//* Uncaught Exception *********************************************
process.on("uncaughtException", (err) => {
	console.log("Uncaught Exception! Shutting down...");
	console.error("Error:", err);
	process.exit(1);
});

//* Import modules **********************************************
require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");
const seedCountries = require("./seeder/seeder"); // adjust path as needed
const app = require("./app");

//* DB Connection **************************************************
console.log("Attempting to connect to MongoDB...");
console.log("MongoDB URI:", process.env.MONGO_URI ? "Set" : "Not set");

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverSelectionTimeoutMS: 5000, // 5s timeout
		socketTimeoutMS: 45000,
	})
	.then(async (conn) => {
		console.log(`MongoDB connected: ${conn.connection.host}`);
		// Seed only if needed
		if (process.env.SEED_COUNTRIES === "true") {
			await seedCountries();
			console.log("Seeder finished!");
		}
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err.message);
		console.error("Full error:", err);
		process.exit(1);
	});

//* Start server ***************************************************
// Production image bakes SchoolPortalAdmin/build; app.js serves SPA + API.
const port = process.env.PORT || 5000;
const server = app.listen(port, "0.0.0.0", () => {
	console.log(`Server started listening at port ${port}`);
	console.log(`API ready at: http://localhost:${port}/api`);
});

//* Unhandled Rejection ********************************************
process.on("unhandledRejection", (err) => {
	console.log("Unhandled Rejection! Shutting down...");
	console.error("Error:", err);
	server.close(() => process.exit(1));
});
