import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.join(__dirname, "..");
const srcDir = path.join(serverDir, "..");
const rootDir = path.join(srcDir, "..");

const modelsPath = path.join(srcDir, "client", "data", "models.json");
const distPath = path.join(rootDir, "dist");

export const paths = {
  serverDir,
  srcDir,
  rootDir,
  modelsPath,
  distPath,
};
