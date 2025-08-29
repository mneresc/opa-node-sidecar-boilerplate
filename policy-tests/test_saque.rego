
package governanca

import data.governanca.saque

test_allow_when_two_valid_approvals_and_verified() {
  input := {
    "tenantId": "TENANT_A",
    "principal": {"userId": "u-solicitante", "perfil": "VERIFICADO"},
    "resource": {"valor_saque": 1000},
    "context": {
      "valor_solicitado": 1000,
      "aprovacoes": [
        {"userId": "u-a1", "status": "APPROVED"},
        {"userId": "u-a2", "status": "APPROVED"}
      ],
      "usuarios": {
        "u-a1": {"roles": ["APPROVER"]},
        "u-a2": {"roles": ["APPROVER"]},
        "u-solicitante": {"roles": ["REQUESTER"]}
      }
    }
  }
  result := saque.decision with input as input
  result.allow == true
}
