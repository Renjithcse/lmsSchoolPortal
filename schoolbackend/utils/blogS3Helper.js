const crypto = require('crypto');
const s3 = require('./s3Client');

// Helper function to upload base64 image to S3 for blog posts
const uploadBlogImageToS3 = async (base64String, folder = 'blog') => {
    try {
        // Extract base64 string after the comma
        const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        const imageType = matches[1]; // e.g., "png" or "jpeg"
        const imageData = matches[2]; // Actual base64 string

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(6).toString('hex');
        const fileName = `blog-featured-${timestamp}-${randomString}.${imageType}`;
        const key = `${folder}/${fileName}`;

        // Decode base64 to buffer
        const buffer = Buffer.from(imageData, "base64");

        // Upload to S3
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: `image/${imageType}`
            // ACL removed - bucket should have public read policy instead
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
const deleteBlogS3File = async (fileKey) => {
    try {
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey
        };
        
        await s3.deleteObject(deleteParams).promise();
        return true;
    } catch (error) {
        throw new Error(`Failed to delete S3 file: ${error.message}`);
    }
};

// Helper function to extract S3 key from URL (for backward compatibility)
const extractS3KeyFromUrl = (url) => {
    if (!url || !url.includes('amazonaws.com/')) {
        return null;
    }
    const urlParts = url.split('amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : null;
};

module.exports = {
    uploadBlogImageToS3,
    deleteBlogS3File,
    extractS3KeyFromUrl
};




