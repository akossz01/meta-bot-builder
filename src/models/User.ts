import mongoose, { Schema, Document } from "mongoose";

// Interface to define the User document structure
export interface IUser extends Document {
  email: string;
  password?: string; // It's optional because we might have users from social logins
  stripe_customer_id?: string;
  subscription_status: "active" | "inactive" | "trialing";
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    stripe_customer_id: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    subscription_status: {
      type: String,
      enum: ["active", "inactive", "trialing"],
      default: "inactive",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// To prevent model recompilation in development
export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);