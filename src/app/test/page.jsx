"use client";

import { useState } from "react";
import axios from "axios";

const SERVER_URL = "http://localhost:5000";

export default function Home() {
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [ping, setPing] = useState(null);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);

  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const measurePing = async () => {
    const pings = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await axios.get(`${SERVER_URL}/ping?t=${Date.now()}`);
      const end = performance.now();
      pings.push(end - start);
    }
    pings.sort((a, b) => a - b);
    const trimmed = pings.slice(1, -1);
    return Math.round(average(trimmed));
  };

  const measureDownload = async () => {
    const sizes = [5000000, 10000000, 25000000];
    const speeds = [];
    for (const size of sizes) {
      try {
        const start = performance.now();
        await axios.get(`${SERVER_URL}/download?size=${size}&t=${Date.now()}`, {
          responseType: "blob",
          onDownloadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        });
        const duration = (performance.now() - start) / 1000;
        const bits = size * 8;
        const mbps = bits / duration / 1000000;
        speeds.push(mbps);
      } catch (err) {
        console.error("Download test failed for size", size, err);
      }
    }
    setProgress(0);
    if (speeds.length === 0) return 0;
    return Math.round(Math.max(...speeds));
  };

  const measureUpload = async () => {
    const sizes = [5000000, 10000000, 20000000];
    const speeds = [];
    for (const size of sizes) {
      try {
        const data = new Blob([new Uint8Array(size)]);
        const start = performance.now();
        await axios.post(`${SERVER_URL}/upload`, data, {
          headers: { "Content-Type": "application/octet-stream" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        });
        const duration = (performance.now() - start) / 1000;
        const bits = size * 8;
        const mbps = bits / duration / 1000000;
        speeds.push(mbps);
      } catch (err) {
        console.error("Upload test failed for size", size, err);
      }
    }
    setProgress(0);
    if (speeds.length === 0) return 0;
    return Math.round(Math.max(...speeds));
  };

  const startTest = async () => {
    setStage("ping");
    setProgress(0);
    let pingResult;
    try {
      pingResult = await measurePing();
      setPing(pingResult);
    } catch (err) {
      setPing(999);
    }

    setStage("download");
    const dlResult = await measureDownload();
    setDownloadSpeed(dlResult);

    setStage("upload");
    const ulResult = await measureUpload();
    setUploadSpeed(ulResult);

    setStage("done");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="bg-gray-800 p-10 rounded-lg shadow-2xl max-w-lg w-full text-center">
        <h1 className="text-4xl font-bold mb-8">Speedtest</h1>

        {stage === "idle" && (
          <button
            onClick={startTest}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded text-xl font-semibold"
          >
            Start Test
          </button>
        )}

        {(stage === "ping" || stage === "download" || stage === "upload") && (
          <div>
            <p className="text-2xl mb-4">
              Testing {stage.charAt(0).toUpperCase() + stage.slice(1)}...
            </p>
            <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p>{progress}%</p>
          </div>
        )}

        {stage === "done" && (
          <div className="space-y-6">
            <div>
              <p className="text-lg text-gray-400">Ping</p>
              <p className="text-5xl font-bold">
                {ping !== null ? ping : "--"} ms
              </p>
            </div>
            <div>
              <p className="text-lg text-gray-400">Download</p>
              <p className="text-5xl font-bold">
                {downloadSpeed !== null ? downloadSpeed : "--"} Mbps
              </p>
            </div>
            <div>
              <p className="text-lg text-gray-400">Upload</p>
              <p className="text-5xl font-bold">
                {uploadSpeed !== null ? uploadSpeed : "--"} Mbps
              </p>
            </div>
            <button
              onClick={() => {
                setStage("idle");
                setPing(null);
                setDownloadSpeed(null);
                setUploadSpeed(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded text-xl font-semibold"
            >
              Test Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
