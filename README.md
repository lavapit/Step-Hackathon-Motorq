🚗 FleetGuard AI

### Predictive Maintenance & Fleet Intelligence Platform

> A connected-vehicle intelligence platform designed to help fleet managers identify vehicles at risk of breakdown within the next 7 days, understand the signals behind that risk, and take maintenance action with a human-in-the-loop approval workflow.

Built for the **Connected Vehicle Intelligence Hackathon**.

---

## 🎯 Problem

Fleet operators generate huge amounts of vehicle telemetry such as:

- 🌡️ Coolant temperature
- 🔋 Battery voltage
- ⚠️ Diagnostic trouble codes
- 🚘 Vehicle usage
- 📍 Location and speed
- 🛠️ Maintenance history

The challenge is identifying which vehicles are likely to fail before the failure actually happens.

For a 100,000-vehicle fleet:

**100,000 vehicles × 1 event/second = 100,000 events/second**

At approximately 1 KB per event, this represents roughly **8.6 TB of raw telemetry per day**.

FleetGuard AI is designed to turn this continuous stream of vehicle intelligence into actionable maintenance decisions.

---

## 💡 Solution

FleetGuard AI provides fleet managers with a centralized platform to:

- 📊 Monitor overall fleet health
- 🔮 Identify vehicles at risk of breakdown within 7 days
- 🚨 Receive critical vehicle alerts
- 📈 Investigate vehicle telemetry
- 🔍 Find similar historical failure patterns
- 🤖 Get AI-assisted maintenance recommendations
- 👤 Approve or reject proposed actions
- 📝 Create maintenance work orders
- 🔐 Maintain an audit trail
- 🧹 Handle driver data erasure requests

### Core Principle

> **AI recommends. Humans approve.**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📊 Fleet Dashboard | Fleet KPIs, watchlist and active alerts |
| 🚨 Real-Time Alerts | Critical alerts delivered using SSE |
| 🔮 7-Day Risk Forecast | Prioritized list of vehicles at risk |
| 📈 Vehicle Telemetry | Vehicle-level telemetry trends |
| 🔍 Failure Fingerprints | Similarity search using pgvector |
| 🤖 Fleet Copilot | Assists fleet managers with maintenance decisions |
| 👤 Human Approval | AI actions require explicit approval |
| 📝 Work Orders | Maintenance work-order creation |
| 🔐 Audit Trail | Records important system actions |
| 🧹 Right-to-Erasure | Driver data erasure workflow |
| 🏢 Multi-Tenancy | Tenant-aware relational architecture |
| 🚘 100K Vehicles | Synthetic fleet containing 100,000 vehicles |
| 🗺️ Fleet Map | City-level fleet visualization |
| 🔑 Role-Based Design | Admin, fleet manager, analyst and viewer |
| 🐳 Docker | Docker Compose based infrastructure |

---

## 🔄 Product Workflow

**Vehicle Telemetry → Health & Risk Analysis → 7-Day Breakdown Risk → Risk Explanation → Fleet Manager → AI Recommendation → Human Approval → Work Order → Audit Log**

---

## 🤖 Human-in-the-Loop AI

FleetGuard does not allow an AI recommendation to directly perform an operational action.

### Workflow

**AI Recommendation**

↓

**Human Review**

↓

**Approve?**

↙️　　　　　　　　　↘️

**YES**　　　　　　　**NO**

↓

**Work Order**　　　**No Action**

↓

**Audit Log**

This keeps the fleet manager in control of maintenance decisions.

---

## 🚨 Real-Time Alerting

FleetGuard supports a real-time alert workflow using **Server-Sent Events (SSE)**.

**Fault Injection → FastAPI → Alert Created → SSE Event → Fleet Dashboard → Critical Alert**

For example, an injected engine-overheat fault can generate an `ENGINE_OVERHEAT` alert and push it to connected clients.

---

## 🔍 Failure Fingerprint Search

FleetGuard is designed to compare a vehicle's recent behavior with historical failure patterns.

**Recent Vehicle Behaviour → 32-Dimensional Fingerprint → pgvector → Similar Historical Failures**

This allows the system to provide context alongside a risk score.

The current prototype contains the fingerprint schema and similarity query, while the seeded fingerprints are placeholder values.

---

## 🏗️ Architecture

The target architecture consists of:

**Vehicle / Telemetry Simulator**

↓

**Ingestion Gateway**

↓

**Redpanda / Kafka API**

↓

**Stream Processor**

↓

**ClickHouse + Redis**

↓

**ML Service**

↓

**FastAPI Backend**

↓

**React + TypeScript Dashboard**

The platform also integrates:

- PostgreSQL + pgvector
- Keycloak
- Prometheus / Grafana
- MinIO / S3
- Fleet Copilot

### Current Prototype

