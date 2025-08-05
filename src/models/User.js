// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    userName: { type: String, required: true, unique: true },
    emailVerification:{type:Boolean,default:false},
    phoneVerification:{type:Boolean,default:false},
    personalInfo:{type:Boolean,default:false},
    email: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    userCountry: { type: String, default: 'in' },
    isNotifyEmail: { type: Boolean, default: true },
    phone: { type: String },
    password: { type: String },
    termsAndCondition: { type: Boolean },
    resetToken: { type: String },
    expireToken: { type: Date },
    customerId: { type: String },
    bannerSettings: { type: [Object] },
    countryCode: { type: String },
    phoneCountry: { type: String },
    two_FA: [
    {
        isEnabled: {
        type: Boolean,
        default: false,
        },
        two_FA_by: {
        type: String,
        },
    },
    ],
    isPromoUsedDetails : {type:Boolean,default:false},
    status:{type: String}
});

module.exports.UserSchema = mongoose.model("User", UserSchema);

