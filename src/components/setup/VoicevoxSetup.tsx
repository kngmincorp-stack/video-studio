"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { VoicevoxDownloadProgress } from "@/types/electron";

type SetupPhase = "prompt" | "downloading" | "extracting" | "starting" | "complete" | "error";

interface VoicevoxSetupProps {
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function VoicevoxSetup({ onClose }: VoicevoxSetupProps) {
  const [phase, setPhase] = useState<SetupPhase>("prompt");
  const [progress, setProgress] = useState<VoicevoxDownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleProgressUpdate = useCallback((p: VoicevoxDownloadProgress) => {
    setProgress(p);
    if (p.phase === "downloading") {
      setPhase("downloading");
    } else if (p.phase === "extracting") {
      setPhase("extracting");
    } else if (p.phase === "complete") {
      setPhase("starting");
      // Short delay then mark complete
      setTimeout(() => setPhase("complete"), 1500);
    } else if (p.phase === "error") {
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.voicevox) return;
    const cleanup = window.electronAPI.voicevox.onDownloadProgress(handleProgressUpdate);
    return cleanup;
  }, [handleProgressUpdate]);

  const handleStartDownload = async () => {
    if (!window.electronAPI?.voicevox) return;
    setPhase("downloading");
    setProgress({ phase: "downloading", downloaded: 0, total: 0, percent: 0, speed: 0 });

    const result = await window.electronAPI.voicevox.startDownload();
    if (!result.success) {
      setPhase("error");
      setErrorMessage(result.error || "ダウンロードに失敗しました。");
    }
  };

  const handleCancel = async () => {
    if (window.electronAPI?.voicevox) {
      await window.electronAPI.voicevox.cancelDownload();
    }
    onClose();
  };

  const handleRetry = () => {
    setPhase("prompt");
    setProgress(null);
    setErrorMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        {/* Close button (always visible) */}
        <button
          onClick={phase === "downloading" || phase === "extracting" ? handleCancel : onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Prompt Phase */}
        {phase === "prompt" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">VOICEVOXエンジン セットアップ</h2>
                <p className="text-xs text-muted-foreground">音声合成に必要です</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              VOICEVOXエンジン (~1.7GB) をダウンロードしてセットアップします。
              ダウンロード後は自動的にエンジンが起動されます。
            </p>
            <div className="flex gap-2">
              <Button onClick={handleStartDownload} className="flex-1">
                ダウンロード開始
              </Button>
              <Button variant="outline" onClick={onClose}>
                後で
              </Button>
            </div>
          </div>
        )}

        {/* Downloading Phase */}
        {phase === "downloading" && progress && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ダウンロード中...</h2>
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
                </span>
                <span>{progress.percent}%</span>
              </div>
              {progress.speed > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {formatSpeed(progress.speed)}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleCancel} className="w-full">
              キャンセル
            </Button>
          </div>
        )}

        {/* Extracting Phase */}
        {phase === "extracting" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">展開中...</h2>
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {progress?.percent ?? 0}%
              </p>
            </div>
          </div>
        )}

        {/* Starting Phase */}
        {phase === "starting" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-lg font-semibold">エンジン起動中...</h2>
            <p className="text-xs text-muted-foreground">少々お待ちください</p>
          </div>
        )}

        {/* Complete Phase */}
        {phase === "complete" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-2">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <h2 className="text-lg font-semibold">セットアップ完了</h2>
              <p className="text-sm text-muted-foreground">
                VOICEVOXエンジンが正常にインストールされました。
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              閉じる
            </Button>
          </div>
        )}

        {/* Error Phase */}
        {phase === "error" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-2">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold">エラーが発生しました</h2>
              <p className="text-sm text-muted-foreground text-center">
                {errorMessage || "セットアップ中にエラーが発生しました。"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1">
                再試行
              </Button>
              <Button variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
