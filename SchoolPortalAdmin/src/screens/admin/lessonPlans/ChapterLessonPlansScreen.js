import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	IconButton,
	Tooltip,
	Alert,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	FormGroup,
	FormControlLabel,
	Checkbox,
	TextField,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
	useDeleteLessonPlanMutation,
	useGetChapterQuery,
	useGetLessonPlansQuery,
	useGetLessonPlanPublishedProgressQuery,
	useUpdateLessonPlanPublishedProgressMutation,
} from '../../../Redux/features/Admin/lessonPlansApiSlice';
import DeleteDialog from '../../../components/Common/DeleteDialog';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSelector } from 'react-redux';

const ChapterLessonPlansScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();
	const { chapterId } = useParams();
	const {user, role} = useSelector((state) => state.auth);

	console.log({user, role});

	const [deleteLessonPlan] = useDeleteLessonPlanMutation();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [planToDelete, setPlanToDelete] = useState(null);
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);
	const [selectedLessonPlan, setSelectedLessonPlan] = useState(null);
	const [selectedPublishedClassIds, setSelectedPublishedClassIds] = useState([]);
	const [progressValue, setProgressValue] = useState('');
	const [progressSaving, setProgressSaving] = useState(false);
	const {
		data: chapterResponse,
		isFetching: chapterLoading,
		error: chapterError
	} = useGetChapterQuery(chapterId ?? skipToken);
	const chapter = chapterResponse?.data;

	const {
		data: lessonPlansResponse,
		isFetching: lessonPlansLoading,
		error: lessonPlansError
	} = useGetLessonPlansQuery(chapterId ? { chapter: chapterId } : skipToken);
	const lessonPlans = lessonPlansResponse?.data || [];
	const totalPlans = lessonPlans?.length || 0;

	const {
		data: publishedProgressResponse,
		isFetching: publishedProgressLoading,
	} = useGetLessonPlanPublishedProgressQuery(
		selectedLessonPlan?._id ?? skipToken,
		{ skip: !selectedLessonPlan }
	);
	const [updateLessonPlanPublishedProgress] = useUpdateLessonPlanPublishedProgressMutation();
	const availablePublishedClasses =
		publishedProgressResponse?.data?.publishedClasses || chapter?.publishedClasses || [];
	const hasPublishedClasses = (chapter?.publishedClasses?.length || 0) > 0;

	const formatPublishedClassLabel = (published) => {
		const genderLabel = published.gender
			? `${published.gender.charAt(0).toUpperCase()}${published.gender.slice(1)}`
			: t('lessonPlans.notAvailable');
		const sectionLabel = published.section?.sectionName || t('lessonPlans.notAvailable');
		const progressLabel = published.progress ?? 0;
		return `${genderLabel} / ${sectionLabel} • ${progressLabel}%`;
	};

	const handleOpenProgressDialog = (plan) => {
		setSelectedLessonPlan(plan);
		setProgressValue(plan.progress?.toString() ?? '0');
		setSelectedPublishedClassIds([]);
		setProgressDialogOpen(true);
	};

	const handleCloseProgressDialog = () => {
		setProgressDialogOpen(false);
		setSelectedLessonPlan(null);
		setSelectedPublishedClassIds([]);
		setProgressValue('');
	};

	const handleTogglePublishedClass = (id) => {
		setSelectedPublishedClassIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const handleSelectAllPublishedClasses = () => {
		if (selectedPublishedClassIds.length === availablePublishedClasses.length) {
			setSelectedPublishedClassIds([]);
			return;
		}
		setSelectedPublishedClassIds(availablePublishedClasses.map((published) => published._id));
	};

	const handleSaveProgress = async () => {
		if (!selectedLessonPlan) return;
		if (selectedPublishedClassIds.length === 0) {
			showSnackbar(t('lessonPlans.progressDialog.validation.selectClasses'), 'warning');
			return;
		}

		const numericProgress = progressValue === '' ? 0 : Number(progressValue);
		if (Number.isNaN(numericProgress) || numericProgress < 0 || numericProgress > 100) {
			showSnackbar(t('lessonPlans.form.progressRange'), 'error');
			return;
		}

		setProgressSaving(true);
		try {
			for (const publishedChapterId of selectedPublishedClassIds) {
				await updateLessonPlanPublishedProgress({
					id: selectedLessonPlan._id,
					data: {
						publishedChapterId,
						progress: numericProgress,
					},
				}).unwrap();
			}
			showSnackbar(t('lessonPlans.messages.updateSuccess'), 'success');
			handleCloseProgressDialog();
		} catch (error) {
			const message =
				error?.data?.message || error?.message || t('lessonPlans.messages.errorOccurred');
			showSnackbar(message, 'error');
		} finally {
			setProgressSaving(false);
		}
	};

	// Notify about chapter or lesson plan errors
	useEffect(() => {
		if (chapterError) {
			const errorMessage = chapterError?.data?.message || chapterError?.message || t('lessonPlans.messages.error');
			showSnackbar(errorMessage, 'error');
		}
		if (lessonPlansError) {
			const errorMessage = lessonPlansError?.data?.message || lessonPlansError?.message || t('lessonPlans.messages.error');
			showSnackbar(errorMessage, 'error');
		}
	}, [chapterError, lessonPlansError, showSnackbar, t]);

	const handleCreateLessonPlan = () => {
		navigate(`/lesson-plans/chapter/${chapterId}/create`);
	};

	const handleEditLessonPlan = (plan) => {
		navigate(`/lesson-plans/chapter/${chapterId}/edit/${plan._id}`);
	};

	const handleDeleteLessonPlan = (plan) => {
		setPlanToDelete(plan);
		setDeleteDialogOpen(true);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'completed':
				return 'success';
			case 'in-progress':
				return 'warning';
			case 'planned':
				return 'default';
			default:
				return 'default';
		}
	};

	const isFetchingData = chapterLoading || lessonPlansLoading;

	if (isFetchingData) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{
			p: 3,
			backgroundColor: themeColors.background.primary,
			minHeight: '100vh'
		}}>
			{/* Breadcrumbs */}
			<Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
				<Link
					underline="hover"
					sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
					onClick={() => navigate('/')}
				>
					{t('timetable.breadcrumbs.admin')}
				</Link>
				<Link
					underline="hover"
					sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
					onClick={() => navigate('/lesson-plans')}
				>
					{t('lessonPlans.title')}
				</Link>
				<Typography sx={{ color: themeColors.text.primary }}>
					{chapter ? chapter.chapterName : t('lessonPlans.chapter.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Box>
					<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{t('lessonPlans.chapter.title')}
					</Typography>
					{chapter && (
						<Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
							{chapter.chapterName} - {chapter.grade?.gradeName} - {chapter.subject?.subjectName}
						</Typography>
					)}
				</Box>
				{ability.can("Create", "LessonPlans") && (
					<Button
						variant="contained"
						startIcon={<ICONS.Add.component />}
						onClick={handleCreateLessonPlan}
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9
							}
						}}
					>
						{t('lessonPlans.chapter.addLessonPlan')}
					</Button>
				)}
			</Box>

			{/* Chapter Info */}
			{chapter && (
				<Card sx={{
					mb: 3,
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6} md={3}>
								<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
									{t('lessonPlans.chapter.chapterName')}
								</Typography>
								<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
									{chapter.chapterName}
								</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
									{t('lessonPlans.chapter.grade')}
								</Typography>
								<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
									{chapter.grade?.gradeName || t('lessonPlans.notAvailable')}
								</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
									{t('lessonPlans.chapter.subject')}
								</Typography>
								<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
									{chapter.subject?.subjectName || t('lessonPlans.notAvailable')}
								</Typography>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
									{t('lessonPlans.chapter.totalPlans')}
								</Typography>
								<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
									{totalPlans}
								</Typography>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Error Alert */}
			{(chapterError || lessonPlansError) && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{(chapterError?.data?.message || chapterError?.message || lessonPlansError?.data?.message || lessonPlansError?.message) || t('lessonPlans.messages.error')}
				</Alert>
			)}

			{/* Lesson Plans Table */}
			<Card sx={{
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					{isFetchingData ? (
						<Box display="flex" justifyContent="center" p={3}>
							<CircularProgress />
						</Box>
					) : (
						<>
							{lessonPlans && lessonPlans.length > 0 ? (
								<TableContainer component={Paper} variant="outlined">
									<Table>
										<TableHead>
											<TableRow sx={{ backgroundColor: themeColors.background.tertiary }}>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.order')}</TableCell>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.topic')}</TableCell>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.status')}</TableCell>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.progressActions')}</TableCell>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.startDate')}</TableCell>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.endDate')}</TableCell>
												<TableCell sx={{
													fontWeight: 'bold',
													color: themeColors.text.primary,
													backgroundColor: themeColors.background.tertiary
												}}>{t('lessonPlans.table.actions')}</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{lessonPlans.map((plan) => (
												<TableRow
													key={plan._id}
													sx={{
														backgroundColor: themeColors.background.secondary,
														'&:hover': {
															backgroundColor: themeColors.background.tertiary
														}
													}}
												>
													<TableCell sx={{ color: themeColors.text.primary }}>
														{plan.order || 0}
													</TableCell>
													<TableCell sx={{ color: themeColors.text.primary }}>
														<Typography variant="body2" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
															{plan.topic}
														</Typography>
														{plan.subTopics && plan.subTopics.length > 0 && (
															<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
																{Array.isArray(plan.subTopics) ? plan.subTopics.join(', ') : plan.subTopics}
															</Typography>
														)}
													</TableCell>
													<TableCell sx={{ color: themeColors.text.primary }}>
														<Chip
															label={t(`lessonPlans.status.${plan.status}`) || plan.status}
															size="small"
															color={getStatusColor(plan.status)}
															variant="outlined"
														/>
													</TableCell>
													<TableCell sx={{ color: themeColors.text.primary }}>
														<Tooltip title={t('lessonPlans.actions.updateProgress')}>
															<span>
																<IconButton
																	size="small"
																	onClick={() => handleOpenProgressDialog(plan)}
																	disabled={!hasPublishedClasses}
																	sx={{
																		color: themeColors.primary,
																		'&:hover': {
																			backgroundColor: `${themeColors.primary}20`
																		}
																	}}
																>
																	<TrendingUpIcon fontSize="small" />
																</IconButton>
															</span>
														</Tooltip>
													</TableCell>
													<TableCell sx={{ color: themeColors.text.primary }}>
														<Typography variant="body2">
															{plan.startDate ? moment(plan.startDate).format('MMM DD, YYYY') : '-'}
														</Typography>
													</TableCell>
													<TableCell sx={{ color: themeColors.text.primary }}>
														<Typography variant="body2">
															{plan.endDate ? moment(plan.endDate).format('MMM DD, YYYY') : '-'}
														</Typography>
													</TableCell>
													<TableCell sx={{ color: themeColors.text.primary }}>
														<Box display="flex" gap={1}>
															{((ability.can("Edit", "LessonPlans") && (plan?.createdBy?._id === user?._id || role === "admin"))) && (
																<Tooltip title={t('lessonPlans.actions.edit')}>
																	<IconButton
																		size="small"
																		onClick={() => handleEditLessonPlan(plan)}
																		sx={{
																			color: themeColors.warning,
																			'&:hover': {
																				backgroundColor: `${themeColors.warning}20`
																			}
																		}}
																	>
																		<ICONS.Edit.component fontSize="small" />
																	</IconButton>
																</Tooltip>
															)}
															{((ability.can("Delete", "LessonPlans") && (plan?.createdBy?._id === user?._id || role === "admin"))) && (
																<Tooltip title={t('lessonPlans.actions.delete')}>
																	<IconButton
																		size="small"
																		onClick={() => handleDeleteLessonPlan(plan)}
																		sx={{
																			color: themeColors.error,
																			'&:hover': {
																				backgroundColor: `${themeColors.error}20`
																			}
																		}}
																	>
																		<ICONS.Delete.component fontSize="small" />
																	</IconButton>
																</Tooltip>
															)}
														</Box>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							) : (
								<Box textAlign="center" py={6}>
									<Typography variant="h6" sx={{ mt: 2, color: themeColors.text.primary }}>
										{t('lessonPlans.chapter.noLessonPlans')}
									</Typography>
									<Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>
										{t('lessonPlans.chapter.createFirstLessonPlan')}
									</Typography>
								</Box>
							)}
						</>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={progressDialogOpen}
				onClose={handleCloseProgressDialog}
				maxWidth="sm"
				fullWidth
				PaperProps={{
					sx: {
						backgroundColor: themeColors.background.secondary,
						color: themeColors.text.primary,
					},
				}}
			>
				<DialogTitle sx={{ color: themeColors.text.primary }}>
					{t('lessonPlans.progressDialog.title')}
				</DialogTitle>
				<DialogContent dividers>
					{publishedProgressLoading ? (
						<Box display="flex" justifyContent="center" py={2}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<>
							<Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
								<Typography variant="subtitle2" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
									{t('lessonPlans.progressDialog.selectClasses')}
								</Typography>
								{availablePublishedClasses.length > 0 && (
									<Button
										size="small"
										onClick={handleSelectAllPublishedClasses}
										sx={{
											color: themeColors.primary,
											textTransform: 'none',
										}}
									>
										{selectedPublishedClassIds.length === availablePublishedClasses.length
											? t('lessonPlans.progressDialog.deselectAll')
											: t('lessonPlans.progressDialog.selectAll')}
									</Button>
								)}
							</Box>
							{availablePublishedClasses.length > 0 ? (
								<Paper
									variant="outlined"
									sx={{
										p: 2,
										maxHeight: 250,
										overflow: 'auto',
										backgroundColor: themeColors.background.primary,
										borderColor: themeColors.border.primary,
									}}
								>
									<FormGroup>
										{availablePublishedClasses.map((published) => (
											<FormControlLabel
												key={published._id}
												control={
													<Checkbox
														checked={selectedPublishedClassIds.includes(published._id)}
														onChange={() => handleTogglePublishedClass(published._id)}
														sx={{
															color: themeColors.primary,
															'&.Mui-checked': {
																color: themeColors.primary,
															},
														}}
													/>
												}
												label={
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{formatPublishedClassLabel(published)}
													</Typography>
												}
											/>
										))}
									</FormGroup>
								</Paper>
							) : (
								<Alert severity="info">
									{t('lessonPlans.progressDialog.noPublishedClasses')}
								</Alert>
							)}
							<Box mt={2}>
								<TextField
									label={t('lessonPlans.progressDialog.progressLabel')}
									value={progressValue}
									onChange={(e) => setProgressValue(e.target.value)}
									type="number"
									inputProps={{ min: 0, max: 100 }}
									fullWidth
									InputLabelProps={{ shrink: true }}
									sx={{
										'.MuiInputBase-root': {
											backgroundColor: themeColors.background.primary,
											borderRadius: 1,
											border: `1px solid ${themeColors.border.primary}`,
										},
										'& .MuiInputBase-input': {
											color: themeColors.text.primary,
										},
									}}
								/>
							</Box>
						</>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={handleCloseProgressDialog} sx={{ color: themeColors.text.primary }}>
						{t('lessonPlans.progressDialog.cancel')}
					</Button>
					<Button
						variant="contained"
						onClick={handleSaveProgress}
						disabled={!availablePublishedClasses.length || progressSaving || !selectedLessonPlan}
						startIcon={
							progressSaving ? <CircularProgress size={20} color="inherit" /> : null
						}
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9,
							},
						}}
					>
						{progressSaving ? t('lessonPlans.progressDialog.saving') : t('lessonPlans.progressDialog.apply')}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Dialog */}
			<DeleteDialog
				open={deleteDialogOpen}
				onClose={() => {
					setDeleteDialogOpen(false);
					setPlanToDelete(null);
				}}
				heading={t('lessonPlans.actions.delete')}
				paragraph={planToDelete?.topic || 'lesson plan'}
				fun={(id) => deleteLessonPlan(id)}
				_id={planToDelete?._id}
			/>
		</Box>
	);
};

export default ChapterLessonPlansScreen;
