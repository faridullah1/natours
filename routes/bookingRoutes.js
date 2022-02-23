const express = require('express');

const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);
// router.get('/my-tours', authController.protect, bookingController.getMyBookedTours);

module.exports = router;