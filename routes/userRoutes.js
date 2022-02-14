const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);

router.route('/')
	.get(userController.getUsers)
	.post(userController.createUser);
	
router.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser);

module.exports = router;