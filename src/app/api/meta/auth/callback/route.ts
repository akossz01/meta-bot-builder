import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import MessengerAccount from "@/models/MessengerAccount";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function exchangeCodeForToken(code: string) {
  const url = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/auth/callback`);
  url.searchParams.set("code", code);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

async function getLongLivedUserToken(shortLivedToken: string) {
  const url = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

async function getUserPages(longLivedUserToken: string) {
  const url = new URL("https://graph.facebook.com/v20.0/me/accounts");
  url.searchParams.set("access_token", longLivedUserToken);
  // Request the fields we need for each page
  url.searchParams.set("fields", "id,name,access_token"); 

  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.data; // This is an array of pages
}

/**
 * Subscribes the app to a page's webhook events (e.g., messages).
 * This is a crucial step to make the webhook functional for a specific page.
 */
async function subscribeAppToPage(pageAccessToken: string, pageId: string) {
  const url = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: pageAccessToken,
      subscribed_fields: ['messages'], // Subscribe to the messages field
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Failed to subscribe app to page ${pageId}: ${JSON.stringify(data.error)}`);
  }
  console.log(`Successfully subscribed app to page ${pageId}`);
}

/**
 * Handles the callback from Facebook's OAuth flow.
 * It receives an authorization `code` that can be exchanged for an access token.
 */
export async function GET(req: NextRequest) {
  const redirectUrl = new URL("/dashboard/connections", req.url);

  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");
    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      throw new Error(`Facebook OAuth Error: ${error}`);
    }

    if (!code) {
      throw new Error("Authorization code not found.");
    }

    await connectToDatabase();

    // 1. Exchange code for a short-lived user access token
    const shortLivedToken = await exchangeCodeForToken(code);

    // 2. Exchange short-lived token for a long-lived one
    const longLivedUserToken = await getLongLivedUserToken(shortLivedToken);

    // 3. Fetch user's pages using the long-lived token
    const pages = await getUserPages(longLivedUserToken);

    if (!pages || pages.length === 0) {
      throw new Error("No Facebook pages found for this user.");
    }

    // 4. Loop through all pages returned by the API
    const operations = pages.map((page: any) => {
      const { name, access_token: pageAccessToken, id: pageId } = page;

      // Subscribe the app to this page's webhook events
      subscribeAppToPage(pageAccessToken, pageId);

      // 5. Create or update an entry for each page in the database
      // TODO: Encryption should be added for production. For now, we store it directly.
      return MessengerAccount.findOneAndUpdate(
        { accountId: pageId, userId },
        {
          userId,
          accountId: pageId,
          accountName: name,
          accessToken: pageAccessToken,
          accountType: "messenger",
        },
        { upsert: true, new: true }
      );
    });

    // Execute all database operations
    await Promise.all(operations);

    redirectUrl.searchParams.set("success", "facebook_connected");
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Facebook auth callback error:", error.message);
    redirectUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}