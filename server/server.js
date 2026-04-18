// server.js
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import movieRouter from './routes/movieRoutes.js';

import startBookingCleanupJob from './utils/bookingCleaner.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from './routes/reportRoutes.js';


const __dirname = path.resolve();
const app = express();
// app.set("trust proxy", 1); //---------- aa hali hancha pn me karela che 
const PORT = process.env.PORT || 3000; // 3000



// ------------------------------------------
// 2️⃣ NORMAL MIDDLEWARE
// ------------------------------------------
app.use(express.json()); // OK after webhook
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
); // me hadi kari che cors ni jagya pr
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://quickshow-client-rosy.vercel.app"
// ];

// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     credentials: true
// }));





// ------------------------------------------
// 3️⃣ CONNECT DATABASE
// ------------------------------------------
connectDB();

// ------------------------------------------
// 4️⃣ START AUTO BOOKING CLEANUP JOB
// ------------------------------------------
startBookingCleanupJob();

// ------------------------------------------
// 5️⃣ STATIC FILES
// ------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------------------------------
// 6️⃣ ROUTES
// ------------------------------------------
app.get("/", (_req, res) => res.send("Server Is Live - Welcome to QuickShow!"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shows", showRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/movies", movieRouter);
app.use("/api/payment", paymentRoutes);
app.use("/api/reports",reportRoutes)






// ------------------------------------------
// 7️⃣ START SERVER
// ------------------------------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
