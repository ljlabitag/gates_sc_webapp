import { CONFERENCE } from "./conference";

/**
 * What the staff area is called, and which event it's currently managing.
 *
 * The desk is meant to outlive a single conference — registrations, check-in
 * and virtual kits will be reused for the Program's later activities — so the
 * product name is deliberately event-neutral, and the event it shows comes
 * from here. For the next activity, point ACTIVE_EVENT at its details.
 */
export const ADMIN_TITLE = "GATES Events Console";

export const ACTIVE_EVENT = {
  name: CONFERENCE.edition,
  dateLabel: CONFERENCE.dateLabel,
} as const;
