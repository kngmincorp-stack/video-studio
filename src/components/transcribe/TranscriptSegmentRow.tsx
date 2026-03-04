"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import type { TranscriptSegment } from "@/types/transcription";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TranscriptSegmentRowProps {
  segment: TranscriptSegment;
  onUpdate: (id: string, text: string) => void;
}

export function TranscriptSegmentRow({
  segment,
  onUpdate,
}: TranscriptSegmentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(segment.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(segment.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(segment.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="group flex gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
      onClick={() => {
        if (!isEditing) {
          setEditText(segment.text);
          setIsEditing(true);
        }
      }}
    >
      <span className="shrink-0 pt-0.5 text-[11px] font-mono text-muted-foreground tabular-nums">
        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
      </span>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <textarea
            ref={inputRef}
            className="w-full resize-none rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            rows={2}
          />
        ) : (
          <span className="text-sm leading-relaxed">{segment.text}</span>
        )}
      </div>

      {!isEditing && (
        <button
          onClick={handleCopy}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          title="コピー"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}
