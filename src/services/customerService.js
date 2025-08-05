// src/services/customerService.js
const Customer = require('../models/Customer');

exports.createCustomer = async (data) => {
    const customer = new Customer(data);
    return await customer.save();
};

exports.getAllCustomers = async () => {
    return await Customer.find();
};

exports.getCustomerById = async (id) => {
    return await Customer.findById(id);
};

exports.updateCustomer = async (id, data) => {
    return await Customer.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteCustomer = async (id) => {
    return await Customer.findByIdAndDelete(id);
};
