const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
	expiresIn: process.env.JWT_EXPIRES_IN
});

const createSentToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
		httpOnly: true,
		sameSite: 'None',
		secure: true,
		path: '/'
	};

	if (process.env.NODE_ENV === 'production ') cookieOptions['secure'] = true;

	res.cookie('jwt', token, cookieOptions);

	// Remove password from the output
	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user
		}
	});
}

exports.signUp = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm
	});

	createSentToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	// 1) check if email and password exists;
	if (!email || !password) {
		return next(new AppError('email and password are required.', 400));
	}

	// 2) check if user exists and password is correct;
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Invalid email or password.'), 401);
	}

	// 3) if everything ok, send token to client;
	createSentToken(user, 200, res);
});

exports.logout = (req, res) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true
	});

	res.status(200).json({ status: 'success' });
}

exports.protect = catchAsync(async (req, res, next) => {
	// 1) Getting token and checking if it is there;
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}
	else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(new AppError('You are not logged in. Please login to get access.', 401));
	}

	// 2) Token verification;
	let decoded;
	decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3) Check if user still exists;
	if (decoded) {
		const currentUser = await User.findById(decoded.id);
		if (!currentUser) {
			return next(new AppError('The user belongs to the token does no longer exists.', 401));
		}

		// 4) Check if user changed password after the token was issued.
		if (await currentUser.passwordChangedAfter(decoded.iat)) {
			return next(new AppError('User recently changed password, please login again.', 401))
		}

		req.user = currentUser;
	}
	
	// Grant access to protected route;
	next();
});

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action.', 403))
		}

		next();
	}
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
	// 1) Get User based on Posted email;
	const user = await User.findOne({email: req.body.email});
	if (!user) {
		return next(new AppError('There is no user with the email address.', 404));
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
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	// 1) Get User based on token;
	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
	const user = await User.findOne({ 
		passwordResetToken: hashedToken, 
		passwordResetExpires: { $gt: Date.now() } 
	});

	// 2) If token is not expired and there is a user then set new password;
	if (!user) {
		return next(new AppError('Token is invalid or has expired.', 400));
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();
	// 3) Update passwordChangedAt property for the current user;

	// 4) Log the user in, send JWT;
	createSentToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
	// 1) Get User from collection
	const user = await User.findById({ _id: req.user._id }).select('+password');

	// 2) check if the given password is correct;
	if (!user || !(await user.correctPassword(req.body.passwordCurrent, user.password))) {
		return next(new AppError('Password is incorrect', 401));
	}

	// 3) If so, update password;
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();

	// 4) Log user in, send JWT
	createSentToken(user, 200, res);
});