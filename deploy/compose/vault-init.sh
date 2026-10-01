#!/bin/sh
set -e
export VAULT_ADDR="http://vault:8200"
export VAULT_TOKEN="vault-root-token-fleetguard"

echo "Waiting for Vault..."
until vault status > /dev/null 2>&1; do
  sleep 1
done

echo "Enabling kv-v2 secrets engine..."
vault secrets enable -version=2 kv 2>/dev/null || true

echo "Writing secrets..."
vault kv put kv/fleetguard/database \
  postgres_user="fleetguard_app" \
  postgres_password="fleetguard_secret_pass" \
  clickhouse_user="fleetguard_app" \
  clickhouse_password="clickhouse_secret_pass" \
  redis_password="redis_secret_pass"

vault kv put kv/fleetguard/s3 \
  access_key="minio_admin" \
  secret_key="minio_secret_pass"

vault kv put kv/fleetguard/ai \
  llm_api_key="mock-key"

echo "Vault initialized successfully."
