# AI Usage Declaration

Connected Vehicle Intelligence Hackathon (SRM x Talenciaglobal)
Industry Reference: Motorq (Academic Exercise, No Affiliation)

## Overview of AI Usage

In compliance with the hackathon rules, this document transparently records the use of AI tools during the development of FleetGuard AI.

| Date / Phase | AI Tool / Model | Component / Task | Generated Content | Human Review & Validation |
|---|---|---|---|---|
| Phase 00-16 | Antigravity (Gemini 3.8 Flash / Pro) | Full System Architecture & Implementation | Code, unit tests, configurations, database schemas, and documentation | Architecture fidelity verified against PLAN.md; automated tests executed; container health verified |
| Services | LLM Copilot Service (LangGraph) | Fleet Copilot Agent | Natural language reasoning, tool selection, explanation drafting | Verified via golden evaluation set (`golden.yaml`), deterministic mock LLM in CI, human-in-the-loop approval gate for write actions |

All code and architecture strictly follow the locked plan specification without unauthorized deviations.
