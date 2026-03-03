"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { VoicevoxSpeaker } from "@/lib/voicevox/client";
import type { DefaultNarration } from "@/types/schema";
import type { VoicevoxEngineStatus } from "@/types/electron";
import { VoicevoxSlider } from "./VoicevoxSlider";
import { VoicevoxTestButton } from "./VoicevoxTestButton";

interface VoicevoxPanelProps {
  narration: DefaultNarration;
  onChange: (narration: DefaultNarration) => void;
  onSetupRequest?: () => void;
}

type EngineState = "loading" | "not-installed" | "stopped" | "connected" | "error";

export function VoicevoxPanel({
  narration,
  onChange,
  onSetupRequest,
}: VoicevoxPanelProps) {
  const [speakers, setSpeakers] = useState<VoicevoxSpeaker[]>([]);
  const [engineState, setEngineState] = useState<EngineState>("loading");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const checkEngineAndLoadSpeakers = useCallback(async () => {
    // In Electron, check via IPC
    if (typeof window !== "undefined" && window.electronAPI?.voicevox) {
      try {
        const status: VoicevoxEngineStatus = await window.electronAPI.voicevox.getStatus();
        if (!status.installed) {
          setEngineState("not-installed");
          return;
        }
        if (!status.running) {
          setEngineState("stopped");
          return;
        }
      } catch {
        // Fall through to HTTP check
      }
    }

    // Check via HTTP (works in both browser dev and Electron)
    try {
      const res = await fetch("/api/voicevox/speakers");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data)) {
        setSpeakers(data);
        setEngineState("connected");
      } else {
        setEngineState("error");
      }
    } catch {
      // If Electron already determined not-installed/stopped, keep that state
      setEngineState((prev) =>
        prev === "not-installed" || prev === "stopped" ? prev : "error"
      );
    }
  }, []);

  useEffect(() => {
    checkEngineAndLoadSpeakers();

    // Listen for engine status changes from Electron
    if (typeof window !== "undefined" && window.electronAPI?.voicevox) {
      const cleanup = window.electronAPI.voicevox.onEngineStatus(() => {
        checkEngineAndLoadSpeakers();
      });
      return cleanup;
    }
  }, [checkEngineAndLoadSpeakers]);

  const handleStartEngine = async () => {
    if (window.electronAPI?.voicevox) {
      setEngineState("loading");
      const result = await window.electronAPI.voicevox.startEngine();
      if (result.success) {
        await checkEngineAndLoadSpeakers();
      } else {
        setEngineState("error");
      }
    }
  };

  // Flatten all styles as selectable options
  const styleOptions = speakers.flatMap((s) =>
    s.styles.map((style) => ({
      label: `${s.name} (${style.name})`,
      id: style.id,
    }))
  );

  const statusDot =
    engineState === "connected"
      ? "bg-green-500"
      : engineState === "loading"
        ? "bg-yellow-500 animate-pulse"
        : "bg-red-500";

  const statusText =
    engineState === "connected"
      ? "接続中"
      : engineState === "loading"
        ? "確認中..."
        : engineState === "not-installed"
          ? "未インストール"
          : engineState === "stopped"
            ? "停止中"
            : "未接続";

  return (
    <div className="space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Voicevox
        </label>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${statusDot}`} />
          <span className="text-[10px] text-muted-foreground">{statusText}</span>
        </div>
      </div>

      {/* Not installed state */}
      {engineState === "not-installed" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            VOICEVOXエンジンがインストールされていません。
          </p>
          {onSetupRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetupRequest}
              className="w-full text-xs"
            >
              セットアップ
            </Button>
          )}
        </div>
      )}

      {/* Stopped state */}
      {engineState === "stopped" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            エンジンが停止しています。
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEngine}
            className="w-full text-xs"
          >
            エンジンを起動
          </Button>
        </div>
      )}

      {/* Error state */}
      {engineState === "error" && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">
            Voicevox Engine未接続
          </p>
          {onSetupRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetupRequest}
              className="w-full text-xs"
            >
              セットアップ
            </Button>
          )}
        </div>
      )}

      {/* Connected state */}
      {engineState === "connected" && (
        <>
          {/* Speaker Select + Test Button */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">スピーカー</label>
            <div className="flex gap-1.5">
              <select
                value={narration.speakerId}
                onChange={(e) =>
                  onChange({ ...narration, speakerId: Number(e.target.value) })
                }
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs min-w-0"
              >
                {styleOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <VoicevoxTestButton narration={narration} />
            </div>
          </div>

          {/* Main Sliders */}
          <VoicevoxSlider
            label="話速"
            value={narration.speedScale}
            defaultValue={1.0}
            min={0.5}
            max={2.0}
            step={0.1}
            format={(v) => `${v.toFixed(1)}x`}
            onChange={(v) => onChange({ ...narration, speedScale: v })}
          />

          <VoicevoxSlider
            label="音高"
            value={narration.pitchScale}
            defaultValue={0}
            min={-0.15}
            max={0.15}
            step={0.01}
            onChange={(v) => onChange({ ...narration, pitchScale: v })}
          />

          <VoicevoxSlider
            label="抑揚"
            value={narration.intonationScale}
            defaultValue={1.0}
            min={0.0}
            max={2.0}
            step={0.1}
            format={(v) => `${v.toFixed(1)}x`}
            onChange={(v) => onChange({ ...narration, intonationScale: v })}
          />

          <VoicevoxSlider
            label="音量"
            value={narration.volumeScale}
            defaultValue={1.0}
            min={0.0}
            max={2.0}
            step={0.1}
            format={(v) => `${v.toFixed(1)}x`}
            onChange={(v) => onChange({ ...narration, volumeScale: v })}
          />

          {/* Advanced Settings (collapsible) */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showAdvanced ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            詳細設定
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-1">
              <VoicevoxSlider
                label="開始無音"
                value={narration.prePhonemeLength}
                defaultValue={0.1}
                min={0.0}
                max={1.5}
                step={0.1}
                format={(v) => `${v.toFixed(1)}s`}
                onChange={(v) => onChange({ ...narration, prePhonemeLength: v })}
              />

              <VoicevoxSlider
                label="終了無音"
                value={narration.postPhonemeLength}
                defaultValue={0.1}
                min={0.0}
                max={1.5}
                step={0.1}
                format={(v) => `${v.toFixed(1)}s`}
                onChange={(v) => onChange({ ...narration, postPhonemeLength: v })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
