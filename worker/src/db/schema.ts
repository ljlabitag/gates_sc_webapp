import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// SQLite has no native enum or boolean type: statuses are validated in app
// code against a TS union, and 0/1 integers stand in for booleans (Drizzle's
// `{ mode: "boolean" }` maps that automatically). Dates are unix-ms integers,
// read and written only through Drizzle — never hand-write date comparisons
// in raw SQL. IDs are generated in app code with crypto.randomUUID(), since
// SQLite has no uuid() default.

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  // FK to the future voucher module's `events` table — nullable until that
  // migration lands, included now so it's additive rather than a schema break.
  eventId: text("event_id"),
  // `name` is the display name, composed server-side from the three parts
  // below ("First M. Last") — kept as its own column so the admin list and
  // exports that predate the split keep working. The parts are nullable only
  // because adding them to an existing table has to be additive.
  name: text("name").notNull(),
  firstName: text("first_name"),
  middleInitial: text("middle_initial"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  mobile: text("mobile"),
  // The attendee's office or agency (e.g. "DOST-ASTI") — distinct from
  // `organization`, the optional parent body (e.g. "Department of Science
  // and Technology", or a development partner's institution).
  agency: text("agency"),
  organization: text("organization"),
  designation: text("designation"),
  // Dietary and assistance details are sensitive personal information under
  // RA 10173 (health-adjacent), hence structured checklists plus short,
  // length-capped notes rather than open text (brief §6). Checklists are
  // stored "; "-joined.
  dietaryPreferences: text("dietary_preferences"),
  foodAllergies: text("food_allergies"),
  specialAssistance: text("special_assistance"),
  assistanceNeeded: text("assistance_needed"),
  // Superseded by the four columns above — new registrations never write it.
  // Left in place so the migration stays additive rather than dropping a
  // column from databases that already have the table.
  dietaryAccessibility: text("dietary_accessibility"),
  consentedAt: integer("consented_at").notNull(),
  privacyNoticeVersion: text("privacy_notice_version").notNull(),
  documentationConsent: integer("documentation_consent", { mode: "boolean" }).notNull(),
  retentionUntil: integer("retention_until").notNull(),
  deletedAt: integer("deleted_at"),
  createdAt: integer("created_at").notNull(),
});

// Mirrors Annex A of the GATES GeoHack 2026 mechanics.
export const hackathonSubmissions = sqliteTable("hackathon_submissions", {
  id: text("id").primaryKey(),
  team: text("team").notNull(),
  title: text("title").notNull(),
  // One of the six GATES priority innovation domains; validated server-side
  // against that union rather than a DB-level enum.
  domain: text("domain"),
  agency: text("agency"),
  leaderName: text("leader_name").notNull(),
  leaderPosition: text("leader_position"),
  leaderEmail: text("leader_email").notNull(),
  leaderMobile: text("leader_mobile"),
  // Members 2-4: "Name — position — role in team", one per line.
  members: text("members"),
  endorsingHead: text("endorsing_head"),
  // R2 object key, set once the upload is confirmed to exist (status flips to
  // "complete" only after that check — see the presign/submit endpoints).
  objectKey: text("object_key"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  status: text("status", { enum: ["pending", "complete"] }).notNull(),
  consentedAt: integer("consented_at").notNull(),
  privacyNoticeVersion: text("privacy_notice_version").notNull(),
  documentationConsent: integer("documentation_consent", { mode: "boolean" }).notNull(),
  // Team leader attests that members and the endorsing head — who never visit
  // the site and cannot consent themselves — have been informed.
  memberConsentAttested: integer("member_consent_attested", { mode: "boolean" }).notNull(),
  retentionUntil: integer("retention_until").notNull(),
  deletedAt: integer("deleted_at"),
  createdAt: integer("created_at").notNull(),
});

// RA 10173 access-logging control: every admin read and export gets a row
// here — actor, action, resource, timestamp. Not a nice-to-have; see brief §4.
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action", { enum: ["view", "export", "download"] }).notNull(),
  resource: text("resource", { enum: ["registrations", "hackathon_submissions"] }).notNull(),
  resourceId: text("resource_id"),
  createdAt: integer("created_at").notNull(),
});

// Backs lib/rateLimit.ts's D1-based rate limiter (the native Workers Rate
// Limiting binding didn't enforce anything in testing — see that file).
// bucketKey is unique per (scope, key, window), so an INSERT ... ON CONFLICT
// there is an atomic increment.
export const rateLimitHits = sqliteTable("rate_limit_hits", {
  bucketKey: text("bucket_key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull(),
});
