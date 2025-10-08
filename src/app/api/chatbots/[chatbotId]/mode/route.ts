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
    const { mode } = await req.json();

    if (!['active', 'test', 'inactive'].includes(mode)) {
      return NextResponse.json({ message: "Invalid mode." }, { status: 400 });
    }

    await connectToDatabase();

    const chatbotToUpdate = await Chatbot.findOne({ _id: chatbotId, userId }).select('accountId').lean() as { accountId: string } | null;
    if (!chatbotToUpdate) {
      throw new Error("Chatbot not found or access denied.");
    }
    
    if (mode === 'active' || mode === 'test') {
      await Chatbot.updateMany(
        { 
          accountId: chatbotToUpdate.accountId, 
          userId,
          _id: { $ne: chatbotId },
        },
        { $set: { mode: 'inactive' } }  // Only update mode
      );
    }

    const result = await Chatbot.findByIdAndUpdate(
      chatbotId,
      { $set: { mode } },  // Only update mode
      { new: true }
    );

    if (!result) {
      throw new Error("Failed to update chatbot mode.");
    }

    return NextResponse.json({ message: "Chatbot mode updated successfully.", mode: result.mode });
  } catch (error: any) {
    console.error("Failed to update chatbot mode:", error);
    return NextResponse.json({ message: error.message || "An error occurred." }, { status: 500 });
  }
}
