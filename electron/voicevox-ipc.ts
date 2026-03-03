import { ipcMain, type BrowserWindow } from "electron";
import {
  getStatus,
  downloadEngine,
  cancelDownload,
  extractEngine,
  startEngine,
  stopEngine,
  type DownloadProgress,
} from "./voicevox-engine";

export function registerVoicevoxIPC(getWindow: () => BrowserWindow | null) {
  ipcMain.handle("voicevox:get-status", async () => {
    return getStatus();
  });

  ipcMain.handle("voicevox:start-download", async () => {
    const win = getWindow();
    const sendProgress = (progress: DownloadProgress) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send("voicevox:download-progress", progress);
      }
    };

    try {
      // Phase 1: Download
      await downloadEngine(sendProgress);

      // Phase 2: Extract
      await extractEngine(sendProgress);

      // Phase 3: Start engine
      sendProgress({ phase: "complete", downloaded: 0, total: 0, percent: 100, speed: 0 });
      await startEngine();

      // Notify engine status update
      const status = await getStatus();
      if (win && !win.isDestroyed()) {
        win.webContents.send("voicevox:engine-status", status);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendProgress({ phase: "error", downloaded: 0, total: 0, percent: 0, speed: 0 });
      return { success: false, error: message };
    }
  });

  ipcMain.handle("voicevox:cancel-download", () => {
    cancelDownload();
    return { success: true };
  });

  ipcMain.handle("voicevox:start-engine", async () => {
    try {
      await startEngine();
      const status = await getStatus();
      const win = getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send("voicevox:engine-status", status);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("voicevox:stop-engine", async () => {
    try {
      await stopEngine();
      const status = await getStatus();
      const win = getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send("voicevox:engine-status", status);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
