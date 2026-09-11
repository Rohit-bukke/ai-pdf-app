# AI Study Companion — Production-Grade Full-Stack AI Learning Platform

An enterprise-ready, production-architected full-stack AI learning companion built with **Next.js 14 App Router**, **MongoDB Atlas (Vector Search)**, **Google Gemini**, **Auth.js (Google OAuth)**, **Upstash Redis**, **Supabase Storage**, **Inngest**, and **Sentry**.

---

## Key Differentiators

Unlike generic PDF chatbot wrappers, AI Study Companion incorporates deep AI engineering principles:

1. **Grounded RAG with Prompt Injection Defenses**:
   - Project-scoped vector retrieval isolating course documents.
   - All retrieved context is treated as untrusted data and wrapped in `<retrieved_content>` tags.
   - Strict citations formatted as `[Document Name — Page N]`.
   - Explicit refusal on out-of-scope/unsupported questions without hallucination.

2. **Concept Dependency Graph**:
   - Automatically extracts core academic concepts and dependencies into a Directed Acyclic Graph (DAG) (e.g. *Linear Equations* → *Quadratic Equations* → *Polynomials*).
   - Dynamic recommendations prioritize foundational prerequisite mastery before advancing.

3. **Metacognitive Quiz Mode**:
   - Students specify confidence level (`LOW`, `MEDIUM`, `HIGH`) before submitting answers.
   - Computes a metacognitive calibration index.
   - High-confidence errors receive heavy mastery penalties to flag hazardous knowledge illusions.

4. **AI Evaluation & Quality Regression Harness**:
   - Built-in administrative testing harness executing 10 curated test cases across Groundedness, Citation Accuracy, and Unsupported Question handling.
   - Stores versioned benchmark scores by model and prompt version.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons | Responsive glassmorphic UI, responsive layouts |
| **Database** | MongoDB Atlas, Mongoose | Multi-tenant document storage, indexing, aggregation |
| **Vector Search** | MongoDB Atlas Vector Search | 768-D vector indexing for document chunks |
| **AI / LLM** | Google Gemini API (`gemini-1.5-flash`, `text-embedding-004`) | Grounded tutoring, question synthesis, embeddings |
| **AI Abstraction** | Provider Interface (`IAIProvider`) | Decoupled vendor abstraction layer |
| **Authentication** | Auth.js / NextAuth (Google OAuth) | Secure session management, role-based access |
| **File Storage** | Supabase Storage (Private Bucket: `pdf-materials`) | PDF storage with magic-byte validation |
| **Background Jobs** | Inngest | Asynchronous PDF chunking, embedding, context distillation |
| **Rate Limiting** | Upstash Redis | Sliding window rate limiting on expensive AI endpoints |
| **Observability** | Sentry | PII-safe error tracking and AI request latency logs |

---

## Getting Started & Local Development

### 1. Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0
- MongoDB Atlas Cluster (or local MongoDB)
- Google Cloud OAuth credentials
- Google Gemini API Key

### 2. Environment Setup
Duplicate `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the credentials in `.env.local` (see [.env.example](.env.example) for exact variable names).

### 3. Installation
```bash
npm install --legacy-peer-deps
```

### 4. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

### 5. Running Automated Tests
```bash
npm run test
```

### 6. Production Build
```bash
npm run build
npm run start
```

---

## Security Verification Summary
- **Multi-Tenant Ownership**: All database operations verify `session.user.id === resource.userId`. Modifying resource IDs in API requests returns `403 Forbidden`.
- **Private PDF Storage**: PDFs are validated for the `%PDF-` file signature and 20MB limit. Supabase bucket is private.
- **Client-Side Secret Protection**: Server credentials (`AUTH_SECRET`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MONGODB_URI`) are strictly server-only.
- **Security Headers**: HSTS, CSP, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and Permissions-Policy are actively enforced.
