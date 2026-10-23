# BrandGuard AI — Real-Time Evidence-Grounded Brand Governance Platform

BrandGuard AI is an enterprise brand governance and legal compliance platform featuring zero-latency deterministic guardrails, bidirectional real-time WebSockets, predictive email-style autocompletion, a 3-agent Grok RAG pipeline with PostgreSQL `pgvector`, multi-role RBAC approval workflows, cryptographic SHA-256 audit logging, and actionable brand analytics.

---

## 🏗️ 3-Version Comprehensive Architecture

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 React + Tailwind Editor                 │
                  │       (Email-Style Inline Autocomplete & Diffing)       │
                  └───────────────────────────┬─────────────────────────────┘
                                              │ Real-Time WebSockets
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                Node.js / Express Server                 │
                  └──────┬───────────────────────────────────────────┬──────┘
                         │ Synchronous Pre-Check                     │ Asynchronous
                         ▼                                           ▼
         ┌───────────────────────────────┐           ┌───────────────────────────────┐
         │ Tier 1 Deterministic Engine   │           │   Agentic RAG Engine (Grok API)   │
         │  • Privacy & Banned Regex     │           │  • Triage & RAG Vector Search  │
         │  • Numerical / Discount Caps  │           │  • Citation Verification      │
         └───────────────────────────────┘           └───────────────┬───────────────┘
                                                                     │
                                                                     ▼
                                                     ┌───────────────────────────────┐
                                                     │  PostgreSQL + pgvector DB     │
                                                     │  • Style Guides & Audit Logs  │
                                                     └───────────────────────────────┘
```

---

## 🚀 Version Breakdown & Completed Deliverables

### Version 1 (V1): Core Engine & Knowledge Base
* **Tier 1 Deterministic Engine:** Zero-latency synchronous regex pre-checks running in **$< 2\text{ms}$** (target was $< 10\text{ms}$).
  * Flags numeric discounts exceeding the $20\%$ promotional limit (e.g., `50% off`).
  * Privacy & PII redaction: detects unmasked emails, phone numbers, and SSNs.
  * Banned terminology & unverified superlatives (e.g., *"India's best food app"*, *"100% guaranteed"*).
* **Knowledge Base with PostgreSQL + pgvector:**
  * Native 1536-dimensional vector embeddings and cosine distance similarity search (`<=>`).
  * Seeded with 5 enterprise brand guidelines (Discount Cap, Humble Voice/Tone, PII Redaction, Comparative Claims, Lexicon).
* **Baseline REST API:** Guidelines CRUD, inspection endpoints, and review retrieval.

### Version 2 (V2): Real-Time WebSockets & Agentic Engine
* **Bidirectional WebSocket Pipeline (`socket.io`):**
  * `draft:type` debounced $(\approx 300\text{ms})$ typing stream.
  * `violations:precheck` synchronous pre-check streamed back in $< 5\text{ms}$.
  * `violations:update` full agentic compliance update with zero hallucinated citations.
  * `completion:suggest` pushes brand-compliant inline predictive ghost text.
* **Email-Style Composer UI:**
  * Inline predictive autocomplete (press <kbd>Tab ⇥</kbd> or <kbd>→</kbd> to accept).
  * Real-time color-coded inline text highlights (Red for Privacy/Discounts, Amber for Claims, Blue for Tone, Purple for Terminology).
  * Side-by-side **Citation Drawer** with exact policy excerpts and 1-Click "Apply Fix" substitution.
* **3-Step Agentic Architecture:**
  * **Agent 1 (Triage Agent):** Classifies marketing intent and runs Tier 1 checks.
  * **Agent 2 (RAG Search Agent):** Queries `pgvector` for candidate brand rules.
  * **Agent 3 (Citation & Verification Agent):** Enforces zero-hallucinated citations by verifying against active database context and computes compliance scores.
  * **Autocomplete Service:** Produces guideline-constrained ghost-text completions.

### Version 3 (V3): Governance Workflows, SHA-256 Audit Trail & Analytics
* **Role-Based Access Control (RBAC):**
  * Supports ✍️ **Creator** (Alice Green), 🔍 **Reviewer** (Bob Taylor), and 🛡️ **Manager** (Sarah Vance).
  * In-app one-click role switcher to experience each permission level.
* **Manager Approval Queue & Diff Studio:**
  * Creators submit drafts directly from the composer once inline checks pass.
  * Side-by-side Diff View comparing original draft vs approved target copy.
  * Rejection feedback loops and managerial justification notes.
* **Cryptographic SHA-256 Audit Trail:**
  * Computes an immutable SHA-256 hash upon sign-off:
    $$\text{Hash} = \text{SHA-256}(\text{raw\_content} \parallel \text{approved\_content} \parallel \text{reviewer\_id} \parallel \text{timestamp})$$
  * Programmatic integrity verifier confirms zero tampering against the database ledger.
* **Brand Governance Analytics Dashboard:**
  * Overall Compliance Score gauge & approval velocity.
  * Category breach distribution (Legal, Privacy, Claim, Tone, Terminology).
  * High-frequency violation type breakdown.
  * **Guidelines Requiring Clarification:** Flags ambiguous rules causing recurring writer mistakes with actionable AI recommendations.
  * **Export Compliance Report:** One-click JSON/CSV download for enterprise legal audits.

---

## 🏃 Running the Platform

### 1. Database (Docker pgvector)
```bash
docker start brandguard-pgvector || docker run -d --name brandguard-pgvector \
  -e POSTGRES_PASSWORD=brandguard \
  -e POSTGRES_USER=brandguard \
  -e POSTGRES_DB=brandguard_db \
  -p 5433:5432 pgvector/pgvector:pg16
```

### 2. Backend Server (Express + WebSockets)
```bash
cd backend
npm install
npm run seed       # Seeds brand guidelines into pgvector
npm start          # Runs on http://localhost:5000
```

### 3. Frontend Application (React + Vite)
```bash
cd frontend
npm install
npm run dev        # Runs on http://localhost:3000
```

---

## 🧪 Verification & Automated Test Suites

```bash
# Test 1: Tier 1 Deterministic Benchmark (<10ms target)
npm --prefix backend run test:tier1

# Test 2: Real-time WebSocket Stream & 3-Step Agentic Engine
node backend/test-socket.js

# Test 3: Version 3 Governance, SHA-256 Signatures & Analytics
node backend/test-v3-governance.js
```
