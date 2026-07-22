import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true, minlength: 6 },
		verified: { type: Boolean, default: false, required: true },
		refreshToken: { type: String, default: null },

		// auto-purge unverified signups after 24h; cleared once verified
		expiresAt: {
			type: Date,
			default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
		},

		// used by the message rate limiter below
		messageCount: { type: Number, default: 0 },
		messageLimit: { type: Number, default: 20 },
	},
	{ timestamps: true }
);

userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash the password before saving the user
userSchema.pre("save", async function () {
	if (!this.isModified("password")) {
		return;
	}

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	} catch (error) {
		next(error);
	}
});
// Method to compare candidate password with the stored hashed password
userSchema.methods.comparePassword = function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

export default userModel;
