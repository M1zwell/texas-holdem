/** The only Google identity that may open ichina.co/funding. Same owner as /career — different desk. */
export const FUNDING_OWNER_EMAIL = "yying2010@gmail.com";

export function normalizeEmail(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function isFundingOwner(email: string | null | undefined): boolean {
  return normalizeEmail(email) === FUNDING_OWNER_EMAIL;
}
