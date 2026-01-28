export const createHealthController = ({ provider }) => {
  return (req, res) => res.json({ ok: true, provider });
};
