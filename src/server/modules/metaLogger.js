import fs from "fs";
import path from "path";

const ensureDir = async (dir) => {
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
};

const appendLog = async (filePath, payload) => {
  await ensureDir(path.dirname(filePath));
  let entries = [];
  try {
    const raw = await fs.promises.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    entries = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  entries.push(payload);
  await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2));
};

export const createMetaLogger = ({ logsDir }) => {
  const metaLogPath = path.join(logsDir, "meta-errors.json");

  const logError = async (entry) => {
    try {
      await appendLog(metaLogPath, entry);
    } catch (err) {
      console.error("Meta error log failed:", err?.message || err);
    }
  };

  const getMetaLogs = async (req, res) => {
    try {
      const raw = await fs.promises.readFile(metaLogPath, "utf8");
      try {
        const parsed = JSON.parse(raw);
        return res.json(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        return res.json([]);
      }
    } catch (err) {
      return res.json([]);
    }
  };

  return { logError, getMetaLogs };
};
