// src/jobs/cronJobs.js
const cron = require('node-cron');
const Customer = require('../models/Customer');

const sendReminderEmails = async () => {
    const customers = await Customer.find();
    // Logic to send emails to customers
    console.log('Reminder emails sent to customers');
};

exports.start = () => {
    cron.schedule('0 0 * * *', sendReminderEmails); // Every day at midnight
    console.log('Cron jobs started');
};
