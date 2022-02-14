const User = require('../models/userModel');
const factory = require('./handlerFactory');


exports.createUser = (req, res) => {
	res.status(500).json({
		status: 'fail',
		message: 'This route is not defined! Please use /signup instead.'
	});
};

exports.getMe = (req, res, next) => {
	req.params.id = req.user.id;
	next();
}

exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Do not update password with this;
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);