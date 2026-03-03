"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = apiKey.startsWith("AIza") && apiKey.length > 20;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.saveApiKey(apiKey);
        if (result.success) {
          onComplete();
        } else {
          setError("保存に失敗しました。");
        }
      } else {
        setError("Electron環境外では設定できません。");
      }
    } catch {
      setError("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Video Studio セットアップ</h1>
          <p className="text-center text-sm text-muted-foreground">
            動画生成にはGoogle Gemini APIキーが必要です。
            <br />
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Google AI Studio
            </a>
            {" "}から無料で取得できます。
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="api-key-input">
            GEMINI_API_KEY
          </label>
          <div className="relative">
            <input
              id="api-key-input"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) handleSave();
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {apiKey && !isValid && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              有効なAPIキー (AIza...) を入力してください
            </p>
          )}
          {apiKey && isValid && (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              キー形式OK
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full"
        >
          {saving ? "保存中..." : "保存して開始"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          APIキーは .env.local にローカル保存されます。
        </p>
      </div>
    </div>
  );
}
