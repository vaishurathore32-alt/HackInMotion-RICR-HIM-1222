const nodemailer = require('nodemailer');

// 1. Create the transporter with your Gmail details
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'learnpath3@gmail.com',        // Your actual Gmail address
    pass: 'qtwrtgobqeaiwpjd'           // Your 16-character App Password
  }
});

// 2. Setup email options (send a test email to yourself)
const mailOptions = {
  from: 'learnpath3@gmail.com',
  to: 'akanshakumari1020@gmail.com',            // Send to your own inbox
  subject: 'SMTP Test Successful!',
  text: 'If you are reading this, your Gmail App Password configuration works perfectly.'
};

// 3. Send the test email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Failed to send email:');
    console.error(error.message);
  } else {
    console.log('✅ Success! Email sent successfully.');
    console.log('Message ID:', info.messageId);
  }
});