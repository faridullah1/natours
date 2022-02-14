const mongoose = require('mongoose');
const slugify = require('slugify');

const schema = {
	name: {
		type: String,
		required: [true, 'name is required.'],
		unique: true,
		trim: true,
		maxlength: [40, 'A tour name can be of maximum 40 characters'],
		minlength: [10, 'A tour name must be of minimum 10 characters']
	},
	duration: {
		type: Number,
		required: [true, 'duration is required.']
	},
	maxGroupSize: {
		type: Number,
		required: [true, 'group size is required.']
	},
	difficulty: {
		type: String,
		required: [true, 'difficulty is required.'],
		enum: {
			values: ['easy', 'medium', 'difficult'],
			message: 'Difficulty be either: easy, medium or difficult'
		}
	},
	price: {
		type: Number,
		required: [true, 'price is required.']
	},
	priceDiscount: {
		type: Number,
		validate: {
			validator: function(val) {
				return val < this.price
			},
			message: 'Discount price ({VALUE}) should be below regular price'
		}
	},
	ratingsAverage: {
		type: Number,
		default: 4.0,
		min: [1, 'Rating must be above 1.0'],
		max: [5, 'Rating must be below 5.0']
	},
	ratingsQuantity: {
		type: Number,
		default: 0
	},
	rating: {
		type: Number,
		default: 4
	},
	summary: {
		type: String,
		trim: true,
		required: [true, 'summary is required.']
	},
	description: {
		type: String,
		trim: true
	},
	imageCover: {
		type: String,
		required: [true, 'cover image is required.']
	},
	images: [String],
	createdAt: {
		type: Date,
		default: Date.now()
	},
	secretTour: {
		type: Boolean,
		default: false
	},
	startDates: [Date],
	startLocation: {
		// GeoJSON
		type: {
			type: String,
			default: 'Point',
			enum: ['Point']
		},
		coordinates: [Number],
		address: String,
		description: String
	},
	locations: [
		{
			type: {
				type: String,
				default: 'Point',
				enum: ['Point']
			},
			coordinates: [Number],
			address: String,
			description: String,
			day: Number
		}
	],
	guides: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		}
	],
	slug: String
};

const tourSchema = mongoose.Schema(schema, {
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.pre('save', function(next) {
	this.slug = slugify(this.name, { lower: true });

	next();
});

tourSchema.virtual('durationWeeks').get(function() {
	return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id'
});

// tourSchema.pre('save', async function(next) {
// 	const guidesPromises = this.guides.map( async id => await User.findById(id));
// 	this.guides = await Promise.all(guidesPromises);

// 	next();
// });

tourSchema.pre(/^find/, function(next) {
	this.find({secretTour: { $ne: true }});
	
	next();
});

tourSchema.pre(/^find/, function(next) {
	this.populate({
		path: 'guides',
		select: '-__v, -passwordChangedAt'
	});

	next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour; 