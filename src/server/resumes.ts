import { randomUUID } from "node:crypto";
import { RESUME_MAX_BYTES, RESUME_MAX_LABEL } from "@/data/apply";
import { RESUME_BUCKET, supabaseAdmin } from "./supabase";

/** Uploads never linked to an application are deleted after this long. */
export const ORPHAN_RESUME_MAX_AGE_HOURS = 24;

export type ResumeCheck = { ok: true } | { ok: false; message: string };

/** Checks size and that the bytes really are a PDF (not just a .pdf name). */
export function checkResume(bytes: Uint8Array): ResumeCheck {
  if (bytes.byteLength === 0) return { ok: false, message: "That file is empty." };
  if (bytes.byteLength > RESUME_MAX_BYTES) {
    return { ok: false, message: `Resumes must be ${RESUME_MAX_LABEL} or smaller.` };
  }
  const header = new TextDecoder().decode(bytes.subarray(0, 5));
  if (header !== "%PDF-") return { ok: false, message: "Resumes must be PDF files." };
  return { ok: true };
}

/** Stores a checked PDF and returns the upload id the application form sends back. */
export async function storeResume(bytes: Uint8Array): Promise<string> {
  const db = supabaseAdmin();
  const path = `${randomUUID()}.pdf`;

  const { error: uploadError } = await db.storage
    .from(RESUME_BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await db
    .from("resume_uploads")
    .insert({ path, size_bytes: bytes.byteLength })
    .select("id")
    .single<{ id: string }>();
  if (error) {
    await db.storage.from(RESUME_BUCKET).remove([path]);
    throw error;
  }
  return data.id;
}

/** Removes a stored resume and its upload record, e.g. after its application is deleted. */
export async function deleteResume(path: string): Promise<void> {
  const db = supabaseAdmin();
  const { error: removeError } = await db.storage.from(RESUME_BUCKET).remove([path]);
  if (removeError) throw removeError;
  const { error } = await db.from("resume_uploads").delete().eq("path", path);
  if (error) throw error;
}

/** A short-lived download link for admins. */
export async function resumeDownloadUrl(path: string, fileName: string): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .storage.from(RESUME_BUCKET)
    .createSignedUrl(path, 60, { download: fileName });
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Deletes uploads that no application claimed within the grace period (for
 * example someone uploaded a resume, then closed the tab). Returns how many
 * files were removed.
 */
export async function cleanupOrphanedResumes(now = new Date()): Promise<number> {
  const db = supabaseAdmin();
  const cutoff = new Date(now.getTime() - ORPHAN_RESUME_MAX_AGE_HOURS * 60 * 60 * 1000);

  const { data: stale, error } = await db
    .from("resume_uploads")
    .select("id, path")
    .is("claimed_at", null)
    .lt("created_at", cutoff.toISOString())
    .limit(500)
    .returns<{ id: string; path: string }[]>();
  if (error) throw error;
  if (!stale || stale.length === 0) return 0;

  // Belt and braces: never delete a file an application points at, even if
  // its upload row was not marked claimed.
  const { data: referenced, error: refError } = await db
    .from("applications")
    .select("resume_path")
    .in("resume_path", stale.map((upload) => upload.path))
    .returns<{ resume_path: string }[]>();
  if (refError) throw refError;
  const keep = new Set((referenced ?? []).map((row) => row.resume_path));

  const orphans = stale.filter((upload) => !keep.has(upload.path));
  const kept = stale.filter((upload) => keep.has(upload.path));

  if (kept.length > 0) {
    await db
      .from("resume_uploads")
      .update({ claimed_at: now.toISOString() })
      .in("id", kept.map((upload) => upload.id));
  }
  if (orphans.length === 0) return 0;

  const { error: removeError } = await db.storage
    .from(RESUME_BUCKET)
    .remove(orphans.map((upload) => upload.path));
  if (removeError) throw removeError;

  const { error: deleteError } = await db
    .from("resume_uploads")
    .delete()
    .in("id", orphans.map((upload) => upload.id));
  if (deleteError) throw deleteError;

  return orphans.length;
}
