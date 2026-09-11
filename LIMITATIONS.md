# Architectural Limitations & Prototype Trade-offs

This project is built as a production-minded prototype for evaluation. The following trade-offs were intentionally made:

1. **PDF OCR vs Standard Text Extraction**:
   - The current parser extracts standard text streams using `pdf-parse`.
   - Scanned image-only PDFs (bitmaps without text layers) require an OCR pre-processing pipeline (e.g. Tesseract or Google Cloud Document AI), which is not bundled in the prototype.

2. **Atlas Vector Search Fallback**:
   - In production with a provisioned Atlas Vector Search index, the system leverages `$vectorSearch` KNN pipelines.
   - For local or development environments without an active vector index, an exact cosine similarity fallback calculates ranking across project chunks in-memory.

3. **Background Job Execution**:
   - Full Inngest event dispatching is configured. For development environments where Inngest dev servers are not running locally, asynchronous `setImmediate` non-blocking fallback pipelines process chunking and embeddings automatically.

4. **Multi-Model Provider**:
   - While the `IAIProvider` interface is fully vendor-agnostic and ready for drop-in providers, Google Gemini is the dedicated active provider per project constraints.
