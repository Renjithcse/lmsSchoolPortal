const fs = require('fs');
const path = require('path');

/**
 * Uploads a base64 file and saves it to the specified directory.
 * @param {string} base64Data - The base64 string including metadata (e.g., "data:image/png;base64,...").
 * @param {string} folder - The subfolder where the file should be stored (e.g., "uploads").
 * @param {string} filePrefix - A prefix for the filename (e.g., "assignment_").
 * @returns {string|null} - Returns the file path if successful, otherwise null.
 */
const uploadBase64File = (base64Data, folder = 'uploads', filePrefix = 'file_') => {
    try {
        console.log('uploadBase64File called with:', { folder, filePrefix });
        
        if (!base64Data.includes(';base64,')) {
            console.error('Invalid Base64 format - missing ;base64,');
            throw new Error('Invalid Base64 format');
        }

        // Extract file extension from base64 metadata
        const match = base64Data.match(/^data:(.+);base64,/);
        if (!match) {
            console.error('Invalid Base64 metadata - no match found');
            throw new Error('Invalid Base64 metadata');
        }

        const mimeType = match[1]; // Get MIME type (e.g., "image/png")
        console.log('MIME type:', mimeType);
        
        const fileExtension = getFileExtension(mimeType);
        if (!fileExtension) {
            console.error('Unsupported file type:', mimeType);
            throw new Error('Unsupported file type');
        }

        console.log('File extension:', fileExtension);

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', folder.replace('uploads/', ''));
        console.log('Upload directory:', uploadDir);
        console.log('Current directory (__dirname):', __dirname);
        console.log('Directory exists:', fs.existsSync(uploadDir));
        
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Directory created successfully');
        }

        // Generate unique filename
        const fileName = `${filePrefix}${Date.now()}.${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        console.log('File path:', filePath);

        // Decode Base64 and save the file
        const fileContent = base64Data.split(';base64,').pop();
        console.log('File content length:', fileContent.length);
        
        fs.writeFileSync(filePath, fileContent, { encoding: 'base64' });
        console.log('File saved successfully at:', filePath);

        return filePath; // Return the file path

    } catch (error) {
        console.error('File upload error:', error.message);
        console.error('Error stack:', error.stack);
        return null;
    }
};

/**
 * Maps MIME types to file extensions.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {string|null} - Returns file extension if supported, otherwise null.
 */
const getFileExtension = (mimeType) => {
    const mimeMap = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };
    return mimeMap[mimeType] || null;
};

module.exports = uploadBase64File;
