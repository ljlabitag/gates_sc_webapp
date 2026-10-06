// What the virtual-kit email links to. Empty for now — the materials and the
// feedback forms don't exist yet — and the email handles that: with nothing
// listed it tells attendees the links will follow. Add entries here as they
// become available; no other code changes are needed.
//
// Only https:// URLs are rendered (see lib/virtualKitEmail.ts).

export interface KitLink {
  label: string;
  url: string;
  /** Optional one-line explanation shown after the link. */
  description?: string;
}

export interface VirtualKitContent {
  /** Slides, handouts, recordings, etc. */
  materials: KitLink[];
  /** Feedback and evaluation forms. */
  feedback: KitLink[];
}

export const VIRTUAL_KIT: VirtualKitContent = {
  materials: [],
  feedback: [],
};
