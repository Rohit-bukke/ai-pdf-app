# Architecture Blueprint — AI Study Companion

## 1. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  Client Layer                                     |
|  - Next.js 14 App Router (React Server Components + Client Islands)               |
|  - Tailwind CSS + Glassmorphism UI tokens + Lucide Icons                          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Edge & Security Gateway Layer                              |
|  - Edge Middleware (Route Protection: /dashboard, /projects, /admin)              |
|  - Security Headers: CSP, HSTS, X-Frame-Options (DENY), X-Content-Type (nosniff)  |
|  - Upstash Redis Sliding-Window Rate Limiter                                      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Authentication & Session Layer                             |
|  - NextAuth / Auth.js with Google OAuth                                           |
|  - Canonical AUTH_SECRET session validation                                       |
|  - MongoDB User Synchronization & Role Management ('USER' | 'ADMIN')              |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            Domain Service Layer                                   |
|  - Spaces & Projects Service (Multi-tenant ownership enforcement)                 |
|  - PDF Processing & Chunking Service (Magic byte validation, 800-char overlap)    |
|  - RAG Vector Retrieval Service (Project-scoped cosine similarity ranking)        |
|  - Grounded Tutor & Prompt Injection Defense Engine                               |
|  - Metacognitive Adaptive Assessment Engine (Confidence Calibration)              |
|  - Concept Dependency Graph & Recommendation Engine (DAG traversal)               |
|  - AI Evaluation & Regression Test Harness                                        |
+-----------------------------------------------------------------------------------+
       |                       |                       |                      |
       v                       v                       v                      v
+--------------+       +---------------+       +---------------+      +-------------+
| AI Provider  |       | MongoDB Atlas |       | Upstash Redis |      |   Supabase  |
| Abstraction  |       | - users       |       | Rate Limiting |      |   Storage   |
| (IAIProvider)|       | - spaces      |       | & Caching     |      |  (Private   |
|      |       |       | - projects    |       +---------------+      |    PDFs)    |
|      v       |       | - materials   |                              +-------------+
| Google       |       | - chunks      |
| Gemini API   |       | - concepts    |
| - 1.5 Flash  |       | - mastery     |
| - embed-004  |       | - questions   |
|              |       | - attempts    |
|              |       | - aiRequestLog|
+--------------+       +---------------+
       ^
       |
+-----------------------------------------------------------------------------------+
|                       Event-Driven Background Engine                              |
|  - Inngest Serverless Workflows:                                                  |
|    * material/uploaded -> PDF chunking & batch Gemini vector generation           |
|    * quiz/completed    -> Asynchronous Learner Context memory distillation        |
|    * mastery/updated   -> Prerequisite DAG analysis & Recommendation generation   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Tenant Authorization & Security Boundaries

1. **Server-Side Ownership Verification**:
   - The application enforces a strict ownership hierarchy: `User -> Space -> Project -> Materials / Chunks / Conversations / Quizzes`.
   - Every API endpoint executes `verifyOwnership(resource.userId, session.user.id)` before accessing or mutating data.
   - Client-provided `userId` parameters are strictly rejected; the authenticated session ID from the JWT is used exclusively.

2. **Prompt Injection Defense Architecture**:
   - Retrieved chunks are treated strictly as untrusted user data.
   - All retrieved text inserted into Gemini prompts is enclosed in `<retrieved_content>` tags.
   - System prompts explicitly forbid the model from executing commands, simulating administrative privileges, or departing from verified source text.

3. **PDF Document Ingestion Pipeline**:
   - Files are validated server-side by inspecting the `%PDF-` file signature header (magic bytes: `0x25 0x50 0x44 0x46 0x2D`).
   - Hard cap of 20 MB enforced server-side.
   - Stored in a private Supabase bucket (`pdf-materials`), accessible only through short-lived signed URLs generated on the server.

---

## 3. Database Schema & Atlas Vector Indexing

- **`chunks` collection**:
  - `projectId`: ObjectId (indexed for project-scoped isolation)
  - `materialId`: ObjectId
  - `chunkIndex`: Number
  - `pageNumber`: Number
  - `content`: String
  - `embedding`: Array of 768 Numbers (`text-embedding-004`)
- **MongoDB Atlas Vector Search Index Definition**:
  ```json
  {
    "mappings": {
      "dynamic": true,
      "fields": {
        "embedding": {
          "dimensions": 768,
          "similarity": "cosine",
          "type": "knnVector"
        },
        "projectId": {
          "type": "filter"
        }
      }
    }
  }
  ```

---

## 4. Metacognitive Calibration Algorithm

The assessment engine computes score deltas based on confidence-accuracy pairing:
- **High Confidence + Correct**: $+18$ points (Calibrated mastery mastery boost).
- **High Confidence + Incorrect**: $-22$ points (Severe overconfidence penalty; flags dangerous knowledge illusions).
- **Medium Confidence + Correct**: $+10$ points.
- **Medium Confidence + Incorrect**: $-10$ points.
- **Low Confidence + Correct**: $+5$ points (Lucky guess; partial understanding).
- **Low Confidence + Incorrect**: $-5$ points (Calibrated awareness of gap).
