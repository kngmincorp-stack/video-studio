"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { PlayerRef } from "@remotion/player";
import { Sidebar } from "@/components/sidebar/Sidebar";
import type { Message } from "@/components/chat/ChatMessage";
import { useVideoProject } from "@/hooks/useVideoProject";
import { useTranscription } from "@/hooks/useTranscription";
import { VideoBlueprintSchema, type DefaultNarration } from "@/types/schema";
import { ApiKeySetup } from "@/components/setup/ApiKeySetup";
import { VoicevoxSetup } from "@/components/setup/VoicevoxSetup";
import { UpdateNotification } from "@/components/update/UpdateNotification";
import { BottomPanel } from "@/components/timeline/BottomPanel";

// Remotion Player must be loaded client-side only
const VideoPreview = dynamic(
  () =>
    import("@/components/preview/VideoPreview").then((m) => ({
      default: m.VideoPreview,
    })),
  { ssr: false, loading: () => <PreviewPlaceholder /> }
);

function PreviewPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-black/50">
      <p className="text-sm text-muted-foreground animate-pulse">
        プレビュー読み込み中...
      </p>
    </div>
  );
}

export default function Home() {
  const {
    blueprint,
    setBlueprint,
    undo,
    redo,
    canUndo,
    canRedo,
    changeFormat,
  } = useVideoProject();

  const playerRef = useRef<PlayerRef>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);
  const [showVoicevoxSetup, setShowVoicevoxSetup] = useState(false);

  const transcription = useTranscription();

  // Check if API key is configured (Electron only)
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.getApiKeyStatus().then(({ hasKey }) => {
        setNeedsSetup(!hasKey);
        setSetupChecked(true);
      });

      // Check VOICEVOX engine status
      if (window.electronAPI.voicevox) {
        window.electronAPI.voicevox.getStatus().then((status) => {
          if (!status.installed) {
            setShowVoicevoxSetup(true);
          }
        });
      }
    } else {
      setSetupChecked(true);
    }
  }, []);

  const handleNarrationChange = useCallback(
    (narration: DefaultNarration) => {
      setBlueprint((prev) => ({ ...prev, defaultNarration: narration }));
    },
    [setBlueprint]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint }),
      });
      const data = await res.json();
      if (data.outputPath) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `MP4エクスポート完了: ${data.outputPath}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "エクスポートに失敗しました。",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsExporting(false);
    }
  }, [blueprint]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            blueprint,
            history: messages.slice(-10),
          }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        // Update blueprint if returned
        if (data.blueprint) {
          const parsed = VideoBlueprintSchema.safeParse(data.blueprint);
          if (parsed.success) {
            setBlueprint(parsed.data);
          }
        }

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message || "動画を更新しました。",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [blueprint, messages, setBlueprint]
  );

  // Keyboard shortcuts (undo/redo)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // Show setup screen if API key is missing (Electron only)
  if (!setupChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">読み込み中...</p>
      </div>
    );
  }

  if (needsSetup) {
    return <ApiKeySetup onComplete={() => setNeedsSetup(false)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <UpdateNotification />

      {/* VOICEVOX Setup Modal */}
      {showVoicevoxSetup && (
        <VoicevoxSetup onClose={() => setShowVoicevoxSetup(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        blueprint={blueprint}
        onFormatChange={changeFormat}
        onNarrationChange={handleNarrationChange}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={handleExport}
        isExporting={isExporting}
        onVoicevoxSetupRequest={() => setShowVoicevoxSetup(true)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Video Preview */}
        <div className="flex-1 min-h-0 border-b border-border">
          <VideoPreview blueprint={blueprint} playerRef={playerRef} />
        </div>

        {/* Bottom Panel (Timeline / Chat / Transcription tabs) */}
        <div className="h-[200px] min-h-[160px] border-t border-border">
          <BottomPanel
            blueprint={blueprint}
            setBlueprint={setBlueprint}
            playerRef={playerRef}
            messages={messages}
            onSend={handleSend}
            isLoading={isLoading}
            transcriptionState={transcription.state}
            onSelectAndTranscribe={transcription.selectAndTranscribe}
            onUpdateSegment={transcription.updateSegment}
            onResetTranscription={transcription.reset}
            getFullText={transcription.getFullText}
            onApplyToNarration={(text) => {
              const content = `以下の文字起こしテキストをナレーションとしてシーンに適用してください:\n\n${text}`;
              handleSend(content);
            }}
          />
        </div>
      </div>
    </div>
  );
}
