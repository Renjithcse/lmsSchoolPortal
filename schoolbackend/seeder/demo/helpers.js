/**
 * Demo-owned documents are tagged with `isDemo: true` at the Mongo layer
 * (not in Mongoose schemas) so wipe only removes seeder data.
 */

async function tagDemo(Model, id) {
	if (!id) return;
	await Model.collection.updateOne({ _id: id }, { $set: { isDemo: true } });
}

async function isTaggedDemo(Model, id) {
	if (!id) return false;
	const raw = await Model.collection.findOne({ _id: id }, { projection: { isDemo: 1 } });
	return Boolean(raw && raw.isDemo);
}

/**
 * Upsert by unique filter. Newly created docs are tagged isDemo.
 * Existing untagged docs are treated as real data: updated in place, not tagged.
 * Existing tagged docs stay tagged.
 */
async function upsertShared(Model, filter, data) {
	try {
		let doc = await Model.findOne(filter);
		if (doc) {
			Object.assign(doc, data);
			await doc.save();
			if (await isTaggedDemo(Model, doc._id)) {
				await tagDemo(Model, doc._id);
			}
			return doc;
		}
		doc = await Model.create(data);
		await tagDemo(Model, doc._id);
		return doc;
	} catch (err) {
		if (err && err.code === 11000) {
			const doc = await Model.findOne(filter);
			if (doc) return doc;
		}
		throw err;
	}
}

/** Always tag as demo (users, teachers, students, transactions, etc.). */
async function upsertDemo(Model, filter, data) {
	try {
		let doc = await Model.findOne(filter);
		if (doc) {
			Object.assign(doc, data);
			await doc.save();
			await tagDemo(Model, doc._id);
			return doc;
		}
		doc = await Model.create(data);
		await tagDemo(Model, doc._id);
		return doc;
	} catch (err) {
		if (err && err.code === 11000) {
			const doc = await Model.findOne(filter);
			if (doc) {
				await tagDemo(Model, doc._id);
				return doc;
			}
		}
		throw err;
	}
}

async function createDemo(Model, data) {
	const doc = await Model.create(data);
	await tagDemo(Model, doc._id);
	return doc;
}

function pad(n, width = 2) {
	return String(n).padStart(width, "0");
}

function atHour(date, h, m = 0) {
	const d = new Date(date);
	d.setHours(h, m, 0, 0);
	return d;
}

function addDays(date, days) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function recentWeekdays(count, from = new Date()) {
	const days = [];
	const cursor = new Date(from);
	cursor.setHours(12, 0, 0, 0);
	while (days.length < count) {
		const dow = cursor.getDay();
		if (dow !== 0 && dow !== 6) {
			days.push(new Date(cursor));
		}
		cursor.setDate(cursor.getDate() - 1);
	}
	return days.reverse();
}

function crud(subjects) {
	const actions = ["Read", "Create", "Edit", "Delete"];
	const permissions = [];
	for (const subject of subjects) {
		for (const action of actions) {
			permissions.push({ action, subject });
		}
	}
	return permissions;
}

module.exports = {
	tagDemo,
	isTaggedDemo,
	upsertShared,
	upsertDemo,
	createDemo,
	pad,
	atHour,
	addDays,
	recentWeekdays,
	crud,
};