The working prototype primarily uses:

**React Web UI → FastAPI → PostgreSQL**

The larger streaming architecture represents the target production architecture.

---

## 🧱 Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Python
- FastAPI
- Pydantic

### Data

- PostgreSQL 16
- pgvector
- ClickHouse
- Redis
- MinIO

### Streaming

- Redpanda
- Kafka-compatible APIs

### Security

- Keycloak
- Vault
- mTLS architecture

### Observability

- Prometheus
- Grafana

### AI / ML

- LightGBM — planned
- pgvector
- LangGraph — planned
- Current copilot — rule/keyword based

### DevOps

- Docker
- Docker Compose
- GitHub Actions

---

## 🗃️ Data Architecture

The relational core contains **26 tables** covering areas such as:

- Tenants
- Fleets
- Vehicles
- Drivers
- Trips
- Alerts
- Alert Rules
- Work Orders
- Maintenance Events
- Risk Scores
- Failure Fingerprints
- Audit Logs
- Erasure Requests
- Agent Runs
- Agent Actions

### Storage Responsibilities

| Storage | Purpose |
|---|---|
| PostgreSQL | Transactional data, vehicles, alerts, work orders and audit |
| pgvector | Failure similarity search |
| ClickHouse | High-volume telemetry |
| Redis | Latest vehicle state |
| MinIO | Object and model storage |

---

## 🏢 Multi-Tenant Architecture

The prototype contains:

- **2 tenants**
- **40 fleets**
- **100,000 synthetic vehicles**

The system is designed so that fleet data remains associated with its respective tenant.

---

## 🔐 Security & Privacy

FleetGuard was designed with security and privacy in mind.

### Roles

- `tenant_admin`
- `fleet_manager`
- `analyst`
- `viewer`

### Security Features

- Human approval for AI-generated write actions
- Tenant-aware data model
- Audit logging
- Hash-chain audit fields
- Driver right-to-erasure workflow
- Keycloak identity architecture
- Development mTLS infrastructure

### Planned Security Improvements

- JWT enforcement
- PostgreSQL Row-Level Security
- Rate limiting
- Complete mTLS enforcement
- Prompt-injection protection
- AI tool allow-listing
- Encryption configuration
- Complete distributed deletion

---

## 📈 Scale Design

FleetGuard's target architecture is designed around a 100,000-vehicle fleet.

### Target Scale

**10,000 vehicles → ~10,000 events/sec**

**100,000 vehicles → ~100,000 events/sec**

The target architecture uses:

- Redpanda for event streaming
- Stream processing
- ClickHouse for telemetry
- Redis for latest state
- PostgreSQL for transactional operations

> These are architecture targets and have not been validated through a 100K events/sec load test.

---

## 🧮 Algorithms

### ISO 3779 VIN Validation

The seed generator creates valid VINs using the ISO 3779 check-digit approach.

The prototype generates and seeds **100,000 synthetic vehicles**.

### Cosine Similarity

Failure fingerprints use vector similarity through pgvector.

This allows the system to search for vehicles with similar historical failure patterns.

### Idempotency

Work-order creation uses idempotency keys to prevent duplicate actions during retries.

Alerts also use unique deduplication keys.

---

## 🔄 Runtime Flows

### Fault → Alert

**Fault Injected → API → Alert Created → SSE → Dashboard → Critical Alert**

### Copilot → Work Order

**Fleet Manager Request → Risk Information → Proposed Action → Human Review → Approval → Work Order → Audit Record**

---

## 📂 Repository Structure

The repository is organized into:

- `.github/workflows/` — CI/CD workflows
- `db/` — database configuration and seed scripts
- `deploy/` — deployment and observability configuration
- `docs/` — project documentation
- `services/api-service/` — FastAPI backend
- `web/` — React frontend
- `docker-compose.yml` — local infrastructure
- `Makefile` — project commands
- `PLAN.md` — architecture and implementation planning
- `.env.example` — environment configuration template

---

## 🚀 Getting Started

### Prerequisites

- Git
- Docker
- Docker Compose
- Make

### Clone Repository

