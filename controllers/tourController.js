const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	}
	else {
		cb(new AppError('Not an image!, please upload only images', 400), false);
	}
}

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
	{ name: 'imageCover', maxCount: 1 },
	{ name: 'images', maxCount: 3 } 
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
	if (!req.files.imageCover || !req.files.images) return next();

	// Cover Image
	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
		.resize(2000, 1333)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.body.imageCover}`);

	// Images
	req.body.images = [];
	await Promise.all(req.files.images.map(async (file, i) => 
	{
		const fileName =  `tour-${req.params.id}-${Date.now()}-${ i + 1 }.jpeg`;
		await sharp(file.buffer)
			.resize(2000, 1333)
			.toFormat('jpeg')
			.jpeg({ quality: 90 })
			.toFile(`public/img/users/${fileName}`);

		req.body.images.push(fileName);
	}));

	next();
})

exports.aliasTopTours = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

	next();
}

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);