const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_S3_SECRET_ACCESS_KEY,
    region:  process.env.AWS_S3_REGION,
    signatureVersion: 'v4',
    s3ForcePathStyle: false
});

module.exports = s3;
