// data/rules.js
/**
 * Cada regra:
 *  - id: string (único)
 *  - type: "deny" | "warn" (opcional; usamos "deny" aqui)
 *  - applies(input, cfg)?: boolean   -> se ausente, assume true
 *  - check(input, cfg): string|null  -> mensagem de violação ou null
 */
const rules = [
  {
    id: "canal_nao_permitido",
    type: "deny",
    applies: (input) => input?.resource?.tipo === "saque",
    check: (input, cfg) => {
      const canal = input?.context?.channel;
      const permitidos = cfg?.canais_permitidos || [];
      return permitidos.includes(canal) ? null : "Canal não permitido para o tenant.";
    }
  },
  {
    id: "req_nivel_n2",
    type: "deny",
    applies: (input) => input?.resource?.tipo === "saque",
    check: (input, cfg) => {
      const v = Number(input?.resource?.valor || 0);
      const n1 = Number(cfg?.limites?.n1 ?? Infinity);
      const n2 = Number(cfg?.limites?.n2 ?? Infinity);
      const roles = input?.subject?.roles || [];
      const precisaN2 = v > n1 && v <= n2;
      const temN2 = roles.includes("aprovador_n2");
      return precisaN2 && !temN2
        ? "Valor acima do N1 requer papel 'aprovador_n2'."
        : null;
    }
  },
  {
    id: "req_nivel_n3",
    type: "deny",
    applies: (input) => input?.resource?.tipo === "saque",
    check: (input, cfg) => {
      const v = Number(input?.resource?.valor || 0);
      const n2 = Number(cfg?.limites?.n2 ?? Infinity);
      const roles = input?.subject?.roles || [];
      const precisaN3 = v > n2;
      const temN3 = roles.includes("aprovador_n3");
      return precisaN3 && !temN3
        ? "Valor acima do N2 requer papel 'aprovador_n3'."
        : null;
    }
  }
];

module.exports = { rules };
