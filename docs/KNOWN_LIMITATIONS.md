# Known Limitations

This document honestly records any constraints, hardware limits, and accepted trade-offs discovered during development and testing, in compliance with Section 0 Rule 4 of `PLAN.md`.

## 1. Hardware Constraints & Profile Separation
- Sustained 100,000 events/second and 300,000 events/second 5-minute burst require a cloud VM (32 vCPU, 64 GB RAM, NVMe) or Kubernetes cluster.
- On local developer laptops, the `dev` profile (5,000 vehicles, ~5k events/s) and `laptop` profile (100,000 vehicles seeded, 20,000 active, ~20k events/s) are supported.
- Synthetic data is used for machine learning training and evaluation; as stated in Section 1.4, real OEM physics may exhibit additional unmodeled failure modes.

## 2. Security & Development Caveats
- Self-signed dev CA certificates are used for mTLS in development mode (`deploy/compose/certs/dev-ca.crt`). Production environments should use HashiCorp Vault PKI or cert-manager with an enterprise root CA.
- Keycloak is run in `start-dev` mode locally for rapid startup with imported realms.

## 3. Storage Tiering
- ClickHouse storage policy `hot_warm` is configured for local NVMe hot volume and S3/MinIO cold volume.
