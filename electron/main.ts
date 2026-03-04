import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fork, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { registerVoicevoxIPC } from "./voicevox-ipc";
import { isEngineInstalled, startEngine, stopEngine } from "./voicevox-engine";
import { initAutoUpdater } from "./auto-updater";

// --- Path helpers ---
const isProd = app.isPackaged;
// dist/electron/main.js → ../../ = project root
const ROOT = isProd
  ? path.join(process.resourcesPath, "app")
  : path.resolve(__dirname, "..", "..");

const ENV_PATH = isProd
  ? path.join(path.dirname(app.getPath("exe")), ".env.local")
  : path.join(ROOT, ".env.local");

// On first packaged launch, copy bundled .env.local to userData if missing
if (isProd) {
  const bundledEnv = path.join(process.resourcesPath, "app", ".env.local");
  if (!fs.existsSync(ENV_PATH) && fs.existsSync(bundledEnv)) {
    fs.copyFileSync(bundledEnv, ENV_PATH);
  }
}

// Load environment variables
if (fs.existsSync(ENV_PATH)) {
  dotenv.config({ path: ENV_PATH });
}

// --- State ---
let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
const PORT = 3000;

// --- Next.js server ---
function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = isProd
      ? path.join(process.resourcesPath, "app", ".next", "standalone", "server.js")
      : path.join(ROOT, ".next", "standalone", "server.js");

    console.log("[Electron] ROOT:", ROOT);
    console.log("[Electron] serverPath:", serverPath);
    console.log("[Electron] exists:", fs.existsSync(serverPath));

    if (!fs.existsSync(serverPath)) {
      reject(
        new Error(
          `server.js not found at ${serverPath}.\nRun "npm run build" first.`
        )
      );
      return;
    }

    const serverCwd = path.dirname(serverPath);

    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: "localhost",
      },
      cwd: serverCwd,
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    });

    let resolved = false;
    let stderrOutput = "";

    // Listen for server ready signal on stdout
    serverProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      console.log("[Next.js]", msg.trim());
      if (!resolved && (msg.includes("Ready") || msg.includes("started server") || msg.includes(`localhost:${PORT}`))) {
        resolved = true;
        resolve();
      }
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      stderrOutput += msg + "\n";
      console.error("[Next.js ERR]", msg);
    });

    serverProcess.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    serverProcess.on("exit", (code) => {
      console.log(`[Next.js] exited with code ${code}`);
      if (!resolved) {
        resolved = true;
        const detail = stderrOutput
          ? `\n\nServer output:\n${stderrOutput.slice(0, 500)}`
          : "";
        reject(new Error(`Next.js server exited with code ${code}${detail}`));
      }
    });

    // Fallback: resolve after timeout (server may not print "Ready")
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log("[Electron] Server timeout fallback — assuming ready");
        resolve();
      }
    }, 10000);
  });
}

function stopNextServer() {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// --- API key check ---
function hasApiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function saveEnvFile(key: string, value: string) {
  let content = "";
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, "utf-8");
  }

  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }

  fs.writeFileSync(ENV_PATH, content, "utf-8");
  process.env[key] = value;
}

// --- Window ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "Video Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open DevTools in development
  if (!isProd) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- IPC handlers ---
ipcMain.handle("get-api-key-status", () => {
  return { hasKey: hasApiKey() };
});

ipcMain.handle("save-api-key", (_event, apiKey: string) => {
  saveEnvFile("GEMINI_API_KEY", apiKey);
  return { success: true };
});

ipcMain.handle("get-env", (_event, key: string) => {
  return process.env[key] ?? null;
});

ipcMain.handle("select-directory", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("select-media-file", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      {
        name: "メディアファイル",
        extensions: ["mp3", "wav", "m4a", "ogg", "flac", "mp4", "webm", "mov"],
      },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase().slice(1);
  const mimeMap: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    flac: "audio/flac",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
  };
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size,
    mimeType: mimeMap[ext] || "application/octet-stream",
  };
});

ipcMain.handle("read-file-as-base64", async (_event, filePath: string) => {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
});

// --- App lifecycle ---
app.whenReady().then(async () => {
  try {
    // Register VOICEVOX IPC handlers
    registerVoicevoxIPC(() => mainWindow);

    console.log("[Electron] Starting Next.js server...");
    console.log("[Electron] isProd:", isProd);
    console.log("[Electron] ROOT:", ROOT);
    await startNextServer();
    console.log("[Electron] Next.js server ready, opening window.");

    // Try to start VOICEVOX engine if installed (non-fatal)
    if (isEngineInstalled()) {
      console.log("[Electron] VOICEVOX engine found, starting...");
      startEngine().catch((err) => {
        console.warn("[Electron] VOICEVOX engine start failed (non-fatal):", err);
      });
    }

    createWindow();

    // Initialize auto-updater (only active in packaged builds)
    initAutoUpdater(() => mainWindow);
  } catch (err) {
    console.error("[Electron] Failed to start:", err);
    dialog.showErrorBox(
      "起動エラー",
      `Next.jsサーバーの起動に失敗しました。\n\n${err instanceof Error ? err.message : String(err)}`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopEngine().catch(() => {});
  stopNextServer();
  app.quit();
});

app.on("before-quit", () => {
  stopEngine().catch(() => {});
  stopNextServer();
});
