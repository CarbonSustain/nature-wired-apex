import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { getUserByEmail } from "@/utils/api";
import { getGoogleUser, storeGoogleUser } from "@/utils/googleAuth";

export default function SessionHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  async function getUserObjByEmail(email) {
    const user = await getUserByEmail(email);
    console.log("💾 Backend user data stored in localStorage");
    console.log("📦 Stored backend data:", user);
    return user;
  }

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      console.log("🔐 Session established, storing user data...");

      // Store user's Google account information in localStorage
      storeGoogleUser(session.user);

      // Also store backend user data if available
      if (session.backendUserId) {
        const backendUserData = {
          ...session.user,
          backendUserId: session.backendUserId,
          backendUserData: session.backendUserData,
          accessToken: session.accessToken,
          idToken: session.idToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          refreshExpiresAt: session.refreshExpiresAt,
        };
        localStorage.setItem("backendUserData", JSON.stringify(backendUserData));
        console.log("💾 Backend user data stored in localStorage");
        console.log("📦 Stored backend data:", backendUserData);
      } else {
        console.warn("⚠️ No backend user ID found in session");

        const gUser = getGoogleUser();
        console.log(gUser);

        const user = getUserObjByEmail(gUser.email);
        console.log("💾 Backend user data stored in localStorage");
        console.log("📦 Stored backend data:", user);
      }

      // Check if there's a stored campaign ID for redirect
      const redirectCampaignId = localStorage.getItem("redirectCampaignId");
      if (redirectCampaignId) {
        console.log("🎯 Found stored campaign ID, redirecting to vote page:", redirectCampaignId);
        localStorage.removeItem("redirectCampaignId"); // Clean up
        router.push(`/vote/campaign?campaign=${redirectCampaignId}&source=email`);
      }
    }
  }, [session, status, router]);

  return null; // This component doesn't render anything
}
