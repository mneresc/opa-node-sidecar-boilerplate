
import axios from "axios";
import { pool } from "../src/db.js";

const OPA_URL = process.env.OPA_URL || "http://localhost:8181";

export async function decidirSaque({ tenantId, saqueId, solicitanteId, canal }) {
  const client = await pool.connect();
  try {
    const saque = await client.query(
      `SELECT id, tenant_id, valor AS valor_saque, criado_por AS solicitante_id
         FROM saques WHERE id = $1 AND tenant_id = $2`,
      [saqueId, tenantId]
    );
    if (saque.rowCount === 0) {
      return { decision: "DENY", rules: [{ id:"saque_existe", passed:false, reason:"saque não encontrado" }], obligations: [] };
    }
    const { valor_saque } = saque.rows[0];

    const aprovs = await client.query(
      `SELECT user_id, status, created_at
         FROM saque_aprovacoes
        WHERE saque_id = $1 AND tenant_id = $2`,
      [saqueId, tenantId]
    );

    const userIds = Array.from(new Set([solicitanteId, ...aprovs.rows.map(r => r.user_id)]));
    const usuarios = await client.query(
      `SELECT user_id, perfil, roles
         FROM usuarios
        WHERE tenant_id = $1
          AND user_id = ANY($2)`,
      [tenantId, userIds]
    );

    const usuariosMap = Object.fromEntries(
      usuarios.rows.map(r => [r.user_id, { perfil: r.perfil, roles: r.roles }])
    );

    const input = {
      action: "aprovar_saque",
      tenantId,
      principal: {
        userId: solicitanteId,
        perfil: usuariosMap[solicitanteId]?.perfil || "DESCONHECIDO"
      },
      resource: {
        tipo: "saque",
        id: saqueId,
        valor_saque: Number(valor_saque)
      },
      context: {
        canal,
        valor_solicitado: Number(valor_saque),
        aprovacoes: aprovs.rows.map(r => ({ userId: r.user_id, status: r.status })),
        usuarios: usuariosMap
      }
    };

    const { data } = await axios.post(
      `${OPA_URL}/v1/data/governanca/saque/decision`,
      { input },
      { timeout: 300 }
    );

    const res = data.result;
    const decision = res.allow ? "ALLOW" : (res.violacoes?.length ? "DENY" : "REVIEW");
    return {
      decision,
      rules: (res.violacoes ?? []).map(v => ({ id: v.id, passed: false, reason: v.motivo, evidence: v.evidence })),
      obligations: res.obligations ?? [],
      policy_version: res.policy_version
    };
  } finally {
    client.release();
  }
}
