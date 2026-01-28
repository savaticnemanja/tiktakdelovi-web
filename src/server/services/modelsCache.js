import fs from "fs";

export const loadScrapedModels = (modelsPath) => {
  let scrapedModels = {};
  try {
    const raw = fs.readFileSync(modelsPath, "utf8");
    scrapedModels = JSON.parse(raw);
  } catch (err) {
    console.warn(
      "models.json not found or unreadable; will rely on live fetch.",
      err?.message || err,
    );
  }
  return scrapedModels;
};
