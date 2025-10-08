import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import MessengerAccount from "@/models/MessengerAccount";
import Chatbot from "@/models/Chatbot";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

/**
 * Handles the webhook verification challenge from Meta.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error("Webhook verification failed.");
    return new NextResponse("Forbidden", { status: 403 });
  }
}

/**
 * Handles incoming messages and events from Meta.
 */
export async function POST(req: NextRequest) {
  // 1. Verify the request signature
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const body = await req.text(); // Read raw body for signature verification

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", APP_SECRET!)
    .update(body)
    .digest("hex")}`;

  if (signature !== expectedSignature) {
    console.warn("Invalid webhook signature received.");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  // 2. Process the webhook event
  if (payload.object === "page") {
    for (const entry of payload.entry) {
      for (const event of entry.messaging) {
        if (event.message && event.message.text) {
          // Asynchronously process the message to respond quickly
          processMessage(event);
        }
      }
    }
  }

  // 3. Respond immediately with 200 OK
  return NextResponse.json({ status: "success" }, { status: 200 });
}


/**
 * Helper function to find the chatbot's reply and send it.
 */
async function processMessage(event: any) {
  try {
    const senderId = event.sender.id; // User's Page-Scoped ID (PSID)
    const recipientId = event.recipient.id; // Your Page's ID

    await connectToDatabase();

    // Find the MessengerAccount associated with your Page ID
    const messengerAccount = await MessengerAccount.findOne({ accountId: recipientId });
    if (!messengerAccount) {
      console.log(`No MessengerAccount found for page ID: ${recipientId}`);
      return;
    }

    // Find the active chatbot for this account
    const chatbot = await Chatbot.findOne({ accountId: messengerAccount._id, isActive: true });
    
    if (!chatbot) {
      console.log(`No active chatbot found for account: ${messengerAccount.accountName}`);
      return;
    }

    // Find the reply message from the flow_json (our simple MVP logic)
    const messageNode = chatbot.flow_json.nodes.find((node: any) => node.type === 'messageNode');
    if (!messageNode || !messageNode.data.message) {
      console.log(`No reply message found in chatbot: ${chatbot.name}`);
      return;
    }
    
    const replyText = messageNode.data.message;

    // Send the reply
    await sendMessage(senderId, replyText, messengerAccount.accessToken);

  } catch (error) {
    console.error("Error processing message:", error);
  }
}

/**
 * Sends a message back to the user via the Graph API.
 */
async function sendMessage(psid: string, message: string, accessToken: string) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`;
  const payload = {
    recipient: { id: psid },
    message: { text: message },
    messaging_type: "RESPONSE",
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.error) {
      console.error("Graph API error:", data.error);
    } else {
      console.log(`Message sent successfully to PSID: ${psid}`);
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}