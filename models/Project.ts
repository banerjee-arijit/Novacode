import mongoose, { Schema, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    files: [{ type: Schema.Types.ObjectId, ref: "File" }],
  },
  { timestamps: true },
);

export const Project = models.Project || mongoose.model("Project", ProjectSchema);
