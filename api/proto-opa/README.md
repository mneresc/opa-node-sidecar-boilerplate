# Validando passar a lógica do OPA para a aplicação

curl -sS -X POST http://localhost:3000/decide \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: TENANT_A" \
  -H "X-User-Id: u-42" \
  -H "X-Channel: WEB" \
  -d '{
    "action": "aprovar_saque",
    "subject": { "id": "u-42", "roles": ["aprovador_n2"] },
    "resource": { "tipo": "saque", "id": "s-1", "valor": 1200 }
  }'

Resposta Esperada

{
  "input": { ... },
  "decision": {
    "allow": true,
    "violations": [],
    "details": { "evaluatedRules": [ { "id":"canal_nao_permitido", "triggered": false }, ... ] }
  }
}
