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
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const body = await req.text();

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", APP_SECRET!)
    .update(body)
    .digest("hex")}`;

  if (signature !== expectedSignature) {
    console.warn("Invalid webhook signature received.");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);
  console.log('Webhook payload received:', JSON.stringify(payload, null, 2));

  if (payload.object === "page") {
    for (const entry of payload.entry) {
      for (const event of entry.messaging) {
        console.log('Processing event:', JSON.stringify(event, null, 2));
        if (event.message) {
          if (event.message.quick_reply) {
            processQuickReply(event);
          } else if (!event.message.is_echo) {
            processMessage(event);
          }
        } else if (event.postback) {
          console.log('Postback detected:', event.postback);
          processPostback(event);
        }
      }
    }
  }

  return NextResponse.json({ status: "success" }, { status: 200 });
}

/**
 * Processes a postback event (e.g., button clicks from cards).
 */
async function processPostback(event: any) {
    try {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const payload = event.postback.payload;

        console.log(`Postback received - Sender: ${senderId}, Recipient: ${recipientId}, Payload: ${payload}`);

        await connectToDatabase();

        const messengerAccount = await MessengerAccount.findOne({ accountId: recipientId });
        if (!messengerAccount) {
            console.log('No messenger account found for recipient:', recipientId);
            return;
        }

        const session = await UserSession.findOne({ user_psid: senderId, accountId: messengerAccount._id });
        if (!session) {
            console.log('No session found for user:', senderId);
            return;
        }

        const chatbot = await Chatbot.findById(session.chatbotId);
        if (!chatbot) {
            console.log('No chatbot found');
            return;
        }

        const currentNode = chatbot.flow_json.nodes.find((n: any) => n.id === session.current_node_id);
        console.log('Current node:', currentNode ? `${currentNode.id} (${currentNode.type})` : 'not found');
        
        // Handle card button postbacks
        if (currentNode && currentNode.type === 'cardNode' && payload.startsWith('CARD_BUTTON_')) {
            const buttonIndex = parseInt(payload.replace('CARD_BUTTON_', ''));
            const sourceHandleId = `button-${buttonIndex}`;
            
            console.log(`Card button ${buttonIndex} clicked, looking for handle: ${sourceHandleId}`);
            console.log('Current node buttons:', JSON.stringify(currentNode.data.buttons));
            
            let nextNode = findNextNode(chatbot.flow_json, currentNode.id, sourceHandleId);
            
            if (nextNode) {
                console.log(`Found next node: ${nextNode.id} (${nextNode.type})`);
                
                if (nextNode.type === 'loopNode') {
                    const targetNodeId = nextNode.data.targetNodeId;
                    if (targetNodeId) {
                        const targetNode = chatbot.flow_json.nodes.find((n: any) => n.id === targetNodeId);
                        if (targetNode) {
                            nextNode = targetNode;
                        }
                    }
                }
                
                await sendNodeMessage(senderId, nextNode, messengerAccount.accessToken);
                session.current_node_id = nextNode.id;
                await session.save();
                
                if (nextNode.type !== 'endNode') {
                    await autoContinueFlow(chatbot.flow_json, nextNode, senderId, session, messengerAccount.accessToken);
                }
            } else {
                console.log(`No next node found for handle: ${sourceHandleId}`);
                console.log('Available edges:', JSON.stringify(chatbot.flow_json.edges));
            }
            return;
        }

        // Handle quick reply postbacks
        if (payload && payload.startsWith('QUICK_REPLY_PAYLOAD_')) {
            const replyTitleFromPayload = payload.replace('QUICK_REPLY_PAYLOAD_', '').replace(/_/g, ' ');

            if (!currentNode || currentNode.type !== 'quickReplyNode') return;

            // Find the index of the clicked reply - use case-insensitive comparison
            const replyIndex = currentNode.data.replies.findIndex((r: any) => 
                r.title.toUpperCase() === replyTitleFromPayload.toUpperCase()
            );
            if (replyIndex === -1) {
                console.log(`Could not find reply index for title: ${replyTitleFromPayload}`);
                console.log(`Available replies:`, currentNode.data.replies.map((r: any) => r.title));
                return;
            }

            console.log(`Quick reply clicked: "${replyTitleFromPayload}" (index: ${replyIndex})`);
            const sourceHandleId = `handle-${replyIndex}`;
            console.log(`Looking for edge from node ${currentNode.id} with sourceHandle: ${sourceHandleId}`);
            
            // Find the next node connected to this specific handle
            let nextNode = findNextNode(chatbot.flow_json, currentNode.id, sourceHandleId);

            if (nextNode) {
                console.log(`Found next node: ${nextNode.id} (${nextNode.type})`);
                // Send the next node's message
                await sendNodeMessage(senderId, nextNode, messengerAccount.accessToken);
                session.current_node_id = nextNode.id;
                await session.save();

                // Continue the flow if the next node is a messageNode (not a quickReplyNode)
                while (nextNode && nextNode.type === 'messageNode') {
                    const followingNode = findNextNode(chatbot.flow_json, nextNode.id);
                    if (followingNode) {
                        await sendNodeMessage(senderId, followingNode, messengerAccount.accessToken);
                        session.current_node_id = followingNode.id;
                        await session.save();
                        nextNode = followingNode;
                    } else {
                        break; // End of flow
                    }
                }
            } else {
                console.log(`No next node found for edge from node ${currentNode.id} with sourceHandle ${sourceHandleId}.`);
                console.log(`Available edges:`, JSON.stringify(chatbot.flow_json.edges));
            }
        }
    } catch(error) {
        console.error("Error processing postback:", error);
    }
}

/**
 * Processes a quick reply event.
 */
async function processQuickReply(event: any) {
    try {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const payload = event.message.quick_reply.payload;

        console.log(`Quick reply received - Payload: ${payload}`);

        if (!payload || !payload.startsWith('QUICK_REPLY_PAYLOAD_')) return;

        const replyTitleFromPayload = payload.replace('QUICK_REPLY_PAYLOAD_', '').replace(/_/g, ' ');

        await connectToDatabase();

        const messengerAccount = await MessengerAccount.findOne({ accountId: recipientId });
        if (!messengerAccount) {
            console.log(`No messenger account found for recipient: ${recipientId}`);
            return;
        }

        const session = await UserSession.findOne({ user_psid: senderId, accountId: messengerAccount._id });
        if (!session) {
            console.log(`No session found for user: ${senderId}`);
            return;
        }

        const chatbot = await Chatbot.findById(session.chatbotId);
        if (!chatbot) {
            console.log(`No chatbot found for session`);
            return;
        }

        const currentNode = chatbot.flow_json.nodes.find((n: any) => n.id === session.current_node_id);
        if (!currentNode || currentNode.type !== 'quickReplyNode') {
            console.log(`Current node is not a quickReplyNode or not found: ${session.current_node_id}`);
            return;
        }

        // Find the index of the clicked reply - use case-insensitive comparison
        const replyIndex = currentNode.data.replies.findIndex((r: any) => 
            r.title.toUpperCase() === replyTitleFromPayload.toUpperCase()
        );
        if (replyIndex === -1) {
            console.log(`Could not find reply index for title: ${replyTitleFromPayload}`);
            console.log(`Available replies:`, currentNode.data.replies.map((r: any) => r.title));
            return;
        }

        console.log(`Quick reply clicked: "${replyTitleFromPayload}" (index: ${replyIndex})`);
        const sourceHandleId = `handle-${replyIndex}`;
        console.log(`Looking for edge from node ${currentNode.id} with sourceHandle: ${sourceHandleId}`);
        console.log(`All edges:`, JSON.stringify(chatbot.flow_json.edges, null, 2));
        
        // Find the next node connected to this specific handle
        let nextNode = findNextNode(chatbot.flow_json, currentNode.id, sourceHandleId);

        if (nextNode) {
            console.log(`Found next node: ${nextNode.id} (${nextNode.type})`);
            
            // Handle loop node
            if (nextNode.type === 'loopNode') {
                const targetNodeId = nextNode.data.targetNodeId;
                if (targetNodeId) {
                    const targetNode = chatbot.flow_json.nodes.find((n: any) => n.id === targetNodeId);
                    if (targetNode) {
                        console.log(`Loop node redirecting to node ${targetNodeId}`);
                        nextNode = targetNode;
                    } else {
                        console.log(`Loop target node ${targetNodeId} not found`);
                        return;
                    }
                } else {
                    console.log(`Loop node has no target configured`);
                    return;
                }
            }
            
            await sendNodeMessage(senderId, nextNode, messengerAccount.accessToken);
            session.current_node_id = nextNode.id;
            await session.save();

            if (nextNode.type === 'endNode') {
                console.log(`End node reached for user ${senderId}. Conversation ended.`);
                return;
            }

            // Auto-continue if waitForReply is false OR if it's a messageNode
            await autoContinueFlow(chatbot.flow_json, nextNode, senderId, session, messengerAccount.accessToken);
        } else {
            console.log(`No next node found for edge from node ${currentNode.id} with sourceHandle ${sourceHandleId}.`);
            console.log(`This quick reply option has no connected path. Conversation paused.`);
            // Send a fallback message
            await sendMessage(senderId, { 
                text: "Sorry, this option is not configured yet. Please try another option or send a new message." 
            }, messengerAccount.accessToken);
        }
    } catch(error) {
        console.error("Error processing quick reply:", error);
    }
}

/**
 * Processes an incoming message event.
 */
async function processMessage(event: any) {
  try {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;
    const messageText = event.message.text?.trim();

    await connectToDatabase();

    const messengerAccount = await MessengerAccount.findOne({ accountId: recipientId });
    if (!messengerAccount) return console.log(`No account for page ID: ${recipientId}`);

    const chatbot = await Chatbot.findOne({ 
      accountId: messengerAccount._id, 
      mode: { $in: ['active', 'test'] }  // Changed from isActive: true
    });
    if (!chatbot) return console.log(`No active bot for account: ${messengerAccount.accountName}`);

    // Handle test mode
    if (chatbot.mode === 'test') {
      const isTester = chatbot.testers.some((t: any) => t.user_psid === senderId);
      
      // Check if message matches test trigger
      if (messageText === chatbot.testTrigger) {
        // Add user as tester if not already
        if (!isTester) {
          await Chatbot.findByIdAndUpdate(chatbot._id, {
            $push: { testers: { user_psid: senderId, addedAt: new Date() } }
          });
          console.log(`Added tester: ${senderId} for chatbot ${chatbot._id}`);
        }
        // Start the flow for the tester
      } else if (!isTester) {
        // Not a tester and didn't send the trigger - ignore
        console.log(`Test mode: User ${senderId} not authorized, ignoring message`);
        return;
      }
      // If already a tester, continue with normal flow
    }

    let session = await UserSession.findOne({ user_psid: senderId, accountId: messengerAccount._id });
    const chatbotId = chatbot._id;
    
    let currentNodeId;
    if (!session || session.chatbotId?.toString() !== chatbotId.toString()) { // If no session or active bot has changed
      const startNode = chatbot.flow_json.nodes.find((node: any) => node.type === 'input');
      if (!startNode) return console.log("No 'start' node found in flow.");
      currentNodeId = startNode.id;
      
      session = await UserSession.findOneAndUpdate(
          { user_psid: senderId, accountId: messengerAccount._id },
          { current_node_id: currentNodeId, chatbotId },
          { new: true, upsert: true }
      );
    } else {
      currentNodeId = session.current_node_id;
    }

    const currentNode = chatbot.flow_json.nodes.find((n: any) => n.id === currentNodeId);
    if (currentNode && currentNode.type === 'quickReplyNode') return;

    const nextNode = findNextNode(chatbot.flow_json, currentNodeId);

    if (nextNode) {
      let nodeToSend = nextNode;
      
      // Handle loop node
      if (nextNode.type === 'loopNode') {
        const targetNodeId = nextNode.data.targetNodeId;
        if (targetNodeId) {
          const targetNode = chatbot.flow_json.nodes.find((n: any) => n.id === targetNodeId);
          if (targetNode) {
            console.log(`Loop node redirecting to node ${targetNodeId}`);
            nodeToSend = targetNode;
          } else {
            console.log(`Loop target node ${targetNodeId} not found`);
            return;
          }
        } else {
          console.log(`Loop node has no target configured`);
          return;
        }
      }
      
      await sendNodeMessage(senderId, nodeToSend, messengerAccount.accessToken);
      session.current_node_id = nodeToSend.id;
      await session.save();
      
      if (nodeToSend.type === 'endNode') {
        console.log(`End node reached for user ${senderId}. Conversation ended.`);
        return;
      }

      // Auto-continue if waitForReply is false
      await autoContinueFlow(chatbot.flow_json, nodeToSend, senderId, session, messengerAccount.accessToken);
    } else {
      console.log(`End of flow reached for user ${senderId} at node ${currentNodeId}`);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

/**
 * Finds the next node in the flow based on the current node ID and optional handle.
 */
function findNextNode(flow: any, currentNodeId: string, sourceHandle?: string) {
    const edge = flow.edges.find((e: any) => 
        e.source === currentNodeId && (sourceHandle ? e.sourceHandle === sourceHandle : !e.sourceHandle)
    );
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
  } else if (node.type === 'cardNode') {
    const element: any = {
      title: node.data.title,
    };
    
    if (node.data.subtitle) {
      element.subtitle = node.data.subtitle;
    }
    
    if (node.data.imageUrl) {
      element.image_url = node.data.imageUrl;
    }
    
    if (node.data.buttons && node.data.buttons.length > 0) {
      element.buttons = node.data.buttons.map((btn: any, index: number) => {
        if (btn.type === 'web_url') {
          return {
            type: 'web_url',
            url: btn.url,
            title: btn.title,
          };
        } else {
          return {
            type: 'postback',
            title: btn.title,
            payload: `CARD_BUTTON_${index}`,
          };
        }
      });
    }
    
    await sendMessage(psid, {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [element],
        },
      },
    }, accessToken);
  } else if (node.type === 'endNode') {
    if (node.data.sendMessage !== false && node.data.message) {
      await sendMessage(psid, { text: node.data.message }, accessToken);
    } else {
      console.log(`End node reached - no message sent (sendMessage: ${node.data.sendMessage})`);
    }
  } else if (node.type === 'loopNode') {
    console.log(`Loop node ${node.id} encountered - should not send message directly`);
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

/**
 * Auto-continues the flow when waitForReply is false.
 * Keeps sending messages until it hits a node that waits for reply or the end.
 */
async function autoContinueFlow(flow: any, currentNode: any, senderId: string, session: any, accessToken: string) {
    let node = currentNode;
    
    console.log(`Starting autoContinueFlow from node ${node.id}, type: ${node.type}`);
    
    while (node) {
        // For card nodes, check if they have only web_url buttons (no postback buttons)
        // If so, auto-continue through the default-output
        if (node.type === 'cardNode') {
            const hasPostbackButtons = node.data.buttons?.some((btn: any) => btn.type === 'postback');
            if (!hasPostbackButtons) {
                // No postback buttons, so auto-continue via default-output
                console.log(`Card node ${node.id} has no postback buttons, auto-continuing via default-output`);
                const nextNode = findNextNode(flow, node.id, 'default-output');
                if (nextNode) {
                    await sendNodeMessage(senderId, nextNode, accessToken);
                    session.current_node_id = nextNode.id;
                    await session.save();
                    node = nextNode;
                    continue;
                }
            }
            // Card has postback buttons, wait for user to click
            console.log(`Card node ${node.id} has postback buttons, waiting for user interaction`);
            break;
        }

        // Check if we should wait for reply (default to true if undefined)
        const shouldWait = node.data.waitForReply !== false;
        
        console.log(`Node ${node.id}: waitForReply=${node.data.waitForReply}, shouldWait=${shouldWait}`);
        
        // Stop if this node waits for reply, is a quick reply, or is an end node
        if (shouldWait || node.type === 'quickReplyNode' || node.type === 'endNode') {
            console.log(`Stopping auto-continue at node ${node.id} (shouldWait: ${shouldWait}, type: ${node.type})`);
            break;
        }

        // Find the next node
        const nextNode = findNextNode(flow, node.id);
        if (!nextNode) {
            console.log(`End of auto-continue flow at node ${node.id} - no next node found`);
            break;
        }

        // Handle loop nodes
        let nodeToSend = nextNode;
        if (nextNode.type === 'loopNode') {
            const targetNodeId = nextNode.data.targetNodeId;
            if (targetNodeId) {
                const targetNode = flow.nodes.find((n: any) => n.id === targetNodeId);
                if (targetNode) {
                    console.log(`Auto-continue: Loop node redirecting to node ${targetNodeId}`);
                    nodeToSend = targetNode;
                } else {
                    console.log(`Auto-continue: Loop target node ${targetNodeId} not found`);
                    break;
                }
            } else {
                console.log(`Auto-continue: Loop node has no target configured`);
                break;
            }
        }

        console.log(`Auto-continuing to node ${nodeToSend.id} (type: ${nodeToSend.type})`);
        
        // Send the message
        await sendNodeMessage(senderId, nodeToSend, accessToken);
        session.current_node_id = nodeToSend.id;
        await session.save();

        if (nodeToSend.type === 'endNode') {
            console.log(`Auto-continue: End node reached`);
            break;
        }

        node = nodeToSend;
    }
}