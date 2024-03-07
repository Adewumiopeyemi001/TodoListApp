const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        default: "Admin",
        enu: [ "Admin", "Super Admin"],
        
    }
}, 
{
    versionKey: false,
    timestamps: true,
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;