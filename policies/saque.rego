
package governanca.saque

default decision := {"allow": false, "violacoes": [], "obligations": [], "policy_version": data.config.version}

required_approvals := n {
  some t
  t := input.tenantId
  n := data.config.tenants[t].requiredApprovals
} else := 2

# valor confere
violacoes[v] {
  input.resource.valor_saque != input.context.valor_solicitado
  v := {"id": "valor_confere", "motivo": "valor divergente",
        "evidence": {"esperado": input.resource.valor_saque, "solicitado": input.context.valor_solicitado}}
}

# aprovações válidas (status=APPROVED, role APPROVER, sem auto-aprovação)
valid_approvals[uid] {
  some a
  a := input.context.aprovacoes[_]
  a.status == "APPROVED"
  uid := a.userId
  input.context.usuarios[uid].roles[_] == "APPROVER"
  uid != input.principal.userId
}

violacoes[v] {
  count(valid_approvals) < required_approvals
  v := {"id": "min_approvals",
        "motivo": sprintf("menos de %d aprovações válidas", [required_approvals]),
        "evidence": {"validas": count(valid_approvals), "required": required_approvals}}
}

# perfil do solicitante
violacoes[v] {
  not input.principal.perfil == "VERIFICADO"
  v := {"id":"perfil_solicitante","motivo":"solicitante não verificado"}
}

allow {
  count(violacoes) == 0
}

decision := {
  "allow": allow,
  "violacoes": violacoes,
  "obligations": obligations,
  "policy_version": data.config.version
}

obligations := o {
  input.context.canal == "WEB"
  o := ["MFA_REQUIRED"]
} else := []
