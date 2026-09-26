//* Uncaught Exception *********************************************
process.on("uncaughtException", (err) => {
	console.log("Uncaught Exception! Shutting down...");
	console.error("Error:", err);
	process.exit(1);
});

//* Import modules **********************************************
const fs = require("fs");
const path = require("path");

// Env precedence (Docker / production):
// 1) process.env from Compose `env_file: .env` / `environment` always wins
// 2) Local/dev only: load schoolbackend/config.env when MONGO_URI is unset
// Never use override:true — compose values must not be clobbered by config.env.
// config.env is dockerignored; if an old image still has it, skip when MONGO_URI is set.
const configEnvPath = path.join(__dirname, "config.env");
const mongoAlreadySet = Boolean(
	process.env.MONGO_URI && String(process.env.MONGO_URI).trim()
);
if (!mongoAlreadySet && fs.existsSync(configEnvPath)) {
	require("dotenv").config({ path: configEnvPath, override: false });
} else if (mongoAlreadySet) {
	console.log("MONGO_URI already set by environment; skipping config.env");
}

const mongoose = require("mongoose");
const seedCountries = require("./seeder/seeder"); // adjust path as needed
const app = require("./app");

//* DB Connection **************************************************
function mongoHostForLog(uri) {
	if (!uri) return "(unset)";
	try {
		const normalized = String(uri).replace(/^mongodb(\+srv)?:\/\//i, "http://");
		return new URL(normalized).hostname || "(unknown)";
	} catch {
		return "(unparseable)";
	}
}

function assertMongoUriSafeInContainer(uri) {
	const inDocker = fs.existsSync("/.dockerenv");
	if (!inDocker && process.env.NODE_ENV !== "production") return;
	const host = mongoHostForLog(uri);
	if (host === "127.0.0.1" || host === "localhost" || host === "::1") {
		console.error(
			`Refusing MONGO_URI host "${host}" inside Docker/production. ` +
				"Use hostname `mongodb` on network lmsold_net (or host.docker.internal / Atlas). " +
				"Set MONGO_URI in lmsold/.env and recreate the container — do not use config.env in the image."
		);
		process.exit(1);
	}
}

console.log("Attempting to connect to MongoDB...");
console.log("MongoDB URI:", process.env.MONGO_URI ? "Set" : "Not set");
console.log("MongoDB host:", mongoHostForLog(process.env.MONGO_URI));
assertMongoUriSafeInContainer(process.env.MONGO_URI);

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
