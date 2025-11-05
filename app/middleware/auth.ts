// ramsriprasaath's CODE — JWT Auth Middleware

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PROTECTED_ROUTES = ["/api/projects", "/api/tasks", "/api/insights", "/api/users"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if route needs protection
  if (PROTECTED_ROUTES.some((r) => path.startsWith(r))) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Check role-based permissions
    const { role } = decoded as { role: string };
    
    if (path.startsWith('/api/projects')) {
      if (req.method === 'POST' && !['MANAGER', 'TEAM_LEAD'].includes(role)) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }
    
    if (path.startsWith('/api/tasks')) {
      if (req.method === 'POST' && !['MANAGER', 'TEAM_LEAD'].includes(role)) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    // Clone the request headers to add user info
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', (decoded as any).id);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-org', (decoded as any).organizationId || '');

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
