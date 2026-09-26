const crypto = require('crypto');
const s3 = require('./s3Client');

const uploadEventGalleryImageToS3 = async (base64Image, folder = 'event-gallery') => {
	const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
	const buffer = Buffer.from(base64Data, 'base64');
	const fileExtension = base64Image.substring('data:image/'.length, base64Image.indexOf(';base64'));
	const fileName = `${folder}/${crypto.randomBytes(16).toString('hex')}-${Date.now()}.${fileExtension}`;

	const uploadParams = {
		Bucket: process.env.AWS_S3_BUCKET,
		Key: fileName,
		Body: buffer,
		ContentType: `image/${fileExtension}`,
	};

	const data = await s3.upload(uploadParams).promise();
	return { url: data.Location, key: data.Key };
};

const deleteEventGalleryS3File = async (s3Key) => {
	const deleteParams = {
		Bucket: process.env.AWS_S3_BUCKET,
		Key: s3Key,
	};
	await s3.deleteObject(deleteParams).promise();
};

const extractS3KeyFromUrl = (url) => {
	if (!url || !url.includes('amazonaws.com/')) {
		return null;
	}
	const urlParts = url.split('amazonaws.com/');
	return urlParts.length > 1 ? urlParts[1] : null;
};

module.exports = {
	uploadEventGalleryImageToS3,
	deleteEventGalleryS3File,
	extractS3KeyFromUrl,
};
