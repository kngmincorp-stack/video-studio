"use client";

import { FileAudio, Loader2, AlertCircle, Copy, Check, Plus, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptSegmentRow } from "./TranscriptSegmentRow";
import type { TranscriptionState } from "@/types/transcription";

interface TranscribePanelProps {
  state: TranscriptionState;
  onSelectAndTranscribe: () => void;
  onUpdateSegment: (id: string, text: string) => void;
  onReset: () => void;
  getFullText: () => string;
  onApplyToNarration?: (text: string) => void;
}

export function TranscribePanel({
  state,
  onSelectAndTranscribe,
  onUpdateSegment,
  onReset,
  getFullText,
  onApplyToNarration,
}: TranscribePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const text = getFullText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyNarration = () => {
    const text = getFullText();
    onApplyToNarration?.(text);
  };

  // Idle state
  if (state.status === "idle" || state.status === "selecting") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <FileAudio className="h-10 w-10 text-muted-foreground/50" />
        <div className="text-center">
          <p className="text-sm font-medium">メディアファイルの文字起こし</p>
          <p className="mt-1 text-xs text-muted-foreground">
            音声・動画ファイルからテキストを自動生成します
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            対応形式: MP3, WAV, M4A, OGG, FLAC, MP4, WebM, MOV
          </p>
        </div>
        <Button
          onClick={onSelectAndTranscribe}
          disabled={state.status === "selecting"}
          size="sm"
        >
          <FileAudio className="mr-2 h-4 w-4" />
          ファイルを選択
        </Button>
      </div>
    );
  }

  // Loading states
  if (state.status === "uploading" || state.status === "transcribing") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">{state.progress}</p>
          {state.selectedFile && (
            <p className="mt-1 text-xs text-muted-foreground">
              {state.selectedFile.name} ({(state.selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">エラーが発生しました</p>
          <p className="mt-1 text-xs text-muted-foreground">{state.error}</p>
        </div>
        <Button onClick={onSelectAndTranscribe} size="sm" variant="outline">
          やり直す
        </Button>
      </div>
    );
  }

  // Done state
  if (state.status === "done" && state.result) {
    return (
      <div className="flex h-full flex-col">
        {/* Result header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="text-xs text-muted-foreground truncate">
            {state.result.fileName} — {state.result.segments.length}セグメント
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopyAll}
            >
              {copied ? (
                <Check className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              全文コピー
            </Button>
            {onApplyToNarration && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleApplyNarration}
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                ナレーション適用
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onReset}
            >
              <Plus className="mr-1 h-3 w-3" />
              新規
            </Button>
          </div>
        </div>

        {/* Segments list */}
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-0.5">
            {state.result.segments.map((segment) => (
              <TranscriptSegmentRow
                key={segment.id}
                segment={segment}
                onUpdate={onUpdateSegment}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return null;
}
