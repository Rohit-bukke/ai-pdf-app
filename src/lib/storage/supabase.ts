import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";
import { BadRequestError } from "../errors";

const PDF_BUCKET = "pdf-materials";
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

let supabaseClient: SupabaseClient | null = null;

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Validates whether a file buffer starts with the canonical PDF magic bytes (%PDF-).
 */
export function validatePdfSignature(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 5) return false;
  // %PDF- magic bytes: 0x25, 0x50, 0x44, 0x46, 0x2D
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

/**
 * Validates PDF file constraints (type signature, max size 20MB).
 */
export function validatePdfFile(buffer: Buffer | Uint8Array, sizeBytes: number) {
  if (sizeBytes > MAX_PDF_SIZE_BYTES) {
    throw new BadRequestError(`File size exceeds the maximum limit of 20MB (got ${(sizeBytes / (1024 * 1024)).toFixed(2)}MB).`);
  }

  if (!validatePdfSignature(buffer)) {
    throw new BadRequestError("Invalid file signature. Only authentic PDF documents are permitted.");
  }
}

/**
 * Uploads a validated PDF file to the private Supabase Storage bucket.
 */
export async function uploadPdfToStorage(
  storagePath: string,
  buffer: Buffer | Uint8Array,
  contentType = "application/pdf"
): Promise<{ path: string }> {
  validatePdfFile(buffer, buffer.length);

  if (!supabaseClient) {
    // Local development fallback
    console.warn(`[Supabase Storage] Supabase credentials not set. Simulated upload for path: ${storagePath}`);
    return { path: storagePath };
  }

  const { data, error } = await supabaseClient.storage
    .from(PDF_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload document to private storage: ${error.message}`);
  }

  return { path: data.path };
}

/**
 * Generates a short-lived signed URL for authenticated download/rendering.
 */
export async function getSignedPdfUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  if (!supabaseClient) {
    return `/api/materials/download?path=${encodeURIComponent(storagePath)}`;
  }

  const { data, error } = await supabaseClient.storage
    .from(PDF_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed access URL: ${error?.message || "Unknown error"}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a PDF file from private storage.
 */
export async function deletePdfFromStorage(storagePath: string): Promise<void> {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.storage.from(PDF_BUCKET).remove([storagePath]);
  if (error) {
    console.error(`[Supabase Storage] Failed to delete file ${storagePath}:`, error.message);
  }
}
