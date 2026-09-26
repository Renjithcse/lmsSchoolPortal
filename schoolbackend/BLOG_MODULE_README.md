# Blog Management Module

A comprehensive blog management system for the School Management System with role-based permissions and content moderation.

## 🚀 Features

### Role-Based Permissions

#### **Admins**
- ✅ Create, edit, and delete any blog post
- ✅ Approve/reject posts from teachers and students
- ✅ Publish posts directly
- ✅ Manage comments (approve/reject)
- ✅ View all posts and statistics
- ✅ Feature/unfeature posts

#### **Teachers**
- ✅ Create educational and activity posts
- ✅ Edit their own posts
- ✅ Submit posts for admin approval
- ✅ View published posts and their own drafts
- ✅ Auto-approved comments on published posts

#### **Students**
- ✅ Submit articles for review (school magazine section)
- ✅ Edit their own posts before submission
- ✅ View published posts and their own submissions
- ✅ Comment on published posts (requires approval)

### Content Management

#### **Post Features**
- ✅ Rich text content with HTML support
- ✅ SEO optimization (title, description, slug)
- ✅ Categories and tags
- ✅ Featured images
- ✅ Excerpt generation
- ✅ Reading time estimation
- ✅ View count tracking
- ✅ Like/unlike functionality
- ✅ Status management (draft, submitted, approved, published, rejected)

#### **Comment System**
- ✅ Nested comments (replies)
- ✅ Comment moderation
- ✅ Like/unlike comments
- ✅ Auto-approval for admins and teachers
- ✅ Comment editing with edit history

#### **Content Categories**
- ✅ Academic
- ✅ Activities
- ✅ News
- ✅ Events
- ✅ Student Life
- ✅ Sports
- ✅ Technology
- ✅ Other

## 📊 Database Models

### Post Model
```javascript
{
  title: String (required, max 200 chars),
  slug: String (auto-generated, unique),
  content: String (required),
  excerpt: String (max 300 chars),
  author: ObjectId (ref: User),
  authorRole: String (admin/teacher/student),
  status: String (draft/submitted/approved/published/rejected),
  category: String (enum),
  tags: [String],
  featuredImage: String,
  publishedAt: Date,
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  rejectionReason: String,
  viewCount: Number,
  likes: [ObjectId],
  comments: [Comment],
  seoTitle: String,
  seoDescription: String,
  isFeatured: Boolean,
  isActive: Boolean
}
```

### Comment Model
```javascript
{
  post: ObjectId (ref: Post),
  user: ObjectId (ref: User),
  content: String (required, max 1000 chars),
  parentComment: ObjectId (ref: Comment),
  replies: [ObjectId],
  isApproved: Boolean,
  isEdited: Boolean,
  editedAt: Date,
  likes: [ObjectId],
  isActive: Boolean
}
```

## 🔌 API Endpoints

### Public Endpoints (No Authentication Required)

#### **Posts**
```
GET /api/v1/blog/posts/published - Get all published posts
GET /api/v1/blog/posts/featured - Get featured posts
GET /api/v1/blog/posts/category/:category - Get posts by category
GET /api/v1/blog/posts/slug/:slug - Get post by slug
```

#### **Comments**
```
GET /api/v1/blog/comments/post/:postId - Get comments for a post
```

### Protected Endpoints (Authentication Required)

#### **Posts**
```
GET /api/v1/blog/posts - Get posts (role-based filtering)
POST /api/v1/blog/posts - Create new post
GET /api/v1/blog/posts/:id - Get specific post
PUT /api/v1/blog/posts/:id - Update post
DELETE /api/v1/blog/posts/:id - Delete post (soft delete)
PATCH /api/v1/blog/posts/:id/like - Like/unlike post
```

#### **Comments**
```
POST /api/v1/blog/comments - Create comment
GET /api/v1/blog/comments/user - Get user's comments
PUT /api/v1/blog/comments/:id - Update comment
DELETE /api/v1/blog/comments/:id - Delete comment
PATCH /api/v1/blog/comments/:id/like - Like/unlike comment
```

### Admin-Only Endpoints

#### **Posts**
```
PATCH /api/v1/blog/posts/:id/approve - Approve/reject/publish post
GET /api/v1/blog/posts/stats/overview - Get blog statistics
```

#### **Comments**
```
PATCH /api/v1/blog/comments/:id/approve - Approve/reject comment
GET /api/v1/blog/comments/pending/list - Get pending comments
GET /api/v1/blog/comments/stats/overview - Get comment statistics
```

