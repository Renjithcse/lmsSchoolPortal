import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Button, Chip, TextField, Divider, IconButton, Stack, Tabs, Tab, Tooltip, CircularProgress } from '@mui/material';
import { TextareaAutosize } from '@mui/base';
import { useForm, Controller } from 'react-hook-form';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomTextArea from '../../components/Common/CustomTextArea';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useGetPublishedPostsQuery, useGetFeaturedPostsQuery, useGetPostsByCategoryQuery, useToggleLikeMutation, useIncrementViewCountMutation } from '../../Redux/features/Blog/postSlice';
import { useGetCommentsQuery, useCreateCommentMutation, useToggleCommentLikeMutation } from '../../Redux/features/Blog/commentSlice';
import { useSnackbar } from '../../hooks/SnackBar';
import moment from 'moment/moment';
import ArticleIcon from '@mui/icons-material/Article';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { BASE_PATH } from '../../config';
import { useTranslation } from 'react-i18next';

const resolveImageUrl = (src) => {
	if (!src) return '';
	if (typeof src !== 'string') return '';
	if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
	const trimmed = src.startsWith('/') ? src.slice(1) : src;
	return `${BASE_PATH}${trimmed}`;
};

const BlogViewScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const { t } = useTranslation();

	// Form control for CustomTextArea
	const { control, setValue, watch } = useForm({
		defaultValues: {
			comment: ''
		}
	});

	const [selectedCategory, setSelectedCategory] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedPost, setSelectedPost] = useState(null);
	const [activeTab, setActiveTab] = useState(0);
	const [optimisticLikes, setOptimisticLikes] = useState(new Set());
	const [optimisticCommentLikes, setOptimisticCommentLikes] = useState(new Set());
	const [loadingLikes, setLoadingLikes] = useState(new Set());
	const [loadingCommentLikes, setLoadingCommentLikes] = useState(new Set());
	const [optimisticPosts, setOptimisticPosts] = useState({});
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

	// Initialize optimistic likes from posts data and preserve optimistic updates
	useEffect(() => {
		if (postsData?.data) {
			const likedPosts = new Set();
			postsData.data.forEach(post => {
				// Check if current user has liked this post
				// This assumes the server returns a userLiked field or similar
				if (post.userLiked || post.likedByUser) {
					likedPosts.add(post._id);
				}
			});
			setOptimisticLikes(likedPosts);
			
			// Preserve optimistic updates for view counts and comment counts
			// by merging server data with existing optimistic updates
			setOptimisticPosts(prev => {
				const newOptimisticPosts = { ...prev };
				postsData.data.forEach(post => {
					if (newOptimisticPosts[post._id]) {
						// Keep existing optimistic updates but update with server data
						newOptimisticPosts[post._id] = {
							...newOptimisticPosts[post._id],
							viewCount: newOptimisticPosts[post._id].viewCount || post.viewCount || 0,
							commentCount: newOptimisticPosts[post._id].commentCount || post.commentCount || 0
						};
					}
				});
				return newOptimisticPosts;
			});
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



	const categories = React.useMemo(() => [
		{ value: 'all', label: t('blogView.categories.all') },
		{ value: 'academic', label: t('blogView.categories.academic') },
		{ value: 'activities', label: t('blogView.categories.activities') },
		{ value: 'news', label: t('blogView.categories.news') },
		{ value: 'events', label: t('blogView.categories.events') },
		{ value: 'student-life', label: t('blogView.categories.studentLife') },
		{ value: 'sports', label: t('blogView.categories.sports') },
		{ value: 'technology', label: t('blogView.categories.technology') },
		{ value: 'other', label: t('blogView.categories.other') }
	], [t]);

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
			// The server response might contain the updated like status
			if (result && result.data) {
				// If server returns updated like status, sync with optimistic state
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
			showSnackbar(t('blogView.messages.likePostFailed'), 'error');
		} finally {
			// Clear loading state
			setLoadingLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(postId);
				return newSet;
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
			showSnackbar(t('blogView.messages.likeCommentFailed'), 'error');
		} finally {
			// Clear loading state
			setLoadingCommentLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(commentId);
				return newSet;
			});
		}
	};

	const handleSubmitComment = async () => {
		const commentValue = String(watch('comment') || '');
		if (!commentValue.trim()) {
			showSnackbar(t('blogView.messages.commentRequired'), 'error');
			return;
		}

		try {
			await createComment({
				postId: selectedPost._id,
				content: commentValue
			}).unwrap();
			setValue('comment', '');
			refetchComments();
			showSnackbar(t('blogView.messages.commentSubmitted'), 'success');
		} catch (error) {
			showSnackbar(error?.data?.message || t('blogView.messages.commentSubmitFailed'), 'error');
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

	const handlePostClick = async (post) => {
		// Optimistically update the view count
		const updatedViewCount = (post.viewCount || 0) + 1;
		
		// Update selectedPost
		setSelectedPost(prev => {
			if (prev && prev._id === post._id) {
				return prev;
			}
			return {
				...post,
				viewCount: updatedViewCount
			};
		});

		// Update optimistic posts
		setOptimisticPosts(prev => ({
			...prev,
			[post._id]: {
				...prev[post._id],
				viewCount: updatedViewCount
			}
		}));

		// Make API call to increment view count on server
		try {
			await incrementViewCount(post._id).unwrap();
		} catch (error) {
			// Revert optimistic update on error
			setSelectedPost(prev => {
				if (prev && prev._id === post._id) {
					return {
						...prev,
						viewCount: post.viewCount || 0
					};
				}
				return prev;
			});

			setOptimisticPosts(prev => ({
				...prev,
				[post._id]: {
					...prev[post._id],
					viewCount: post.viewCount || 0
				}
			}));
		}
	};

	

	// Separate CommentForm component to prevent parent re-renders
	const CommentForm = React.memo(() => {
		const [localCommentText, setLocalCommentText] = useState('');
		
		const handleLocalSubmit = async () => {
			if (!localCommentText.trim()) {
				showSnackbar(t('blogView.messages.commentRequired'), 'error');
				return;
			}

			try {
				// Optimistically update the comment count
				const updatedCommentCount = (selectedPost.commentCount || 0) + 1;
				
				setSelectedPost(prev => ({
					...prev,
					commentCount: updatedCommentCount
				}));

				// Update optimistic posts
				setOptimisticPosts(prev => ({
					...prev,
					[selectedPost._id]: {
						...prev[selectedPost._id],
						commentCount: updatedCommentCount
					}
				}));

				const result = await createComment({
					postId: selectedPost._id,
					content: localCommentText
				}).unwrap();
				
				setLocalCommentText('');
				refetchComments();
				
				// Use server response comment count if available, otherwise use optimistic count
				const finalCommentCount = result.commentCount !== undefined ? result.commentCount : updatedCommentCount;
				
				// Update selectedPost with final comment count
				setSelectedPost(prev => ({
					...prev,
					commentCount: finalCommentCount
				}));
				
				// Update optimistic posts instead of refetching to preserve view count updates
				setOptimisticPosts(prev => ({
					...prev,
					[selectedPost._id]: {
						...prev[selectedPost._id],
						commentCount: finalCommentCount
					}
				}));
				showSnackbar(t('blogView.messages.commentSubmitted'), 'success');
			} catch (error) {
				// Revert the optimistic update on error
				const revertedCommentCount = Math.max(0, (selectedPost.commentCount || 1) - 1);
				
				setSelectedPost(prev => ({
					...prev,
					commentCount: revertedCommentCount
				}));

				// Revert optimistic posts
				setOptimisticPosts(prev => ({
					...prev,
					[selectedPost._id]: {
						...prev[selectedPost._id],
						commentCount: revertedCommentCount
					}
				}));
				
				showSnackbar(error?.data?.message || t('blogView.messages.commentSubmitFailed'), 'error');
			}
		};

		return (
			<Box display="flex" gap={1} mb={3}>
				<Box sx={{ flex: 1 }}>
					<TextareaAutosize
						style={{ 
							width: '100%',
							borderRadius: "8px", 
							minHeight: 33, 
							color: themeColors.text.primary, 
							border: `1px solid ${themeColors.border.primary}`, 
							padding: 12,
							backgroundColor: themeColors.background.primary,
							fontFamily: 'Raleway, sans-serif',
							fontSize: '14px',
							resize: 'vertical',
							outline: 'none',
						}}
						minRows={2}
						maxRows={6}
						readOnly={false}
						value={localCommentText}
						onChange={(e) => setLocalCommentText(e.target.value)}
						placeholder={t('blogView.commentPlaceholder')}
						onFocus={(e) => {
							e.target.style.borderColor = themeColors.primary;
							e.target.style.boxShadow = `0 0 0 2px ${themeColors.primary}20`;
						}}
						onBlur={(e) => {
							e.target.style.borderColor = themeColors.border.primary;
							e.target.style.boxShadow = 'none';
						}}
					/>
				</Box>
				<Button
					variant="contained"
					onClick={handleLocalSubmit}
					disabled={!localCommentText.trim()}
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



	const formatReadingTime = (content) => {
		if (!content || typeof content !== 'string') return 1;
		const wordsPerMinute = 200;
		const wordCount = content.split(' ').length;
		return Math.ceil(wordCount / wordsPerMinute);
	};

	const truncateText = (text, maxLength = 150) => {
		if (!text || typeof text !== 'string') return t('blogView.noContent');
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
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

	const isPostLiked = (post) => {
		return optimisticLikes.has(post._id);
	};

	const getPostViewCount = (post) => {
		// Check if we have optimistic updates for this post
		if (optimisticPosts[post._id]) {
			return optimisticPosts[post._id].viewCount || post.viewCount || 0;
		}
		// For selectedPost, use the updated viewCount
		if (selectedPost && selectedPost._id === post._id) {
			return selectedPost.viewCount || post.viewCount || 0;
		}
		// For other posts, use the original count from server
		return post.viewCount || 0;
	};

	const getPostCommentCount = (post) => {
		// Check if we have optimistic updates for this post
		if (optimisticPosts[post._id]) {
			return optimisticPosts[post._id].commentCount || post.commentCount || 0;
		}
		// For selectedPost, use the updated commentCount
		if (selectedPost && selectedPost._id === post._id) {
			return selectedPost.commentCount || post.commentCount || 0;
		}
		// For other posts, use the original count from server
		return post.commentCount || 0;
	};

	const PostCard = ({ post, isFeatured = false }) => (
		<Card
			sx={{
				backgroundColor: themeColors.background.primary,
				border: `1px solid ${themeColors.border.primary}`,
				cursor: 'pointer',
				transition: 'all 0.3s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
					borderColor: themeColors.primary
				},
				...(isFeatured && {
					borderColor: themeColors.primary,
					borderWidth: 2
				})
			}}
			onClick={() => handlePostClick(post)}
		>
			{post.featuredImage && (
				<Box
					sx={{
						height: 200,
						backgroundImage: `url(${resolveImageUrl(post.featuredImage)})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						borderTopLeftRadius: 8,
						borderTopRightRadius: 8
					}}
				/>
			)}
			<CardContent>
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
					{isFeatured && (
						<Chip
							label={t('blogView.featured')}
							size="small"
							sx={{
								backgroundColor: '#FF9800',
								color: 'white',
								fontWeight: 'bold',
								fontSize: '0.7rem'
							}}
						/>
					)}
				</Box>

				<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
					{post.title}
				</Typography>

				<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2 }}>
					{truncateText(post.excerpt || post.content)}
				</Typography>

				<Box display="flex" alignItems="center" gap={2} mb={2}>
					<Box display="flex" alignItems="center" gap={0.5}>
						<PersonIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
						<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
							{post.author?.name || t('blogView.anonymous')}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={0.5}>
						<AccessTimeIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
						<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
							{formatReadingTime(post.content)} {t('blogView.minRead')}
						</Typography>
					</Box>
				</Box>

				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Box display="flex" alignItems="center" gap={2}>
						<Box display="flex" alignItems="center" gap={0.5}>
							<VisibilityIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
							<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
								{getPostViewCount(post)}
							</Typography>
						</Box>
						<Box display="flex" alignItems="center" gap={0.5}>
							<CommentIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
							<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
								{getPostCommentCount(post)}
							</Typography>
						</Box>
						<Box display="flex" alignItems="center" gap={0.5}>
							<Tooltip title={isPostLiked(post) ? t('blogView.unlike') : t('blogView.like')}>
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
										<CircularProgress size={16} sx={{ color: themeColors.primary }} />
									) : (
										<ThumbUpIcon sx={{ fontSize: 16 }} />
									)}
								</IconButton>
							</Tooltip>
							<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
								{getLikeCount(post)}
							</Typography>
						</Box>
					</Box>
					<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
						{moment(post.publishedAt || post.createdAt).format('MMM DD, YYYY')}
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
							label={t('blogView.featured')}
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
							backgroundSize: 'contain',
							backgroundPosition: 'center',
							backgroundRepeat: 'no-repeat',
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
							{post.author?.name || t('blogView.anonymous')}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={1}>
						<AccessTimeIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{formatReadingTime(post.content)} {t('blogView.minRead')}
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
						{loadingLikes.has(post._id) ? t('blogView.loading') : `${isPostLiked(post) ? t('blogView.unlike') : t('blogView.like')} (${getLikeCount(post)})`}
					</Button>
					<Box display="flex" alignItems="center" gap={1}>
						<CommentIcon sx={{ color: themeColors.text.secondary }} />
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{getPostCommentCount(post)} {t('blogView.comments')}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={1}>
						<VisibilityIcon sx={{ color: themeColors.text.secondary }} />
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{getPostViewCount(post)} {t('blogView.views')}
						</Typography>
					</Box>
				</Box>

				{/* Comments Section */}
				<Box>
					<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
						{t('blogView.comments')} ({getPostCommentCount(post)})
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
													{comment.user?.name || t('blogView.anonymous')}
												</Typography>
												{!comment.isApproved && (
													<Chip
														label={t('blogView.pendingApproval')}
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
												{comment.isEdited && ` (${t('blogView.edited')})`}
											</Typography>
										</Box>
									</Box>
									<Typography variant="body2" sx={{ color: themeColors.text.primary, mb: 1 }}>
										{comment.content}
									</Typography>
									<Box display="flex" alignItems="center" gap={1}>
										<Tooltip title={optimisticCommentLikes.has(comment._id) ? t('blogView.unlike') : t('blogView.like')}>
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
										</Tooltip>
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
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
					<Box display="flex" alignItems="center" gap={2}>
						<ArticleIcon sx={{ fontSize: 32, color: themeColors.primary }} />
						<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('blogView.title')}
						</Typography>
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
							{t('blogView.backToPosts')}
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
										<Box sx={{ position: 'relative' }}>
											<TextField
												fullWidth
												placeholder={t('blogView.searchPlaceholder')}
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
														fontFamily: 'Raleway, sans-serif',
														fontSize: '14px',
													},
													'& .MuiInputBase-root': {
														backgroundColor: themeColors.background.primary,
														borderRadius: '8px',
													},
												}}
											/>
										</Box>
									</Grid>
									<Grid item xs={12} md={6}>
										<Box display="flex" gap={1} flexWrap="wrap">
											{categories.map((category) => (
												<Chip
													key={category.value}
													label={category.label}
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
									{t('blogView.featuredPosts')}
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
								{selectedCategory === 'all' ? t('blogView.allPosts') : `${categories.find(c => c.value === selectedCategory)?.label}`}
							</Typography>
							<Grid container spacing={3}>
								{postsData?.data?.map((post) => (
									<Grid item xs={12} md={4} key={post._id}>
										<PostCard post={post} />
									</Grid>
								))}
							</Grid>
							{postsData?.data?.length === 0 && (
								<Box textAlign="center" py={4}>
									<Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
										{t('blogView.noPostsFound')}
									</Typography>
								</Box>
							)}
						</Box>
					</>
				)}
			</Box>
		</CustomOutletBox>
	);
};

export default BlogViewScreen;
