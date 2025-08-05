// src/services/authService.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

exports.login = async ({ username, password }) => {
    const user = await User.findOne({ username });
    if (!user || !(await user.isValidPassword(password))) {
        throw new Error('Invalid username or password');
    }
    const token = jwt.sign({ id: user._id }, config.jwtSecret);
    return token;
};
