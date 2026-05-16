import mongoose, { Schema, models } from "mongoose";

const MessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ChatHistorySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    fileId: { type: Schema.Types.ObjectId, ref: "File", required: true, index: true },
    messages: [MessageSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ChatHistory = models.ChatHistory || mongoose.model("ChatHistory", ChatHistorySchema);
