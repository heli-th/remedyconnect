export const symptomCheckerData = async (req, res) => {
  const { isclientbase, base, key, table, view } = req.query;

  if (!base || !key || !table || !view) {
    return res
      .status(400)
      .send("Missing required parameters:base, key, table, or view");
  }

  const urlBase = `https://api.airtable.com/v0/${base}/${encodeURIComponent(
    table
  )}?view=${encodeURIComponent(view)}`;

  
};
