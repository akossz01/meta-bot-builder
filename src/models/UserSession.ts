import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserSession extends Document {
  user_psid: string; // Page-Scoped ID for Messenger user
  accountId: Types.ObjectId; // Link to the MessengerAccount (_id)
  current_node_id: string; // The ID of the last node sent to the user
  chat_state: object; // For storing variables, context, etc. (optional for now)
}

const UserSessionSchema: Schema = new Schema(
  {
    user_psid: {
      type: String,
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "MessengerAccount",
      required: true,
    },
    current_node_id: {
      type: String,
      required: true,
    },
    chat_state: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// A user can only have one session per page
UserSessionSchema.index({ user_psid: 1, accountId: 1 }, { unique: true });

export default mongoose.models.UserSession ||
  mongoose.model<IUserSession>("UserSession", UserSessionSchema);