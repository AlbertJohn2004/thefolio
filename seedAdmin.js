require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
connectDB().then(async () => {
const exists = await User.findOne({ email: 'admin@thefolio.com' });
if (exists) {
console.log('Admin account already exists.');
process.exit();
}
await User.create({
name: 'TheFolio Admin',
email: 'admin@thefolio.com',
password: 'Admin@1234',
role: 'admin',
});
console.log('Admin account created successfully!');
console.log('Email: admin@thefolio.com');
console.log('Password: Admin@1234');
process.exit();
});