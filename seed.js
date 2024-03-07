const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./Models/admin.schema');

dotenv.config();

mongoose.connect(process.env.MONGODB_UR);

const adminsData = [
    {
        firstName: 'Admin1',
        lastName: 'User',
        email: 'admin1@example.com',
        password: 'adminpassword1',
        role: 'admin',
    },
    {
        firstName: 'Admin2',
        lastName: 'User',
        email: 'admin1@example.com',
        password: 'adminpassword2',
        role: 'admin',
    },
    {
        firstName: 'Admin3',
        lastName: 'User',
        email: 'admin1@example.com',
        password: 'adminpassword3',
        role: 'admin',
    },
    {
        firstName: 'Admin4',
        lastName: 'User',
        email: 'admin1@example.com',
        password: 'adminpassword4',
        role: 'admin',
    },
    {
        firstName: 'Admin5',
        lastName: 'User',
        email: 'admin1@example.com',
        password: 'adminpassword5',
        role: 'admin',
    },
];
const seedAdmins = async () => {
    try {
        for (const adminData of adminsData) {
            const newAdmin = new Admin(adminData);
            await newAdmin.save();
          }
          console.log('Admins seeded successfully');
    }catch (err) {
        console.error('Error seeding admins:', err.message);
    }
    finally {
        // Close the database connection
        mongoose.connection.close();
      }
    };
    
    // Call the seedAdmins function to start seeding
    seedAdmins();