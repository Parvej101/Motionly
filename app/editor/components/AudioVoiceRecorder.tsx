"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioConfig } from "@/remotion/types";

type AudioVoiceRecorderProps = {
  audioConfig?: AudioConfig;
  onChange: (config?: AudioConfig) => void;
  videoDuration?: number;
};

export const AudioVoiceRecorder = ({
  audioConfig,
  onChange,
  videoDuration = 8,
}: AudioVoiceRecorderProps) => {
  const [activeTab, setActiveTab] = useState<"mic" | "upload">("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(audioConfig?.audioUrl || null);
  const [volume, setVolume] = useState<number>(audioConfig?.volume ?? 1);
  const [startFromSeconds, setStartFromSeconds] = useState<number>(audioConfig?.startFromSeconds ?? 0);
  const [totalAudioDuration, setTotalAudioDuration] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlayingClip, setIsPlayingClip] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const effectiveClipLength = Math.max(1, Math.min(videoDuration, totalAudioDuration > 0 ? totalAudioDuration : videoDuration));
  const maxStart = Math.max(0, (totalAudioDuration > 0 ? totalAudioDuration : 60) - effectiveClipLength);
  const currentStart = Math.min(startFromSeconds, maxStart);
  const currentEnd = currentStart + effectiveClipLength;

  const emitChange = (url: string | null, vol = volume, start = currentStart) => {
    if (!url) {
      onChange(undefined);
      return;
    }
    onChange({
      audioUrl: url,
      volume: vol,
      loop: true,
      startFromSeconds: start,
      endAtSeconds: start + effectiveClipLength,
    });
  };

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
        setStartFromSeconds(0);
        emitChange(url, volume, 0);

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
    setStartFromSeconds(0);
    emitChange(url, volume, 0);
  };

  const removeAudio = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setFileName(null);
    setRecordDuration(0);
    setTotalAudioDuration(0);
    setStartFromSeconds(0);
    setIsPlayingClip(false);
    emitChange(null);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (recordedBlobUrl) {
      emitChange(recordedBlobUrl, newVol, currentStart);
    }
  };

  const handleSlidePosition = (newStart: number) => {
    const safeStart = Math.max(0, Math.min(newStart, maxStart));
    setStartFromSeconds(safeStart);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = safeStart;
    }
    if (recordedBlobUrl) {
      emitChange(recordedBlobUrl, volume, safeStart);
    }
  };

  const toggleClipPreview = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingClip) {
      audioPlayerRef.current.pause();
      setIsPlayingClip(false);
    } else {
      audioPlayerRef.current.currentTime = currentStart;
      audioPlayerRef.current.play().then(() => setIsPlayingClip(true)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Percentages for visual window display
  const startPercent = totalAudioDuration > 0 ? (currentStart / totalAudioDuration) * 100 : 0;
  const widthPercent = totalAudioDuration > 0 ? (effectiveClipLength / totalAudioDuration) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Tab Selectors */}
      <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1 border border-white/10">
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
          <span>Upload Audio Track</span>
        </button>
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
      </div>

      {micError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {micError}
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
            <span>📁 Select Music Track (.mp3, .wav, .m4a)</span>
          </button>
        </div>
      )}

      {/* Mic Recording Mode */}
      {activeTab === "mic" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          {!isRecording ? (
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Record your voice narration or commentary directly in the browser.
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

      {/* Easy Reels/TikTok Style Music Selector Window */}
      {recordedBlobUrl && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className="text-violet-400">🔊</span>
              <span className="truncate max-w-[220px]">{fileName || "Attached Track"}</span>
            </div>
            <button
              type="button"
              onClick={removeAudio}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Remove
            </button>
          </div>

          <audio
            ref={audioPlayerRef}
            src={recordedBlobUrl}
            controls
            onLoadedMetadata={(e) => {
              const dur = (e.target as HTMLAudioElement).duration;
              if (Number.isFinite(dur)) {
                setTotalAudioDuration(dur);
              }
            }}
            onTimeUpdate={(e) => {
              const cur = (e.target as HTMLAudioElement).currentTime;
              if (isPlayingClip && cur >= currentEnd) {
                audioPlayerRef.current?.pause();
                setIsPlayingClip(false);
              }
            }}
            onEnded={() => setIsPlayingClip(false)}
            onPause={() => setIsPlayingClip(false)}
            className="w-full h-8"
          />

          {/* TikTok / Reels-style Easy Drag Box */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                <span>🎵</span>
                <span>Drag Music to Match Video ({effectiveClipLength}s)</span>
              </span>
              <span className="text-emerald-400 font-mono text-xs font-bold">
                {formatTime(currentStart)} ➔ {formatTime(currentEnd)}
              </span>
            </div>

            <p className="text-[11px] text-white/50">
              Just drag the slider anywhere across the song. It will automatically take the exact {effectiveClipLength}s clip for your video.
            </p>

            {/* Visual Moving Window Bar */}
            <div className="relative h-4 w-full rounded-full bg-white/10 overflow-hidden border border-white/5">
              <div
                style={{
                  left: `${startPercent}%`,
                  width: `${Math.max(2, widthPercent)}%`,
                }}
                className="absolute top-0 bottom-0 bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full shadow-lg shadow-violet-500/40"
              />
            </div>

            {/* Single Easy Slider */}
            <input
              type="range"
              min="0"
              max={maxStart}
              step="0.5"
              value={currentStart}
              onChange={(e) => handleSlidePosition(parseFloat(e.target.value))}
              className="w-full accent-violet-400 cursor-pointer"
            />

            {/* Quick jump presets & Listen Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/40 uppercase">Jump:</span>
                {[0, 15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleSlidePosition(sec)}
                    disabled={totalAudioDuration > 0 && sec > maxStart}
                    className={`rounded px-1.5 py-0.5 text-[10px] border transition ${
                      Math.abs(currentStart - sec) < 0.5
                        ? "border-violet-400 bg-violet-500/30 text-white font-bold"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white disabled:opacity-30"
                    }`}
                  >
                    {formatTime(sec)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggleClipPreview}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/25 px-3 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/35"
              >
                <span>{isPlayingClip ? "⏸ Pause" : `▶ Play ${effectiveClipLength}s Clip`}</span>
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 pt-0.5">
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
            <span className="text-[11px] text-white/70 w-8 text-right font-mono">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
