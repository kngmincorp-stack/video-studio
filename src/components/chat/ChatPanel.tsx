"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, type Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  messages: Message[];
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function ChatPanel({ messages, onSend, isLoading }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center border-b border-border px-4 py-2">
        <h2 className="text-sm font-medium">チャット</h2>
        {isLoading && (
          <span className="ml-2 text-xs text-muted-foreground animate-pulse">
            生成中...
          </span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2 text-lg">動画の指示を入力してください</p>
              <p className="text-xs">例: 「30秒の猫雑学ショート動画を作って」</p>
              <p className="text-xs">例: 「テキストをもっと大きくして」</p>
              <p className="text-xs">例: 「エンディングシーンを追加して」</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="animate-pulse">考え中...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
