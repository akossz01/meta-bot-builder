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

// Helper function to generate random test trigger
function generateTestTrigger() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export interface IChatbot extends Document {
  name: string;
  accountId: Types.ObjectId;
  flow_json: object;
  userId: Types.ObjectId;
  mode: 'active' | 'test' | 'inactive';
  testTrigger: string;
  testers: Array<{
    user_psid: string;
    addedAt: Date;
  }>;
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
    mode: {
      type: String,
      enum: ['active', 'test', 'inactive'],
      default: 'inactive',
      select: true,
    },
    testTrigger: {
      type: String,
      default: generateTestTrigger,
      select: true,
    },
    testers: [{
      user_psid: {
        type: String,
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      }
    }]
  },
  {
    timestamps: true,
  }
);

// Virtual property for backwards compatibility
ChatbotSchema.virtual('isActive').get(function() {
  return this.mode === 'active' || this.mode === 'test';
});

// Ensure virtuals are included in JSON
ChatbotSchema.set('toJSON', { virtuals: true });
ChatbotSchema.set('toObject', { virtuals: true });

// Create a compound index
ChatbotSchema.index({ userId: 1, accountId: 1, name: 1 }, { unique: true });

export default mongoose.models.Chatbot ||
  mongoose.model<IChatbot>("Chatbot", ChatbotSchema);