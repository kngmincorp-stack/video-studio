"use client";

import React, { useState, useRef, useEffect } from "react";
import type { PlayerRef } from "@remotion/player";
import type { VideoBlueprint } from "@/types/schema";
import type { Message } from "@/components/chat/ChatMessage";
import type { TranscriptionState } from "@/types/transcription";
import { TimelinePanel } from "./TimelinePanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { TranscribePanel } from "@/components/transcribe/TranscribePanel";

type TabId = "timeline" | "chat" | "transcribe";

interface BottomPanelProps {
  blueprint: VideoBlueprint;
  setBlueprint: (next: VideoBlueprint | ((prev: VideoBlueprint) => VideoBlueprint)) => void;
  playerRef: React.RefObject<PlayerRef | null>;
  // Chat
  messages: Message[];
  onSend: (message: string) => void;
  isLoading: boolean;
  // Transcription
  transcriptionState: TranscriptionState;
  onSelectAndTranscribe: () => void;
  onUpdateSegment: (id: string, text: string) => void;
  onResetTranscription: () => void;
  getFullText: () => string;
  onApplyToNarration: (text: string) => void;
}

export function BottomPanel({
  blueprint,
  setBlueprint,
  playerRef,
  messages,
  onSend,
  isLoading,
  transcriptionState,
  onSelectAndTranscribe,
  onUpdateSegment,
  onResetTranscription,
  getFullText,
  onApplyToNarration,
}: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("timeline");
  const pendingNarrationRef = useRef<string | null>(null);

  const handleApplyToNarration = (text: string) => {
    const content = `以下の文字起こしテキストをナレーションとしてシーンに適用してください:\n\n${text}`;
    pendingNarrationRef.current = content;
    setActiveTab("chat");
  };

  // Send pending narration after tab switch to chat
  useEffect(() => {
    if (activeTab === "chat" && pendingNarrationRef.current) {
      const content = pendingNarrationRef.current;
      pendingNarrationRef.current = null;
      onSend(content);
    }
  }, [activeTab, onSend]);

  const tabs: { id: TabId; label: string; badge?: React.ReactNode }[] = [
    { id: "timeline", label: "タイムライン" },
    {
      id: "chat",
      label: "チャット",
      badge: isLoading ? (
        <span className="ml-1 text-[10px] text-muted-foreground animate-pulse">生成中...</span>
      ) : null,
    },
    { id: "transcribe", label: "文字起こし" },
  ];

  return (
    <div className="relative flex h-full flex-col">
      {/* Floating tab selector (always visible, top-right) */}
      <div className="absolute top-0 right-2 z-10 flex items-center gap-0.5 h-9">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "timeline" && (
          <TimelinePanel
            blueprint={blueprint}
            setBlueprint={setBlueprint}
            playerRef={playerRef}
          />
        )}
        {activeTab === "chat" && (
          <div className="flex h-full flex-col">
            <div className="h-9 border-b border-border bg-muted/50 flex items-center px-3">
              <span className="text-xs font-medium text-muted-foreground">AI チャット</span>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel
                messages={messages}
                onSend={onSend}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
        {activeTab === "transcribe" && (
          <div className="flex h-full flex-col">
            <div className="h-9 border-b border-border bg-muted/50 flex items-center px-3">
              <span className="text-xs font-medium text-muted-foreground">文字起こし</span>
            </div>
            <div className="flex-1 min-h-0">
              <TranscribePanel
                state={transcriptionState}
                onSelectAndTranscribe={onSelectAndTranscribe}
                onUpdateSegment={onUpdateSegment}
                onReset={onResetTranscription}
                getFullText={getFullText}
                onApplyToNarration={handleApplyToNarration}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
