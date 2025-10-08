import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

function generateTestTrigger() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");

    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId as string;
    const { chatbotId } = await paramsPromise;

    await connectToDatabase();

    const newTrigger = generateTestTrigger();
    const result = await Chatbot.findOneAndUpdate(
      { _id: chatbotId, userId },
      { $set: { testTrigger: newTrigger, testers: [] } }, // Clear testers when regenerating
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ message: "Chatbot not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ testTrigger: newTrigger });
  } catch (error: any) {
    console.error("Failed to regenerate test trigger:", error);
    return NextResponse.json({ message: error.message || "An error occurred." }, { status: 500 });
  }
}
