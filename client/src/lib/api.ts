export interface RegistrationInput {
  name: string;
  email: string;
  org: string;
  needs: string;
}

/** Mirrors Annex A of the GATES Hackathon 2026 mechanics. */
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
  endorsingHead: string;
  file: File | null;
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

export async function submitRegistration(input: RegistrationInput): Promise<void> {
  const res = await fetch("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res, "Please enter your name and a valid email."));
  }
}

export async function submitHackathonEntry(input: HackathonInput): Promise<void> {
  const formData = new FormData();
  const { file, ...fields } = input;
  for (const [key, value] of Object.entries(fields)) formData.append(key, value);
  if (file) formData.append("proposal", file);

  const res = await fetch("/api/hackathon-submissions", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res, "Please check the required fields and try again."));
  }
}
