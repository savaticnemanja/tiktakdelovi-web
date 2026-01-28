export const createModelsController = ({ scrapedModels }) => {
  return (req, res) => {
    const brand = String(req.query.brand || "").trim();
    if (!brand) {
      return res.status(400).json({ error: "brand is required" });
    }

    if (scrapedModels && scrapedModels[brand]) {
      return res.json({ ok: true, options: scrapedModels[brand] });
    }

    return res
      .status(404)
      .json({ error: "Models not found in cache for this brand", options: [] });
  };
};
