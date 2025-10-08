import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";
import MessengerAccount from "@/models/MessengerAccount";
import { Types } from "mongoose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Helper function to get User ID from the token
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Accommodates different possible claim names for user ID
    return (payload.userId || payload.sub || payload.id) as string;
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return null;
  }
}

// GET all chatbots for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // The FIX is here: We add .select('+testTrigger') to explicitly fetch the field.
    const chatbots = await Chatbot.find({ userId: new Types.ObjectId(userId) })
      .populate('accountId', 'accountName accountId accessToken')
      .select('+testTrigger') // <--- THIS IS THE CRITICAL FIX
      .sort({ createdAt: -1 });
    
    // Your existing logic for fetching profile pictures is good, so we keep it.
    const chatbotsWithPictures = await Promise.all(
      chatbots.map(async (bot) => {
        // Convert Mongoose doc to a plain object to modify it
        const botObj = bot.toObject({ virtuals: true }); // Ensure virtuals like isActive are included
        
        if (botObj.accountId && botObj.accountId.accountId && botObj.accountId.accessToken) {
          try {
            const response = await fetch(
              `https://graph.facebook.com/v20.0/${botObj.accountId.accountId}/picture?redirect=false&access_token=${botObj.accountId.accessToken}`
            );
            const data = await response.json();
            botObj.accountId.pictureUrl = data.data?.url || null;
          } catch (error) {
            console.error('Failed to fetch profile picture:', error);
            botObj.accountId.pictureUrl = null;
          }
        }
        // Remove accessToken from the response for security
        if (botObj.accountId) {
          delete botObj.accountId.accessToken;
        }
        return botObj;
      })
    );

    return NextResponse.json(chatbotsWithPictures);

  } catch (error) {
    console.error("Failed to fetch chatbots:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

// POST to create a new chatbot
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
    
        const { name, accountId } = await req.json();
        if (!name || !accountId) {
            return NextResponse.json({ message: "Name and accountId are required." }, { status: 400 });
        }
    
        await connectToDatabase();
    
        // Security check: ensure the messenger account belongs to the user
        const messengerAccount = await MessengerAccount.findOne({ _id: accountId, userId });
        if (!messengerAccount) {
            return NextResponse.json({ message: "Account not found or access denied." }, { status: 404 });
        }

        const newChatbot = new Chatbot({
            name,
            accountId,
            userId,
        });
        await newChatbot.save();
    
        return NextResponse.json(newChatbot, { status: 201 });

    } catch (error: any) {
        // Handle duplicate name error (from the unique index on the model)
        if (error.code === 11000) {
            return NextResponse.json({ message: "A chatbot with this name already exists for the selected page." }, { status: 409 });
        }
        console.error("Failed to create chatbot:", error);
        return NextResponse.json({ message: "An error occurred." }, { status: 500 });
    }
}