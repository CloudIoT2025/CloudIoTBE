const express = require('express');
const router = express.Router();
const controller = require('../controllers/fitbitController');

router.get('/', controller.showLoginPage);
router.get('/login', controller.redirectToFitbit);
router.get('/callback', controller.handleCallback);

module.exports = router;