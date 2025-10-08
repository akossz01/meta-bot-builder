import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/auth/callback`;

  if (!appId || !redirectUri) {
    return NextResponse.json(
      { message: "Missing Meta App configuration." },
      { status: 500 }
    );
  }

  // Permissions required for managing pages and messaging
  const scope = "pages_show_list,pages_messaging,whatsapp_business_messaging";

  // A unique string to prevent CSRF attacks
  const state = "your_unique_state_string"; // In a real app, generate this dynamically

  const authUrl = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("auth_type", "reauthorize"); // Force re-authorization dialog

  return NextResponse.redirect(authUrl.toString());
}