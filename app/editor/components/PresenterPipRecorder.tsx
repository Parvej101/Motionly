"use client";

import { useEffect, useRef, useState } from "react";
import type { PresenterConfig, PresenterShape, PresenterSize } from "@/remotion/types";

type PresenterPipRecorderProps = {
  presenterConfig?: PresenterConfig;
  onChange: (config?: PresenterConfig) => void;
};

export const PresenterPipRecorder = ({ presenterConfig, onChange }: PresenterPipRecorderProps) => {
  const [enabled, setEnabled] = useState(presenterConfig?.enabled ?? false);
  const [shape, setShape] = useState<PresenterShape>(presenterConfig?.shape ?? "circle");
  const [size, setSize] = useState<PresenterSize>(presenterConfig?.size ?? "medium");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    presenterConfig?.position ?? "bottom-right"
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(presenterConfig?.videoUrl || null);
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");

  // Camera recording states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const updateConfig = (newUrl: string | null, newShape = shape, newSize = size, newPos = position) => {
    if (!newUrl) {
      onChange({
        enabled,
        videoUrl: undefined,
        shape: newShape,
        size: newSize,
        position: newPos,
      });
      return;
    }
    onChange({
      enabled: true,
      videoUrl: newUrl,
      shape: newShape,
      size: newSize,
      position: newPos,
    });
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      stopCameraStream();
      onChange(undefined);
    } else {
      onChange({
        enabled: true,
        videoUrl: videoUrl || undefined,
        shape,
        size,
        position,
      });
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error(err);
      setCameraError("Camera/Microphone permission denied or device not found.");
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoPreviewRef.current && streamRef.current) {
      videoPreviewRef.current.srcObject = streamRef.current;
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm",
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      updateConfig(url);
      stopCameraStream();
    };

    mediaRecorder.start(200);
    setIsRecording(true);
    setRecordDuration(0);

    timerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setCameraError("Please select a video file (.mp4, .webm).");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    updateConfig(url);
  };

  const removeVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    updateConfig(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Master Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3.5 border border-white/10">
        <div>
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <span>📹</span>
            <span>Course Presenter Mode (PiP)</span>
          </span>
          <p className="text-[11px] text-white/40 mt-0.5">
            Talking head video bubble in the corner like online courses
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? "bg-violet-600" : "bg-white/20"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pt-1">
          {/* Shape and Size Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Avatar Shape
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShape("circle");
                    updateConfig(videoUrl, "circle", size, position);
                  }}
                  className={`rounded-xl border p-2 text-center text-xs transition ${
                    shape === "circle"
                      ? "border-violet-400 bg-violet-500/20 text-white font-semibold"
                      : "border-white/10 bg-white/[0.025] text-white/60 hover:text-white"
                  }`}
                >
                  ⭕ Loom Circle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShape("rounded");
                    updateConfig(videoUrl, "rounded", size, position);
                  }}
                  className={`rounded-xl border p-2 text-center text-xs transition ${
                    shape === "rounded"
                      ? "border-violet-400 bg-violet-500/20 text-white font-semibold"
                      : "border-white/10 bg-white/[0.025] text-white/60 hover:text-white"
                  }`}
                >
                  🔲 Course Card
                </button>
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Size
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(["small", "medium", "large"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSize(s);
                      updateConfig(videoUrl, shape, s, position);
                    }}
                    className={`rounded-xl border p-2 text-center text-xs capitalize transition ${
                      size === s
                        ? "border-violet-400 bg-violet-500/20 text-white font-semibold"
                        : "border-white/10 bg-white/[0.025] text-white/60 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Position Selector */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Corner Position
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPosition("bottom-right");
                  updateConfig(videoUrl, shape, size, "bottom-right");
                }}
                className={`rounded-xl border p-2 text-center text-xs transition ${
                  position === "bottom-right"
                    ? "border-violet-400 bg-violet-500/20 text-white font-semibold"
                    : "border-white/10 bg-white/[0.025] text-white/60 hover:text-white"
                }`}
              >
                ↘ Bottom Right (Standard)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPosition("bottom-left");
                  updateConfig(videoUrl, shape, size, "bottom-left");
                }}
                className={`rounded-xl border p-2 text-center text-xs transition ${
                  position === "bottom-left"
                    ? "border-violet-400 bg-violet-500/20 text-white font-semibold"
                    : "border-white/10 bg-white/[0.025] text-white/60 hover:text-white"
                }`}
              >
                ↙ Bottom Left
              </button>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "camera"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              🎥 Record Webcam + Mic
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                stopCameraStream();
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "upload"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              📤 Upload Video
            </button>
          </div>

          {cameraError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {cameraError}
            </div>
          )}

          {/* Live Camera Tab */}
          {activeTab === "camera" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center space-y-3">
              {!isCameraActive ? (
                <div className="space-y-3">
                  <p className="text-xs text-white/60">
                    Turn on your webcam and microphone to record a live talking-head course video.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500"
                  >
                    <span>📷 Turn On Camera</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col items-center">
                  <div
                    className={`relative overflow-hidden border-4 border-violet-500 shadow-2xl shadow-violet-500/30 transition-all ${
                      shape === "circle" ? "w-52 h-52 rounded-full" : "w-52 h-64 rounded-3xl"
                    } bg-neutral-900 flex items-center justify-center`}
                  >
                    <video
                      ref={(el) => {
                        videoPreviewRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                          el.srcObject = streamRef.current;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {isRecording ? (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-rose-600/40">
                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                        <span>REC {formatTime(recordDuration)}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Live Camera</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 active:scale-95"
                      >
                        <span className="h-2 w-2 rounded-full bg-white" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/30"
                      >
                        <span>⏹ Stop & Attach</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Video Tab */}
          {activeTab === "upload" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <span>📁 Select Recorded Video (.mp4, .webm)</span>
              </button>
            </div>
          )}

          {/* Active Attached Video Confirmation with Playback */}
          {videoUrl && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <span>✅</span>
                  <span>Presenter Video Attached & Synced</span>
                </div>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Remove / Re-record
                </button>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div
                  className={`relative overflow-hidden border-2 border-emerald-400/80 shadow-md ${
                    shape === "circle" ? "w-20 h-20 rounded-full" : "w-20 h-24 rounded-2xl"
                  } bg-black shrink-0`}
                >
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 text-xs text-white/70">
                  <p className="font-semibold text-white">Talking-head avatar active</p>
                  <p className="text-[11px] text-white/40">
                    Will appear in {position === "bottom-left" ? "Bottom-Left" : "Bottom-Right"} corner.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Shape: {shape === "circle" ? "Loom Circle" : "Course Card"} • Size: {size}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
