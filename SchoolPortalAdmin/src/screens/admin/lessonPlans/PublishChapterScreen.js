import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	MenuItem,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
	Alert,
	Chip,
	Checkbox,
	FormControlLabel,
	FormGroup,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import {
	getChapterAsync,
	publishChapterAsync,
	getAvailablePublishSectionsAsync,
	clearError
} from '../../../Redux/features/Admin/chaptersSlice';
import { useLazyGetMyGenderPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';

const PublishChapterScreen = () => {
	const { themeColors } = useThemeContext();
	const dispatch = useDispatch();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();
	const { id } = useParams();

	const { loading, error, currentChapter: chapter } = useSelector(state => state.chapters);
	const [publishModalOpen, setPublishModalOpen] = useState(false);
	const [publishLoading, setPublishLoading] = useState(false);
	const [selectedGender, setSelectedGender] = useState('');
	const [selectedSections, setSelectedSections] = useState([]);
	const [availableSections, setAvailableSections] = useState([]);
	const [publishedClasses, setPublishedClasses] = useState([]);

	// Form control
	const { control, setValue } = useForm({
		defaultValues: {
			gender: ''
		}
	});

	// Permission queries
	const [getGenderPermissions, { data: genders, isLoading: genderLoading }] = useLazyGetMyGenderPermissionsQuery();

	// Load chapter
	useEffect(() => {
		if (id) {
			dispatch(getChapterAsync(id));
		}
	}, [id, dispatch]);

	// Load genders when chapter is loaded
	useEffect(() => {
		if (chapter?.grade) {
			getGenderPermissions({ grade: chapter.grade._id });
		}
	}, [chapter?.grade, getGenderPermissions]);

	// Fetch available publish sections when gender changes
	useEffect(() => {
		if (selectedGender && chapter?.grade && chapter?.subject && chapter?._id) {
			dispatch(getAvailablePublishSectionsAsync({
				grade: chapter.grade._id,
				gender: selectedGender,
				subject: chapter.subject._id,
				chapterId: chapter._id
			})).then((result) => {
				if (result.type.endsWith('/fulfilled')) {
					setAvailableSections(result.payload.data || []);
				}
			});
		}
	}, [selectedGender, chapter, dispatch]);

	// Extract published classes from the chapter
	useEffect(() => {
		if (chapter) {
			// Get published classes from the publishedClasses array
			if (chapter.publishedClasses && chapter.publishedClasses.length > 0) {
				setPublishedClasses(chapter.publishedClasses.map(pc => ({
					_id: pc._id,
					gender: pc.gender,
					section: pc.section,
					publishedAt: pc.publishedAt,
					publishedBy: pc.publishedBy
				})));
			} else {
				setPublishedClasses([]);
			}
		}
	}, [chapter]);

	// Handle error messages
	useEffect(() => {
		if (error) {
			showSnackbar(error.message || t('lessonPlans.publish.messages.error'), 'error');
			dispatch(clearError());
		}
	}, [error, showSnackbar, dispatch, t]);

	const handleOpenPublishModal = () => {
		setPublishModalOpen(true);
		setSelectedGender('');
		setSelectedSections([]);
	};

	const handleClosePublishModal = () => {
		setPublishModalOpen(false);
		setSelectedGender('');
		setSelectedSections([]);
	};

	const handleGenderChange = (value) => {
		setSelectedGender(value);
		setSelectedSections([]);
		setValue('gender', value);
	};

	const handleSectionToggle = (sectionId) => {
		if (selectedSections.includes(sectionId)) {
			setSelectedSections(selectedSections.filter(id => id !== sectionId));
		} else {
			setSelectedSections([...selectedSections, sectionId]);
		}
	};

	const handleSelectAllSections = () => {
		if (selectedSections.length === availableSections.length) {
			setSelectedSections([]);
		} else {
			setSelectedSections(availableSections.map(s => s._id));
		}
	};

	const handlePublish = async () => {
		if (!selectedGender || selectedSections.length === 0) {
			showSnackbar(t('lessonPlans.publish.validation.selectGenderAndSections'), 'error');
			return;
		}

		setPublishLoading(true);
		try {
			const result = await dispatch(publishChapterAsync({
				chapterId: id,
				data: {
					gender: selectedGender,
					sections: selectedSections
				}
			}));

			if (result.type.endsWith('/fulfilled')) {
				showSnackbar(t('lessonPlans.publish.messages.success'), 'success');
				handleClosePublishModal();
				// Reload the chapter to get updated published classes
				dispatch(getChapterAsync(id));
			} else {
				showSnackbar(result.payload?.message || t('lessonPlans.publish.messages.error'), 'error');
			}
		} catch (error) {
			showSnackbar(t('lessonPlans.publish.messages.error'), 'error');
		} finally {
			setPublishLoading(false);
		}
	};

	if (loading && !chapter) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!chapter) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">{t('lessonPlans.publish.messages.chapterNotFound')}</Alert>
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
					{t('lessonPlans.publish.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
				{ability.can("Edit", "Chapters") && (
					<Button
						variant="contained"
						startIcon={<ICONS.Publish.component />}
						onClick={handleOpenPublishModal}
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9
							}
						}}
					>
						{t('lessonPlans.publish.newPublish')}
					</Button>
				)}
			</Box>

			{/* Chapter Info Card */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('lessonPlans.publish.chapterInfo')}
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('lessonPlans.publish.chapterName')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'medium' }}>
								{chapter.chapterName}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('lessonPlans.publish.grade')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'medium' }}>
								{chapter.grade?.gradeName || t('lessonPlans.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('lessonPlans.publish.subject')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'medium' }}>
								{chapter.subject?.subjectName || t('lessonPlans.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('lessonPlans.publish.status')}
							</Typography>
							<Chip
								label={t(`lessonPlans.status.${chapter.status}`) || chapter.status}
								color={chapter.status === 'active' ? 'success' : 'default'}
								size="small"
								variant="outlined"
							/>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Published Classes Table */}
			<Card sx={{
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('lessonPlans.publish.publishedClasses')}
					</Typography>
					{publishedClasses.length === 0 ? (
						<Alert severity="info">{t('lessonPlans.publish.noPublishedClasses')}</Alert>
					) : (
						<TableContainer component={Paper} variant="outlined">
							<Table>
								<TableHead>
									<TableRow sx={{ backgroundColor: themeColors.background.tertiary }}>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('lessonPlans.publish.gender')}</TableCell>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('lessonPlans.publish.section')}</TableCell>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('lessonPlans.publish.publishedAt')}</TableCell>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('lessonPlans.publish.publishedBy')}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{publishedClasses.map((published, index) => (
										<TableRow
											key={published._id || index}
											sx={{
												backgroundColor: themeColors.background.secondary,
												'&:hover': {
													backgroundColor: themeColors.background.tertiary
												}
											}}
										>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{published.gender?.charAt(0).toUpperCase() + published.gender?.slice(1) || t('lessonPlans.notAvailable')}
											</TableCell>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{published.section?.sectionName || t('lessonPlans.notAvailable')}
											</TableCell>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{moment(published.publishedAt).format('MMM DD, YYYY HH:mm')}
											</TableCell>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{published.publishedBy?.name || t('lessonPlans.notAvailable')}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</CardContent>
			</Card>

			{/* Publish Modal */}
			<Dialog
				open={publishModalOpen}
				onClose={handleClosePublishModal}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						backgroundColor: themeColors.background.secondary,
						color: themeColors.text.primary
					}
				}}
			>
				<DialogTitle sx={{ color: themeColors.text.primary }}>
					{t('lessonPlans.publish.modalTitle')}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={3} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<CustomSelect
								fieldName="gender"
								control={control}
								fieldLabel={t('lessonPlans.publish.selectGender')}
								onChangeValue={handleGenderChange}
								disabled={genderLoading}
							>
								<MenuItem value="">{t('lessonPlans.publish.selectGender')}</MenuItem>
								{genders?.data?.map((gender) => (
									<MenuItem key={gender} value={gender}>
										{gender.charAt(0).toUpperCase() + gender.slice(1)}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>

						{selectedGender && availableSections.length > 0 && (
							<Grid item xs={12}>
								<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
									<Typography variant="subtitle2" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
										{t('lessonPlans.publish.selectSections')}
									</Typography>
									<Button
										size="small"
										onClick={handleSelectAllSections}
										sx={{
											color: themeColors.primary,
											textTransform: 'none'
										}}
									>
										{selectedSections.length === availableSections.length 
											? t('lessonPlans.publish.deselectAll') 
											: t('lessonPlans.publish.selectAll')}
									</Button>
								</Box>
								<Paper 
									variant="outlined"
									sx={{
										p: 2,
										maxHeight: 300,
										overflow: 'auto',
										backgroundColor: themeColors.background.primary,
										borderColor: themeColors.border.primary
									}}
								>
									<FormGroup>
										{availableSections.map((section) => (
											<FormControlLabel
												key={section._id}
												control={
													<Checkbox
														checked={selectedSections.includes(section._id)}
														onChange={() => handleSectionToggle(section._id)}
														sx={{
															color: themeColors.primary,
															'&.Mui-checked': {
																color: themeColors.primary
															}
														}}
													/>
												}
												label={section.sectionName}
												sx={{
													color: themeColors.text.primary,
													'&:hover': {
														backgroundColor: themeColors.background.secondary,
														borderRadius: 1
													}
												}}
											/>
										))}
									</FormGroup>
								</Paper>
								{selectedSections.length > 0 && (
									<Typography variant="caption" sx={{ mt: 1, color: themeColors.text.secondary, display: 'block' }}>
										{t('lessonPlans.publish.selectedCount', { count: selectedSections.length })}
									</Typography>
								)}
							</Grid>
						)}
						{selectedGender && availableSections.length === 0 && (
							<Grid item xs={12}>
								<Alert severity="info">{t('lessonPlans.publish.noSectionsAvailable')}</Alert>
							</Grid>
						)}
					</Grid>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={handleClosePublishModal}
						sx={{ color: themeColors.text.primary }}
					>
						{t('lessonPlans.publish.cancel')}
					</Button>
					<Button
						onClick={handlePublish}
						disabled={!selectedGender || selectedSections.length === 0 || publishLoading}
						variant="contained"
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9
							}
						}}
					>
						{publishLoading ? t('lessonPlans.publish.publishing') : t('lessonPlans.publish.publish')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default PublishChapterScreen;
