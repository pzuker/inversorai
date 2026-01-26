# Audit Logging — Retention and Privacy Considerations

This document describes the audit logging implementation in InversorAI, including what events are logged, data retention recommendations, and privacy considerations for GDPR compliance.

## Overview

InversorAI implements structured audit logging for security-sensitive operations. Logs are emitted as JSON to stdout, enabling integration with log aggregation systems (CloudWatch, Datadog, ELK, etc.).

Two log types exist:
- **ADMIN_AUDIT**: User management actions
- **PIPELINE_AUDIT**: Market analysis pipeline executions

---

## Events Logged

### ADMIN_AUDIT Events

| Action | Description | Trigger |
|--------|-------------|---------|
| `USER_ROLE_CHANGED` | Admin changed a user's role (USER ↔ ADMIN) | `POST /api/v1/admin/users/:id/role` |
| `PASSWORD_RESET_TRIGGERED` | Admin triggered password reset for a user | `POST /api/v1/admin/users/:id/password-reset` |

**Fields logged:**

```json
{
  "type": "ADMIN_AUDIT",
  "requestId": "uuid",
  "timestamp": "ISO-8601",
  "action": "USER_ROLE_CHANGED | PASSWORD_RESET_TRIGGERED",
  "result": "success | error",
  "actor": {
    "id": "admin-user-id",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "target": {
    "id": "target-user-id",
    "email": "user@example.com"
  },
  "clientIp": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": { "previousRole": "USER", "newRole": "ADMIN" },
  "error": "error message if failed"
}
```

### PIPELINE_AUDIT Events

| Event | Description | Trigger |
|-------|-------------|---------|
| Pipeline execution | Admin ran the market analysis pipeline | `POST /api/v1/admin/pipeline/run` |

**Fields logged:**

```json
{
  "type": "PIPELINE_AUDIT",
  "requestId": "uuid",
  "userRole": "ADMIN",
  "clientIp": "192.168.1.1",
  "assetSymbol": "BTC-USD",
  "timestamp": "ISO-8601",
  "result": "success | error",
  "duration": 1234,
  "error": "error message if failed"
}
```

---

## Why These Fields Are Logged

### Actor/Target Email

Email addresses are logged to enable:
- **Accountability**: Identify who performed privileged actions
- **Incident response**: Trace unauthorized access or abuse
- **Compliance**: Meet audit trail requirements

### Client IP and User Agent

Logged for:
- **Forensic analysis**: Detect compromised accounts or suspicious patterns
- **Geographic anomaly detection**: Identify logins from unexpected locations
- **Device fingerprinting**: Correlate actions across sessions

### Request ID and Timestamp

Enable:
- **Request tracing**: Correlate logs with application errors
- **Timeline reconstruction**: Establish sequence of events during incidents

---

## Retention Recommendations

| Environment | Retention Period | Rationale |
|-------------|------------------|-----------|
| Development | 7 days | Sufficient for debugging |
| Staging | 30 days | Cover testing cycles |
| Production | 90 days | Balance compliance needs with storage costs |
| Compliance-critical | 1 year+ | GDPR/regulatory requirements may mandate longer |

### Implementation Notes

1. **Log aggregation**: Ship logs to a centralized system (CloudWatch Logs, Datadog, ELK)
2. **Lifecycle policies**: Configure automatic deletion after retention period
3. **Immutability**: Use append-only storage to prevent tampering
4. **Encryption**: Encrypt logs at rest and in transit

---

## Access Controls

Audit logs should be protected with strict access controls:

| Role | Access Level |
|------|--------------|
| System administrators | Read-only access for incident response |
| Security team | Full access for investigations |
| Developers | No direct access (use anonymized samples for debugging) |
| End users | No access |

### Recommended Controls

- Separate log storage from application data
- Require MFA for log access
- Log all access to audit logs (meta-auditing)
- Alert on bulk log exports

---

## GDPR / PII Considerations

### PII Present in Logs

| Field | PII Type | Necessity |
|-------|----------|-----------|
| `actor.email` | Email address | Required for accountability |
| `target.email` | Email address | Required for audit trail |
| `clientIp` | IP address | Required for security analysis |
| `userAgent` | Device info | Optional, aids forensics |

### Academic Context Disclaimer

> **Note**: This system is developed for academic purposes (TFM - Trabajo Final de Máster). In a production deployment handling EU user data, additional GDPR compliance measures would be required.

### GDPR Compliance Checklist (Production)

For production deployments processing EU personal data:

- [ ] **Legal basis**: Document legitimate interest for logging (security)
- [ ] **Data minimization**: Log only necessary fields
- [ ] **Retention limits**: Implement automatic deletion after retention period
- [ ] **Right to erasure**: Implement process to delete user data from logs upon request
- [ ] **Access requests**: Implement process to export user's audit trail upon request
- [ ] **DPA**: Ensure Data Processing Agreements with log storage providers
- [ ] **Privacy policy**: Disclose logging practices to users
- [ ] **DPIA**: Conduct Data Protection Impact Assessment if high-risk processing

### Anonymization Strategies

For long-term analytics while respecting privacy:

1. **Pseudonymization**: Replace emails with hashed identifiers after retention period
2. **IP truncation**: Store only `/24` subnet (e.g., `192.168.1.0`) after 30 days
3. **Aggregation**: Convert detailed logs to aggregate metrics for trend analysis

---

## Log Format Examples

### Successful Role Change

```json
{
  "type": "ADMIN_AUDIT",
  "requestId": "f2d4dfed-c4f1-44f1-b975-141ce8abfbc3",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "action": "USER_ROLE_CHANGED",
  "result": "success",
  "actor": {
    "id": "admin-123",
    "email": "admin@inversorai.com",
    "role": "ADMIN"
  },
  "target": {
    "id": "user-456",
    "email": "user@example.com"
  },
  "clientIp": "192.168.1.100",
  "metadata": {
    "previousRole": "USER",
    "newRole": "ADMIN"
  }
}
```

### Failed Pipeline Execution

```json
{
  "type": "PIPELINE_AUDIT",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userRole": "ADMIN",
  "clientIp": "10.0.0.50",
  "assetSymbol": "INVALID-SYMBOL",
  "timestamp": "2024-01-15T11:45:00.000Z",
  "result": "error",
  "error": "Invalid symbol. Allowed: BTC-USD, AAPL, EURUSD=X"
}
```

---

## Related Documentation

- [ADR-0005: Seguridad, IAM y Autorización](./03_ADR/ADR-0005-seguridad-iam-autorizacion.md)
- [Operación Admin y Gobernanza](./11_OPERACION_ADMIN_Y_GOBERNANZA.md)
- [Supabase Configuration](./SUPABASE_CONFIG.md)
