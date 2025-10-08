import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import MessengerAccount from "@/models/MessengerAccount";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * Fetches all connected Messenger accounts for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json({ message: "Invalid token payload." }, { status: 401 });
    }

    await connectToDatabase();

    const accounts = await MessengerAccount.find({ userId }).select(
      "accountId accountName accountType" // We only send necessary, non-sensitive data to the client
    );

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'JWTExpired') {
        return NextResponse.json({ message: "Session expired. Please log in again." }, { status: 401 });
    }
    console.error("Failed to fetch connections:", error);
    return NextResponse.json({ message: "An internal server error occurred." }, { status: 500 });
  }
}