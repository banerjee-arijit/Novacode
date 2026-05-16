import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const User = models.User || mongoose.model("User", UserSchema);
