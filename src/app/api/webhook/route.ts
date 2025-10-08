import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import MessengerAccount from "@/models/MessengerAccount";
import Chatbot from "@/models/Chatbot";
import UserSession from "@/models/UserSession";

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
        if (event.message && !event.message.is_echo) { // Handle incoming text messages
          // Asynchronously process the message to respond quickly
          processMessage(event);
        } else if (event.postback) { // Handle quick reply clicks
          // Asynchronously process the postback
          processPostback(event);
        }
      }
    }
  }

  // 3. Respond immediately with 200 OK
  return NextResponse.json({ status: "success" }, { status: 200 });
}

/**
 * Processes a postback event (e.g., a quick reply button click).
 */
async function processPostback(event: any) {
    try {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const payload = event.postback.payload;

        if (!payload || !payload.startsWith('QUICK_REPLY_PAYLOAD_')) return;

        const replyTitle = payload.replace('QUICK_REPLY_PAYLOAD_', '').replace(/_/g, ' ');

        await connectToDatabase();

        const messengerAccount = await MessengerAccount.findOne({ accountId: recipientId });
        if (!messengerAccount) return;

        const session = await UserSession.findOne({ user_psid: senderId, accountId: messengerAccount._id });
        if (!session) return; // No active session to continue from

        const chatbot = await Chatbot.findById(session.chatbotId); // Assuming we'll add chatbotId to session
        if (!chatbot) return;

        const currentNode = chatbot.flow_json.nodes.find((n: any) => n.id === session.current_node_id);
        if (!currentNode || currentNode.type !== 'quickReplyNode') return;

        // Find the index of the clicked reply
        const replyIndex = currentNode.data.replies.findIndex((r: any) => r.title.toUpperCase() === replyTitle);
        if (replyIndex === -1) return;

        const sourceHandleId = `handle-${replyIndex}`;
        
        // Find the next node connected to this specific handle
        const nextNode = findNextNode(chatbot.flow_json, currentNode.id, sourceHandleId);

        if (nextNode) {
            await sendNodeMessage(senderId, nextNode, messengerAccount.accessToken);
            session.current_node_id = nextNode.id;
            await session.save();
        } else {
            console.log(`End of flow reached for user ${senderId} after quick reply.`);
        }

    } catch(error) {
        console.error("Error processing postback:", error);
    }
}

/**
 * Helper function to find the chatbot's reply and send it.
 */
async function processMessage(event: any) {
  try {
    const senderId = event.sender.id; // User's Page-Scoped ID (PSID)
    const recipientId = event.recipient.id; // Your Page's ID

    await connectToDatabase();

    const messengerAccount = await MessengerAccount.findOne({ accountId: recipientId });
    if (!messengerAccount) return console.log(`No account for page ID: ${recipientId}`);

    const chatbot = await Chatbot.findOne({ accountId: messengerAccount._id, isActive: true });
    if (!chatbot) return console.log(`No active bot for account: ${messengerAccount.accountName}`);

    let session = await UserSession.findOne({ user_psid: senderId, accountId: messengerAccount._id });
    const chatbotId = chatbot._id; // Get the chatbot ID
    
    let currentNodeId;
    if (!session) {
      // New user session, start from the beginning
      const startNode = chatbot.flow_json.nodes.find((node: any) => node.type === 'input');
      if (!startNode) return console.log("No 'start' node found in flow.");
      currentNodeId = startNode.id;
      
      session = new UserSession({
          user_psid: senderId,
          accountId: messengerAccount._id,
          current_node_id: currentNodeId,
          chatbotId, // Store the chatbotId in the session
      });
    } else {
      // Existing user, get their current position
      currentNodeId = session.current_node_id;
      session.chatbotId = chatbotId; // Ensure session is up-to-date with active bot
    }

    const currentNode = chatbot.flow_json.nodes.find((n: any) => n.id === currentNodeId);
    // If user is at a quick reply node and types something, do nothing. They must click a button.
    if (currentNode && currentNode.type === 'quickReplyNode') return;

    // Determine the next step in the flow
    const nextNode = findNextNode(chatbot.flow_json, currentNodeId);

    if (nextNode) {
      await sendNodeMessage(senderId, nextNode, messengerAccount.accessToken);
      // Update the session to the new node
      session.current_node_id = nextNode.id;
      await session.save();
    } else {
      // End of conversation or dead end
      console.log(`End of flow reached for user ${senderId} at node ${currentNodeId}`);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

/**
 * Finds the next node in the flow based on the current node ID.
 */
function findNextNode(flow: any, currentNodeId: string, sourceHandle?: string) {
    const edge = flow.edges.find((e: any) => e.source === currentNodeId && e.sourceHandle === (sourceHandle || null));
    if (!edge) return null;
    return flow.nodes.find((n: any) => n.id === edge.target);
}

/**
 * Sends a message to the user based on the node type.
 */
async function sendNodeMessage(psid: string, node: any, accessToken: string) {
  if (node.type === 'messageNode') {
    await sendMessage(psid, { text: node.data.message }, accessToken);
  } else if (node.type === 'quickReplyNode') {
    const quickReplies = node.data.replies.map((reply: any) => ({
        content_type: 'text',
        title: reply.title,
        payload: `QUICK_REPLY_PAYLOAD_${reply.title.toUpperCase().replace(/ /g, '_')}`,
    }));
    await sendMessage(psid, { text: node.data.message, quick_replies: quickReplies }, accessToken);
  }
}

/**
 * Sends a message back to the user via the Graph API.
 */
async function sendMessage(psid: string, messagePayload: object, accessToken: string) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`;
  const payload = {
    recipient: { id: psid },
    message: messagePayload,
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