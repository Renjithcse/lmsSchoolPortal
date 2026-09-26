# Library Management Module

This module provides comprehensive library management functionality for the school system, including rack management, book cataloging, and book issue/return operations.

## Features

### 1. Rack Management
- Create and manage library racks with specified number of rows
- Track rack utilization and statistics
- Soft delete functionality to prevent data loss

### 2. Book Management
- Complete book cataloging with ISBN, title, author, publisher, etc.
- Rack positioning system (rack, row, position)
- Book status tracking (available, issued, lost, damaged, reserved)
- Book condition tracking (excellent, good, fair, poor)
- Search and filter functionality
- Available position finder

### 3. Book Issue/Return System
- Issue books to students and teachers
- Return books by ISBN or student ID
- Book renewal functionality
- Fine calculation for overdue books
- Fine payment tracking

### 4. Library Settings
- Configurable book limits for students and teachers
- Customizable issue duration
- Maximum renewal limits
- Fine calculation settings

## API Endpoints

### Rack Management
```
GET    /api/v1/library/racks              - Get all racks
POST   /api/v1/library/racks              - Create new rack
GET    /api/v1/library/racks/:id          - Get rack by ID
PUT    /api/v1/library/racks/:id          - Update rack
DELETE /api/v1/library/racks/:id          - Delete rack
GET    /api/v1/library/racks/:id/stats    - Get rack statistics
```

### Book Management
```
GET    /api/v1/library/books              - Get all books (with pagination & filters)
POST   /api/v1/library/books              - Add new book
GET    /api/v1/library/books/:id          - Get book by ID
PUT    /api/v1/library/books/:id          - Update book
DELETE /api/v1/library/books/:id          - Delete book
GET    /api/v1/library/books/isbn/:isbn   - Get book by ISBN
GET    /api/v1/library/books/positions/available - Get available positions
GET    /api/v1/library/books/stats/overview - Get book statistics
```

### Book Issue Management
```
POST   /api/v1/library/issues/issue       - Issue a book
POST   /api/v1/library/issues/return      - Return a book
PATCH  /api/v1/library/issues/:id/renew   - Renew a book
PATCH  /api/v1/library/issues/:id/pay-fine - Pay fine
GET    /api/v1/library/issues             - Get all issues (with filters)
GET    /api/v1/library/issues/:id         - Get issue by ID
GET    /api/v1/library/issues/user/:type/:id - Get user's issued books
GET    /api/v1/library/issues/overdue/list - Get overdue books
GET    /api/v1/library/issues/stats/overview - Get library statistics
```

## Models

### Settings Model (Updated)
```javascript
{
  academicYear: ObjectId,
  term: String,
  librarySettings: {
    maxBooksForStudent: Number,    // Default: 3
    maxBooksForTeacher: Number,    // Default: 5
    bookIssueDuration: Number,     // Default: 14 days
    maxRenewals: Number           // Default: 2
  }
}
```

### Rack Model
```javascript
{
  rackNumber: String,           // Required, unique
  description: String,
  numberOfRows: Number,         // Required, min: 1
  isActive: Boolean,            // Default: true
  academicYear: ObjectId        // Required
}
```

### Book Model
```javascript
{
  isbn: String,                 // Required, unique
  title: String,                // Required
  author: String,               // Required
  publisher: String,
  publicationYear: Number,
  edition: String,
  category: String,             // Required
  subject: String,
  language: String,             // Default: 'English'
  pages: Number,
  price: Number,
  rack: ObjectId,               // Required
  row: Number,                  // Required, min: 1
  position: Number,             // Required, min: 1
  status: String,               // Enum: available, issued, lost, damaged, reserved
  condition: String,            // Enum: excellent, good, fair, poor
  description: String,
  coverImage: String,
  academicYear: ObjectId,       // Required
  isActive: Boolean             // Default: true
}
```

### BookIssue Model
```javascript
{
  book: ObjectId,               // Required
  issuedTo: ObjectId,           // Required
  issuedToModel: String,        // Required, enum: Student, Teacher
  issuedBy: ObjectId,           // Required
  issueDate: Date,              // Default: now
  dueDate: Date,                // Required
  returnDate: Date,
  returnedTo: ObjectId,
  status: String,               // Enum: issued, returned, overdue, lost
  renewalCount: Number,         // Default: 0
  lastRenewalDate: Date,
  fineAmount: Number,           // Default: 0
  finePaid: Boolean,            // Default: false
  finePaidDate: Date,
  issueNotes: String,
  returnNotes: String,
  academicYear: ObjectId        // Required
}
```

## Usage Examples

### Creating a Rack
```javascript
POST /api/v1/library/racks
{
  "rackNumber": "R001",
  "description": "Fiction Section",
  "numberOfRows": 5,
  "academicYear": "academicYearId"
}
```

### Adding a Book
```javascript
POST /api/v1/library/books
{
  "isbn": "978-0-7475-3269-9",
  "title": "Harry Potter and the Philosopher's Stone",
  "author": "J.K. Rowling",
  "publisher": "Bloomsbury",
  "publicationYear": 1997,
  "category": "Fiction",
  "subject": "Fantasy",
  "rack": "rackId",
  "row": 1,
  "position": 5,
  "academicYear": "academicYearId"
}
```

### Issuing a Book
```javascript
POST /api/v1/library/issues/issue
{
  "bookId": "bookId",
  "issuedTo": "studentId",
  "issuedToModel": "Student",
  "issueNotes": "For English class assignment"
}
```

### Returning a Book
```javascript
POST /api/v1/library/issues/return
{
  "isbn": "978-0-7475-3269-9",
  "returnNotes": "Book returned in good condition"
}
```

## Permissions Required

The following permissions are required for different operations:

- **Rack Management**: Create, Read, Edit, Delete permissions for "Rack"
- **Book Management**: Create, Read, Edit, Delete permissions for "Book"
- **Book Issue Management**: Create, Read, Edit permissions for "BookIssue"

## Error Handling

The module includes comprehensive error handling for:
- Duplicate ISBN numbers
- Occupied rack positions
- Book availability checks
- User book limits
- Renewal limits
- Invalid rack/row combinations

## Statistics and Reporting

The module provides various statistics:
- Rack utilization rates
- Book status distribution
- Overdue book tracking
- Fine collection reports
- User borrowing patterns

## Integration

This module integrates with:
- User management system (Students and Teachers)
- Academic year management
- Settings management
- Authentication and authorization system
