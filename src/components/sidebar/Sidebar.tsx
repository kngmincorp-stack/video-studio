"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { VideoBlueprint, Format, DefaultNarration } from "@/types/schema";
import { FORMAT_PRESETS } from "@/types/schema";
import { VoicevoxPanel } from "@/components/voicevox/VoicevoxPanel";

interface SidebarProps {
  blueprint: VideoBlueprint;
  onFormatChange: (format: Format) => void;
  onNarrationChange: (narration: DefaultNarration) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  isExporting: boolean;
  onVoicevoxSetupRequest?: () => void;
}

export function Sidebar({
  blueprint,
  onFormatChange,
  onNarrationChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  isExporting,
  onVoicevoxSetupRequest,
}: SidebarProps) {
  const totalSeconds = (
    blueprint.totalDurationFrames / blueprint.fps
  ).toFixed(1);

  return (
    <div className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          VS
        </div>
        <div>
          <h1 className="text-sm font-semibold">Video Studio</h1>
          <p className="text-xs text-muted-foreground">対話式動画生成</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            フォーマット
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FORMAT_PRESETS) as Format[]).map((f) => (
              <button
                key={f}
                onClick={() => onFormatChange(f)}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  blueprint.format === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {FORMAT_PRESETS[f].label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Project Info */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            プロジェクト情報
          </label>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              解像度: {blueprint.width} x {blueprint.height}
            </p>
            <p>FPS: {blueprint.fps}</p>
            <p>長さ: {totalSeconds}秒</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Voicevox Settings */}
        <VoicevoxPanel
          narration={blueprint.defaultNarration}
          onChange={onNarrationChange}
          onSetupRequest={onVoicevoxSetupRequest}
        />

        <Separator className="my-4" />

        {/* Scene List */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            シーン一覧
          </label>
          <div className="space-y-1">
            {blueprint.scenes.map((scene, i) => (
              <div
                key={scene.id}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-xs">
                  {scene.title || scene.type}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {(scene.durationFrames / blueprint.fps).toFixed(1)}s
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Undo/Redo */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 text-xs"
          >
            元に戻す
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 text-xs"
          >
            やり直し
          </Button>
        </div>
      </ScrollArea>

      {/* Export Button */}
      <div className="border-t border-border p-4">
        <Button className="w-full" size="sm" onClick={onExport} disabled={isExporting}>
          {isExporting ? "エクスポート中..." : "MP4 エクスポート"}
        </Button>
      </div>
    </div>
  );
}
