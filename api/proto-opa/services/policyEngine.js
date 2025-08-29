// api/src/services/policyEngine.js
const path = require("node:path");
const fs = require("node:fs");
const jsonLogic = require("json-logic-js");

/**
 * Carrega JSON com cache leve em memória.
 */
function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

const ROOT = path.resolve(__dirname, "../../.."); // repo root
const CONFIG_PATH = path.join(ROOT, "data", "config.json");
const RULES_PATH = path.join(ROOT, "data", "rules.json");

// Carregamento inicial (pode trocar por hot-reload se quiser)
let CONFIG = loadJson(CONFIG_PATH);
let RULESET = loadJson(RULES_PATH);

/**
 * Recarrega config/rules (útil em dev)
 */
function reload() {
  CONFIG = loadJson(CONFIG_PATH);
  RULESET = loadJson(RULES_PATH);
}

/**
 * Avalia as regras do tenant sobre um input no formato "OPA-like".
 * @param {object} input { tenant, action, subject, resource, context }
 * @returns {{ allow: boolean, violations: string[], details: object }}
 */
function evaluate(input) {
  const { tenant } = input;
  const tenantConfig = CONFIG.tenants?.[tenant];
  if (!tenantConfig) {
    return {
      allow: false,
      violations: [`Tenant desconhecido: ${tenant}`],
      details: { evaluatedRules: [] }
    };
  }

  const activeRuleIds = new Set(tenantConfig.rules || []);
  const evaluatedRules = [];
  const violations = [];

  // Ambiente de avaliação disponível às expressões JSONLogic
  const env = { ...input, tenantConfig };

  for (const rule of RULESET.rules) {
    if (!activeRuleIds.has(rule.id)) continue;

    // "applies" é opcional — filtra por domínio (ex.: saque)
    let applies = true;
    if (rule.applies) {
      applies = !!jsonLogic.apply(rule.applies, env);
    }
    if (!applies) {
      evaluatedRules.push({ id: rule.id, skipped: true });
      continue;
    }

    const triggered = !!jsonLogic.apply(rule.logic, env);
    evaluatedRules.push({ id: rule.id, triggered });

    if (rule.type === "deny" && triggered) {
      violations.push(rule.message || rule.id);
    }
  }

  const allow = violations.length === 0;
  return { allow, violations, details: { evaluatedRules } };
}

module.exports = { evaluate, reload };
