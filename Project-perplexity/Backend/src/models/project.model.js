import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
    {
        filePath: { type: String, required: true },
        content: { type: String, required: true },
        embedding: { type: [Number], required: true },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        githubUrl: { type: String, required: true, trim: true },
        branch: { type: String, default: "" },
        status: {
            type: String,
            enum: ["indexing", "ready", "failed"],
            default: "indexing",
        },
        fileCount: { type: Number, default: 0 },
        chunkCount: { type: Number, default: 0 },
        error: { type: String, default: "" },
        chunks: { type: [chunkSchema], default: [] },
    },
    { timestamps: true }
);

const projectModel = mongoose.model("Project", projectSchema);
export default projectModel;