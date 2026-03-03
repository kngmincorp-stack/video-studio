import { app, ipcMain, type BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

export function initAutoUpdater(getWindow: () => BrowserWindow | null) {
  if (!app.isPackaged) {
    console.log("[AutoUpdater] Skipping in development mode");
    return;
  }

  // --- Configuration ---
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // --- Helper: send status to renderer ---
  function sendStatus(data: Record<string, unknown>) {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send("updater:status", data);
    }
  }

  // --- autoUpdater events → renderer push ---
  autoUpdater.on("checking-for-update", () => {
    sendStatus({ status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    sendStatus({ status: "available", version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    sendStatus({ status: "not-available" });
  });

  autoUpdater.on("download-progress", (progress) => {
    sendStatus({
      status: "downloading",
      progress: {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      },
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendStatus({ status: "downloaded", version: info.version });
  });

  autoUpdater.on("error", (err) => {
    sendStatus({ status: "error", error: err.message });
  });

  // --- IPC handlers ---
  ipcMain.handle("updater:check", async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.handle("updater:download", async () => {
    await autoUpdater.downloadUpdate();
  });

  ipcMain.handle("updater:install", () => {
    autoUpdater.quitAndInstall();
  });

  // --- Auto-check on startup (5s delay) ---
  setTimeout(() => {
    console.log("[AutoUpdater] Checking for updates...");
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn("[AutoUpdater] Check failed:", err.message);
    });
  }, 5000);
}
