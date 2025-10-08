import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// GET a single chatbot by its ID
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");
    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId as string;
    const { chatbotId } = await paramsPromise;
    
    await connectToDatabase();

    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId });

    if (!chatbot) {
      return NextResponse.json({ message: "Chatbot not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error(`Failed to fetch chatbot:`, error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

// PUT to update a chatbot's flow
export async function PUT(req: NextRequest, { params: paramsPromise }: { params: Promise<{ chatbotId: string }> }) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) throw new Error("Authentication required.");
        const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
        const userId = payload.userId as string;
        const { chatbotId } = await paramsPromise;

        const { flow_json } = await req.json();
        if (!flow_json) {
            return NextResponse.json({ message: "flow_json is required." }, { status: 400 });
        }
        
        await connectToDatabase();

        const updatedChatbot = await Chatbot.findOneAndUpdate(
            { _id: chatbotId, userId },
            { flow_json },
            { new: true }
        );

        if (!updatedChatbot) {
            return NextResponse.json({ message: "Chatbot not found or access denied." }, { status: 404 });
        }

        return NextResponse.json({ message: "Flow saved successfully." });
    } catch (error) {
        console.error(`Failed to update chatbot:`, error);
        return NextResponse.json({ message: "An error occurred." }, { status: 500 });
    }
}