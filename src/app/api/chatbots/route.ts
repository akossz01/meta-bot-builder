import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectToDatabase from "@/lib/mongodb";
import Chatbot from "@/models/Chatbot";
import MessengerAccount from "@/models/MessengerAccount";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// GET all chatbots for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) throw new Error("Authentication required.");
    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const userId = payload.userId;

    await connectToDatabase();

    const chatbots = await Chatbot.find({ userId }).populate('accountId', 'accountName accountId accessToken');
    
    // Fetch profile pictures for each page
    const chatbotsWithPictures = await Promise.all(
      chatbots.map(async (bot) => {
        const botObj = bot.toObject();
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
        // Remove accessToken from response for security
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
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) throw new Error("Authentication required.");
        const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
        const userId = payload.userId;
    
        const { name, accountId } = await req.json(); // accountId is the _id of the MessengerAccount
        if (!name || !accountId) {
            return NextResponse.json({ message: "Name and accountId are required." }, { status: 400 });
        }
    
        await connectToDatabase();
    
        // Security check: ensure the messenger account belongs to the user
        const messengerAccount = await MessengerAccount.findOne({ _id: accountId, userId });
        if (!messengerAccount) {
            return NextResponse.json({ message: "Account not found or access denied." }, { status: 404 });
        }

        // Check if another active bot exists for this account
        const existingActiveBot = await Chatbot.findOne({ accountId, userId, isActive: true });

        const newChatbot = new Chatbot({
            name,
            accountId,
            userId,
            isActive: !existingActiveBot, // Set to true only if no other bot is active
        });
        await newChatbot.save();
    
        return NextResponse.json(newChatbot, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) { // Handle duplicate name error
            return NextResponse.json({ message: "A chatbot with this name already exists for the selected page." }, { status: 409 });
        }
        console.error("Failed to create chatbot:", error);
        return NextResponse.json({ message: "An error occurred." }, { status: 500 });
    }
}