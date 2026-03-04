"use client";

import { useState, useCallback } from "react";
import type {
  TranscriptionState,
  TranscriptionResult,
  TranscriptSegment,
} from "@/types/transcription";

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({ status: "idle" });

  const selectAndTranscribe = useCallback(async () => {
    if (!window.electronAPI) {
      setState({ status: "error", error: "Electron環境でのみ利用可能です" });
      return;
    }

    setState({ status: "selecting" });

    const file = await window.electronAPI.selectMediaFile();
    if (!file) {
      setState({ status: "idle" });
      return;
    }

    setState({
      status: "uploading",
      progress: "ファイルを読み込み中...",
      selectedFile: file,
    });

    try {
      const base64Data = await window.electronAPI.readFileAsBase64(file.path);
      if (!base64Data) {
        setState({ status: "error", error: "ファイルの読み込みに失敗しました" });
        return;
      }

      setState({
        status: "transcribing",
        progress: "文字起こし中...",
        selectedFile: file,
      });

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data,
          mimeType: file.mimeType,
          fileName: file.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "APIエラー");
      }

      const data = await res.json();

      const result: TranscriptionResult = {
        fileName: file.name,
        durationSeconds: data.durationSeconds,
        language: data.language,
        segments: data.segments.map(
          (seg: { startTime: number; endTime: number; text: string }, i: number) => ({
            id: `seg-${i}`,
            startTime: seg.startTime,
            endTime: seg.endTime,
            text: seg.text,
          })
        ),
      };

      setState({ status: "done", result, selectedFile: file });
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err.message : "文字起こしに失敗しました",
        selectedFile: file,
      });
    }
  }, []);

  const updateSegment = useCallback((id: string, text: string) => {
    setState((prev) => {
      if (!prev.result) return prev;
      return {
        ...prev,
        result: {
          ...prev.result,
          segments: prev.result.segments.map((seg: TranscriptSegment) =>
            seg.id === id ? { ...seg, text } : seg
          ),
        },
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const getFullText = useCallback(() => {
    if (!state.result) return "";
    return state.result.segments.map((seg: TranscriptSegment) => seg.text).join("\n");
  }, [state.result]);

  return {
    state,
    selectAndTranscribe,
    updateSegment,
    reset,
    getFullText,
  };
}
