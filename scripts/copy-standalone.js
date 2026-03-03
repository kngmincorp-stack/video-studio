const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("Copied .next/static -> standalone");
}

if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("Copied public -> standalone");
}

console.log("Done.");
