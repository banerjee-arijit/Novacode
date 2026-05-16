import mongoose, { Schema, models } from "mongoose";

const FileSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true },
    language: { type: String, enum: ["javascript", "typescript", "python", "html", "css", "java", "plaintext"], required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true },
);

export const FileModel = models.File || mongoose.model("File", FileSchema);
