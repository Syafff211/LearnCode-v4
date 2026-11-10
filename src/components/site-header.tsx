import { displayName, getProfile, getSessionContext } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { HeaderBar } from "@/components/header-bar";

export async function SiteHeader({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  const [session, platform] = await Promise.all([getSessionContext(), getPlatformSettings()]);
  const profile = session ? await getProfile(session.user.id) : null;
  const user = session
    ? {
        name: displayName(session.user, profile),
        email: session.user.email ?? "",
      }
    : null;

  return <HeaderBar variant={variant} user={user} logoUrl={platform.logoUrl} />;
}
