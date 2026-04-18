import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/Movie.js';
import Show from './models/Show.js';

dotenv.config();

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");
        
        const movieCount = await Movie.countDocuments();
        const showCount = await Show.countDocuments();
        const movies = await Movie.find({}, 'title _id');
        
        console.log(`Movies: ${movieCount}`);
        console.log(`Shows: ${showCount}`);
        console.log("Movie List:", movies.map(m => m.title));
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dbConnect();
