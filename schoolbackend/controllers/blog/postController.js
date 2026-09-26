const Post = require('../../models/Blog/Post');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const apiFeatures = require('../../utils/apiFeatures');
const { uploadBlogImageToS3, deleteBlogS3File, extractS3KeyFromUrl } = require('../../utils/blogS3Helper');

// Create a new blog post
exports.createPost = catchAsync(async (req, res, next) => {
    const { title, content, excerpt, category, tags, featuredImage, seoTitle, seoDescription, ...otherFields } = req.body;
    
    // Determine author role based on user role
    let authorRole = 'student'; // default
    if (req.user.role === 'admin') {
        authorRole = 'admin';
    } else if (req.user.role === 'teacher') {
        authorRole = 'teacher';
    }

    // Set initial status based on role
    let status = 'draft';
    if (authorRole === 'admin') {
        status = 'published'; // Admins can publish directly
    } else if (authorRole === 'teacher') {
        status = 'draft'; // Teachers start with draft
    } else {
        status = 'submitted'; // Students submit for review
    }

    let featuredImageData = null;

    // Upload featured image to S3 if provided
    if (featuredImage && featuredImage.includes('data:image')) {
        try {
            featuredImageData = await uploadBlogImageToS3(featuredImage, 'blog');
        } catch (error) {
            return next(new AppError(`Failed to upload featured image: ${error.message}`, 400));
        }
    }

    const postData = {
        title,
        content,
        excerpt,
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        seoTitle,
        seoDescription,
        author: req.user.id,
        authorRole,
        status,
        featuredImage: featuredImageData ? featuredImageData.url : null,
        featuredImageS3Key: featuredImageData ? featuredImageData.key : null
    };

    const post = await Post.create(postData);

    await post.populate('author', 'name email');

    res.status(201).json({
        status: 'success',
        data: post
    });
});

// Get all posts with role-based filtering
exports.getPosts = catchAsync(async (req, res, next) => {
    const features = new apiFeatures(Post.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // Apply role-based filtering
    if (req.user.role === 'admin') {
        // Admins can see all posts
        features.query = features.query.find({ isActive: true });
    } else {
        // Teachers and students can see their own posts and published posts
        features.query = features.query.find({
            $or: [
                { author: req.user.id },
                { status: 'published', isActive: true }
            ]
        });
    }

    // Populate author information
    features.query = features.query.populate('author', 'name email');

    const posts = await features.query;

    // Get comment counts for all posts
    const Comment = require('../../models/Blog/Comment');
    const postsWithCommentCounts = await Promise.all(
        posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({
                post: post._id,
                isApproved: true,
                isActive: true
            });
            return {
                ...post.toObject(),
                commentCount
            };
        })
    );

    // Get total count for pagination
    const totalQuery = Post.find();
    if (req.user.role !== 'admin') {
        totalQuery.find({
            $or: [
                { author: req.user.id },
                { status: 'published', isActive: true }
            ]
        });
    }
    const totalPosts = await totalQuery.countDocuments();

    res.status(200).json({
        status: 'success',
        results: postsWithCommentCounts.length,
        pagination: {
            currentPage: parseInt(req.query.page) || 1,
            totalPages: Math.ceil(totalPosts / (parseInt(req.query.limit) || 10)),
            totalPosts
        },
        data: postsWithCommentCounts
    });
});

// Get published posts (public endpoint)
exports.getPublishedPosts = catchAsync(async (req, res, next) => {
    const features = new apiFeatures(Post.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    features.query = features.query.find({
        status: 'published',
        isActive: true,
        publishedAt: { $lte: new Date() }
    }).populate('author', 'name email');

    const posts = await features.query;
    
    // Get comment counts for all posts
    const Comment = require('../../models/Blog/Comment');
    const postsWithCommentCounts = await Promise.all(
        posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({
                post: post._id,
                isApproved: true,
                isActive: true
            });
            return {
                ...post.toObject(),
                commentCount
            };
        })
    );

    const totalPosts = await Post.countDocuments({
        status: 'published',
        isActive: true,
        publishedAt: { $lte: new Date() }
    });

    res.status(200).json({
        status: 'success',
        results: postsWithCommentCounts.length,
        pagination: {
            currentPage: parseInt(req.query.page) || 1,
            totalPages: Math.ceil(totalPosts / (parseInt(req.query.limit) || 10)),
            totalPosts
        },
        data: postsWithCommentCounts
    });
});

