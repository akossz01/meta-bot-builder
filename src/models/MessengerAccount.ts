import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessengerAccount extends Document {
  userId: Types.ObjectId;
  accountId: string; // This will be the Facebook Page ID
  accountType: "messenger" | "whatsapp";
  accountName: string;
  accessToken: string; // This will be the encrypted Page Access Token
}

const MessengerAccountSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountId: {
      type: String,
      required: true,
      unique: true,
    },
    accountType: {
      type: String,
      enum: ["messenger", "whatsapp"],
      default: "messenger",
    },
    accountName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.MessengerAccount ||
  mongoose.model<IMessengerAccount>("MessengerAccount", MessengerAccountSchema);