import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Allow ALL google sign-ins — routing happens
      // client-side based on email.
      // Do NOT call the backend API here — it causes
      // silent failures if the API is unreachable.
      return true
    },
    async session({ session }) {
      return session
    },
    async redirect({ url, baseUrl }) {
      return baseUrl
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
