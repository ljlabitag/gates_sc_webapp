/** Mirrors Annex A of the GATES GeoHack 2026 mechanics. */
export interface HackathonInput {
  team: string;
  title: string;
  domain: string;
  agency: string;
  leaderName: string;
  leaderPosition: string;
  leaderEmail: string;
  leaderMobile: string;
  members: string;
  file: File | null;
  consent: boolean;
  documentationConsent: boolean;
  memberConsentAttested: boolean;
}

class ApiError extends Error {}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}

// Browser gets a presigned URL, PUTs the file straight to R2, then submits
// the form metadata with the resulting objectKey — in that order, so an
// abandoned submission leaves an orphaned file rather than a database row
// that looks like a real submission with no proposal attached. It also keeps
// the file off this Worker request's body entirely.
export async function submitHackathonEntry(input: HackathonInput): Promise<void> {
  const { file, ...fields } = input;
  if (!file) {
    throw new ApiError("Please attach your completed proposal PDF.");
  }

  const contentType = file.type || "application/pdf";

  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, contentType, fileSize: file.size }),
  });
  if (!presignRes.ok) {
    throw new ApiError(await parseErrorMessage(presignRes, "Could not prepare the upload. Please try again."));
  }
  const { objectKey, uploadUrl } = await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) {
    throw new ApiError("Could not upload the proposal file. Please try again.");
  }

  const res = await fetch("/api/hackathon-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...fields,
      objectKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: contentType,
    }),
  });
  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res, "Please check the required fields and try again."));
  }
}
