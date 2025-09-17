// utils/sendMail.js
const nodemailer = require('nodemailer');

const sendMail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, 
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Optional: verify connection
  transporter.verify((error) => {
    if (error) {
      console.error('Error with email transporter:', error);
    } else {
      console.log('Email transporter is ready!');
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html: `<h2>${text}</h2>`,
  });
};

module.exports = sendMail;
