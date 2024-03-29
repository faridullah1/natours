const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
	name: {
		type: String,
		required: [true, 'name is required.']
	},
	email: {
		type: String,
		required: [true, 'email is required.'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide valid email']
	},
	photo: {
		type: String,
		default: 'default.jpg'
	},
	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user'
	},
	password: {
		type: String,
		required: [true, 'password is required.'],
		minlength: 8,
		select: false
	},
	passwordConfirm: {
		type: String,
		required: [true, 'please confirm your password.'],
		validate: {
			// This will only works on SAVE!
			validator: function(el) {
				return el === this.password;
			},

			message: 'Passwords are not the same!'
		}
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
});

userSchema.pre('save', async function(next) {
	// Only run this function if the password is actually modified.
	if (!this.isModified('password')) return next();

	// Hash the password with cost of 12.
	this.password = await bcrypt.hash(this.password, 12);

	// Delete password confirm field.
	this.passwordConfirm = undefined;
	next();
});

userSchema.pre('save', function(next) {
	if (!this.isModified('password') || this.isNew) return next();

	// We subtracted 1sec, so that passwordChangedAt value should always be greater than token creation time;
	this.passwordChangedAt = Date.now() - 1000;

	next();
});

// QUERY MIDDLEWHERE
userSchema.pre(/^find/, function(next) {
	this.find({ active: { $ne: false } });
	next();
});

userSchema.methods.correctPassword = async function (condidatePassword, userPassword) {
	return await bcrypt.compare(condidatePassword, userPassword);
}

userSchema.methods.passwordChangedAfter = async function(JWTTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return JWTTimestamp < changedTimestamp;
	}

	return false;
}

userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;