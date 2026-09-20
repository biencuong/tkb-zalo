/**
 * Kiểm tra node:sqlite có trong Electron đã cài hay không (chạy: npm run kiem-sqlite).
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const electron = require("electron"); // đường dẫn electron.exe
const r = spawnSync(electron, ["-p", "process.versions.electron + ' | node ' + process.versions.node + ' | sqlite ' + typeof require('node:sqlite').DatabaseSync"], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
  encoding: "utf8",
});
console.log((r.stdout || "").trim());
if (r.stderr) console.error(r.stderr.trim());
process.exit(r.status ?? 1);
