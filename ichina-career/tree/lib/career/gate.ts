/** The only Google identity that may open ichina.co/career. */
export const CAREER_OWNER_EMAIL = "yying2010@gmail.com";

export function normalizeEmail(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

export function isCareerOwner(email: string | null | undefined): boolean {
  return normalizeEmail(email) === CAREER_OWNER_EMAIL;
}
