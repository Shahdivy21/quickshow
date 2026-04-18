import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/Movie.js';
import Show from './models/Show.js';

dotenv.config();

const showTimes = ["10:30", "13:30", "16:30", "20:30"];
const DEFAULT_THEATER = "CINEPOLIS";
const DEFAULT_PRICE = 350;

const populate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("🚀 DB Connected. Starting population...");

        const movies = await Movie.find({});
        console.log(`🎬 Found ${movies.length} movies.`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalAdded = 0;

        for (const movie of movies) {
            console.log(`🔍 Processing: ${movie.title}`);
            const showsToCreate = [];

            for (let i = 0; i < 10; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                const dateString = currentDate.toISOString().split('T')[0];

                for (const time of showTimes) {
                    const [hours, minutes] = time.split(':');
                    const showDateTime = new Date(currentDate);
                    showDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    // Check if show already exists for this movie, date, and time
                    const existing = await Show.findOne({
                        movie: movie._id,
                        showDateTime: showDateTime
                    });

                    if (!existing) {
                        showsToCreate.push({
                            movie: movie._id,
                            theater: DEFAULT_THEATER,
                            showDateTime: showDateTime,
                            showPrice: DEFAULT_PRICE,
                            occupiedSeats: {}
                        });
                    }
                }
            }

            if (showsToCreate.length > 0) {
                await Show.insertMany(showsToCreate);
                totalAdded += showsToCreate.length;
                console.log(`✅ Added ${showsToCreate.length} shows for ${movie.title}`);
            } else {
                console.log(`ℹ️ Already has shows for the next 10 days for ${movie.title}`);
            }
        }

        console.log(`\n🎉 Population Complete! Total shows added: ${totalAdded}`);
        process.exit();
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
};

populate();
