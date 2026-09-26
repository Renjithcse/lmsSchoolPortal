const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please provide content'],
        trim: true
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: [300, 'Excerpt cannot exceed 300 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide author information']
    },
    authorRole: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        required: [true, 'Please specify author role']
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'published', 'rejected'],
        default: 'draft'
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['academic', 'activities', 'news', 'events', 'student-life', 'sports', 'technology', 'other'],
        default: 'other'
    },
    tags: {
        type: [String],
        trim: true,
        default: []
    },
    featuredImage: {
        type: String,
        trim: true // S3 URL to the featured image
    },
    featuredImageS3Key: {
        type: String,
        trim: true // S3 key for deletion
    },
    publishedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    seoTitle: {
        type: String,
        trim: true
    },
    seoDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'SEO description cannot exceed 160 characters']
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ slug: 1 });
postSchema.index({ tags: 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
    // Since comments are stored in a separate Comment collection,
    // we need to calculate this dynamically
    // For now, return 0 and we'll handle this in the controller
    return 0;
});

// Method to get comment count from Comment collection
postSchema.methods.getCommentCount = async function() {
    const Comment = mongoose.model('Comment');
    return await Comment.countDocuments({
        post: this._id,
        isApproved: true,
        isActive: true
    });
};

// Virtual for reading time (estimated)
postSchema.virtual('readingTime').get(function() {
    const wordsPerMinute = 200;
    const wordCount = this.content ? this.content.split(' ').length : 0;
    return Math.ceil(wordCount / wordsPerMinute);
});

// Pre-save middleware to generate slug
postSchema.pre('save', function(next) {
    if (!this.isModified('title')) return next();
    
    this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    
    next();
});

// Pre-save middleware to set publishedAt when status changes to published
postSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Static method to get published posts
postSchema.statics.getPublishedPosts = function() {
    return this.find({ 
        status: 'published', 
        isActive: true,
        publishedAt: { $lte: new Date() }
    }).populate('author', 'name email');
};

// Static method to get posts by role
postSchema.statics.getPostsByRole = function(role, userId) {
    const query = { isActive: true };
    
    if (role === 'admin') {
        // Admins can see all posts
        return this.find(query);
    } else if (role === 'teacher') {
        // Teachers can see their own posts and published posts
        return this.find({
            $or: [
                { author: userId },
                { status: 'published' }
            ],
            ...query
        });
    } else if (role === 'student') {
        // Students can see their own posts and published posts
        return this.find({
            $or: [
                { author: userId },
                { status: 'published' }
            ],
            ...query
        });
    }
    
    return this.find({ status: 'published', ...query });
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
