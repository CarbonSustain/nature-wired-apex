import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// NextAuth reads NEXTAUTH_URL from the actual Lambda process.env at runtime.
// This ensures it's available even if Amplify doesn't inject it into the Lambda.
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://main.d2falv1xg02otc.amplifyapp.com";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV !== "production",
});
