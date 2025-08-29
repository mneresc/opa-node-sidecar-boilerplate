
import { pool } from "./db.js";

export async function seed() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS saques (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        valor NUMERIC NOT NULL,
        criado_por TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS saque_aprovacoes (
        saque_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS usuarios (
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        perfil TEXT,
        roles TEXT[],
        PRIMARY KEY (tenant_id, user_id)
      );
    `);

    // limpa dados
    await client.query("DELETE FROM saque_aprovacoes");
    await client.query("DELETE FROM saques");
    await client.query("DELETE FROM usuarios");

    // cria exemplo
    await client.query(
      "INSERT INTO saques (id, tenant_id, valor, criado_por) VALUES ($1,$2,$3,$4)",
      ["saque-1", "TENANT_A", 1500, "u-solicitante"]
    );

    await client.query(
      "INSERT INTO usuarios (tenant_id, user_id, perfil, roles) VALUES ($1,$2,$3,$4)",
      ["TENANT_A","u-solicitante","VERIFICADO",["REQUESTER"]]
    );
    await client.query(
      "INSERT INTO usuarios (tenant_id, user_id, perfil, roles) VALUES ($1,$2,$3,$4)",
      ["TENANT_A","u-aprov1","VERIFICADO",["APPROVER"]]
    );
    await client.query(
      "INSERT INTO usuarios (tenant_id, user_id, perfil, roles) VALUES ($1,$2,$3,$4)",
      ["TENANT_A","u-aprov2","VERIFICADO",["APPROVER"]]
    );
    await client.query(
      "INSERT INTO usuarios (tenant_id, user_id, perfil, roles) VALUES ($1,$2,$3,$4)",
      ["TENANT_A","u-aprov3","DESCONHECIDO",["VIEWER"]]
    );

    // aprovacoes
    await client.query(
      "INSERT INTO saque_aprovacoes (saque_id, tenant_id, user_id, status) VALUES ($1,$2,$3,$4)",
      ["saque-1","TENANT_A","u-aprov1","APPROVED"]
    );
    await client.query(
      "INSERT INTO saque_aprovacoes (saque_id, tenant_id, user_id, status) VALUES ($1,$2,$3,$4)",
      ["saque-1","TENANT_A","u-aprov2","APPROVED"]
    );
    // um que não conta (VIEWER)
    await client.query(
      "INSERT INTO saque_aprovacoes (saque_id, tenant_id, user_id, status) VALUES ($1,$2,$3,$4)",
      ["saque-1","TENANT_A","u-aprov3","APPROVED"]
    );

  } finally {
    client.release();
  }
}
