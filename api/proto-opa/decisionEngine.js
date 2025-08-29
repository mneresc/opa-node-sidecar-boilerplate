// api/src/routes/decide.js
const express = require("express");
const router = express.Router();
const { evaluate } = require("../services/policyEngine");

// Ex.: POST /decide  (body = {tenant, action, subject, resource, context})
router.post("/", async (req, res) => {
  try {
    const hdrTenant = req.header("X-Tenant-Id");
    const hdrUser = req.header("X-User-Id");
    const hdrChannel = req.header("X-Channel");

    const body = req.body || {};
    const input = {
      tenant: body.tenant || hdrTenant,
      action: body.action || "aprovar_saque",
      subject: body.subject || { id: hdrUser, roles: [] },
      resource: body.resource || { tipo: "saque", id: "s-0", valor: 0 },
      context: body.context || { channel: hdrChannel }
    };

    const decision = evaluate(input);
    const status = decision.allow ? 200 : 403;
    return res.status(status).json({ input, decision });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
