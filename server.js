process.on('uncaughtException', err => {
	console.log('UNCAUGHT EXCEPTION, Shutting down');
	console.log(err.name, err.message);

	process.exit(1);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({path: './config.env'});

const app = require('./app');

mongoose.connect(process.env.DATABASE).then(() => {
	console.log('DB connection successfull.');
}).catch(err => {
	console.log(err.name, err.message);
	process.exit(1);
});;

// const LOCAL_DB = process.env.DATABASE_LOCAL;
// mongoose.connect(LOCAL_DB).then(() => {
// 	console.log('DB connection successfull.');
// }).catch(err => {
// 	console.log(err.name, err.message);
// 	process.exit(1);
// });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	console.log(`App is listening on port ${port}`);
});

process.on('unhandledRejection', err => {
	console.log('UNHANDLED REJECTION, Shutting down');
	console.log(err.name, err.message);

	server.close( () => {
		process.exit(1);
	});
});

process.on('SIGTERM', () => {
	console.log('SIGTERM RECEIVED, Shutting down gracefully!');
	server.close( () => {
		console.log('Process terminated!');
	});
})