
import express from "express";
import { decidirSaque } from "../pep/decidirSaque.js";
import { seed } from "./seed.js";

const app = express();
app.use(express.json());

app.post("/seed", async (_req, res) => {
  try {
    await seed();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post("/saques/:id/decidir", async (req, res) => {
  const tenantId = req.header("X-Tenant-Id");
  const solicitanteId = req.header("X-User-Id");
  const canal = req.header("X-Channel") || "API";
  if (!tenantId || !solicitanteId) {
    return res.status(400).json({ error: "Missing X-Tenant-Id or X-User-Id" });
  }
  try {
    const out = await decidirSaque({
      tenantId,
      saqueId: req.params.id,
      solicitanteId,
      canal
    });
    return res.status(out.decision === "ALLOW" ? 200 : 403).json(out);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error", detail: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API on :" + port));
