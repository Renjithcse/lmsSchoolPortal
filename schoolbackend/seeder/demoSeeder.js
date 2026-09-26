/**
 * Demo data seeder for the legacy Express + Mongo LMS (schoolbackend).
 *
 * Idempotent: re-running upserts by unique keys (email, codes, names) and
 * tags owned documents with `isDemo: true` so they can be removed safely.
 *
 * From schoolbackend root:
 *   yarn seed:demo
 *   npm run seed:demo
 *   node seeder/demoSeeder.js
 *
 * Wipe only demo-tagged / demo-prefixed rows (does NOT drop real admin or
 * untagged production documents):
 *   node seeder/demoSeeder.js --delete
 *   node seeder/demoSeeder.js --wipe-demo
 *   npm run seed:demo:delete
 *
 * Docker (compose injects MONGO_URI; config.env may be absent in the image):
 *   docker exec lmsold-app node seeder/demoSeeder.js
 *   docker exec lmsold-app node seeder/demoSeeder.js --delete
 *
 * Login passwords printed at the end. Admin defaults match adminSeeder
 * (admin@school.local / Admin@123) unless ADMIN_* env vars are set.
 * Demo teacher/student password is Demo@123.
 */
const { loadEnv, connectMongo, disconnectMongo, isAuthError } = require("./demo/connect");
const { wipeDemo } = require("./demo/wipe");
const { seedAll, DEMO_PASSWORD, TEACHER_DEFS, STUDENT_DEFS } = require("./demo/seedModules");

loadEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@school.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "9876543210";

function wantsWipe() {
	return process.argv.slice(2).some((a) => a === "--delete" || a === "--wipe-demo");
}

function printLogins() {
	const firstStudent = STUDENT_DEFS[0];
	const studentEmail = `demo-student${String(firstStudent.n).padStart(2, "0")}@school.local`;
	console.log("\n========== Demo logins ==========");
	console.log("Admin (super user, same as seed:admin):");
	console.log(`  ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
	console.log("Extra staff (admin role):");
	console.log(`  demo-staff@school.local  /  ${DEMO_PASSWORD}`);
	console.log("Teachers (User.role = user):");
	for (const t of TEACHER_DEFS) {
		console.log(`  ${t.email}  /  ${DEMO_PASSWORD}   (${t.name} — ${t.designation})`);
	}
	console.log("Students (User.role = student), e.g.:");
	console.log(`  ${studentEmail}  /  ${DEMO_PASSWORD}   (${firstStudent.name})`);
	console.log(`  demo-student02@school.local  /  ${DEMO_PASSWORD}   (${STUDENT_DEFS[1].name})`);
	console.log("  … through demo-student16@school.local");
	console.log("=================================\n");
}

async function main() {
	await connectMongo();

	if (wantsWipe()) {
		await wipeDemo({ adminEmail: ADMIN_EMAIL });
		await disconnectMongo();
		process.exit(0);
		return;
	}

	console.log("Seeding demo data (idempotent upserts)...\n");
	const ctx = {
		adminEmail: ADMIN_EMAIL,
		adminPassword: ADMIN_PASSWORD,
		adminName: ADMIN_NAME,
		adminPhone: ADMIN_PHONE,
	};
	await seedAll(ctx);
	printLogins();
	console.log("Demo seed completed.");
	await disconnectMongo();
	process.exit(0);
}

main().catch(async (err) => {
	console.error("Demo seeder failed:", err.message || err);
	if (err && err.stack) console.error(err.stack);
	if (isAuthError(err)) {
		console.error(
			"Hint: MongoDB requires authentication. Set MONGO_URI with credentials and authSource, e.g.\n" +
				"  MONGO_URI=mongodb://USER:PASS@127.0.0.1:27017/dbname?authSource=admin\n" +
				"Or set MONGO_USER + MONGO_PASSWORD (+ optional MONGO_AUTH_SOURCE) alongside a host-only MONGO_URI."
		);
	}
	await disconnectMongo();
	process.exit(1);
});
