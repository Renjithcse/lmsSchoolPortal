/**
 * Admin credential seeder for local / bootstrap login.
 *
 * Run from schoolbackend root:
 *   yarn seed:admin
 *   npm run seed:admin
 *   node seeder/adminSeeder.js
 *
 * Optional env (in config.env or shell):
 *   ADMIN_EMAIL      (default: admin@school.local)
 *   ADMIN_PASSWORD   (default: Admin@123)
 *   ADMIN_NAME       (default: Admin)
 *   ADMIN_PHONE      (default: 9876543210)
 *
 * Mongo: uses the same config.env + MONGO_URI as server.js.
 * If Mongo requires auth, URI must include userinfo and usually authSource, e.g.
 *   MONGO_URI=mongodb://USER:PASS@127.0.0.1:27017/dbname?authSource=admin
 * Optional parts: MONGO_USER, MONGO_PASSWORD, MONGO_AUTH_SOURCE (composed into URI when set).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "config.env") });

const mongoose = require("mongoose");
const User = require("../models/userModel");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@school.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "9876543210";

/** Same connect options as server.js */
const MONGO_CONNECT_OPTIONS = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
};

function uriHasUserinfo(uri) {
	return /mongodb(\+srv)?:\/\/[^/@]+@/.test(uri || "");
}

/**
 * Resolve MONGO_URI the same way as the app, optionally composing
 * credentials from MONGO_USER / MONGO_PASSWORD / MONGO_AUTH_SOURCE.
 */
function resolveMongoUri() {
	let uri = (process.env.MONGO_URI || "").trim();
	const user = (process.env.MONGO_USER || "").trim();
	const pass = process.env.MONGO_PASSWORD;
	const authSource = (process.env.MONGO_AUTH_SOURCE || "admin").trim();

	if (user && pass != null && pass !== "" && uri && !uriHasUserinfo(uri)) {
		const rest = uri.replace(/^mongodb(\+srv)?:\/\//, "");
		const scheme = uri.startsWith("mongodb+srv://") ? "mongodb+srv" : "mongodb";
		const joined = `${scheme}://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${rest}`;
		uri = /[?&]authSource=/i.test(joined)
			? joined
			: `${joined}${joined.includes("?") ? "&" : "?"}authSource=${encodeURIComponent(authSource)}`;
	}

	return uri;
}

function isAuthError(err) {
	const msg = String(err && (err.message || err) || "");
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

async function seedAdmin() {
	const mongoUri = resolveMongoUri();
	if (!mongoUri) {
		console.error("MONGO_URI is not set. Add it to config.env and try again.");
		process.exit(1);
	}

	if (!uriHasUserinfo(mongoUri)) {
		console.warn(
			"Warning: MONGO_URI has no username/password. If MongoDB auth is enabled, queries will fail."
		);
	}

	const conn = await mongoose.connect(mongoUri, MONGO_CONNECT_OPTIONS);
	console.log(`MongoDB connected: ${conn.connection.host}`);

	const email = ADMIN_EMAIL.toLowerCase().trim();
	let user = await User.findOne({ email });
	let created = false;

	if (user) {
		user.name = ADMIN_NAME;
		user.phone = ADMIN_PHONE;
		user.role = "admin";
		user.active = true;
		user.emailVerified = true;
		user.password = ADMIN_PASSWORD;
		user.passwordConfirm = ADMIN_PASSWORD;
		user.refreshTokens = [];
		await user.save();
		console.log(`Admin user updated: ${email}`);
	} else {
		user = await User.create({
			name: ADMIN_NAME,
			email,
			phone: ADMIN_PHONE,
			password: ADMIN_PASSWORD,
			passwordConfirm: ADMIN_PASSWORD,
			role: "admin",
			emailVerified: true,
			active: true,
		});
		created = true;
		console.log(`Admin user created: ${email}`);
	}

	const usingDefaults =
		!process.env.ADMIN_EMAIL &&
		!process.env.ADMIN_PASSWORD &&
		!process.env.ADMIN_NAME;

	console.log(`Role: ${user.role}`);
	if (usingDefaults || process.env.NODE_ENV !== "production") {
		console.log(
			`Login with email "${email}"` +
				(process.env.ADMIN_PASSWORD
					? " and your ADMIN_PASSWORD."
					: ` and password "${ADMIN_PASSWORD}" (default — change after login).`)
		);
	} else {
		console.log("Admin password was set from ADMIN_PASSWORD (not logged).");
	}

	await mongoose.disconnect();
	console.log(created ? "Admin seed completed (created)." : "Admin seed completed (upserted).");
	process.exit(0);
}

seedAdmin().catch(async (err) => {
	console.error("Admin seeder failed:", err.message || err);
	if (isAuthError(err)) {
		console.error(
			"Hint: MongoDB requires authentication. Set MONGO_URI with credentials and authSource, e.g.\n" +
				"  MONGO_URI=mongodb://USER:PASS@127.0.0.1:27017/dbname?authSource=admin\n" +
				"Or set MONGO_USER + MONGO_PASSWORD (+ optional MONGO_AUTH_SOURCE) alongside a host-only MONGO_URI.\n" +
				"Match credentials to your Mongo setup (e.g. Docker MONGO_INITDB_ROOT_*)."
		);
	}
	try {
		await mongoose.disconnect();
	} catch (_) {
		/* ignore */
	}
	process.exit(1);
});
