"use client";

import { Slider } from "@/components/ui/slider";
import { RotateCcw } from "lucide-react";

interface VoicevoxSliderProps {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

export function VoicevoxSlider({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  format,
  onChange,
}: VoicevoxSliderProps) {
  const displayValue = format ? format(value) : value.toFixed(step < 0.1 ? 2 : 1);
  const isDefault = Math.abs(value - defaultValue) < step / 2;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            {displayValue}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              title="リセット"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
