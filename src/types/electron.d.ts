export interface VoicevoxDownloadProgress {
  phase: "downloading" | "extracting" | "complete" | "error";
  downloaded: number;
  total: number;
  percent: number;
  speed: number;
}

export interface VoicevoxEngineStatus {
  installed: boolean;
  running: boolean;
  version: string | null;
  port: number;
}

export interface VoicevoxAPI {
  getStatus: () => Promise<VoicevoxEngineStatus>;
  startDownload: () => Promise<{ success: boolean; error?: string }>;
  cancelDownload: () => Promise<{ success: boolean }>;
  startEngine: () => Promise<{ success: boolean; error?: string }>;
  stopEngine: () => Promise<{ success: boolean; error?: string }>;
  onDownloadProgress: (callback: (progress: VoicevoxDownloadProgress) => void) => () => void;
  onEngineStatus: (callback: (status: VoicevoxEngineStatus) => void) => () => void;
}

export interface UpdateStatus {
  status: "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
  version?: string;
  progress?: { percent: number; bytesPerSecond: number; transferred: number; total: number };
  error?: string;
}

export interface UpdaterAPI {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => void;
  onStatus: (callback: (status: UpdateStatus) => void) => () => void;
}

export interface MediaFileInfo {
  path: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ElectronAPI {
  getApiKeyStatus: () => Promise<{ hasKey: boolean }>;
  saveApiKey: (key: string) => Promise<{ success: boolean }>;
  getEnv: (key: string) => Promise<string | null>;
  selectDirectory: () => Promise<string | null>;
  selectMediaFile: () => Promise<MediaFileInfo | null>;
  readFileAsBase64: (filePath: string) => Promise<string | null>;
  voicevox: VoicevoxAPI;
  updater: UpdaterAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
