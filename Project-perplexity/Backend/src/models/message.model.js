import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		chatId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		role: {
			type: String,
			enum: ["user", "assistant"],
			required: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		sources: [
			{
				title: {
					type: String,
					trim: true,
				},
				url: {
					type: String,
					trim: true,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;
