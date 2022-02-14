const AppError = require("../utils/appError");

const handleCastErrorDB = error => {
	const message = `Invalid ${error.path}: ${error.value}`;
	return new AppError(message, 400);
}

const handleDuplicateFieldDB = error => {
	const fieldName = Object.keys(error.keyValue)[0];
	const message = `Duplicate field value: ${fieldName}`;
	return new AppError(message, 400);
}

const handleValidationErrorDB = error => {
	const errors = Object.values(error.errors).map(el => el.message);
	const message = `Invalid Input data. ${errors.join('. ')}`;
	return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
		err: err,
		stack: err.stack
	});
}

const sendErrorProd = (err, res) => {
	// Operational, trusted erros: send message to the client;
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message
		});
	}
	// Programming or other unknown error: don't leak error details;
	else {
		// 1) Log error
		console.log('ERROR =', err);

		// 2) Send generic message;
		res.status(500).json({
			status: 'error',
			message: 'Something went wrong'
		});
	}
};

module.exports = (err, req, res, next) => {

	console.log(err.stack);
	
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development ') {
		sendErrorDev(err, res);
	}
	else if (process.env.NODE_ENV === 'production ') {
		let error = JSON.parse(JSON.stringify(err));

		if (error.name === 'CastError') error = handleCastErrorDB(error);
		else if (error.code === 11000) error = handleDuplicateFieldDB(error);
		else if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

		sendErrorProd(error, res);
	}
}