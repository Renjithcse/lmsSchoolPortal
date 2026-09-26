import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Button, Chip, TextField, Divider, IconButton, Stack, Badge, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomTextArea from '../../components/Common/CustomTextArea';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useGetPublishedPostsQuery, useGetFeaturedPostsQuery, useToggleLikeMutation, useIncrementViewCountMutation } from '../../Redux/features/Blog/postSlice';
import { useGetCommentsQuery, useCreateCommentMutation, useToggleCommentLikeMutation } from '../../Redux/features/Blog/commentSlice';
import { useSnackbar } from '../../hooks/SnackBar';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';
import ArticleIcon from '@mui/icons-material/Article';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BookIcon from '@mui/icons-material/Book';
import { BASE_PATH } from '../../config';

const resolveImageUrl = (src) => {
	if (!src) return '';
	if (typeof src !== 'string') return '';
	if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
	const trimmed = src.startsWith('/') ? src.slice(1) : src;
	return `${BASE_PATH}${trimmed}`;
};

const StudentBlogView = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const { t } = useTranslation();

	const [selectedCategory, setSelectedCategory] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedPost, setSelectedPost] = useState(null);
	const [optimisticLikes, setOptimisticLikes] = useState(new Set());
	const [optimisticCommentLikes, setOptimisticCommentLikes] = useState(new Set());
	const [loadingLikes, setLoadingLikes] = useState(new Set());
	const [loadingCommentLikes, setLoadingCommentLikes] = useState(new Set());
	const scrollPositionRef = useRef(0);
	const commentTextFieldRef = useRef(null);



	// Fetch published posts
	const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useGetPublishedPostsQuery({
		search: searchTerm,
		category: selectedCategory !== 'all' ? selectedCategory : undefined,
		page: 1,
		limit: 20
	});

	// Fetch featured posts
	const { data: featuredData, isLoading: featuredLoading } = useGetFeaturedPostsQuery();

	// Fetch comments for selected post
	const { data: commentsData, refetch: refetchComments } = useGetCommentsQuery(selectedPost?._id, {
		skip: !selectedPost?._id
	});

	const [toggleLike] = useToggleLikeMutation();
	const [incrementViewCount] = useIncrementViewCountMutation();
	const [createComment] = useCreateCommentMutation();
	const [toggleCommentLike] = useToggleCommentLikeMutation();

	// Initialize optimistic likes from posts data
	useEffect(() => {
		if (postsData?.data) {
			const likedPosts = new Set();
			postsData.data.forEach(post => {
				// Check if current user has liked this post
				if (post.userLiked || post.likedByUser) {
					likedPosts.add(post._id);
				}
			});
			setOptimisticLikes(likedPosts);
		}
	}, [postsData?.data]);

	// Initialize optimistic comment likes from comments data
	useEffect(() => {
		if (commentsData?.data) {
			const likedComments = new Set();
			commentsData.data.forEach(comment => {
				// Check if current user has liked this comment
				if (comment.userLiked || comment.likedByUser) {
					likedComments.add(comment._id);
				}
			});
			setOptimisticCommentLikes(likedComments);
		}
	}, [commentsData?.data]);

	// Ensure selectedPost has the correct optimistic state
	useEffect(() => {
		if (selectedPost) {
			// Check if the selected post should be marked as liked
			const shouldBeLiked = selectedPost.userLiked || selectedPost.likedByUser;
			const isCurrentlyLiked = optimisticLikes.has(selectedPost._id);

			if (shouldBeLiked && !isCurrentlyLiked) {
				setOptimisticLikes(prev => new Set([...prev, selectedPost._id]));
			} else if (!shouldBeLiked && isCurrentlyLiked) {
				setOptimisticLikes(prev => {
					const newSet = new Set(prev);
					newSet.delete(selectedPost._id);
					return newSet;
				});
			}
		}
	}, [selectedPost]);

	const categories = [
		{ value: 'all', label: t('blogView.categories.allPosts'), icon: <ArticleIcon /> },
		{ value: 'academic', label: t('blogView.categories.academic'), icon: <SchoolIcon /> },
		{ value: 'activities', label: t('blogView.categories.activities'), icon: <TrendingUpIcon /> },
		{ value: 'news', label: t('blogView.categories.news'), icon: <ArticleIcon /> },
		{ value: 'events', label: t('blogView.categories.events'), icon: <BookIcon /> },
		{ value: 'student-life', label: t('blogView.categories.studentLife'), icon: <PersonIcon /> },
		{ value: 'sports', label: t('blogView.categories.sports'), icon: <TrendingUpIcon /> },
		{ value: 'technology', label: t('blogView.categories.technology'), icon: <SchoolIcon /> },
		{ value: 'other', label: t('blogView.categories.other'), icon: <ArticleIcon /> }
	];

	const handleLike = async (postId) => {
		// Set loading state
		setLoadingLikes(prev => new Set([...prev, postId]));

		// Optimistic update
		const isCurrentlyLiked = optimisticLikes.has(postId);
		if (isCurrentlyLiked) {
			setOptimisticLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(postId);
				return newSet;
			});
		} else {
			setOptimisticLikes(prev => new Set([...prev, postId]));
		}

		// Update selectedPost if it's the one being liked
		if (selectedPost && selectedPost._id === postId) {
			setSelectedPost(prev => ({
				...prev,
				likeCount: isCurrentlyLiked ? Math.max(0, (prev.likeCount || 1) - 1) : (prev.likeCount || 0) + 1
			}));
		}

		try {
			const result = await toggleLike(postId).unwrap();
			// Update the optimistic state based on server response if needed
			if (result && result.data) {
				const serverLiked = result.data.userLiked || result.data.likedByUser;
				const optimisticLiked = optimisticLikes.has(postId);

				if (serverLiked !== optimisticLiked) {
					if (serverLiked) {
						setOptimisticLikes(prev => new Set([...prev, postId]));
					} else {
						setOptimisticLikes(prev => {
							const newSet = new Set(prev);
							newSet.delete(postId);
							return newSet;
						});
					}
				}

				// Update selectedPost with server data if available
				if (selectedPost && selectedPost._id === postId && result.data.likeCount !== undefined) {
					setSelectedPost(prev => ({
						...prev,
						likeCount: result.data.likeCount
					}));
				}
			}
		} catch (error) {
			// Revert optimistic update on error
			if (isCurrentlyLiked) {
				setOptimisticLikes(prev => new Set([...prev, postId]));
				// Revert selectedPost update
				if (selectedPost && selectedPost._id === postId) {
					setSelectedPost(prev => ({
						...prev,
						likeCount: (prev.likeCount || 0) + 1
					}));
				}
			} else {
				setOptimisticLikes(prev => {
					const newSet = new Set(prev);
					newSet.delete(postId);
					return newSet;
				});
				// Revert selectedPost update
				if (selectedPost && selectedPost._id === postId) {
					setSelectedPost(prev => ({
						...prev,
						likeCount: Math.max(0, (prev.likeCount || 1) - 1)
					}));
				}
			}
			showSnackbar(t('blogView.messages.likeFailed'), 'error');
		} finally {
			// Clear loading state
			setLoadingLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(postId);
				return newSet;
			});
		}
	};

	const handlePostClick = async (post) => {
		// Optimistically update the view count
		const updatedViewCount = (post.viewCount || 0) + 1;

		// Update selectedPost
		setSelectedPost({
			...post,
			viewCount: updatedViewCount
		});

		// Make API call to increment view count on server
		try {
			await incrementViewCount(post._id).unwrap();
		} catch (error) {
			// Revert optimistic update on error
			setSelectedPost({
				...post,
				viewCount: post.viewCount || 0
			});
		}
	};

	const handleCommentLike = async (commentId) => {
		// Set loading state
		setLoadingCommentLikes(prev => new Set([...prev, commentId]));

		// Optimistic update
		const isCurrentlyLiked = optimisticCommentLikes.has(commentId);
		if (isCurrentlyLiked) {
			setOptimisticCommentLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(commentId);
				return newSet;
			});
		} else {
			setOptimisticCommentLikes(prev => new Set([...prev, commentId]));
		}

		try {
			const result = await toggleCommentLike(commentId).unwrap();
			// Update the optimistic state based on server response if needed
			if (result && result.data) {
				const serverLiked = result.data.userLiked || result.data.likedByUser;
				const optimisticLiked = optimisticCommentLikes.has(commentId);

				if (serverLiked !== optimisticLiked) {
					if (serverLiked) {
						setOptimisticCommentLikes(prev => new Set([...prev, commentId]));
					} else {
						setOptimisticCommentLikes(prev => {
							const newSet = new Set(prev);
							newSet.delete(commentId);
							return newSet;
						});
					}
				}
			}
		} catch (error) {
			// Revert optimistic update on error
			if (isCurrentlyLiked) {
				setOptimisticCommentLikes(prev => new Set([...prev, commentId]));
			} else {
				setOptimisticCommentLikes(prev => {
					const newSet = new Set(prev);
					newSet.delete(commentId);
					return newSet;
				});
			}
			showSnackbar(t('blogView.messages.commentLikeFailed'), 'error');
		} finally {
			// Clear loading state
			setLoadingCommentLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(commentId);
				return newSet;
			});
		}
	};



	const handleCategoryChange = (category) => {
		setSelectedCategory(category);
		setSelectedPost(null);
	};

	const handleSearch = (event) => {
		setSearchTerm(event.target.value);
		setSelectedPost(null);
	};



	const formatReadingTime = (content) => {
		if (!content || typeof content !== 'string') return 1;
		const wordsPerMinute = 200;
		const wordCount = content.split(' ').length;
		return Math.ceil(wordCount / wordsPerMinute);
	};

	const truncateText = (text, maxLength = 120) => {
		if (!text || typeof text !== 'string') return t('blogView.fallback.noContent');
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	};

	const isPostLiked = (post) => {
		return optimisticLikes.has(post._id);
	};

	const getLikeCount = (post) => {
		// For selectedPost, use the updated likeCount directly
		if (selectedPost && selectedPost._id === post._id) {
			return selectedPost.likeCount || 0;
		}
		// For other posts, use the original count from server
		return post.likeCount || 0;
	};

	const getCommentLikeCount = (comment) => {
		return comment.likeCount || 0;
	};

	// Separate CommentForm component to prevent re-renders
	const CommentForm = React.memo(() => {
		const { control, handleSubmit, setValue, watch } = useForm({
			defaultValues: {
				comment: ''
			}
		});

		const handleSubmitComment = async (data) => {
			if (!data.comment?.trim()) {
				showSnackbar(t('blogView.messages.pleaseEnterComment'), 'error');
				return;
			}

			try {
				const result = await createComment({
					postId: selectedPost._id,
					content: data.comment
				}).unwrap();

				setValue('comment', '');
				refetchComments();
				
				// Update the selectedPost comment count if available in response
				if (result.commentCount !== undefined) {
					setSelectedPost(prev => ({
						...prev,
						commentCount: result.commentCount
					}));
				}
				
				showSnackbar(t('blogView.messages.commentSubmitted'), 'success');
			} catch (error) {
				showSnackbar(error?.data?.message || t('blogView.messages.commentSubmitFailed'), 'error');
			}
		};

		return (
			<Box component="form" onSubmit={handleSubmit(handleSubmitComment)} display="flex" gap={1} mb={3}>
				<Box sx={{ flex: 1 }}>
					<CustomTextArea
						fieldName="comment"
						control={control}
						placeholder={t('blogView.placeholders.shareThoughts')}
						rows={3}
						themeColors={themeColors}
					/>
				</Box>
				<Button
					type="submit"
					variant="contained"
					sx={{
						backgroundColor: themeColors.primary,
						'&:hover': {
							backgroundColor: themeColors.primary,
							opacity: 0.9,
						},
					}}
				>
					<SendIcon />
				</Button>
			</Box>
		);
	});

	const PostCard = ({ post, isFeatured = false }) => (
		<Card
			sx={{
				backgroundColor: themeColors.background.primary,
				border: `1px solid ${themeColors.border.primary}`,
				cursor: 'pointer',
				transition: 'all 0.3s ease',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				'&:hover': {
					transform: 'translateY(-4px)',
					boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
					borderColor: themeColors.primary
				},
				...(isFeatured && {
					borderColor: themeColors.primary,
					borderWidth: 2,
					boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
				})
			}}
			onClick={() => handlePostClick(post)}
		>
			{post.featuredImage && (
				<Box
					sx={{
						height: 180,
						backgroundImage: `url(${resolveImageUrl(post.featuredImage)})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						borderTopLeftRadius: 8,
						borderTopRightRadius: 8,
						position: 'relative'
					}}
				>
					{isFeatured && (
						<Chip
							label={t('blogView.labels.featured')}
							size="small"
							sx={{
								position: 'absolute',
								top: 8,
								right: 8,
								backgroundColor: '#FF9800',
								color: 'white',
								fontWeight: 'bold',
								fontSize: '0.7rem'
							}}
						/>
					)}
				</Box>
			)}
			<CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
				<Box display="flex" alignItems="center" gap={1} mb={1}>
					<Chip
						label={post.category}
						size="small"
						sx={{
							backgroundColor: themeColors.primary,
							color: 'white',
							fontWeight: 'bold',
							fontSize: '0.7rem'
						}}
					/>
				</Box>

				<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1, lineHeight: 1.3 }}>
					{post.title}
				</Typography>

				<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2, flexGrow: 1 }}>
					{truncateText(post.excerpt || post.content)}
				</Typography>

				<Box display="flex" alignItems="center" gap={2} mb={2}>
					<Box display="flex" alignItems="center" gap={0.5}>
						<Avatar sx={{ width: 20, height: 20, backgroundColor: themeColors.primary, fontSize: '0.7rem' }}>
							<PersonIcon sx={{ fontSize: 12 }} />
						</Avatar>
						<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
							{post.author?.name || t('blogView.labels.anonymous')}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={0.5}>
						<AccessTimeIcon sx={{ fontSize: 14, color: themeColors.text.secondary }} />
						<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
							{t('blogView.labels.readingTime', { minutes: formatReadingTime(post.content) })}
						</Typography>
					</Box>
				</Box>

				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Box display="flex" alignItems="center" gap={2}>
						<Box display="flex" alignItems="center" gap={0.5}>
							<VisibilityIcon sx={{ fontSize: 14, color: themeColors.text.secondary }} />
							<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
								{post.viewCount || 0}
							</Typography>
						</Box>
						<Box display="flex" alignItems="center" gap={0.5}>
							<CommentIcon sx={{ fontSize: 14, color: themeColors.text.secondary }} />
							<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
								{post.commentCount || 0}
							</Typography>
						</Box>
						<Box display="flex" alignItems="center" gap={0.5}>
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									handleLike(post._id);
								}}
								disabled={loadingLikes.has(post._id)}
								sx={{
									padding: 0,
									color: isPostLiked(post) ? '#4CAF50' : themeColors.text.secondary,
									'&:hover': {
										backgroundColor: '#4CAF5022',
									},
								}}
							>
								{loadingLikes.has(post._id) ? (
									<CircularProgress size={14} sx={{ color: themeColors.primary }} />
								) : (
									<ThumbUpIcon sx={{ fontSize: 14 }} />
								)}
							</IconButton>
							<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
								{getLikeCount(post)}
							</Typography>
						</Box>
					</Box>
					<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
						{moment(post.publishedAt || post.createdAt).format('MMM DD')}
					</Typography>
				</Box>
			</CardContent>
		</Card>
	);

	const PostDetail = ({ post }) => (
		<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
			<CardContent>
				<Box display="flex" alignItems="center" gap={1} mb={2}>
					<Chip
						label={post.category}
						size="small"
						sx={{
							backgroundColor: themeColors.primary,
							color: 'white',
							fontWeight: 'bold'
						}}
					/>
					{post.isFeatured && (
						<Chip
							label={t('blogView.labels.featured')}
							size="small"
							sx={{
								backgroundColor: '#FF9800',
								color: 'white',
								fontWeight: 'bold'
							}}
						/>
					)}
				</Box>

				<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
					{post.title}
				</Typography>

				{post.featuredImage && (
					<Box
						sx={{
							height: 300,
							backgroundImage: `url(${resolveImageUrl(post.featuredImage)})`,
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							borderRadius: 2,
							mb: 3
						}}
					/>
				)}

				<Box display="flex" alignItems="center" gap={3} mb={3}>
					<Box display="flex" alignItems="center" gap={1}>
						<Avatar sx={{ width: 32, height: 32, backgroundColor: themeColors.primary }}>
							<PersonIcon />
						</Avatar>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{post.author?.name || t('blogView.labels.anonymous')}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={1}>
						<AccessTimeIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('blogView.labels.readingTimeRead', { minutes: formatReadingTime(post.content) })}
						</Typography>
					</Box>
					<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
						{moment(post.publishedAt || post.createdAt).format('MMMM DD, YYYY')}
					</Typography>
				</Box>

				<Typography variant="body1" sx={{ color: themeColors.text.primary, mb: 3, lineHeight: 1.8 }}>
					{post.content}
				</Typography>

				{post.tags && post.tags.length > 0 && (
					<Box display="flex" gap={1} flexWrap="wrap" mb={3}>
						{post.tags.map((tag, index) => (
							<Chip
								key={index}
								label={tag}
								size="small"
								sx={{
									backgroundColor: `${themeColors.primary}22`,
									color: themeColors.primary,
									fontWeight: 'bold'
								}}
							/>
						))}
					</Box>
				)}

				<Divider sx={{ my: 3 }} />

				<Box display="flex" alignItems="center" gap={3} mb={3}>
					<Button
						startIcon={
							loadingLikes.has(post._id) ? (
								<CircularProgress size={16} sx={{ color: themeColors.primary }} />
							) : isPostLiked(post) ? (
								<ThumbUpIcon />
							) : (
								<ThumbUpOutlinedIcon />
							)
						}
						onClick={() => handleLike(post._id)}
						disabled={loadingLikes.has(post._id)}
						sx={{
							color: isPostLiked(post) ? '#4CAF50' : themeColors.text.secondary,
							'&:hover': {
								backgroundColor: '#4CAF5022',
							},
						}}
					>
						{loadingLikes.has(post._id) ? t('blogView.actions.loading') : `${isPostLiked(post) ? t('blogView.actions.unlike') : t('blogView.actions.like')} (${getLikeCount(post)})`}
					</Button>
					<Box display="flex" alignItems="center" gap={1}>
						<CommentIcon sx={{ color: themeColors.text.secondary }} />
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('blogView.labels.comments', { count: post.commentCount || 0 })}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={1}>
						<VisibilityIcon sx={{ color: themeColors.text.secondary }} />
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('blogView.labels.views', { count: post.viewCount || 0 })}
						</Typography>
					</Box>
				</Box>

				{/* Comments Section */}
				<Box>
					<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
						{t('blogView.sections.comments', { count: post.commentCount || 0 })}
					</Typography>

					{/* Add Comment */}
					<CommentForm />

					{/* Comments List */}
					<Stack spacing={2}>
						{commentsData?.data?.map((comment) => (
							<Card 
								key={comment._id} 
								sx={{ 
									backgroundColor: `${themeColors.background.primary}88`, 
									border: `1px solid ${themeColors.border.primary}`,
									opacity: !comment.isApproved ? 0.7 : 1
								}}
							>
								<CardContent>
									<Box display="flex" alignItems="center" gap={2} mb={1}>
										<Avatar sx={{ width: 32, height: 32, backgroundColor: themeColors.primary }}>
											<PersonIcon />
										</Avatar>
										<Box sx={{ flex: 1 }}>
											<Box display="flex" alignItems="center" gap={1}>
												<Typography variant="body2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
													{comment.user?.name || t('blogView.labels.anonymous')}
												</Typography>
												{!comment.isApproved && (
													<Chip
														label={t('blogView.labels.pendingApproval')}
														size="small"
														sx={{
															backgroundColor: '#FF9800',
															color: 'white',
															fontSize: '0.6rem',
															height: 20
														}}
													/>
												)}
											</Box>
											<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
												{moment(comment.createdAt).format('MMM DD, YYYY HH:mm')}
												{comment.isEdited && ` ${t('blogView.labels.edited')}`}
											</Typography>
										</Box>
									</Box>
									<Typography variant="body2" sx={{ color: themeColors.text.primary, mb: 1 }}>
										{comment.content}
									</Typography>
									<Box display="flex" alignItems="center" gap={1}>
										<IconButton
											size="small"
											onClick={() => handleCommentLike(comment._id)}
											disabled={loadingCommentLikes.has(comment._id)}
											sx={{
												color: optimisticCommentLikes.has(comment._id) ? '#4CAF50' : themeColors.text.secondary,
												'&:hover': {
													backgroundColor: '#4CAF5022',
												},
											}}
										>
											{loadingCommentLikes.has(comment._id) ? (
												<CircularProgress size={16} sx={{ color: themeColors.primary }} />
											) : optimisticCommentLikes.has(comment._id) ? (
												<ThumbUpIcon />
											) : (
												<ThumbUpOutlinedIcon />
											)}
										</IconButton>
										<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
											{getCommentLikeCount(comment)}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						))}
					</Stack>
				</Box>
			</CardContent>
		</Card>
	);

	return (
		<Box sx={{ p: 3, backgroundColor: themeColors.background.secondary, minHeight: '100vh' }}>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Box display="flex" alignItems="center" gap={2}>
					<Avatar sx={{ width: 48, height: 48, backgroundColor: themeColors.primary }}>
						<ArticleIcon sx={{ fontSize: 24 }} />
					</Avatar>
					<Box>
						<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('blogView.title')}
						</Typography>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('blogView.subtitle')}
						</Typography>
					</Box>
				</Box>
				{selectedPost && (
					<Button
						variant="outlined"
						onClick={() => setSelectedPost(null)}
						sx={{
							borderColor: themeColors.border.primary,
							color: themeColors.text.primary,
							'&:hover': {
								borderColor: themeColors.primary,
								backgroundColor: `${themeColors.primary}22`,
							},
						}}
					>
						{t('blogView.actions.backToPosts')}
					</Button>
				)}
			</Box>

			{selectedPost ? (
				<PostDetail key={selectedPost._id} post={selectedPost} />
			) : (
				<>
					{/* Search and Categories */}
					<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
						<CardContent>
							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										placeholder={t('blogView.placeholders.searchPosts')}
										value={searchTerm}
										onChange={handleSearch}
										InputProps={{
											startAdornment: <SearchIcon sx={{ color: themeColors.text.secondary, mr: 1 }} />,
										}}
										sx={{
											'& .MuiOutlinedInput-root': {
												'& fieldset': {
													borderColor: themeColors.border.primary,
												},
												'&:hover fieldset': {
													borderColor: themeColors.primary,
												},
												'&.Mui-focused fieldset': {
													borderColor: themeColors.primary,
												},
											},
											'& .MuiInputBase-input': {
												color: themeColors.text.primary,
											},
										}}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<Box display="flex" gap={1} flexWrap="wrap">
										{categories.map((category) => (
											<Chip
												key={category.value}
												label={category.label}
												icon={category.icon}
												onClick={() => handleCategoryChange(category.value)}
												sx={{
													backgroundColor: selectedCategory === category.value ? themeColors.primary : `${themeColors.primary}22`,
													color: selectedCategory === category.value ? 'white' : themeColors.primary,
													fontWeight: 'bold',
													cursor: 'pointer',
													'&:hover': {
														backgroundColor: themeColors.primary,
														color: 'white',
													},
												}}
											/>
										))}
									</Box>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					{/* Featured Posts */}
					{featuredData?.data && featuredData.data.length > 0 && (
						<Box mb={4}>
							<Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
								{t('blogView.sections.featuredPosts')}
							</Typography>
							<Grid container spacing={3}>
								{featuredData.data.map((post) => (
									<Grid item xs={12} md={4} key={post._id}>
										<PostCard post={post} isFeatured={true} />
									</Grid>
								))}
							</Grid>
						</Box>
					)}

					{/* All Posts */}
					<Box>
						<Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
							{selectedCategory === 'all' ? t('blogView.sections.allPosts') : `${categories.find(c => c.value === selectedCategory)?.label}`}
						</Typography>
						<Grid container spacing={3}>
							{postsData?.data?.map((post) => (
								<Grid item xs={12} sm={6} md={4} key={post._id}>
									<PostCard post={post} />
								</Grid>
							))}
						</Grid>
						{postsData?.data?.length === 0 && (
							<Box textAlign="center" py={4}>
								<ArticleIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
								<Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
									{t('blogView.messages.noPostsFound')}
								</Typography>
								<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
									{t('blogView.messages.tryAdjustingFilters')}
								</Typography>
							</Box>
						)}
					</Box>
				</>
			)}
		</Box>
	);
};

export default StudentBlogView;
