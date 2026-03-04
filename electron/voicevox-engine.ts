import { app } from "electron";
import { spawn, execFile, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";

// --- Constants ---
const ENGINE_VERSION = "0.25.1";
const ENGINE_PORT = 50021;
const DOWNLOAD_URL = `https://github.com/VOICEVOX/voicevox_engine/releases/download/${ENGINE_VERSION}/voicevox_engine-windows-cpu-${ENGINE_VERSION}.7z.001`;
const ARCHIVE_FILENAME = `voicevox_engine-windows-cpu-${ENGINE_VERSION}.7z.001`;

const isProd = app.isPackaged;

function getEngineDir(): string {
  if (isProd) {
    return path.join(app.getPath("userData"), "voicevox-engine");
  }
  return path.join(
    path.resolve(__dirname, "..", ".."),
    ".voicevox-engine"
  );
}

// Migrate engine from old location (install dir) to userData
function migrateEngineDir(): void {
  if (!isProd) return;
  const oldDir = path.join(path.dirname(app.getPath("exe")), "voicevox-engine");
  const newDir = getEngineDir();
  if (fs.existsSync(path.join(oldDir, "run.exe")) && !fs.existsSync(path.join(newDir, "run.exe"))) {
    try {
      fs.renameSync(oldDir, newDir);
      console.log("[VoicevoxEngine] Migrated engine to userData");
    } catch {
      console.warn("[VoicevoxEngine] Migration failed, will re-download if needed");
    }
  }
}

migrateEngineDir();

function get7zaPath(): string {
  if (isProd) {
    return path.join(process.resourcesPath, "app", "resources", "7za.exe");
  }
  return path.join(path.resolve(__dirname, "..", ".."), "resources", "7za.exe");
}

// --- State ---
let engineProcess: ChildProcess | null = null;
let downloadAbortController: AbortController | null = null;

// --- Public API ---

export function isEngineInstalled(): boolean {
  const runExe = path.join(getEngineDir(), "run.exe");
  return fs.existsSync(runExe);
}

export function getEnginePort(): number {
  return ENGINE_PORT;
}

export interface DownloadProgress {
  phase: "downloading" | "extracting" | "complete" | "error";
  downloaded: number;
  total: number;
  percent: number;
  speed: number; // bytes/sec
}

export async function downloadEngine(
  onProgress: (progress: DownloadProgress) => void
): Promise<void> {
  const engineDir = getEngineDir();
  fs.mkdirSync(engineDir, { recursive: true });

  const archivePath = path.join(engineDir, ARCHIVE_FILENAME);

  // Check for partial download (resume support)
  let startByte = 0;
  if (fs.existsSync(archivePath)) {
    startByte = fs.statSync(archivePath).size;
  }

  downloadAbortController = new AbortController();

  await new Promise<void>((resolve, reject) => {
    const makeRequest = (url: string) => {
      const headers: Record<string, string> = {};
      if (startByte > 0) {
        headers["Range"] = `bytes=${startByte}-`;
      }

      const urlObj = new URL(url);
      const transport = urlObj.protocol === "https:" ? https : http;

      const req = transport.get(url, { headers }, (res) => {
        // Follow redirects
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          makeRequest(res.headers.location);
          return;
        }

        if (res.statusCode !== 200 && res.statusCode !== 206) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }

        const isPartial = res.statusCode === 206;
        const contentLength = parseInt(res.headers["content-length"] || "0", 10);
        const total = isPartial ? startByte + contentLength : contentLength;
        let downloaded = isPartial ? startByte : 0;

        const writeStream = fs.createWriteStream(archivePath, {
          flags: isPartial ? "a" : "w",
        });

        let lastTime = Date.now();
        let lastDownloaded = downloaded;

        res.on("data", (chunk: Buffer) => {
          downloaded += chunk.length;
          writeStream.write(chunk);

          const now = Date.now();
          const elapsed = (now - lastTime) / 1000;
          let speed = 0;
          if (elapsed > 0.5) {
            speed = (downloaded - lastDownloaded) / elapsed;
            lastTime = now;
            lastDownloaded = downloaded;
          }

          onProgress({
            phase: "downloading",
            downloaded,
            total,
            percent: total > 0 ? Math.round((downloaded / total) * 100) : 0,
            speed,
          });
        });

        res.on("end", () => {
          writeStream.end(() => resolve());
        });

        res.on("error", (err) => {
          writeStream.end();
          reject(err);
        });

        // Abort support
        downloadAbortController!.signal.addEventListener("abort", () => {
          res.destroy();
          writeStream.end();
          reject(new Error("Download cancelled"));
        });
      });

      req.on("error", reject);
    };

    makeRequest(DOWNLOAD_URL);
  });
}

export function cancelDownload(): void {
  if (downloadAbortController) {
    downloadAbortController.abort();
    downloadAbortController = null;
  }
}

