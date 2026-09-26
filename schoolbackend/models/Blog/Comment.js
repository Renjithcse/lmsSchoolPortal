const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Please provide post reference']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user information']
    },
    content: {
        type: String,
        required: [true, 'Please provide comment content'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    isApproved: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ isApproved: 1, isActive: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
    return this.replies.length;
});

// Pre-save middleware to update editedAt when content changes
commentSchema.pre('save', function(next) {
    if (this.isModified('content') && !this.isNew) {
        this.isEdited = true;
        this.editedAt = new Date();
    }
    next();
});

// Static method to get approved comments for a post
commentSchema.statics.getApprovedComments = function(postId) {
    return this.find({
        post: postId,
        isApproved: true,
        isActive: true,
        parentComment: null
    })
    .populate('user', 'name email')
    .populate({
        path: 'replies',
        match: { isApproved: true, isActive: true },
        populate: { path: 'user', select: 'name email' }
    })
    .sort({ createdAt: -1 });
};

// Static method to get approved comments plus user's own unapproved comments
commentSchema.statics.getCommentsWithUserPending = function(postId, userId) {
    return this.find({
        post: postId,
        isActive: true,
        parentComment: null,
        $or: [
            { isApproved: true },
            { user: userId, isApproved: false }
        ]
    })
    .populate('user', 'name email')
    .populate({
        path: 'replies',
        match: { 
            isActive: true,
            $or: [
                { isApproved: true },
                { user: userId, isApproved: false }
            ]
        },
        populate: { path: 'user', select: 'name email' }
    })
    .sort({ createdAt: -1 });
};

// Static method to get comments by user
commentSchema.statics.getCommentsByUser = function(userId) {
    return this.find({
        user: userId,
        isActive: true
    })
    .populate('post', 'title slug')
    .sort({ createdAt: -1 });
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
