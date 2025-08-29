// policy-tests/run.js
const path = require("node:path");
const fs = require("node:fs");
const { evaluate, reload } = require("../api/src/services/policyEngine");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

const ROOT = path.resolve(__dirname, "..");
const CASES = loadJson(path.join(ROOT, "policy-tests", "cases.json"));

let passed = 0, failed = 0;

function toInputFromCase(kase) {
  const tenant = kase.headers?.["X-Tenant-Id"];
  const channel = kase.headers?.["X-Channel"];
  const user = kase.headers?.["X-User-Id"];

  const body = kase.body || {};
  return {
    tenant: body.tenant || tenant,
    action: body.action || "aprovar_saque",
    subject: body.subject || { id: user, roles: [] },
    resource: body.resource || { tipo: "saque", id: "s-0", valor: 0 },
    context: body.context || { channel }
  };
}

reload();

for (const kase of CASES.cases) {
  const input = toInputFromCase(kase);
  const result = evaluate(input);

  const okAllow = result.allow === kase.expect.allow;
  const wantViol = (kase.expect.violations || []).sort();
  const gotViol = (result.violations || []).sort();
  const okViol = JSON.stringify(wantViol) === JSON.stringify(gotViol);

  const ok = okAllow && okViol;
  if (ok) {
    console.log(`✅  ${kase.name}`);
    passed++;
  } else {
    console.log(`❌  ${kase.name}`);
    console.log("    expected:", kase.expect);
    console.log("    got     :", { allow: result.allow, violations: result.violations });
    failed++;
  }
}

console.log(`\nTotal: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
process.exit(failed ? 1 : 0);
