const { promisify } = require('util');

const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
	expiresIn: process.env.JWT_EXPIRES_IN
});

exports.signUp = catchAsync(async (req, res, next) => {
	const newUser = await User.create(req.body);

	const token = signToken(newUser._id);

	res.status(201).json({
		status: 'success',
		token,
		data: {
			user: newUser
		}
	});
});

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	// 1) check if email and password exists;
	if (!email && !password) {
		return res.status(400).json({
			status: 'fail',
			message: 'email and password is required.'
		});
	}

	// 2) check if user exists and password is correct;
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return res.status(401).json({
			status: 'fail',
			message: 'Invalid email or password.'
		});
	}

	// 3) if everything ok, send token to client;
	const token = signToken(user._id);
	res.status(200).json({
		status: 'success', 
		token
	});
}

exports.protect = async (req, res, next) => {
	// 1) Getting token and checking if it is there;
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return res.status(401).json({
			status: 'fail',
			message: 'You are not logged in. Please login to get access.'
		});
	}

	// 2) Token verification;
	let decoded;
	try {
		decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
	}
	catch (error) {
		return res.status(401).json({
			status: 'fail',
			message: error
		})
	}

	// 3) Check if user still exists;
	if (decoded) {
		const currentUser = await User.findById(decoded.id);
		if (!currentUser) {
			return res.status(401).json({
				status: 'fail',
				message: 'The user belongs to the token does no longer exists.'
			});
		}

		// 4) Check if user changed password after the token was issued.
		if (await currentUser.passwordChangedAfter(decoded.iat)) {
			return res.status(401).json({
				status: 'fail',
				message: 'User recently changed password, please login again.'
			});
		}

		req.user = currentUser;
	}
	
	// Grant access to protected route;
	next();
}

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				status: 'fail',
				message: 'You do not have permission to perform this action.'
			});
		}

		next();
	}
}

exports.forgotPassword = async (req, res, next) => {
	// 1) Get User based on Posted email;
	const user = await User.findOne({email: req.body.email});
	if (!user) {
		res.status(404).json({
			status: 'fail',
			message: 'There is no user with the email address.'
		});
	}

	// 2) Generate random reset token;
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	// 3) Send it to user's email
	const resetURL = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;
	const message = `Forgot your password? Submit a PATCH request with your new password and 
		passwordConfirm to: ${resetURL}.\nIf you did't forgot password then you can ignore this email.`;

	try {
		await sendEmail({
			to: user.email,
			subject: 'Your password reset token (valid for 10 min).',
			message
		});
	
		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!'
		});
	}
	catch (error) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		res.status(500).json({
			status: 'fail',
			message: 'There was an error sending email. Try again later.'
		});
	}
};

exports.resetPassword = (req, res, next) => {};