## 🔐 Permission System

### Post Creation Permissions
- **Admins**: Can create and publish directly
- **Teachers**: Can create drafts, submit for approval
- **Students**: Can submit articles for review

### Post Viewing Permissions
- **Admins**: Can view all posts
- **Teachers**: Can view published posts and their own posts
- **Students**: Can view published posts and their own posts

### Post Editing Permissions
- **Admins**: Can edit any post
- **Teachers**: Can edit their own posts
- **Students**: Can edit their own posts before approval

### Comment Permissions
- **Admins**: Auto-approved comments, can moderate all comments
- **Teachers**: Auto-approved comments
- **Students**: Comments require admin approval

## 📝 Usage Examples

### Creating a Post (Teacher)
```javascript
// POST /api/v1/blog/posts
{
  "title": "Mathematics Workshop Success",
  "content": "<p>Our recent mathematics workshop was a great success...</p>",
  "excerpt": "Students participated in an engaging mathematics workshop",
  "category": "academic",
  "tags": "mathematics, workshop, education",
  "featuredImage": "https://example.com/image.jpg",
  "seoTitle": "Mathematics Workshop Success - School Blog",
  "seoDescription": "Learn about our successful mathematics workshop"
}
// Status will be set to 'draft' automatically
```

### Approving a Post (Admin)
```javascript
// PATCH /api/v1/blog/posts/:id/approve
{
  "status": "published" // or "approved", "rejected"
}
// If rejected, include rejectionReason
```

### Creating a Comment
```javascript
// POST /api/v1/blog/comments
{
  "postId": "post_id_here",
  "content": "Great article! Very informative.",
  "parentCommentId": "optional_parent_comment_id"
}
```

### Getting Posts with Filters
```javascript
// GET /api/v1/blog/posts?category=academic&status=published&page=1&limit=10
// Available filters: category, status, author, tags
// Available sorts: createdAt, updatedAt, publishedAt, viewCount, likeCount
```

## 📊 Statistics

### Blog Statistics (Admin Only)
```javascript
{
  "totalPosts": 150,
  "publishedPosts": 120,
  "totalViews": 5000,
  "statusBreakdown": [
    { "_id": "published", "count": 120 },
    { "_id": "draft", "count": 20 },
    { "_id": "submitted", "count": 10 }
  ],
  "categoryBreakdown": [
    { "_id": "academic", "count": 50 },
    { "_id": "activities", "count": 30 },
    { "_id": "news", "count": 20 }
  ]
}
```

### Comment Statistics (Admin Only)
```javascript
{
  "totalComments": 300,
  "approvedComments": 280,
  "pendingComments": 20,
  "recentComments": [...]
}
```

## 🔧 Configuration

### Environment Variables
No additional environment variables required. The module uses existing authentication and database configuration.

### Dependencies
- mongoose (for database operations)
- express (for routing)
- Existing authentication middleware
- Existing permission middleware

## 🚀 Getting Started

1. **Database Setup**: The models will be automatically created when the application starts.

2. **API Integration**: The blog routes are automatically mounted at `/api/v1/blog`.

3. **Permissions**: Ensure your user roles include the necessary permissions for blog operations.

4. **Testing**: Use the provided API endpoints to test the functionality.

## 📱 Frontend Integration

The blog module is designed to work seamlessly with the existing frontend architecture:

- **RTK Query**: Use the existing pattern for API calls
- **Role-based UI**: Show/hide features based on user role
- **Theme Support**: Follow the existing theme system
- **Component Reuse**: Use existing UI components

## 🔒 Security Features

- **Input Sanitization**: All HTML content is sanitized
- **Role-based Access**: Strict permission checking
- **Soft Deletes**: Data integrity maintained
- **Rate Limiting**: Existing rate limiting applies
- **XSS Protection**: Built-in XSS protection

## 📈 Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient pagination for large datasets
- **Caching**: RTK Query provides automatic caching
- **Lazy Loading**: Comments loaded on demand

## 🎯 Future Enhancements

- **Rich Text Editor**: WYSIWYG editor for content creation
- **Image Upload**: Direct image upload functionality
- **Email Notifications**: Notify users of post status changes
- **Analytics**: Detailed view and engagement analytics
- **Search**: Full-text search functionality
- **RSS Feeds**: RSS feed generation for published posts
- **Social Sharing**: Social media sharing buttons
- **Newsletter Integration**: Email newsletter functionality

---

The blog module provides a complete content management solution for your school management system with robust role-based permissions and content moderation capabilities.
