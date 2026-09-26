const crypto = require('crypto');
const s3 = require('./s3Client');

// Helper function to upload base64 image to S3 for teacher profile pictures
const uploadTeacherProfilePictureToS3 = async (base64Image, folder = 'teachers') => {
    try {
        // Extract base64 string after the comma
        const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        const imageType = matches[1]; // e.g., "png" or "jpeg"
        const imageData = matches[2]; // Actual base64 string

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(6).toString('hex');
        const fileName = `profile-${timestamp}-${randomString}.${imageType}`;
        const key = `${folder}/${fileName}`;

        // Decode base64 to buffer
        const buffer = Buffer.from(imageData, "base64");

        // Upload to S3
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: `image/${imageType}`
        };

        const result = await s3.upload(uploadParams).promise();

        return {
            url: result.Location,
            key: key,
            fileName: fileName,
            mimeType: `image/${imageType}`,
            size: buffer.length
        };
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

// Helper function to delete S3 file
const deleteTeacherProfilePictureFromS3 = async (fileKey) => {
    try {
        if (!fileKey) {
            return;
        }

        // Extract S3 key from URL if full URL is provided
        let s3Key = fileKey;
        if (fileKey.includes('amazonaws.com/')) {
            const urlParts = fileKey.split('amazonaws.com/');
            s3Key = urlParts.length > 1 ? urlParts[1] : fileKey;
        }

        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        };

        await s3.deleteObject(deleteParams).promise();
        return true;
    } catch (error) {
        console.error('Error deleting teacher profile picture from S3:', error);
        throw error;
    }
};

// Helper function to extract S3 key from URL
const extractS3KeyFromUrl = (url) => {
    if (!url || !url.includes('amazonaws.com/')) {
        return null;
    }
    const urlParts = url.split('amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : null;
};

module.exports = {
    uploadTeacherProfilePictureToS3,
    deleteTeacherProfilePictureFromS3,
    extractS3KeyFromUrl
};










