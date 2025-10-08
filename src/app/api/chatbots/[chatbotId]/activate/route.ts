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

    // 1. Find the chatbot to get its accountId. Use .lean() for a plain object.
    const chatbotToActivate = await Chatbot.findOne({ _id: chatbotId, userId }).select('accountId').lean() as { accountId: string } | null;
    if (!chatbotToActivate) {
      throw new Error("Chatbot not found or access denied.");
    }
    
    // 2. Deactivate all other chatbots for the same accountId using a direct update command.
    await Chatbot.updateMany(
      { 
        accountId: chatbotToActivate.accountId, 
        userId,
        _id: { $ne: chatbotId }, // $ne means "not equal to"
      },
      { $set: { isActive: false } }
    );

    // 3. Activate the target chatbot using a direct update command.
    const result = await Chatbot.findByIdAndUpdate(
      chatbotId,
      { $set: { isActive: true } },
      { new: true } // `new: true` is not strictly needed here but good practice
    );

    if (!result) {
        throw new Error("Failed to activate the chatbot after deactivation step.");
    }

    return NextResponse.json({ message: "Chatbot activated successfully." });
  } catch (error: any) {
    console.error("Failed to activate chatbot:", error);
    return NextResponse.json({ message: error.message || "An error occurred." }, { status: 500 });
  }
}