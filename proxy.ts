import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_REALM, isAdminAuthConfigured, isAdminAuthorized } from "@/lib/admin-auth";

// HTTP Basic Auth challenge in front of the lead admin. The pages, route handlers
// and server actions under /admin re-check the same header themselves.
export function proxy(request: NextRequest) {
  if (!isAdminAuthConfigured) {
    return new NextResponse("Admin access is not configured on this deployment.", { status: 503 });
  }
  if (isAdminAuthorized(request.headers.get("authorization"))) {
    return NextResponse.next();
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": ADMIN_REALM },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
