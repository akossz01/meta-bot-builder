import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Handles user logout by clearing the authentication token cookie.
 */
export async function POST() {
  try {
    // To clear a cookie, we set it again with a maxAge of -1
    (await
          // To clear a cookie, we set it again with a maxAge of -1
          cookies()).set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: -1,
      path: "/",
    });

    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}