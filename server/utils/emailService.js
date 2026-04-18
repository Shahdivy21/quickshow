import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"QuickShow" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      text: text || "",
      html: html || text || ""
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};

// ---------------------------
// 🎟️ Booking Confirmation Email
// ---------------------------
export const generateConfirmationEmail = ({
  userName,
  movieTitle,
  theater,
  showTime,
  seats,
  amount,
  currency
}) => {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1d4ed8; color: white; padding: 20px; text-align: center;">
        <h2>Booking Confirmed 🎉</h2>
      </div>
      <div style="padding: 30px;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your booking has been successfully confirmed! Here are your details:</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p><strong>Movie:</strong> ${movieTitle}</p>
        <p><strong>Theater:</strong> ${theater}</p>
        <p><strong>Show Time:</strong> ${showTime}</p>
        <p><strong>Seats:</strong> ${seats.join(", ")}</p>
        <p><strong>Total Paid:</strong> ${currency}${amount}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #555;">Thank you for booking with QuickShow. Enjoy your movie! 🎥</p>
        <p style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:5173" style="background-color: #1d4ed8; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none;">View Booking</a>
        </p>
      </div>
      <div style="background-color: #f3f4f6; color: #555; padding: 15px; text-align: center; font-size: 12px;">
        QuickShow &copy; 2025. All rights reserved.
      </div>
    </div>
  </div>
  `;
};

// ---------------------------
// ❌ Booking Cancellation Email (existing)
export const generateCancellationEmail = ({ userName, movieTitle, theater, showTime }) => {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1d4ed8; color: white; padding: 20px; text-align: center;">
        <h2>Booking Cancelled</h2>
      </div>
      <div style="padding: 30px;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>We wanted to inform you that your booking has been <strong>cancelled</strong> because payment was not completed within 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p><strong>Movie:</strong> ${movieTitle}</p>
        <p><strong>Theater:</strong> ${theater}</p>
        <p><strong>Show Time:</strong> ${showTime}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #555;">If you want to book tickets again, you can visit our website and make a new booking at any time.</p>
        <p style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:5173" style="background-color: #1d4ed8; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none;">Book Again</a>
        </p>
      </div>
      <div style="background-color: #f3f4f6; color: #555; padding: 15px; text-align: center; font-size: 12px;">
        QuickShow &copy; 2025. All rights reserved.
      </div>
    </div>
  </div>
  `;
};

// ---------------------------
// 💸 Booking Refund Email (new)
// ---------------------------
export const generateRefundEmail = ({ userName, movieTitle, theater, showTime, amount, currency }) => {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #e11d48; color: white; padding: 20px; text-align: center;">
        <h2>Booking Cancelled & Refund Initiated</h2>
      </div>
      <div style="padding: 30px;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>As requested, your booking has been cancelled. A refund of <strong>${currency}${amount}</strong> has been initiated to your original payment method.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p><strong>Movie:</strong> ${movieTitle}</p>
        <p><strong>Theater:</strong> ${theater}</p>
        <p><strong>Show Time:</strong> ${showTime}</p>
        <p><strong>Refund Amount:</strong> ${currency}${amount}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #555;">Please allow 5-7 business days for the refund to reflect in your account.</p>
        <p style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:5173/my-bookings" style="background-color: #e11d48; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none;">View My Bookings</a>
        </p>
      </div>
      <div style="background-color: #f3f4f6; color: #555; padding: 15px; text-align: center; font-size: 12px;">
        QuickShow &copy; 2026. All rights reserved.
      </div>
    </div>
  </div>
  `;
};
