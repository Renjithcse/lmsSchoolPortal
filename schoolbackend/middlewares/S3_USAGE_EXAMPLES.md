# AWS S3 Upload Middleware Usage Examples

## Environment Variables Required

Add these to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## S3 Bucket Setup

### 1. Create S3 Bucket
1. Go to AWS S3 Console
2. Create a new bucket
3. Choose your region
4. **Important**: Disable "Block all public access" if you want public read access

### 2. Bucket Policy for Public Read Access

If you want files to be publicly accessible, add this bucket policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

### 3. CORS Configuration (if uploading from browser)

Add this CORS configuration to your bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Installation

Make sure you have the required dependencies:

```bash
yarn add aws-sdk multer
```

## Basic Usage Examples

### 1. Single File Upload

```javascript
const { uploadSingle } = require('../middlewares/s3UploadMiddleware');

// Basic single file upload with default field name 'file'
router.post('/upload-file', 
  uploadSingle('uploads'), // uploads is the S3 folder
  (req, res) => {
    res.json({
      status: 'success',
      file: req.uploadedFile // Contains { url, key, originalName, size, mimetype }
    });
  }
);

// Single file upload with custom field name
router.post('/upload-avatar', 
  uploadSingle('avatars', 'avatar'), // folder: 'avatars', field name: 'avatar'
  (req, res) => {
    res.json({
      status: 'success',
      avatar: req.uploadedFile
    });
  }
);
```

### 2. Multiple Files Upload

```javascript
const { uploadMultiple } = require('../middlewares/s3UploadMiddleware');

// Multiple files upload with default settings
router.post('/upload-multiple', 
  uploadMultiple('uploads'), // folder: 'uploads', field name: 'files', maxFiles: 10
  (req, res) => {
    res.json({
      status: 'success',
      files: req.uploadedFiles // Array of file objects
    });
  }
);

// Multiple files upload with custom settings
router.post('/upload-gallery', 
  uploadMultiple('gallery', 'images', 5), // folder: 'gallery', field name: 'images', maxFiles: 5
  (req, res) => {
    res.json({
      status: 'success',
      images: req.uploadedFiles
    });
  }
);
```

### 3. School Management System Examples

#### Student Photo Upload
```javascript
router.patch('/students/:id/photo', 
  uploadSingle('student-photos', 'photo'),
  updateStudentPhoto
);
```

#### Assignment Documents Upload
```javascript
router.post('/assignments/:id/documents',
  uploadMultiple('assignments', 'documents', 5),
  uploadAssignmentDocuments
);
```

#### Subject Notes Upload
```javascript
router.post('/subject-notes',
  uploadMultiple('subject-notes', 'files'),
  createSubjectNotes
);
```

#### Library Book Cover Upload
```javascript
router.post('/library/books/cover',
  uploadSingle('book-covers', 'cover'),
  uploadBookCover
);
```

#### Information Module Attachments
```javascript
router.post('/information/attachments',
  uploadMultiple('information', 'attachments', 3),
  uploadInformationAttachments
);
```

## Advanced Usage

### 1. Delete Files from S3

```javascript
const { deleteS3File } = require('../middlewares/s3UploadMiddleware');

// In your controller
const deleteFile = async (req, res) => {
  try {
    const { fileKey } = req.params;
    await deleteS3File(fileKey);
    res.json({
      status: 'success',
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

### 2. Generate Pre-signed URLs (for private files)

```javascript
const { generatePresignedUrl } = require('../middlewares/s3UploadMiddleware');

