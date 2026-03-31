import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      const path = req.nextUrl.pathname;

      // Any protected page requires a session.
      if (path.startsWith("/account")) {
        return !!token;
      }

      // Admin pages require ADMIN role.
      if (path.startsWith("/admin")) {
        return !!token && (token as any).role === "ADMIN";
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/admin", "/account"],
};

