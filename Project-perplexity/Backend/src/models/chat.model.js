import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: {
			type: String,
			trim: true,
			default: "New chat",
		},
		summary: {
			type: String,
			trim: true,
			default: "",
		},
		projectId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
			default: null,
		},
		messageIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
			},
		],
	},
	{
		timestamps: true,
	}
);

const chatModel = mongoose.model("Chat", chatSchema);

export default chatModel;