// Generate URL that expires in 1 hour
const getPrivateFile = (req, res) => {
  try {
    const { fileKey } = req.params;
    const privateUrl = generatePresignedUrl(fileKey, 3600);
    res.json({
      status: 'success',
      url: privateUrl
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

### 3. Get File Information

```javascript
const { getS3FileInfo } = require('../middlewares/s3UploadMiddleware');

const getFileInfo = async (req, res) => {
  try {
    const { fileKey } = req.params;
    const fileInfo = await getS3FileInfo(fileKey);
    res.json({
      status: 'success',
      fileInfo
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

## Frontend Integration Examples

### React/JavaScript Frontend

```javascript
// Single file upload
const uploadFile = async (file, folder = 'uploads') => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload-file', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.file.url;
};

// Multiple files upload
const uploadFiles = async (files, folder = 'uploads') => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch('/api/upload-multiple', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.files.map(file => file.url);
};

// Avatar upload with custom field name
const uploadAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);
  
  const response = await fetch('/api/upload-avatar', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.avatar.url;
};
```

## File Structure in S3

```
your-s3-bucket/
├── student-photos/
│   ├── student-1234567890-abc123.jpeg
│   └── student-1234567891-def456.jpeg
├── assignments/
│   ├── assignment-1234567890-ghi789.pdf
│   └── homework-1234567891-jkl012.docx
├── subject-notes/
│   ├── notes-1234567890-mno345.pdf
│   └── lecture-1234567891-pqr678.pptx
├── book-covers/
│   ├── cover-1234567890-stu901.jpeg
│   └── cover-1234567891-vwx234.jpeg
├── information/
│   ├── announcement-1234567890-yza567.pdf
│   └── notice-1234567891-bcd890.jpg
├── avatars/
│   ├── avatar-1234567890-efg123.jpeg
│   └── avatar-1234567891-hij456.png
├── gallery/
│   ├── image-1234567890-klm789.jpeg
│   └── image-1234567891-nop012.jpeg
└── uploads/
    ├── document-1234567890-qrs345.pdf
    └── file-1234567891-tuv678.txt
```

## Error Handling

The middleware includes built-in error handling for:
- Invalid file types
- File size limits
- S3 upload failures
- Missing AWS credentials
- No file uploaded

## File Size Limits

- **Images**: 5MB limit
- **Documents**: 20MB limit

## Supported File Types

### Images
- JPEG, JPG, PNG, GIF, WebP

### Documents
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV

## Response Structure

### Single File Upload Response
```javascript
req.uploadedFile = {
  url: "https://your-bucket.s3.amazonaws.com/uploads/filename.jpg",
  key: "uploads/filename.jpg", // S3 key for deletion
  originalName: "original-filename.jpg",
  size: 12345, // bytes
  mimetype: "image/jpeg"
}
```

### Multiple Files Upload Response
```javascript
req.uploadedFiles = [
  {
    url: "https://your-bucket.s3.amazonaws.com/uploads/file1.jpg",
    key: "uploads/file1.jpg",
    originalName: "original-file1.jpg",
    size: 12345,
    mimetype: "image/jpeg"
  },
  {
    url: "https://your-bucket.s3.amazonaws.com/uploads/file2.pdf",
    key: "uploads/file2.pdf",
    originalName: "original-file2.pdf",
    size: 67890,
    mimetype: "application/pdf"
  }
]
```

## Security Features

- File type validation
- File size limits
- Unique filename generation (prevents conflicts)
- Public read access (via bucket policy)
- Pre-signed URLs for private files
- Error handling for all edge cases

## Troubleshooting

### Common Issues

#### 1. "The bucket does not allow ACLs" Error
**Solution**: Remove ACL settings and use bucket policy instead (already fixed in the middleware)

#### 2. "Access Denied" Error
**Solutions**:
- Check your AWS credentials
- Verify bucket name and region
- Ensure your IAM user has S3 permissions:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      }
    ]
  }
  ```

#### 3. Files Not Publicly Accessible
**Solution**: Add the bucket policy mentioned in the setup section

#### 4. CORS Errors (when uploading from browser)
**Solution**: Add CORS configuration to your S3 bucket

#### 5. "Invalid file type" Error
**Solution**: Check that your file type is in the allowed list (images: jpeg, jpg, png, gif, webp; documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv)

## Integration with Existing Controllers

```javascript
// Example controller using the uploaded file
const updateStudentPhoto = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { photo: req.uploadedFile.url },
      { new: true }
    );
    
    res.json({
      status: 'success',
      data: {
        student
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```
