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

const buildLogger = (filePath) => async (entry) => {
  try {
    await appendLog(filePath, entry);
  } catch (err) {
    console.error("Log write failed:", err?.message || err);
  }
};

export const createRequestLogger = ({ logsDir }) => {
  const apiLogPath = path.join(logsDir, "api.json");
  const webhookLogPath = path.join(logsDir, "webhook.json");

  const logApi = buildLogger(apiLogPath);
  const logWebhook = buildLogger(webhookLogPath);

  const middlewareFor = (type) => {
    const log = type === "webhook" ? logWebhook : logApi;
    return (req, res, next) => {
      const startedAt = Date.now();
      const requestBody = req.body ?? null;

      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      const finalize = (body) => {
        log({
          at: new Date().toISOString(),
          type,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Date.now() - startedAt,
          request: {
            headers: req.headers ?? null,
            query: req.query ?? null,
            body: requestBody,
          },
          response: body ?? null,
        });
      };

      res.json = (body) => {
        finalize(body);
        return originalJson(body);
      };

      res.send = (body) => {
        finalize(body);
        return originalSend(body);
      };

      next();
    };
  };

  const getLogs = (type) => {
    const filePath = type === "webhook" ? webhookLogPath : apiLogPath;
    return async (req, res) => {
      try {
        const raw = await fs.promises.readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);
        return res.json(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        if (err.code === "ENOENT") {
          return res.json([]);
        }
        return res.status(500).json({ error: "Failed to read logs" });
      }
    };
  };

  return {
    apiLogger: middlewareFor("api"),
    webhookLogger: middlewareFor("webhook"),
    getApiLogs: getLogs("api"),
    getWebhookLogs: getLogs("webhook"),
  };
};