// Get a single post by ID
exports.getPost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
        .populate('author', 'name email')
        .populate('approvedBy', 'name email');

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    // Check if user has permission to view this post
    if (post.status !== 'published' && post.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to view this post', 403));
    }

    // Increment view count for published posts
    if (post.status === 'published') {
        post.viewCount += 1;
        await post.save();
    }

    // Get comment count for this post
    const Comment = require('../../models/Blog/Comment');
    const commentCount = await Comment.countDocuments({
        post: post._id,
        isApproved: true,
        isActive: true
    });

    const postWithCommentCount = {
        ...post.toObject(),
        commentCount
    };

    res.status(200).json({
        status: 'success',
        data: postWithCommentCount
    });
});

// Get a single post by slug
exports.getPostBySlug = catchAsync(async (req, res, next) => {
    const post = await Post.findOne({ slug: req.params.slug })
        .populate('author', 'name email')
        .populate('approvedBy', 'name email');

    if (!post) {
        return next(new AppError('No post found with that slug', 404));
    }

    // Check if user has permission to view this post
    if (post.status !== 'published' && post.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to view this post', 403));
    }

    // Increment view count for published posts
    if (post.status === 'published') {
        post.viewCount += 1;
        await post.save();
    }

    // Get comment count for this post
    const Comment = require('../../models/Blog/Comment');
    const commentCount = await Comment.countDocuments({
        post: post._id,
        isApproved: true,
        isActive: true
    });

    const postWithCommentCount = {
        ...post.toObject(),
        commentCount
    };

    res.status(200).json({
        status: 'success',
        data: postWithCommentCount
    });
});

// Update a post
exports.updatePost = catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const { featuredImage, tags, ...otherFields } = req.body;

    // Get the existing post first
    const existingPost = await Post.findById(postId);

    if (!existingPost) {
        return next(new AppError('No post found with that ID', 404));
    }

    // Check if user has permission to update this post
    if (existingPost.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to update this post', 403));
    }

    // Only admins can change status to published
    if (otherFields.status === 'published' && req.user.role !== 'admin') {
        return next(new AppError('Only admins can publish posts', 403));
    }

    let featuredImageData = null;
    let updateData = { ...otherFields };

    // Handle tags if provided
    if (tags) {
        updateData.tags = tags.split(',').map(tag => tag.trim());
    }

    // Handle featured image update
    if (featuredImage && featuredImage.includes('data:image')) {
        try {
            featuredImageData = await uploadBlogImageToS3(featuredImage, 'blog');
            
            // Delete old featured image from S3 if it exists
            if (existingPost.featuredImageS3Key) {
                try {
                    await deleteBlogS3File(existingPost.featuredImageS3Key);
                    console.log(`Successfully deleted old blog featured image: ${existingPost.featuredImageS3Key}`);
                } catch (error) {
                    console.error('Error deleting old blog featured image:', error);
                }
            }

            updateData.featuredImage = featuredImageData.url;
            updateData.featuredImageS3Key = featuredImageData.key;
        } catch (error) {
            return next(new AppError(`Failed to upload featured image: ${error.message}`, 400));
        }
    }

    // If status is being changed to published, set approvedBy and approvedAt
    if (updateData.status === 'published' && existingPost.status !== 'published') {
        updateData.approvedBy = req.user.id;
        updateData.approvedAt = new Date();
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
        new: true,
        runValidators: true
    }).populate('author', 'name email');

    res.status(200).json({
        status: 'success',
        data: updatedPost
    });
});

