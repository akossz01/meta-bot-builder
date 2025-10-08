import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";
import { Types } from "mongoose";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// --- THE FIX IS IN THIS FUNCTION ---
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // We now also check for 'userId', which is a common custom claim name.
    return (payload.sub || payload.id || payload.userId) as string;
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { chatbotId } = params;
    if (!chatbotId || !Types.ObjectId.isValid(chatbotId)) {
      return NextResponse.json({ message: "Invalid chatbot ID" }, { status: 400 });
    }

    const body = await req.json();
    const { mode } = body;

    const validModes = ['active', 'test', 'inactive'];
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json({ message: "Invalid mode provided. Must be one of: " + validModes.join(', ') }, { status: 400 });
    }

    await connectToDatabase();

    const updatedChatbot = await Chatbot.findOneAndUpdate(
      { _id: new Types.ObjectId(chatbotId), userId: new Types.ObjectId(userId) },
      { $set: { mode: mode } },
      { new: true, runValidators: true }
    );

    if (!updatedChatbot) {
      return NextResponse.json({ message: "Chatbot not found or you do not have permission" }, { status: 404 });
    }

    return NextResponse.json(updatedChatbot);

  } catch (error) {
    console.error("Error updating chatbot mode:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}