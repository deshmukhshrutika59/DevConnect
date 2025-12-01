// const mongoose = require('mongoose');
import mongoose from "mongoose";

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async ({ maxRetries = 5, initialDelay = 1000 } = {}) => {
	let attempt = 0;
	let delay = initialDelay;

	while (attempt <= maxRetries) {
		try {
			await mongoose.connect(process.env.MONGO_URI);
			console.log('MongoDB connected');
			return;
		} catch (err) {
			attempt += 1;
			console.error(`MongoDB connection attempt ${attempt} failed:`);
			console.error(err && err.message ? err.message : err);

			if (attempt > maxRetries) {
				console.error(`Exceeded max MongoDB connection attempts (${maxRetries}). Exiting.`);
				process.exit(1);
			}

			console.log(`Retrying in ${delay}ms...`);
			// wait then increase backoff
			// eslint-disable-next-line no-await-in-loop
			await wait(delay);
			delay *= 2;
		}
	}
};

export default connectDB;