export async function extractEngine(
  onProgress: (progress: DownloadProgress) => void
): Promise<void> {
  const engineDir = getEngineDir();
  const archivePath = path.join(engineDir, ARCHIVE_FILENAME);
  const sevenZaPath = get7zaPath();

  if (!fs.existsSync(sevenZaPath)) {
    throw new Error(`7za.exe not found at ${sevenZaPath}`);
  }
  if (!fs.existsSync(archivePath)) {
    throw new Error(`Archive not found at ${archivePath}`);
  }

  await new Promise<void>((resolve, reject) => {
    const proc = execFile(
      sevenZaPath,
      ["x", archivePath, `-o${engineDir}`, "-y"],
      { maxBuffer: 10 * 1024 * 1024 },
      (error) => {
        if (error) {
          reject(new Error(`Extraction failed: ${error.message}`));
          return;
        }

        // 7z extracts into a subfolder (e.g. windows-cpu/). Move contents up.
        try {
          const entries = fs.readdirSync(engineDir);
          const subDir = entries.find((e) => {
            const full = path.join(engineDir, e);
            return fs.statSync(full).isDirectory() && e !== "." && e !== "..";
          });
          if (subDir) {
            const subDirPath = path.join(engineDir, subDir);
            for (const item of fs.readdirSync(subDirPath)) {
              fs.renameSync(
                path.join(subDirPath, item),
                path.join(engineDir, item)
              );
            }
            fs.rmdirSync(subDirPath);
          }
        } catch (moveErr) {
          console.warn("[VoicevoxEngine] Could not flatten extracted dir:", moveErr);
        }

        // Clean up archive after successful extraction
        try {
          fs.unlinkSync(archivePath);
        } catch {
          // ignore cleanup errors
        }
        resolve();
      }
    );

    // Parse stdout for progress percentage
    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/(\d+)%/);
      if (match) {
        const percent = parseInt(match[1], 10);
        onProgress({
          phase: "extracting",
          downloaded: 0,
          total: 0,
          percent,
          speed: 0,
        });
      }
    });
  });
}

async function isPortResponding(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/version`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function waitForHealthy(timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortResponding(ENGINE_PORT)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

export async function startEngine(): Promise<void> {
  // Check if already responding (external VOICEVOX may be running)
  if (await isPortResponding(ENGINE_PORT)) {
    console.log("[VoicevoxEngine] Port already responding, reusing existing engine");
    return;
  }

  if (!isEngineInstalled()) {
    throw new Error("VOICEVOX engine is not installed");
  }

  const runExe = path.join(getEngineDir(), "run.exe");
  console.log("[VoicevoxEngine] Starting engine:", runExe);

  engineProcess = spawn(runExe, ["--host", "localhost", "--port", String(ENGINE_PORT)], {
    cwd: getEngineDir(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  engineProcess.stdout?.on("data", (data: Buffer) => {
    console.log("[VoicevoxEngine]", data.toString().trim());
  });

  engineProcess.stderr?.on("data", (data: Buffer) => {
    console.error("[VoicevoxEngine ERR]", data.toString().trim());
  });

  engineProcess.on("exit", (code) => {
    console.log(`[VoicevoxEngine] Exited with code ${code}`);
    engineProcess = null;
  });

  // Wait for engine to become healthy
  const healthy = await waitForHealthy(60000);
  if (!healthy) {
    throw new Error("VOICEVOX engine failed to start within 60 seconds");
  }
  console.log("[VoicevoxEngine] Engine is ready");
}

export async function stopEngine(): Promise<void> {
  if (!engineProcess) return;

  console.log("[VoicevoxEngine] Stopping engine...");

  const pid = engineProcess.pid;
  if (pid) {
    // On Windows, use taskkill to kill the process tree
    try {
      execFile("taskkill", ["/pid", String(pid), "/t", "/f"], (err) => {
        if (err) console.error("[VoicevoxEngine] taskkill error:", err.message);
      });
    } catch {
      engineProcess.kill("SIGTERM");
    }
  } else {
    engineProcess.kill("SIGTERM");
  }

  engineProcess = null;
}

export function isEngineRunning(): boolean {
  return engineProcess !== null;
}

export async function getStatus(): Promise<{
  installed: boolean;
  running: boolean;
  version: string | null;
  port: number;
}> {
  const installed = isEngineInstalled();
  let running = false;
  let version: string | null = null;

  if (await isPortResponding(ENGINE_PORT)) {
    running = true;
    try {
      const data = await new Promise<string>((resolve, reject) => {
        http.get(`http://localhost:${ENGINE_PORT}/version`, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve(body));
          res.on("error", reject);
        }).on("error", reject);
      });
      version = data.replace(/"/g, "").trim();
    } catch {
      // ignore version fetch errors
    }
  }

  return { installed, running, version, port: ENGINE_PORT };
}
