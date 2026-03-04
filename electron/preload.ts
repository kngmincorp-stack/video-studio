import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getApiKeyStatus: () => ipcRenderer.invoke("get-api-key-status"),
  saveApiKey: (key: string) => ipcRenderer.invoke("save-api-key", key),
  getEnv: (key: string) => ipcRenderer.invoke("get-env", key),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  selectMediaFile: () => ipcRenderer.invoke("select-media-file"),
  readFileAsBase64: (filePath: string) => ipcRenderer.invoke("read-file-as-base64", filePath),
  voicevox: {
    getStatus: () => ipcRenderer.invoke("voicevox:get-status"),
    startDownload: () => ipcRenderer.invoke("voicevox:start-download"),
    cancelDownload: () => ipcRenderer.invoke("voicevox:cancel-download"),
    startEngine: () => ipcRenderer.invoke("voicevox:start-engine"),
    stopEngine: () => ipcRenderer.invoke("voicevox:stop-engine"),
    onDownloadProgress: (callback: (progress: unknown) => void) => {
      const listener = (_event: unknown, progress: unknown) => callback(progress);
      ipcRenderer.on("voicevox:download-progress", listener);
      return () => {
        ipcRenderer.removeListener("voicevox:download-progress", listener);
      };
    },
    onEngineStatus: (callback: (status: unknown) => void) => {
      const listener = (_event: unknown, status: unknown) => callback(status);
      ipcRenderer.on("voicevox:engine-status", listener);
      return () => {
        ipcRenderer.removeListener("voicevox:engine-status", listener);
      };
    },
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke("updater:check"),
    downloadUpdate: () => ipcRenderer.invoke("updater:download"),
    quitAndInstall: () => ipcRenderer.invoke("updater:install"),
    onStatus: (callback: (status: unknown) => void) => {
      const listener = (_event: unknown, status: unknown) => callback(status);
      ipcRenderer.on("updater:status", listener);
      return () => {
        ipcRenderer.removeListener("updater:status", listener);
      };
    },
  },
});
