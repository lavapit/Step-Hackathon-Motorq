# 🚗 FleetGuard AI

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

```text
100,000 vehicles
       ×
1 event / second
       =
100,000 events / second

At approximately 1 KB per event, this represents roughly 8.6 TB of raw telemetry per day.
FleetGuard AI is designed to turn this continuous stream of vehicle intelligence into actionable maintenance decisions.
💡 Solution
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
The core philosophy is:
AI recommends. Humans approve.

✨ Key Features
Feature	Description
📊 Fleet Dashboard	Fleet KPIs, watchlist and active alerts
🚨 Real-Time Alerts	Critical alerts delivered using SSE
🔮 7-Day Risk Forecast	Prioritized list of vehicles at risk
📈 Vehicle Telemetry	Vehicle-level telemetry trends
🔍 Failure Fingerprints	Similarity search using pgvector
🤖 Fleet Copilot	Assists fleet managers with maintenance decisions
👤 Human Approval	AI actions require explicit approval
📝 Work Orders	Maintenance work-order creation
🔐 Audit Trail	Records important system actions
🧹 Right-to-Erasure	Driver data erasure workflow
🏢 Multi-Tenancy	Tenant-aware relational architecture
🚘 100K Vehicles	Synthetic fleet containing 100,000 vehicles
🗺️ Fleet Map	City-level fleet visualization
🔑 Role-Based Design	Admin, fleet manager, analyst and viewer
🐳 Docker	Docker Compose based infrastructure


🖥️ Product Workflow
Vehicle Telemetry
       ↓
Health & Risk Analysis
       ↓
7-Day Breakdown Risk
       ↓
Risk Explanation
       ↓
Fleet Manager
       ↓
AI Recommendation
       ↓
Human Approval
       ↓
Work Order
       ↓
Audit Log

🤖 Human-in-the-Loop AI
FleetGuard does not allow an AI recommendation to directly perform an operational action.
AI Recommendation
       ↓
Human Review
       ↓
   ┌─────────┐
   │ Approve?│
   └─────────┘
     ↙     ↘
   YES      NO
    ↓        ↓
Work Order  No Action
    ↓
Audit Log

This keeps the fleet manager in control of maintenance decisions.
🚨 Real-Time Alerting
FleetGuard supports a real-time alert workflow using Server-Sent Events.
Fault Injection
      ↓
FastAPI
      ↓
Alert Created
      ↓
SSE Event
      ↓
Fleet Dashboard
      ↓
Critical Alert

For example, an injected engine-overheat fault can generate an ENGINE_OVERHEAT alert and push it to connected clients.
🔍 Failure Fingerprint Search
FleetGuard is designed to compare a vehicle's recent behavior with historical failure patterns.
Recent Vehicle Behaviour
          ↓
32-Dimensional Fingerprint
          ↓
       pgvector
          ↓
Similar Historical Failures

This allows the system to provide context alongside a risk score.
The current prototype contains the fingerprint schema and similarity query, while the seeded fingerprints are placeholder values.
🏗️ Architecture
#chatgpt-mermaid-_r_15v_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_15v_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_15v_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_15v_ .error-icon{fill:rgb(255, 255, 255);}#chatgpt-mermaid-_r_15v_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_15v_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_15v_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_15v_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_15v_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_15v_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_15v_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_15v_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_15v_ p{margin:0;}#chatgpt-mermaid-_r_15v_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_15v_ .label text,#chatgpt-mermaid-_r_15v_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ .node rect,#chatgpt-mermaid-_r_15v_ .node circle,#chatgpt-mermaid-_r_15v_ .node ellipse,#chatgpt-mermaid-_r_15v_ .node polygon,#chatgpt-mermaid-_r_15v_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .rough-node .label text,#chatgpt-mermaid-_r_15v_ .node .label text,#chatgpt-mermaid-_r_15v_ .image-shape .label,#chatgpt-mermaid-_r_15v_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_15v_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .rough-node .label,#chatgpt-mermaid-_r_15v_ .node .label,#chatgpt-mermaid-_r_15v_ .image-shape .label,#chatgpt-mermaid-_r_15v_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_15v_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_15v_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_15v_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_15v_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_15v_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_15v_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_15v_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_15v_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_15v_ .cluster rect{fill:rgb(255, 255, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(255, 255, 255);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_15v_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_15v_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_15v_ .icon-shape,#chatgpt-mermaid-_r_15v_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_15v_ .icon-shape p,#chatgpt-mermaid-_r_15v_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_15v_ .icon-shape .label rect,#chatgpt-mermaid-_r_15v_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_15v_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_15v_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_15v_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_15v_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_15v_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_15v_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_15v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_15v_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_15v_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_15v_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_15v_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_15v_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_15v_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_15v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_15v_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_15v_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_15v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_15v_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_15v_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_15v_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_15v_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_15v_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_15v_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_15v_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .node rect,#chatgpt-mermaid-_r_15v_ .node circle,#chatgpt-mermaid-_r_15v_ .node ellipse,#chatgpt-mermaid-_r_15v_ .node polygon,#chatgpt-mermaid-_r_15v_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_15v_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_15v_ .node.mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_15v_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_15v_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_15v_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Vehicle / Telemetry SimulatorIngestion GatewayRedpanda / Kafka APIStream ProcessorClickHouseRedisML ServiceFastAPI BackendPostgreSQL 16 + pgvectorReact + TypeScript DashboardCopilot / AgentKeycloakPrometheus / GrafanaMinIO / S3




Current Prototype
The working prototype primarily uses:
React Web UI
      ↓
FastAPI
      ↓
PostgreSQL

The larger streaming architecture represents the target architecture.
🧱 Technology Stack
Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
Backend
- Python
- FastAPI
- Pydantic
Data
- PostgreSQL 16
- pgvector
- ClickHouse
- Redis
- MinIO
Streaming
- Redpanda
- Kafka-compatible APIs
Security
- Keycloak
- Vault
- mTLS architecture
Observability
- Prometheus
- Grafana
AI / ML
- LightGBM — planned
- pgvector
- LangGraph — planned
- Current copilot — rule/keyword based
DevOps
- Docker
- Docker Compose
- GitHub Actions
🗃️ Data Architecture
The relational core contains 26 tables covering:
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
Storage Responsibilities
Storage	Purpose
PostgreSQL	Transactional data, vehicles, alerts, work orders and audit
pgvector	Failure similarity search
ClickHouse	High-volume telemetry
Redis	Latest vehicle state
MinIO	Object and model storage


🏢 Multi-Tenant Architecture
The prototype contains:
- 2 tenants
- 40 fleets
- 100,000 synthetic vehicles
Tenant A
│
├── Fleet 1
│   ├── Vehicle A
│   ├── Vehicle B
│   └── Vehicle C
│
└── Fleet 2
    ├── Vehicle D
    └── Vehicle E


Tenant B
│
└── Fleet 3
    ├── Vehicle F
    └── Vehicle G

🔐 Security & Privacy
FleetGuard was designed with security and privacy in mind.
Roles
tenant_admin
fleet_manager
analyst
viewer

Security Features
- Human approval for AI-generated write actions
- Tenant-aware data model
- Audit logging
- Hash-chain audit fields
- Driver right-to-erasure workflow
- Keycloak identity architecture
- Development mTLS infrastructure
Planned Hardening
- JWT enforcement
- PostgreSQL Row-Level Security
- Rate limiting
- Complete mTLS enforcement
- Prompt-injection protection
- AI tool allow-listing
- Encryption configuration
- Complete distributed deletion
📈 Scale Design
FleetGuard's target architecture is designed around a 100,000-vehicle fleet.
10,000 vehicles
      ↓
~10,000 events/sec


100,000 vehicles
      ↓
~100,000 events/sec

The target architecture uses:
- Redpanda for event streaming
- Stream processing
- ClickHouse for telemetry
- Redis for latest state
- PostgreSQL for transactional operations
These are architecture targets and have not been validated through a 100K events/sec load test.

🧮 Algorithms
ISO 3779 VIN Validation
The seed generator creates valid VINs using the ISO 3779 check-digit approach.
17-character VIN
       ↓
Weighted character values
       ↓
Modulo 11
       ↓
Check Digit

The prototype generates and seeds 100,000 synthetic vehicles.
Cosine Similarity
Failure fingerprints use vector similarity through pgvector.
Vehicle A → [0.21, 0.14, ...]
Vehicle B → [0.19, 0.17, ...]
Vehicle C → [0.78, 0.42, ...]

Idempotency
Work-order creation uses idempotency keys to prevent duplicate actions during retries.
Alerts also use unique deduplication keys.
🔄 Runtime Flows
Fault → Alert
1. Fault is injected
        ↓
2. API receives request
        ↓
3. Alert is created
        ↓
4. Alert pushed to SSE subscribers
        ↓
5. Dashboard receives event
        ↓
6. Critical alert displayed

Copilot → Work Order
1. Fleet manager asks a question
        ↓
2. System retrieves fleet risk information
        ↓
3. Proposed action is generated
        ↓
4. Manager reviews proposal
        ↓
5. Manager approves
        ↓
6. Work order is created
        ↓
7. Audit record is created

📂 Repository Structure
Step-Hackathon-Motorq/
│
├── .github/
│   └── workflows/
│
├── db/
│   ├── clickhouse/
│   └── seed/
│
├── deploy/
│   ├── compose/
│   └── observability/
│
├── docs/
│   ├── AI_USAGE
│   ├── KNOWN_LIMITATIONS
│   └── OPEN_QUESTIONS
│
├── services/
│   └── api-service/
│       └── app/
│           └── main.py
│
├── web/
│   └── src/
│       └── App.tsx
│
├── docker-compose.yml
├── Makefile
├── PLAN.md
├── README.md
└── .env.example

🚀 Getting Started
Prerequisites
- Git
- Docker
- Docker Compose
- Make
Clone
git clone https://github.com/lavapit/Step-Hackathon-Motorq.git

cd Step-Hackathon-Motorq

Configure Environment
cp .env.example .env

Update the environment variables if required.
Start Infrastructure
make up

Seed Database
make seed

Run Demo
make demo

🌐 Main Services
Service	URL
FleetGuard Web UI	http://localhost:3000
FastAPI Swagger	http://localhost:8000/docs
Keycloak	http://localhost:8080
Grafana	http://localhost:3001
MinIO	http://localhost:9001


👥 User Roles
Role	Responsibilities
Fleet Manager	Monitor vehicles, alerts, risk and approve actions
Analyst	Investigate vehicle telemetry and risk
Tenant Admin	Manage audit and privacy workflows
Viewer	Read-only fleet visibility


🧪 Implementation Status
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


⚠️ Known Limitations
FleetGuard AI is a hackathon prototype.
ML
The LightGBM training pipeline has not yet been implemented.
Risk scores and model-related values are seeded demonstration values.
Streaming
The target pipeline:
Vehicle
   ↓
Gateway
   ↓
Redpanda
   ↓
Stream Processor
   ↓
ClickHouse

is not yet implemented in the current prototype.
Copilot
The current copilot is keyword/rule based.
A guarded LangGraph + LLM architecture is planned for a future version.
Performance
No formal load testing has been performed.
Therefore:
100K events/sec
< 2 sec latency

should be treated as architecture targets rather than measured benchmarks.
Security
Production controls such as JWT validation, Row-Level Security and rate limiting are still planned.
🛣️ Roadmap
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
OBSERVE
   ↓
DETECT
   ↓
PRIORITIZE
   ↓
EXPLAIN
   ↓
RECOMMEND
   ↓
APPROVE
   ↓
ACT
   ↓
AUDIT

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
🎥 Demo
The prototype demonstration covers:
00:00  Fleet overview
00:24  7-day risk forecast
00:30  Vehicle telemetry / similar cases
00:54  Fleet map
01:06  Copilot
01:18  Audit & privacy
01:36  Fault injection
02:27  End of demonstration

The recorded demonstration is approximately 2 minutes 27 seconds.
🔮 Future Vision
The long-term goal is to turn FleetGuard into a continuously operating predictive-maintenance platform.
Connected Vehicles
        ↓
Real-Time Telemetry
        ↓
Streaming Intelligence
        ↓
Predictive ML
        ↓
Failure Similarity
        ↓
Fleet Copilot
        ↓
Human Approval
        ↓
Maintenance Execution
        ↓
Continuous Learning

The ultimate goal is to move from:
"This vehicle is at risk."

to:
"This vehicle shows a combination of thermal, electrical and fault-code patterns similar to vehicles that previously failed. Review this vehicle before the predicted failure window."

📚 Documentation
Additional documentation can be found in:
docs/
├── AI_USAGE
├── KNOWN_LIMITATIONS
└── OPEN_QUESTIONS

Architecture and implementation planning:
PLAN.md

⚖️ Disclaimer
FleetGuard AI is a hackathon prototype and academic project.
All vehicle, driver and telemetry data used in the prototype is synthetic.
Production-scale streaming, trained ML prediction, complete security enforcement and performance benchmarking are future implementation goals.
🔗 Repository
FleetGuard AI — Connected Vehicle Intelligence Hackathon
