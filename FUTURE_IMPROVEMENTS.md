# Future Improvements Roadmap

The following enhancements are prioritized for subsequent production iterations:

1. **Streaming Responses**:
   - Integrate SSE (Server-Sent Events) or Vercel AI SDK streaming for word-by-word AI Tutor chat responses.

2. **Multimodal Diagram & Formula Understanding**:
   - Leverage Gemini Vision to parse diagrams, graphs, and LaTeX mathematical formulas embedded in course PDFs.

3. **Spaced Repetition Schedule**:
   - Implement SuperMemo-2 (SM-2) or FSRS algorithms to dynamically schedule review sessions based on concept mastery decay rates.

4. **Multi-User Collaborative Spaces**:
   - Introduce role-based collaboration allowing multiple students or study groups to share spaces with fine-grained read/write permissions.

5. **Advanced Hybrid Search (RRF)**:
   - Combine dense vector retrieval (Gemini 3072-D) with sparse lexical BM25 retrieval using Reciprocal Rank Fusion for maximum keyword precision on technical domain terms.
