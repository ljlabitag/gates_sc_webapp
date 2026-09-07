import { getDb } from "../db/client";
import { auditLog } from "../db/schema";

interface AuditEntry {
  actor: string;
  action: "view" | "export" | "download";
  resource: "registrations" | "hackathon_submissions";
  resourceId?: string;
}

// RA 10173 access-logging control (brief §4): every admin read and export
// gets a row here — who, what, when. Not best-effort; callers await this
// before returning data, since an unlogged access defeats the point.
export async function logAudit(db: D1Database, entry: AuditEntry): Promise<void> {
  await getDb(db)
    .insert(auditLog)
    .values({
      id: crypto.randomUUID(),
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      createdAt: Date.now(),
    });
}
