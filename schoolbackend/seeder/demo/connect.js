const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const MONGO_CONNECT_OPTIONS = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
};

function loadEnv() {
	const envPath = path.join(__dirname, "..", "..", "config.env");
	if (fs.existsSync(envPath)) {
		require("dotenv").config({ path: envPath });
	} else {
		require("dotenv").config();
	}
}

function uriHasUserinfo(uri) {
	return /mongodb(\+srv)?:\/\/[^/@]+@/.test(uri || "");
}

function resolveMongoUri() {
	let uri = (process.env.MONGO_URI || "").trim();
	const user = (process.env.MONGO_USER || "").trim();
	const pass = process.env.MONGO_PASSWORD;
	const authSource = (process.env.MONGO_AUTH_SOURCE || "admin").trim();

	if (user && pass != null && pass !== "" && uri && !uriHasUserinfo(uri)) {
		const rest = uri.replace(/^mongodb(\+srv)?:\/\//, "");
		const scheme = uri.startsWith("mongodb+srv://") ? "mongodb+srv" : "mongodb";
		const joined = `${scheme}://${encodeURIComponent(user)}:${encodeURIComponent(
			pass
		)}@${rest}`;
		uri = /[?&]authSource=/i.test(joined)
			? joined
			: `${joined}${joined.includes("?") ? "&" : "?"}authSource=${encodeURIComponent(
					authSource
			  )}`;
	}

	return uri;
}

function isAuthError(err) {
	const msg = String((err && (err.message || err)) || "");
	const code = err && (err.codeName || err.code);
	return (
		code === "Unauthorized" ||
		code === 13 ||
		code === 18 ||
		code === "AuthenticationFailed" ||
		/requires authentication/i.test(msg) ||
		/not authorized/i.test(msg) ||
		/authentication failed/i.test(msg)
	);
}

async function connectMongo() {
	const mongoUri = resolveMongoUri();
	if (!mongoUri) {
		console.error(
			"MONGO_URI is not set. Add it to config.env or the process environment and try again."
		);
		process.exit(1);
	}

	if (!uriHasUserinfo(mongoUri)) {
		console.warn(
			"Warning: MONGO_URI has no username/password. If MongoDB auth is enabled, queries will fail."
		);
	}

	const conn = await mongoose.connect(mongoUri, MONGO_CONNECT_OPTIONS);
	console.log(`MongoDB connected: ${conn.connection.host}`);
	return conn;
}

async function disconnectMongo() {
	try {
		await mongoose.disconnect();
	} catch (_) {
		/* ignore */
	}
}

module.exports = {
	loadEnv,
	resolveMongoUri,
	isAuthError,
	connectMongo,
	disconnectMongo,
};
