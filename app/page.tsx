"use client";

import { useState } from "react";
import { Client } from "@gradio/client";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setResult(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  // DRAG EVENTS
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  };

  // 🔥 THIS IS THE ONLY LOGIC CHANGE
  const uploadAndPredict = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const client = await Client.connect("yadollahi/mri-tumor-detector");

      const response = await client.predict("/predict", {
        image: file,
      }) as { data: [string, number] }; // <-- type cast

      const prediction = response.data[0];
      const confidence = response.data[1];

      setResult(`${prediction} (confidence: ${confidence})`);
    } catch (err) {
      setResult("Error connecting to model");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          MRI Tumor Detector
        </h1>

        {/* DRAG + DROP UPLOAD BOX */}
        <label
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition
            ${dragActive
              ? "bg-indigo-200 border-indigo-500"
              : "bg-indigo-50 border-indigo-300 hover:bg-indigo-100"
            }
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <span className="text-indigo-600 font-medium mb-2">
            Drag & drop MRI scan here
          </span>
          <span className="text-gray-500 text-sm">or click to choose</span>

          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </label>

        {/* PREVIEW */}
        {preview && (
          <div className="mt-5 flex justify-center">
            <img
              src={preview}
              alt="preview"
              className="max-h-64 rounded-xl shadow-md border"
            />
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={uploadAndPredict}
          disabled={!file || loading}
          className={`w-full mt-6 py-3 rounded-xl text-lg font-semibold text-white transition shadow-md
            ${!file || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
            }
          `}
        >
          {loading ? "Analyzing..." : "Analyze MRI"}
        </button>

        {/* RESULT */}
        {result && (
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border text-center text-lg font-medium text-gray-800">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
