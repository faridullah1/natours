const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');


dotenv.config({path: './config.env'});

const LOCAL_DB = process.env.DATABASE_LOCAL;
mongoose.connect(LOCAL_DB).then(() => {
	console.log('DB connection successfull.');
});

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'));


// Import data into database;
const importData = async () => {
	try {
		await Tour.create(tours);
		await User.create(users, { validateBeforeSave: false });
		await Review.create(reviews);

		console.log('Data successfully loaded.');
	}
	catch(err) {
		console.log(err);
	}

	process.exit();
}

// Delete all data from Collection
// Import data into database;
const deleteAllData = async () => {
	try {
		await Tour.deleteMany();
		await User.deleteMany();
		await Review.deleteMany();

		console.log('All Data successfully deleted.');
	}
	catch(err) {
		console.log(err);
	}

	process.exit();
}

if (process.argv[2] === '--import') {
	importData();
}
else if (process.argv[2] === '--delete') {
	deleteAllData();
}