// Delete a post (soft delete)
exports.deletePost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    // Check if user has permission to delete this post
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to delete this post', 403));
    }

    // Delete associated featured image from S3
    if (post.featuredImageS3Key) {
        try {
            await deleteBlogS3File(post.featuredImageS3Key);
            console.log(`Successfully deleted blog featured image: ${post.featuredImageS3Key}`);
        } catch (error) {
            console.error('Error deleting S3 file:', error);
            // Continue with deletion even if S3 deletion fails
        }
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Approve/Reject a post (admin only)
exports.approvePost = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return next(new AppError('Only admins can approve posts', 403));
    }

    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected', 'published'].includes(status)) {
        return next(new AppError('Invalid status. Must be approved, rejected, or published', 400));
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    post.status = status;
    post.approvedBy = req.user.id;
    post.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
        post.rejectionReason = rejectionReason;
    }

    if (status === 'published') {
        post.publishedAt = new Date();
    }

    await post.save();
    await post.populate('author', 'name email');

    res.status(200).json({
        status: 'success',
        data: post
    });
});

// Like/Unlike a post
exports.toggleLike = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    
    if (likeIndex > -1) {
        // Unlike
        post.likes.splice(likeIndex, 1);
    } else {
        // Like
        post.likes.push(req.user.id);
    }

    await post.save();

    res.status(200).json({
        status: 'success',
        data: {
            liked: likeIndex === -1,
            likeCount: post.likes.length
        }
    });
});

// Increment view count for a post
exports.incrementViewCount = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    // Check if post is published
    if (post.status !== 'published') {
        return next(new AppError('View count can only be incremented for published posts', 400));
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.status(200).json({
        status: 'success',
        data: {
            viewCount: post.viewCount
        }
    });
});

// Get posts by category
exports.getPostsByCategory = catchAsync(async (req, res, next) => {
    const { category } = req.params;
    
    const features = new apiFeatures(Post.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    features.query = features.query.find({
        category,
        status: 'published',
        isActive: true,
        publishedAt: { $lte: new Date() }
    }).populate('author', 'name email');

    const posts = await features.query;
    
    // Get comment counts for posts by category
    const Comment = require('../../models/Blog/Comment');
    const postsWithCommentCounts = await Promise.all(
        posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({
                post: post._id,
                isApproved: true,
                isActive: true
            });
            return {
                ...post.toObject(),
                commentCount
            };
        })
    );

    const totalPosts = await Post.countDocuments({
        category,
        status: 'published',
        isActive: true,
        publishedAt: { $lte: new Date() }
    });

    res.status(200).json({
        status: 'success',
        results: postsWithCommentCounts.length,
        pagination: {
            currentPage: parseInt(req.query.page) || 1,
            totalPages: Math.ceil(totalPosts / (parseInt(req.query.limit) || 10)),
            totalPosts
        },
        data: postsWithCommentCounts
    });
});

// Get featured posts
exports.getFeaturedPosts = catchAsync(async (req, res, next) => {
    const posts = await Post.find({
        isFeatured: true,
        status: 'published',
        isActive: true,
        publishedAt: { $lte: new Date() }
    })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(10);

    // Get comment counts for featured posts
    const Comment = require('../../models/Blog/Comment');
    const postsWithCommentCounts = await Promise.all(
        posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({
                post: post._id,
                isApproved: true,
                isActive: true
            });
            return {
                ...post.toObject(),
                commentCount
            };
        })
    );

    res.status(200).json({
        status: 'success',
        results: postsWithCommentCounts.length,
        data: postsWithCommentCounts
    });
});

// Get blog statistics
exports.getBlogStats = catchAsync(async (req, res, next) => {
    const stats = await Post.aggregate([
        {
            $match: { isActive: true }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const totalPosts = await Post.countDocuments({ isActive: true });
    const publishedPosts = await Post.countDocuments({ 
        status: 'published', 
        isActive: true,
        publishedAt: { $lte: new Date() }
    });
    const totalViews = await Post.aggregate([
        {
            $match: { isActive: true }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$viewCount' }
            }
        }
    ]);

    const categoryStats = await Post.aggregate([
        {
            $match: { 
                status: 'published', 
                isActive: true,
                publishedAt: { $lte: new Date() }
            }
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            totalPosts,
            publishedPosts,
            totalViews: totalViews[0]?.totalViews || 0,
            statusBreakdown: stats,
            categoryBreakdown: categoryStats
        }
    });
});
