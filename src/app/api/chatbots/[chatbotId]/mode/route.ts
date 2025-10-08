import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";
import { Types } from "mongoose";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.sub || payload.id || payload.userId) as string;
  } catch (error) {
    return null;
  }
}

// Helper to generate the trigger code, so we don't repeat it.
function generateTestTrigger() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
      return NextResponse.json({ message: "Invalid mode provided." }, { status: 400 });
    }

    await connectToDatabase();

    // Find the chatbot first
    const chatbot = await Chatbot.findOne({
      _id: new Types.ObjectId(chatbotId),
      userId: new Types.ObjectId(userId),
    });

    if (!chatbot) {
      return NextResponse.json({ message: "Chatbot not found or you do not have permission" }, { status: 404 });
    }

    // If we are switching to 'test' mode and the bot has no trigger, create one.
    if (mode === 'test' && !chatbot.testTrigger) {
      chatbot.testTrigger = generateTestTrigger();
      console.log(`Generated new testTrigger ${chatbot.testTrigger} for old bot ${chatbot._id}`);
    }

    // Set the new mode
    chatbot.mode = mode;
    
    // Save all changes (both mode and the potential new trigger)
    const updatedChatbot = await chatbot.save();

    // Convert to a plain object to ensure all fields, including the new trigger, are in the response
    const responseObj = updatedChatbot.toObject({ virtuals: true });
    
    return NextResponse.json(responseObj);

  } catch (error) {
    console.error("Error updating chatbot mode:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}