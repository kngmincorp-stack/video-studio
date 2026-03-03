"use client";

import { useState, useEffect, useCallback } from "react";
import type { UpdateStatus } from "@/types/electron";

export function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.updater) return;

    const cleanup = api.updater.onStatus((s: UpdateStatus) => {
      setStatus(s);
      setDismissed(false);
    });

    return cleanup;
  }, []);

  const handleDownload = useCallback(() => {
    window.electronAPI?.updater.downloadUpdate();
  }, []);

  const handleInstall = useCallback(() => {
    window.electronAPI?.updater.quitAndInstall();
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render in non-Electron or when dismissed
  if (!status || dismissed) return null;

  // Hidden states
  if (
    status.status === "checking" ||
    status.status === "not-available" ||
    status.status === "error"
  ) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-primary px-4 py-2 text-primary-foreground text-sm">
      {status.status === "available" && (
        <>
          <span>v{status.version} が利用可能です</span>
          <button
            onClick={handleDownload}
            className="rounded bg-primary-foreground/20 px-3 py-0.5 text-xs font-medium hover:bg-primary-foreground/30 transition-colors"
          >
            ダウンロード
          </button>
          <button
            onClick={handleDismiss}
            className="rounded px-3 py-0.5 text-xs hover:bg-primary-foreground/10 transition-colors"
          >
            後で
          </button>
        </>
      )}

      {status.status === "downloading" && (
        <>
          <span>ダウンロード中... {status.progress ? `${Math.round(status.progress.percent)}%` : ""}</span>
          <div className="h-1.5 w-48 rounded-full bg-primary-foreground/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-300"
              style={{ width: `${status.progress?.percent ?? 0}%` }}
            />
          </div>
        </>
      )}

      {status.status === "downloaded" && (
        <>
          <span>v{status.version} のダウンロード完了</span>
          <button
            onClick={handleInstall}
            className="rounded bg-primary-foreground/20 px-3 py-0.5 text-xs font-medium hover:bg-primary-foreground/30 transition-colors"
          >
            再起動して適用
          </button>
          <button
            onClick={handleDismiss}
            className="rounded px-3 py-0.5 text-xs hover:bg-primary-foreground/10 transition-colors"
          >
            後で
          </button>
        </>
      )}
    </div>
  );
}
