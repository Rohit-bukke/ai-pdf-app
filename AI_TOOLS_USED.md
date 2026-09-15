# AI Tools Used

The following AI models and developer tooling were utilized in building the AI Study Companion:

## 1. Production Models & APIs
- **Google Gemini 2.5 Flash (`gemini-2.5-flash`)**:
  - Grounded RAG question answering with strict citation generation.
  - Adaptive assessment generation with JSON structured outputs validated via Zod.
  - Asynchronous persistent learner context memory distillation.
  - Curriculum concept extraction and prerequisite relationship identification.
- **Google Gemini Embeddings (`gemini-embedding-001`)**:
  - High-density 3072-dimensional semantic embeddings for document chunks.

## 2. Engineering & Development Tooling
- **Antigravity AI IDE & Gemini Coding Agent**: End-to-end full-stack pair programming, schema design, and test suite implementation.
- **Zod**: Runtime type validation ensuring LLM outputs strictly adhere to application schemas.
- **Mongoose / MongoDB Atlas Vector Search**: Vector storage, KNN similarity matching, and analytics aggregations.
- **Vitest**: Automated test execution for isolation, PDF validation, and calibration algorithms.
   