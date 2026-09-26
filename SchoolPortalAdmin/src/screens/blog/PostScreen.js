import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomAddButton from '../../components/Common/CustomAddButton';
import CustomInput from '../../components/Common/CustomInput';
import CustomSelect from '../../components/Common/CustomSelect';
import useModal from '../../hooks/modalHook';
import PostForm from '../../components/blog/PostForm';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, Grid, Button, MenuItem, CircularProgress, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';

import DataTable from '../../components/Common/CustomTable';
import { useListPostsQuery, useDeletePostMutation, useApprovePostMutation, useToggleLikeMutation } from '../../Redux/features/Blog/postSlice';
import moment from 'moment/moment';
import CustomDelete from '../../components/Common/CustomDelete';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { BASE_PATH } from '../../config';
import ArticleIcon from '@mui/icons-material/Article';
import SearchIcon from '@mui/icons-material/Search';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import PublishIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const resolveImageUrl = (src) => {
	if (!src) return '';
	if (typeof src !== 'string') return '';
	if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
	const trimmed = src.startsWith('/') ? src.slice(1) : src;
	return `${BASE_PATH}${trimmed}`;
};

const PostScreen = () => {
	const showSnackbar = useSnackbar();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();

	const { modal, openModal, closeModal } = useModal();
	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);
	const [optimisticLikes, setOptimisticLikes] = useState(new Set());
	const [loadingLikes, setLoadingLikes] = useState(new Set());
	const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

	const ability = useAbility();


	// Filters state
	const [filters, setFilters] = useState({
		search: '',
		status: '',
		category: '',
		authorRole: ''
	});

	const { control, setValue } = useForm({
		defaultValues: {
			search: filters.search,
			status: filters.status,
			category: filters.category,
			authorRole: filters.authorRole
		}
	});

	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10
	});

	// Fetch posts with filters
	const { data, isError, isLoading, isFetched, refetch, error } = useListPostsQuery({
		...filters,
		...pagination
	});

	// Transform data to include id field for DataGrid
	const transformedPosts = data?.data?.map(post => ({
		...post,
		id: post._id
	})) || [];

	const [deletePost] = useDeletePostMutation();
	const [approvePost] = useApprovePostMutation();
	const [toggleLike] = useToggleLikeMutation();

	const isPostLiked = (post) => {
		return optimisticLikes.has(post._id);
	};

	const getLikeCount = (post) => {
		return post.likeCount || 0;
	};

	// Sync form values with filters
	useEffect(() => {
		setValue('search', filters.search);
		setValue('status', filters.status);
		setValue('category', filters.category);
		setValue('authorRole', filters.authorRole);
	}, [filters, setValue]);

	// Initialize optimistic likes from posts data
	useEffect(() => {
		if (data?.data) {
			const likedPosts = new Set();
			data.data.forEach(post => {
				// Check if current user has liked this post
				if (post.userLiked || post.likedByUser) {
					likedPosts.add(post._id);
				}
			});
			setOptimisticLikes(likedPosts);
		}
	}, [data?.data]);

	const categories = React.useMemo(() => [
		{ value: 'academic', label: t('postScreen.categories.academic') },
		{ value: 'activities', label: t('postScreen.categories.activities') },
		{ value: 'news', label: t('postScreen.categories.news') },
		{ value: 'events', label: t('postScreen.categories.events') },
		{ value: 'student-life', label: t('postScreen.categories.studentLife') },
		{ value: 'sports', label: t('postScreen.categories.sports') },
		{ value: 'technology', label: t('postScreen.categories.technology') },
		{ value: 'other', label: t('postScreen.categories.other') }
	], [t]);

	const statuses = React.useMemo(() => [
		{ value: 'draft', label: t('postScreen.statuses.draft'), color: '#FF9800' },
		{ value: 'submitted', label: t('postScreen.statuses.submitted'), color: '#2196F3' },
		{ value: 'approved', label: t('postScreen.statuses.approved'), color: '#4CAF50' },
		{ value: 'published', label: t('postScreen.statuses.published'), color: '#4CAF50' },
		{ value: 'rejected', label: t('postScreen.statuses.rejected'), color: '#F44336' }
	], [t]);

	const handleApprove = useCallback(async (postId, status) => {
		try {
			await approvePost({ id: postId, data: { status } }).unwrap();
			const statusLabel = statuses.find(s => s.value === status)?.label || status;
			showSnackbar(t('postScreen.messages.statusUpdated', { status: statusLabel }), 'success');
			refetch();
		} catch (error) {
			showSnackbar(error?.data?.message || t('postScreen.messages.updateStatusFailed'), 'error');
		}
	}, [approvePost, statuses, t, showSnackbar, refetch]);

	const handleToggleLike = useCallback(async (postId) => {
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
			}
		} catch (error) {
			// Revert optimistic update on error
			if (isCurrentlyLiked) {
				setOptimisticLikes(prev => new Set([...prev, postId]));
			} else {
				setOptimisticLikes(prev => {
					const newSet = new Set(prev);
					newSet.delete(postId);
					return newSet;
				});
			}
			showSnackbar(error?.data?.message || t('postScreen.messages.toggleLikeFailed'), 'error');
		} finally {
			// Clear loading state
			setLoadingLikes(prev => {
				const newSet = new Set(prev);
				newSet.delete(postId);
				return newSet;
			});
		}
	}, [toggleLike, optimisticLikes, t, showSnackbar]);

	const columns = React.useMemo(() => [
		{
			field: 'SN',
			headerName: t('postScreen.table.sn'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
		},
		{
			field: 'title',
			headerName: t('postScreen.table.title'),
			flex: 2,
			headerAlign: 'center',
			align: 'left',
		},
		{
			field: 'author',
			headerName: t('postScreen.table.author'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => {
				const author = params.row.author;
				return author ? author.name : t('postScreen.table.na');
			}
		},
		{
			field: 'authorRole',
			headerName: t('postScreen.table.role'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => (
				<Chip
					label={row.authorRole}
					size="small"
					sx={{
						backgroundColor:
							row.authorRole === 'admin' ? '#9C27B0' :
								row.authorRole === 'teacher' ? '#2196F3' :
									row.authorRole === 'student' ? '#4CAF50' : '#757575',
						color: 'white',
						fontWeight: 'bold',
						fontSize: '0.75rem'
					}}
				/>
			)
		},
		{
			field: 'category',
			headerName: t('postScreen.table.category'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => (
				<Chip
					label={row.category}
					size="small"
					sx={{
						backgroundColor: themeColors.primary,
						color: 'white',
						fontWeight: 'bold',
						fontSize: '0.75rem'
					}}
				/>
			)
		},
		{
			field: 'status',
			headerName: t('postScreen.table.status'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => {
				const status = statuses.find(s => s.value === row.status);
				return (
					<Chip
						label={status?.label || row.status}
						size="small"
						sx={{
							backgroundColor: status?.color || '#757575',
							color: 'white',
							fontWeight: 'bold',
							fontSize: '0.75rem'
						}}
					/>
				);
			}
		},
		{
			field: 'viewCount',
			headerName: t('postScreen.table.views'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'likeCount',
			headerName: t('postScreen.table.likes'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => getLikeCount(row)
		},
		{
			field: 'created',
			headerName: t('postScreen.table.created'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.createdAt).format("DD-MM-YYYY")
		},
		{
			field: 'actions',
			headerName: t('postScreen.table.actions'),
			flex: 1.5,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Stack direction="row" spacing={1}>
					{ability.can("Read", "BlogView") && <Tooltip title={t('postScreen.actions.view')}>
						<IconButton
							size="small"
							onClick={() => {
								setItem(row);
								openModal('view');
							}}
							sx={{
								color: themeColors.primary,
								'&:hover': {
									backgroundColor: `${themeColors.primary}22`,
								},
							}}
						>
							<VisibilityIcon sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>}

					{ability.can("Edit", "BlogPosts") && <Tooltip title={t('postScreen.actions.edit')}>
						<IconButton
							size="small"
							onClick={() => {
								setItem(row);
								openModal('edit');
							}}
							sx={{
								color: themeColors.primary,
								'&:hover': {
									backgroundColor: `${themeColors.primary}22`,
								},
							}}
						>
							<EditIcon sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>}

					{ability.can("Like", "BlogPosts") && <Tooltip title={isPostLiked(row) ? t('postScreen.actions.unlike') : t('postScreen.actions.like')}>
						<IconButton
							size="small"
							onClick={() => handleToggleLike(row._id)}
							disabled={loadingLikes.has(row._id)}
							sx={{
								color: isPostLiked(row) ? '#4CAF50' : themeColors.text.secondary,
								'&:hover': {
									backgroundColor: '#4CAF5022',
								},
							}}
						>
							{loadingLikes.has(row._id) ? (
								<CircularProgress size={16} sx={{ color: themeColors.primary }} />
							) : isPostLiked(row) ? (
								<ThumbUpIcon sx={{ fontSize: 20 }} />
							) : (
								<ThumbUpOutlinedIcon sx={{ fontSize: 20 }} />
							)}
						</IconButton>
					</Tooltip>}

					{(row.status === 'submitted' && ability.can("Approve", "BlogPosts")) && (
						<Tooltip title={t('postScreen.actions.approve')}>
							<IconButton
								size="small"
								onClick={() => handleApprove(row._id, 'approved')}
								sx={{
									color: '#4CAF50',
									'&:hover': {
										backgroundColor: '#4CAF5022',
									},
								}}
							>
								<CheckIcon sx={{ fontSize: 20 }} />
							</IconButton>
						</Tooltip>
					)}

					{(row.status === 'approved' && ability.can("Publish", "BlogPosts")) && (
						<Tooltip title={t('postScreen.actions.publish')}>
							<IconButton
								size="small"
								onClick={() => handleApprove(row._id, 'published')}
								sx={{
									color: '#2196F3',
									'&:hover': {
										backgroundColor: '#2196F322',
									},
								}}
							>
								<PublishIcon sx={{ fontSize: 20 }} />
							</IconButton>
						</Tooltip>
					)}

					{ability.can("Delete", "BlogPosts") && <Tooltip title={t('postScreen.actions.delete')}>
						<IconButton
							size="small"
							onClick={() => {
								set_id(row._id);
								openModal('delete');
							}}
							sx={{
								color: themeColors.error,
								'&:hover': {
									backgroundColor: `${themeColors.error}22`,
								},
							}}
						>
							<DeleteIcon sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>}
				</Stack>
			),
		},
	], [t, themeColors, ability, isPostLiked, handleToggleLike, loadingLikes, handleApprove, openModal, setItem, set_id]);

	const handleDelete = useCallback(async (postId) => {
		try {
			await deletePost(postId).unwrap();
			showSnackbar(t('postScreen.messages.deleteSuccess'), 'success');
			closeModal('delete');
			refetch();
		} catch (error) {
			showSnackbar(error?.data?.message || t('postScreen.messages.deleteFailed'), 'error');
		}
	}, [deletePost, showSnackbar, closeModal, refetch, t]);

	const handleFilterChange = (field, value) => {
		setFilters(prev => ({ ...prev, [field]: value }));
		setValue(field, value);
		setPagination(prev => ({ ...prev, page: 1 }));
	};

	const handlePageChange = (newPage) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	};

	if (isError) {
		return (
			<CustomOutletBox>
				<ErrorInfo error={error} />
			</CustomOutletBox>
		);
	}

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
					<Box display="flex" alignItems="center" gap={2}>
						<ArticleIcon sx={{ fontSize: 32, color: themeColors.primary }} />
						<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('postScreen.title')}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center" gap={2}>
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							onChange={(e, newMode) => {
								if (newMode !== null) {
									setViewMode(newMode);
								}
							}}
							size="small"
							sx={{
								backgroundColor: themeColors.background.primary,
								border: `1px solid ${themeColors.border.primary}`,
								'& .MuiToggleButton-root': {
									color: themeColors.text.secondary,
									border: 'none',
									'&.Mui-selected': {
										backgroundColor: themeColors.primary,
										color: 'white',
										'&:hover': {
											backgroundColor: themeColors.primary,
										},
									},
									'&:hover': {
										backgroundColor: `${themeColors.primary}22`,
									},
								},
							}}
						>
							<ToggleButton value="table" aria-label="table view">
								<ViewListIcon sx={{ fontSize: 20 }} />
							</ToggleButton>
							<ToggleButton value="card" aria-label="card view">
								<ViewModuleIcon sx={{ fontSize: 20 }} />
							</ToggleButton>
						</ToggleButtonGroup>
						{ability.can("Create", "BlogPosts") && <CustomAddButton
							ClickEvent={() => {
								setItem(null);
								openModal('add');
							}}
							themeColors={themeColors}
						/>}
					</Box>
				</Box>

				{/* Filters */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
							{t('postScreen.filters.title')}
						</Typography>
						<Grid container spacing={2} alignItems="flex-end">
							<Grid item xs={12} md={3}>
								<Box>
									<Typography
										variant="subtitle2"
										sx={{
											color: themeColors.text.primary,
											mb: 1,
											fontSize: '14px',
											fontWeight: 'bold',
											fontFamily: 'Raleway, sans-serif'
										}}
									>
										{t('postScreen.filters.search')}
									</Typography>
									<CustomInput
										name="search"
										control={control}
										placeholder={t('postScreen.filters.searchPlaceholder')}
										cust_value={filters.search}
										changeValue={(value) => handleFilterChange('search', value)}
										Not={true}
										inputProps={{
											startAdornment: <SearchIcon sx={{ color: themeColors.text.secondary, mr: 1, fontSize: 20 }} />,
										}}
									/>
								</Box>
							</Grid>
							<Grid item xs={12} md={2}>
								<CustomSelect
									fieldName="status"
									control={control}
									fieldLabel={t('postScreen.filters.status')}
									onChangeValue={(value) => handleFilterChange('status', value)}
								>
									<MenuItem value="">{t('postScreen.filters.all')}</MenuItem>
									{statuses.map((status) => (
										<MenuItem key={status.value} value={status.value}>
											{status.label}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>
							<Grid item xs={12} md={2}>
								<CustomSelect
									fieldName="category"
									control={control}
									fieldLabel={t('postScreen.filters.category')}
									onChangeValue={(value) => handleFilterChange('category', value)}
								>
									<MenuItem value="">{t('postScreen.filters.all')}</MenuItem>
									{categories.map((category) => (
										<MenuItem key={category.value} value={category.value}>
											{category.label}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>
							<Grid item xs={12} md={2}>
								<CustomSelect
									fieldName="authorRole"
									control={control}
									fieldLabel={t('postScreen.filters.authorRole')}
									onChangeValue={(value) => handleFilterChange('authorRole', value)}
								>
									<MenuItem value="">{t('postScreen.filters.all')}</MenuItem>
									<MenuItem value="admin">{t('postScreen.filters.admin')}</MenuItem>
									<MenuItem value="teacher">{t('postScreen.filters.teacher')}</MenuItem>
									<MenuItem value="student">{t('postScreen.filters.student')}</MenuItem>
								</CustomSelect>
							</Grid>
							<Grid item xs={12} md={3}>
								<Box sx={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
									<Button
										variant="outlined"
										onClick={() => {
											const clearedFilters = {
												search: '',
												status: '',
												category: '',
												authorRole: ''
											};
											setFilters(clearedFilters);
											setValue('search', '');
											setValue('status', '');
											setValue('category', '');
											setValue('authorRole', '');
											setPagination({ page: 1, limit: 10 });
										}}
										sx={{
											borderColor: themeColors.border.primary,
											color: themeColors.text.primary,
											height: '40px',
											'&:hover': {
												borderColor: themeColors.primary,
												backgroundColor: `${themeColors.primary}22`,
											},
										}}
									>
										{t('postScreen.filters.clear')}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Posts View */}
				{viewMode === 'table' ? (
					<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<CardContent>
							<DataTable
								rows={transformedPosts}
								columns={columns}
								loading={isLoading}
								id="id"
								themeColors={themeColors}
								pagination={{
									currentPage: pagination.page,
									totalPages: data?.pagination?.totalPages || 1,
									totalItems: data?.pagination?.totalPosts || 0,
									onPageChange: handlePageChange
								}}
							/>
						</CardContent>
					</Card>
				) : (
					<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<CardContent>
							{isLoading ? (
								<Box display="flex" justifyContent="center" p={4}>
									<CircularProgress sx={{ color: themeColors.primary }} />
								</Box>
							) : (
								<>
									<Grid container spacing={3}>
										{transformedPosts.map((post) => (
											<Grid item xs={12} sm={6} md={4} lg={3} key={post._id}>
												<Card
													sx={{
														backgroundColor: themeColors.background.secondary,
														border: `1px solid ${themeColors.border.primary}`,
														height: '100%',
														display: 'flex',
														flexDirection: 'column',
														transition: 'all 0.3s ease',
														'&:hover': {
															transform: 'translateY(-4px)',
															boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
															borderColor: themeColors.primary
														}
													}}
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
															<Chip
																label={post.status}
																size="small"
																sx={{
																	backgroundColor:
																		post.status === 'published' ? '#4CAF50' :
																			post.status === 'approved' ? '#2196F3' :
																				post.status === 'submitted' ? '#FF9800' :
																					post.status === 'draft' ? '#757575' : '#F44336',
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
															{post.excerpt || post.content?.substring(0, 100) + '...'}
														</Typography>

														<Box display="flex" alignItems="center" gap={2} mb={2}>
															<Box display="flex" alignItems="center" gap={0.5}>
																<VisibilityIcon sx={{ fontSize: 14, color: themeColors.text.secondary }} />
																<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
																	{post.viewCount || 0}
																</Typography>
															</Box>
															<Box display="flex" alignItems="center" gap={0.5}>
																<ThumbUpIcon sx={{ fontSize: 14, color: themeColors.text.secondary }} />
																<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
																	{getLikeCount(post)}
																</Typography>
															</Box>
														</Box>

														<Box display="flex" alignItems="center" justifyContent="space-between">
															<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
																{post.author?.name || t('postScreen.anonymous')}
															</Typography>
															<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
																{moment(post.createdAt).format('MMM DD')}
															</Typography>
														</Box>

														<Box display="flex" justifyContent="center" gap={1} mt={2}>
															<Tooltip title={t('postScreen.actions.view')}>
																<IconButton
																	size="small"
																	onClick={() => {
																		setItem(post);
																		openModal('view');
																	}}
																	sx={{
																		color: themeColors.primary,
																		'&:hover': {
																			backgroundColor: `${themeColors.primary}22`,
																		},
																	}}
																>
																	<VisibilityIcon sx={{ fontSize: 20 }} />
																</IconButton>
															</Tooltip>

															<Tooltip title={t('postScreen.actions.edit')}>
																<IconButton
																	size="small"
																	onClick={() => {
																		setItem(post);
																		openModal('edit');
																	}}
																	sx={{
																		color: themeColors.primary,
																		'&:hover': {
																			backgroundColor: `${themeColors.primary}22`,
																		},
																	}}
																>
																	<EditIcon sx={{ fontSize: 20 }} />
																</IconButton>
															</Tooltip>

															<Tooltip title={isPostLiked(post) ? t('postScreen.actions.unlike') : t('postScreen.actions.like')}>
																<IconButton
																	size="small"
																	onClick={() => handleToggleLike(post._id)}
																	disabled={loadingLikes.has(post._id)}
																	sx={{
																		color: isPostLiked(post) ? '#4CAF50' : themeColors.text.secondary,
																		'&:hover': {
																			backgroundColor: '#4CAF5022',
																		},
																	}}
																>
																	{loadingLikes.has(post._id) ? (
																		<CircularProgress size={16} sx={{ color: themeColors.primary }} />
																	) : isPostLiked(post) ? (
																		<ThumbUpIcon sx={{ fontSize: 20 }} />
																	) : (
																		<ThumbUpOutlinedIcon sx={{ fontSize: 20 }} />
																	)}
																</IconButton>
															</Tooltip>

															{post.status === 'submitted' && (
																<Tooltip title={t('postScreen.actions.approve')}>
																	<IconButton
																		size="small"
																		onClick={() => handleApprove(post._id, 'approved')}
																		sx={{
																			color: '#4CAF50',
																			'&:hover': {
																				backgroundColor: '#4CAF5022',
																			},
																		}}
																	>
																		<CheckIcon sx={{ fontSize: 20 }} />
																	</IconButton>
																</Tooltip>
															)}

															{post.status === 'approved' && (
																<Tooltip title={t('postScreen.actions.publish')}>
																	<IconButton
																		size="small"
																		onClick={() => handleApprove(post._id, 'published')}
																		sx={{
																			color: '#2196F3',
																			'&:hover': {
																				backgroundColor: '#2196F322',
																			},
																		}}
																	>
																		<PublishIcon sx={{ fontSize: 20 }} />
																	</IconButton>
																</Tooltip>
															)}

															<Tooltip title={t('postScreen.actions.delete')}>
																<IconButton
																	size="small"
																	onClick={() => {
																		set_id(post._id);
																		openModal('delete');
																	}}
																	sx={{
																		color: themeColors.error,
																		'&:hover': {
																			backgroundColor: `${themeColors.error}22`,
																		},
																	}}
																>
																	<DeleteIcon sx={{ fontSize: 20 }} />
																</IconButton>
															</Tooltip>
														</Box>
													</CardContent>
												</Card>
											</Grid>
										))}
									</Grid>

									{/* Pagination for card view */}
									{data?.pagination && data.pagination.totalPages > 1 && (
										<Box display="flex" justifyContent="center" mt={3}>
											<Stack direction="row" spacing={1}>
												<Button
													variant="outlined"
													disabled={pagination.page === 1}
													onClick={() => handlePageChange(pagination.page - 1)}
													sx={{
														borderColor: themeColors.border.primary,
														color: themeColors.text.primary,
														'&:hover': {
															borderColor: themeColors.primary,
															backgroundColor: `${themeColors.primary}22`,
														},
													}}
												>
													{t('postScreen.pagination.previous')}
												</Button>
												<Typography variant="body2" sx={{ color: themeColors.text.secondary, display: 'flex', alignItems: 'center' }}>
													{t('postScreen.pagination.pageInfo', { current: pagination.page, total: data.pagination.totalPages })}
												</Typography>
												<Button
													variant="outlined"
													disabled={pagination.page === data.pagination.totalPages}
													onClick={() => handlePageChange(pagination.page + 1)}
													sx={{
														borderColor: themeColors.border.primary,
														color: themeColors.text.primary,
														'&:hover': {
															borderColor: themeColors.primary,
															backgroundColor: `${themeColors.primary}22`,
														},
													}}
												>
													{t('postScreen.pagination.next')}
												</Button>
											</Stack>
										</Box>
									)}
								</>
							)}
						</CardContent>
					</Card>
				)}

				{/* Add/Edit Modal */}
				<PostForm
					open={modal.addModal || modal.editModal}
					close={() => {
						closeModal('add');
						closeModal('edit');
					}}
					label={modal.editModal ? t('postScreen.form.editPost') : t('postScreen.form.createPost')}
					item={modal.editModal ? item : null}
					btnLabel={modal.editModal ? t('postScreen.form.update') : t('postScreen.form.create')}
				/>

        {/* Delete Confirmation Modal */}
        <CustomDelete
          open={modal.deleteModal}
          onClose={() => closeModal('delete')}
          fun={handleDelete}
          heading="Post"
          paragraph="post"
          _id={_id}
          fetch="posts"
        />

        {/* View Modal */}
        <Dialog
          open={modal.viewModal}
          onClose={() => closeModal('view')}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: themeColors.background.primary,
              border: `1px solid ${themeColors.border.primary}`,
            }
          }}
        >
          <DialogTitle sx={{ 
            color: themeColors.text.primary, 
            borderBottom: `1px solid ${themeColors.border.primary}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <ArticleIcon sx={{ color: themeColors.primary }} />
            {t('postScreen.viewModal.title')}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {item && (
              <Box>
                {/* Featured Image */}
                {item.featuredImage && (
                  <Box
                    sx={{
                      height: 300,
                      backgroundImage: `url(${resolveImageUrl(item.featuredImage)})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      borderRadius: 2,
                      mb: 3,
                      border: `1px solid ${themeColors.border.primary}`
                    }}
                  />
                )}

                {/* Post Meta Information */}
                <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                  <Chip
                    label={item.category}
                    size="small"
                    sx={{
                      backgroundColor: themeColors.primary,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      backgroundColor: 
                        item.status === 'published' ? '#4CAF50' :
                        item.status === 'approved' ? '#2196F3' :
                        item.status === 'submitted' ? '#FF9800' :
                        item.status === 'draft' ? '#757575' : '#F44336',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip
                    label={item.authorRole}
                    size="small"
                    sx={{
                      backgroundColor: 
                        item.authorRole === 'admin' ? '#9C27B0' :
                        item.authorRole === 'teacher' ? '#2196F3' :
                        item.authorRole === 'student' ? '#4CAF50' : '#757575',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>

                {/* Title */}
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                  {item.title}
                </Typography>

                {/* Author and Date */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: themeColors.primary,
                      fontSize: '0.875rem'
                    }}>
                      {item.author?.name?.charAt(0) || 'A'}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                      {item.author?.name || t('postScreen.anonymous')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    • {moment(item.createdAt).format('MMMM DD, YYYY')}
                  </Typography>
                </Box>

                {/* Excerpt */}
                {item.excerpt && (
                  <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 3, fontStyle: 'italic' }}>
                    {item.excerpt}
                  </Typography>
                )}

                {/* Content */}
                <Typography variant="body1" sx={{ 
                  color: themeColors.text.primary, 
                  mb: 3,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {item.content}
                </Typography>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 1 }}>
                      {t('postScreen.viewModal.tags')}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {item.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{
                            backgroundColor: `${themeColors.primary}22`,
                            color: themeColors.primary,
                            border: `1px solid ${themeColors.primary}`
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Stats */}
                <Box display="flex" alignItems="center" gap={3} mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <VisibilityIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                      {t('postScreen.viewModal.views', { count: item.viewCount || 0 })}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ThumbUpIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                      {t('postScreen.viewModal.likes', { count: getLikeCount(item) })}
                    </Typography>
                  </Box>
                </Box>

                {/* SEO Information */}
                {(item.seoTitle || item.seoDescription) && (
                  <Box sx={{ 
                    backgroundColor: themeColors.background.secondary, 
                    p: 2, 
                    borderRadius: 1,
                    border: `1px solid ${themeColors.border.primary}`
                  }}>
                    <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 2 }}>
                      {t('postScreen.viewModal.seoInformation')}
                    </Typography>
                    {item.seoTitle && (
                      <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                        <strong>{t('postScreen.viewModal.seoTitle')}:</strong> {item.seoTitle}
                      </Typography>
                    )}
                    {item.seoDescription && (
                      <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        <strong>{t('postScreen.viewModal.seoDescription')}:</strong> {item.seoDescription}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
            <Button
              onClick={() => closeModal('view')}
              variant="outlined"
              sx={{
                borderColor: themeColors.border.primary,
                color: themeColors.text.primary,
                '&:hover': {
                  borderColor: themeColors.primary,
                  backgroundColor: `${themeColors.primary}22`,
                },
              }}
            >
              {t('postScreen.viewModal.close')}
            </Button>
          </DialogActions>
        </Dialog>

        <CustomBackDrop open={isLoading} />
			</Box>
		</CustomOutletBox>
	);
};

export default PostScreen;
