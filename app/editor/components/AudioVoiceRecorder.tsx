"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioConfig } from "@/remotion/types";

type AudioVoiceRecorderProps = {
  audioConfig?: AudioConfig;
  onChange: (config?: AudioConfig) => void;
};

export const AudioVoiceRecorder = ({ audioConfig, onChange }: AudioVoiceRecorderProps) => {
  const [activeTab, setActiveTab] = useState<"mic" | "upload">("mic");
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(audioConfig?.audioUrl || null);
  const [volume, setVolume] = useState<number>(audioConfig?.volume ?? 1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(url);
        setFileName("Voiceover_Recording.webm");
        onChange({ audioUrl: url, volume, loop: false });

        // Stop all mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setMicError("Microphone permission denied or device not found.");
      setIsRecording(false);
    }
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

    if (!file.type.startsWith("audio/")) {
      setMicError("Please select an audio file (.mp3, .wav, .m4a).");
      return;
    }

    const url = URL.createObjectURL(file);
    setRecordedBlobUrl(url);
    setFileName(file.name);
    onChange({ audioUrl: url, volume, loop: true });
  };

  const removeAudio = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setFileName(null);
    setRecordDuration(0);
    onChange(undefined);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (recordedBlobUrl) {
      onChange({ audioUrl: recordedBlobUrl, volume: newVol, loop: true });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Tab Selectors */}
      <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1 border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("mic")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
            activeTab === "mic"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-white/60 hover:text-white"
          }`}
        >
          <span>🎙️</span>
          <span>Record Microphone</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
            activeTab === "upload"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-white/60 hover:text-white"
          }`}
        >
          <span>🎵</span>
          <span>Upload Audio File</span>
        </button>
      </div>

      {micError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {micError}
        </div>
      )}

      {/* Mic Recording Mode */}
      {activeTab === "mic" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          {!isRecording ? (
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Record your voice narration or audio course commentary directly in the browser.
              </p>
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2.5 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 active:scale-95"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                <span>Start Recording Voice</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-rose-400">
                <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-sm font-bold tracking-wider">RECORDING ({formatTime(recordDuration)})</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                <span>⏹ Stop & Save Voice</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Audio Mode */}
      {activeTab === "upload" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <span>📁 Select Audio (.mp3, .wav, .m4a)</span>
          </button>
        </div>
      )}

      {/* Current Attached Audio Preview */}
      {recordedBlobUrl && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <span className="text-violet-400">🔊</span>
              <span className="truncate max-w-[220px]">{fileName || "Attached Audio"}</span>
            </div>
            <button
              type="button"
              onClick={removeAudio}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Remove
            </button>
          </div>

          <audio src={recordedBlobUrl} controls className="w-full h-8" />

          {/* Volume Control */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-white/50">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 accent-violet-500 cursor-pointer"
            />
            <span className="text-[11px] text-white/70 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
