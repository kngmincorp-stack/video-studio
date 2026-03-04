"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { TranscribePanel } from "@/components/transcribe/TranscribePanel";
import type { Message } from "@/components/chat/ChatMessage";
import type { TranscriptionState } from "@/types/transcription";

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onSend: (message: string) => void;
  isLoading: boolean;
  transcriptionState: TranscriptionState;
  onSelectAndTranscribe: () => void;
  onUpdateSegment: (id: string, text: string) => void;
  onResetTranscription: () => void;
  getFullText: () => string;
  onApplyToNarration: (text: string) => void;
}

export function ChatDrawer({
  open,
  onOpenChange,
  messages,
  onSend,
  isLoading,
  transcriptionState,
  onSelectAndTranscribe,
  onUpdateSegment,
  onResetTranscription,
  getFullText,
  onApplyToNarration,
}: ChatDrawerProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const pendingNarrationRef = useRef<string | null>(null);

  const handleApplyToNarration = (text: string) => {
    const content = `以下の文字起こしテキストをナレーションとしてシーンに適用してください:\n\n${text}`;
    pendingNarrationRef.current = content;
    setActiveTab("chat");
  };

  // Send pending narration after tab switch
  useEffect(() => {
    if (activeTab === "chat" && pendingNarrationRef.current) {
      const content = pendingNarrationRef.current;
      pendingNarrationRef.current = null;
      onSend(content);
    }
  }, [activeTab, onSend]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="text-sm">AI チャット</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
          <TabsList className="shrink-0 w-full justify-start rounded-none border-b border-border bg-transparent px-2 h-9">
            <TabsTrigger value="chat" className="text-xs data-[state=active]:bg-muted">
              チャット
              {isLoading && (
                <span className="ml-1.5 text-[10px] text-muted-foreground animate-pulse">
                  生成中...
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transcribe" className="text-xs data-[state=active]:bg-muted">
              文字起こし
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <ChatPanel
              messages={messages}
              onSend={onSend}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="transcribe" className="flex-1 min-h-0 mt-0">
            <TranscribePanel
              state={transcriptionState}
              onSelectAndTranscribe={onSelectAndTranscribe}
              onUpdateSegment={onUpdateSegment}
              onReset={onResetTranscription}
              getFullText={getFullText}
              onApplyToNarration={handleApplyToNarration}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
