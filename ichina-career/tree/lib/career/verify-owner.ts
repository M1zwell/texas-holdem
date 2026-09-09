import { JUBIT_ANON_KEY, JUBIT_SUPABASE_URL, decodeJwtPayload, type FamilySession } from "@/lib/jubit-sso";
import { isCareerOwner } from "./gate";

type AuthUserPayload = {
  email?: string;
  user?: { email?: string };
};

export async function verifyCareerOwner(session: FamilySession): Promise<boolean> {
  const jwt = decodeJwtPayload(session.accessToken);
  const claimed = session.email || jwt?.email || "";
  if (!isCareerOwner(claimed)) return false;

  try {
    const response = await fetch(`${JUBIT_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: JUBIT_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as AuthUserPayload;
    return isCareerOwner(payload.email || payload.user?.email);
  } catch {
    return false;
  }
}
