# FleetGuard AI

> Predictive Maintenance and Fleet Copilot Platform
> Connected Vehicle Intelligence Hackathon (SRM x Talenciaglobal)
> Industry reference: Motorq (independent academic exercise, no affiliation)

FleetGuard AI is a high-throughput telematics and predictive maintenance platform designed to ingest over 100,000 events/second from a 100,000-vehicle fleet, detect dangerous conditions within seconds, predict breakdown risks 7 days in advance with calibrated ML, and provide an AI Copilot with human-in-the-loop work order approvals.

---

## Architecture Overview

- **Hot Path (Go 1.22):**
  - `simulator`: Realistic multi-tenant vehicle physics, trip simulation, fault injection, and ground-truth generation.
  - `ingest-gateway`: HTTP/2 mTLS termination, VIN ISO 3779 check-digit validation, back-pressure (429/503), partitioned Kafka producer.
  - `stream-processor`: Lock-free per-partition Go stream processor, rotating Bloom filter deduplication, 30s watermarking, 8 real-time rules, Redis latest state.
- **Backbone & Storage:**
  - **Redpanda (Kafka API):** 48-partition partitioned streaming bus (`telemetry.raw`, `telemetry.clean`, `telemetry.late`, `telemetry.dlq`, `alerts`, `audit`).
  - **PostgreSQL 16 + pgvector:** ACID transactional relational core, multi-tenant Row Level Security (RLS), 32-dim failure fingerprints HNSW index, tamper-evident SHA-256 audit hash chain.
  - **ClickHouse 24.x LTS:** High-performance columnar analytics, ReplacingMergeTree, 1-minute and 1-hour AggregatingMergeTree rollups.
  - **Redis 7:** Sub-millisecond latest vehicle state, GEO spatial index, alert stream pub/sub.
  - **MinIO (S3 API):** Tiered storage and ML model artifact repository.
- **Control Plane & Intelligence (Python 3.12):**
  - `api-service`: FastAPI REST & SSE endpoints, OIDC/Keycloak authentication, keyset pagination, location privacy masking.
  - `ml-service`: 45-feature pipeline from ClickHouse rollups, calibrated LightGBM model, baseline comparison, PCA fingerprints.
  - `agent-service`: LangGraph stateful copilot, Pydantic tool guardrails, human-in-the-loop work order proposals.
- **Frontend (React 18 + TypeScript + Vite + Tailwind):**
  - Real-time map with clustering and viewport streaming.
  - Risk explorer, vehicle telemetry charts, live alert feed.
  - Copilot interactive chat with proposal approval cards.

---

## Quick Start (One Command)

```bash
# 1. Start full stack with seeded dataset and demo simulator
make demo
```

After startup, access the local services:
- **Web UI:** [http://localhost:3000](http://localhost:3000)
- **API Service & Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Grafana Observability:** [http://localhost:3001](http://localhost:3001) (Credentials: `admin` / `admin`)
- **Keycloak Identity:** [http://localhost:8080](http://localhost:8080) (Credentials: `admin` / `admin_secret_pass`)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001) (Credentials: `minio_admin` / `minio_secret_pass`)

### Demo Credentials (Keycloak Realm: `fleetguard`)

| Persona | Email | Password | Role | Access Level |
|---|---|---|---|---|
| Priya Sharma | `priya@apex.io` | `demo1234` | `fleet_manager` | Map, alerts, at-risk list, copilot, work orders |
| Ravi Verma | `ravi@apex.io` | `demo1234` | `analyst` | Risk list, vehicle telemetry, similar cases |
| Anita Deshmukh | `anita@apex.io` | `demo1234` | `tenant_admin` | Users, right-to-erasure, audit chain verification |
| Apex Viewer | `viewer@apex.io` | `demo1234` | `viewer` | Read-only KPIs, privacy-masked map |
| BlueDart Admin | `admin@bluedart.io` | `demo1234` | `tenant_admin` | Isolated Tenant B admin |

---

## Makefile Targets

| Target | Description |
|---|---|
| `make up` | Start core infrastructure (Redpanda, ClickHouse, Postgres, Redis, MinIO, Keycloak, Vault) and wait for health |
| `make seed` | Run database migrations, load reference data, generate 100K vehicles and telemetry backfill |
| `make demo` | Bring up full stack with seeded dataset and live simulator |
| `make test` | Run unit and integration tests across Go, Python, and Web |
| `make lint` | Run code quality linters (ruff, gofmt, eslint) |
| `make load` | Execute k6 and Locust load test scenarios |
| `make chaos` | Run chaos injection scenarios and assert zero-loss recovery |
| `make down` | Stop running containers |
| `make clean` | Stop containers and wipe persistent data volumes |
