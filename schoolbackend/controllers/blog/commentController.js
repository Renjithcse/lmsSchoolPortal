const Comment = require('../../models/Blog/Comment');
const Post = require('../../models/Blog/Post');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

// Create a new comment
exports.createComment = catchAsync(async (req, res, next) => {
    const { postId, content, parentCommentId } = req.body;

    // Check if post exists and is published
    const post = await Post.findById(postId);
    if (!post) {
        return next(new AppError('Post not found', 404));
    }

    if (post.status !== 'published') {
        return next(new AppError('Comments can only be added to published posts', 400));
    }

    // Check if parent comment exists (for replies)
    if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
            return next(new AppError('Parent comment not found', 404));
        }
    }

    // Auto-approve comments from admins and teachers
    const isApproved = req.user.role === 'admin' || req.user.role === 'teacher';

    const comment = await Comment.create({
        post: postId,
        user: req.user.id,
        content,
        parentComment: parentCommentId || null,
        isApproved
    });

    // If this is a reply, add it to parent comment's replies
    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
            $push: { replies: comment._id }
        });
    }

    await comment.populate('user', 'name email');

    // Get updated comment count for the post (only approved comments)
    const commentCount = await Comment.countDocuments({
        post: postId,
        isApproved: true,
        isActive: true
    });

    res.status(201).json({
        status: 'success',
        data: comment,
        commentCount
    });
});

// Get comments for a post
exports.getComments = catchAsync(async (req, res, next) => {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        return next(new AppError('Post not found', 404));
    }

    let comments;

    
    
    // If user is authenticated, show approved comments plus their own unapproved comments
    if (req.user) {
        comments = await Comment.getCommentsWithUserPending(postId, req.user._id);
    } else {
        // For unauthenticated users, only show approved comments
        comments = await Comment.getApprovedComments(postId);
    }

    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: comments
    });
});

// Get comments by user
exports.getUserComments = catchAsync(async (req, res, next) => {
    const comments = await Comment.getCommentsByUser(req.user.id);

    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: comments
    });
});

// Update a comment
exports.updateComment = catchAsync(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    // Check if user has permission to update this comment
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to update this comment', 403));
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        req.params.id,
        { content: req.body.content },
        { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.status(200).json({
        status: 'success',
        data: updatedComment
    });
});

// Delete a comment (soft delete)
exports.deleteComment = catchAsync(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    // Check if user has permission to delete this comment
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to delete this comment', 403));
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Approve/Reject a comment (admin only)
exports.approveComment = catchAsync(async (req, res, next) => {

    const { isApproved } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    comment.isApproved = isApproved;
    await comment.save();

    await comment.populate('user', 'name email');

    res.status(200).json({
        status: 'success',
        data: comment
    });
});

// Like/Unlike a comment
exports.toggleCommentLike = catchAsync(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    const likeIndex = comment.likes.indexOf(req.user.id);
    
    if (likeIndex > -1) {
        // Unlike
        comment.likes.splice(likeIndex, 1);
    } else {
        // Like
        comment.likes.push(req.user.id);
    }

    await comment.save();

    res.status(200).json({
        status: 'success',
        data: {
            liked: likeIndex === -1,
            likeCount: comment.likes.length
        }
    });
});

// Get pending comments for approval (admin only)
exports.getPendingComments = catchAsync(async (req, res, next) => {

    const comments = await Comment.find({
        isApproved: false,
        isActive: true
    })
    .populate('user', 'name email')
    .populate('post', 'title slug')
    .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: comments
    });
});

// Get comment statistics
exports.getCommentStats = catchAsync(async (req, res, next) => {

    const totalComments = await Comment.countDocuments({ isActive: true });
    const approvedComments = await Comment.countDocuments({ 
        isApproved: true, 
        isActive: true 
    });
    const pendingComments = await Comment.countDocuments({ 
        isApproved: false, 
        isActive: true 
    });

    const recentComments = await Comment.find({ isActive: true })
        .populate('user', 'name email')
        .populate('post', 'title slug')
        .sort({ createdAt: -1 })
        .limit(10);

    res.status(200).json({
        status: 'success',
        data: {
            totalComments,
            approvedComments,
            pendingComments,
            recentComments
        }
    });
});
