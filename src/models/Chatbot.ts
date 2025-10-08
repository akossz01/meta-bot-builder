import mongoose, { Schema, Document, Types } from "mongoose";

const defaultFlow = {
  nodes: [
    {
      id: "1",
      type: "input",
      data: { label: "Start" },
      position: { x: 250, y: 5 },
    },
    {
      id: "2",
      type: "messageNode", // Our custom node
      data: { message: "Hello! Thanks for your message. How can I help you today?" },
      position: { x: 250, y: 125 },
    },
  ],
  edges: [
    {
      id: "e1-2",
      source: "1",
      target: "2",
    },
  ],
};

export interface IChatbot extends Document {
  name: string;
  accountId: Types.ObjectId;
  flow_json: object;
  userId: Types.ObjectId;
  isActive: boolean;
}

const ChatbotSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "MessengerAccount",
      required: true,
    },
    flow_json: {
      type: Object,
      default: defaultFlow,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can't have multiple chatbots with the same name for the same account
ChatbotSchema.index({ userId: 1, accountId: 1, name: 1 }, { unique: true });

export default mongoose.models.Chatbot ||
  mongoose.model<IChatbot>("Chatbot", ChatbotSchema);