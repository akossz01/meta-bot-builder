import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// GET all testers for a chatbot
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");

    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId as string;
    const { chatbotId } = await paramsPromise;

    await connectToDatabase();

    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId }).select('testers');
    if (!chatbot) {
      return NextResponse.json({ message: "Chatbot not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(chatbot.testers);
  } catch (error: any) {
    console.error("Failed to fetch testers:", error);
    return NextResponse.json({ message: error.message || "An error occurred." }, { status: 500 });
  }
}

// DELETE a tester
export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");

    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId as string;
    const { chatbotId } = await paramsPromise;
    const { searchParams } = new URL(req.url);
    const user_psid = searchParams.get("user_psid");

    if (!user_psid) {
      return NextResponse.json({ message: "user_psid is required." }, { status: 400 });
    }

    await connectToDatabase();

    const result = await Chatbot.findOneAndUpdate(
      { _id: chatbotId, userId },
      { $pull: { testers: { user_psid } } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ message: "Chatbot not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ message: "Tester removed successfully." });
  } catch (error: any) {
    console.error("Failed to remove tester:", error);
    return NextResponse.json({ message: error.message || "An error occurred." }, { status: 500 });
  }
}
