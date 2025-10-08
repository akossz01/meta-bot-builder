import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function PUT(req: NextRequest, { params: paramsPromise }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");

    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId as string;
    const { chatbotId } = await paramsPromise;

    await connectToDatabase();

    const result = await Chatbot.findOneAndUpdate(
      { _id: chatbotId, userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!result) {
      throw new Error("Chatbot not found or access denied.");
    }

    return NextResponse.json({ message: "Chatbot deactivated successfully." });
  } catch (error: any) {
    console.error("Failed to deactivate chatbot:", error);
    return NextResponse.json({ message: error.message || "An error occurred." }, { status: 500 });
  }
}
