import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isMemberRoute = pathname === "/member" || pathname.startsWith("/member/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if ((isMemberRoute || isAdminRoute) && !user) {
    const url = request.nextUrl.clone();
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", `${url.pathname}${url.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (isAuthRoute && profile?.status === "active") {
    return NextResponse.redirect(
      new URL(["staff", "admin"].includes(profile.role) ? "/admin" : "/member", request.url)
    );
  }

  if ((isMemberRoute || isAdminRoute) && profile?.status !== "active") {
    return NextResponse.redirect(new URL("/account-pending", request.url));
  }

  if (isAdminRoute && !["staff", "admin"].includes(profile?.role ?? "member")) {
    return NextResponse.redirect(new URL("/member", request.url));
  }

  if (isMemberRoute && ["staff", "admin"].includes(profile?.role ?? "member")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}
