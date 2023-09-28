import express from 'express';
import { buySubscription, cancelSubcription, getAllPayments, getRazorpayApiKey, verifySubscription } from '../controllers/payment.controller.js';
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const router=express.Router();

router.route('/razorpay-key').get(isLoggedIn, getRazorpayApiKey);

router.route('/subcribe').post(isLoggedIn, buySubscription);

router.route('/verify').post(isLoggedIn, verifySubscription);

router.route('/unsubscribe').post(isLoggedIn, cancelSubcription);

router.route('/').get(isLoggedIn, authorizedRoles('ADMIN'), getAllPayments);


export default router;