```bash
git clone https://github.com/lavapit/Step-Hackathon-Motorq.git
cd Step-Hackathon-Motorq

Configure Environment
cp .env.example .env

Update the environment variables if required.
Start Infrastructure
make up

Seed Database
make seed

This creates the synthetic fleet dataset, including the 100,000-vehicle registry.
Run Demo
make demo

## 🌐 Main Services
Service	URL
FleetGuard Web UI	http://localhost:3000
FastAPI Swagger	http://localhost:8000/docs
Keycloak	http://localhost:8080
Grafana	http://localhost:3001
MinIO	http://localhost:9001


## 👥 User Roles
Role	Responsibilities
Fleet Manager	Monitor vehicles, alerts, risk and approve actions
Analyst	Investigate vehicle telemetry and risk
Tenant Admin	Manage audit and privacy workflows
Viewer	Read-only fleet visibility


## 🧪 Implementation Status
Component	Status
Fleet Dashboard	✅ Implemented
100K Vehicle Dataset	✅ Implemented
PostgreSQL Data Model	✅ Implemented
Multi-Tenant Schema	✅ Implemented
Alert Generation	✅ Implemented
SSE Notifications	✅ Implemented
Risk Ranking UI	⚠️ Prototype / Seeded Scores
Vehicle Telemetry	⚠️ Prototype
Failure Fingerprints	⚠️ Placeholder Data
Work Orders	✅ API Implemented
Human Approval	✅ API Workflow
Audit Workflow	⚠️ Partial
Driver Erasure	⚠️ PostgreSQL Implementation
Streaming Pipeline	🔜 Planned
LightGBM Model	🔜 Planned
LangGraph Agent	🔜 Planned
Production Authentication	🔜 Planned
Load Testing	🔜 Planned


## ⚠️ Known Limitations
FleetGuard AI is a hackathon prototype.
ML
The LightGBM training pipeline has not yet been implemented.
Risk scores and model-related values are seeded demonstration values.
Streaming
The target vehicle → gateway → Redpanda → stream processor → ClickHouse pipeline is not yet implemented in the current prototype.
Copilot
The current copilot is keyword/rule based.
A guarded LangGraph + LLM architecture is planned for a future version.
Performance
No formal load testing has been performed.
Therefore, values such as 100K events/sec and <2 sec latency should be treated as architecture targets rather than measured benchmarks.
Security
Production controls such as JWT validation, Row-Level Security and rate limiting are still planned.
## 🛣️ Roadmap
Phase 1 — Prototype
- [x] Fleet dashboard
- [x] 100K synthetic vehicles
- [x] Multi-tenant database
- [x] Risk ranking interface
- [x] Alert generation
- [x] SSE notifications
- [x] Work-order API
- [x] Human approval workflow
- [x] Audit workflow
- [x] Driver erasure workflow
Phase 2 — Intelligence
- [ ] Realistic telemetry simulator
- [ ] Ingestion gateway
- [ ] Redpanda streaming pipeline
- [ ] Stream processor
- [ ] ClickHouse telemetry ingestion
- [ ] LightGBM model training
- [ ] Model evaluation
- [ ] Replace seeded risk scores
- [ ] Validate failure fingerprints
Phase 3 — Production
- [ ] JWT authentication
- [ ] PostgreSQL Row-Level Security
- [ ] Rate limiting
- [ ] Complete mTLS
- [ ] Prompt-injection protection
- [ ] AI tool allow-list
- [ ] Automated test suite
- [ ] k6 / Locust load testing
- [ ] Chaos testing
- [ ] Kubernetes deployment
- [ ] Helm charts
- [ ] Terraform
🏆 Key Innovation
FleetGuard is designed around the complete fleet-maintenance loop:
OBSERVE → DETECT → PRIORITIZE → EXPLAIN → RECOMMEND → APPROVE → ACT → AUDIT
The project combines:
- Predictive maintenance
- Real-time alerting
- Vehicle intelligence
- Failure similarity analysis
- AI-assisted decision support
- Human approval
- Auditability
- Privacy workflows
- Multi-tenant architecture
## 🎥 Demo
The prototype demonstration covers:
Time	Feature
00:00	Fleet overview
00:24	7-day risk forecast
00:30	Vehicle telemetry / similar cases
00:54	Fleet map
01:06	Copilot
01:18	Audit & privacy
01:36	Fault injection
02:27	End of demonstration


The recorded demonstration is approximately 2 minutes 27 seconds.
## 🔮 Future Vision
The long-term goal is to turn FleetGuard into a continuously operating predictive-maintenance platform.
Connected Vehicles → Real-Time Telemetry → Streaming Intelligence → Predictive ML → Failure Similarity → Fleet Copilot → Human Approval → Maintenance Execution → Continuous Learning
The ultimate goal is to move from:
"This vehicle is at risk."

to:
"This vehicle shows a combination of thermal, electrical and fault-code patterns similar to vehicles that previously failed. Review this vehicle before the predicted failure window."

## 📚 Documentation
Additional documentation can be found in:
- docs/AI_USAGE
- docs/KNOWN_LIMITATIONS
- docs/OPEN_QUESTIONS
- PLAN.md
⚖️ Disclaimer
FleetGuard AI is a hackathon prototype and academic project.
All vehicle, driver and telemetry data used in the prototype is synthetic.
Production-scale streaming, trained ML prediction, complete security enforcement and performance benchmarking are future implementation goals.
## 🔗 Repository
 
FleetGuard AI — Connected Vehicle Intelligence Hackathon
