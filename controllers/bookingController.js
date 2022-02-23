const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');


exports.getCheckoutSession = async (req, res, next) => {
	// 1) Get the currently booked tour;
	const tour = await Tour.findById(req.params.tourId);

	// 2) Create checkout session
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
		cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour._id}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		line_items: [
			{ 
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
				amount: tour.price * 100,
				currency: 'usd',
				quantity: 1,
			}
		]
	});

	// 3) Create session as response
	res.status(200).json({
		status: 'success',
		session
	});
};

exports.createBookingCheckout = catchAsync(async(req, res, next) => {
	const { tour, user, price } = req.params;

	if (!tour || !user || !price) return next();

	await Booking.create({user, tour, price});

	next();
});

exports.getMyBookedTours1 = catchAsync(async(req, res, next) => {
	// 1) Find all bookings
	const bookings = await Booking.find({ user: req.user.id });
  
	// 2) Find tours with the returned IDs
	const tourIDs = bookings.map(el => el.tour);
	const tours = await Tour.find({ _id: { $in: tourIDs } });
  
	res.status(200).json({
		status: 'success',
		tours
	});
});