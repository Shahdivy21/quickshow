import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/Movie.js';
import Show from './models/Show.js';

dotenv.config();

const dbCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const lastShow = await Show.findOne().sort({ createdAt: -1 });
        if (lastShow) {
            console.log("Last Show Template:", {
                theater: lastShow.theater,
                showPrice: lastShow.showPrice
            });
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dbCheck();
