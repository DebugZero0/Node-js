import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true, minlength: 6 },
		verified: { type: Boolean, default: false, required: true },
		refreshToken: { type: String, default: null },
		githubAccessToken: { type: String, default: null, select: false },
		githubUsername: { type: String, default: null },
		githubConnectedAt: { type: Date, default: null },
		expiresAt: {
			type: Date,
			default: null,
		},

		messageCount: { type: Number, default: 0 },
		messageLimit: { type: Number, default: 20 },
		storageLimit: { type: Number, default: 10 * 1024 * 1024 }, // 10MB default
	},
	{ timestamps: true }
);

userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


userSchema.pre("save", async function () {
	if (!this.isModified("password")) {
		return;
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

export default userModel;