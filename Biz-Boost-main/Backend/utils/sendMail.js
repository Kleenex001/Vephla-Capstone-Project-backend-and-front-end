const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, otp) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587, 
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Verify once when sending (optional)
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Error with email transporter:', error);
        } else {
            console.log('✅ Email transporter is ready!');
        }
    });

    // Send the email
    await transporter.sendMail({  
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html: `<h2>Your OTP is <strong>${otp}</strong></h2>`
    });
};

module.exports = sendEmail;
