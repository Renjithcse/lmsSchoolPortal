import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	TextField,
	MenuItem,
	Alert,
	CircularProgress
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyTeacherSubjectsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import {
	getChapterAsync,
	updateChapterAsync,
	clearError,
	clearSuccess
} from '../../../Redux/features/Admin/chaptersSlice';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

const EditChapterScreen = () => {
	const { themeColors } = useThemeContext();
	const dispatch = useDispatch();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const { id } = useParams();
	const ability = useAbility();
	const { t } = useTranslation();

	const { currentChapter, loading, error, success } = useSelector(state => state.chapters);

	// Form state
	const [formData, setFormData] = useState({
		chapterName: '',
		description: '',
		grade: '',
		subject: '',
		status: 'active'
	});

	// Form control for CustomSelect components
	const { control, setValue } = useForm({
		defaultValues: {
			grade: '',
			subject: '',
			status: 'active'
		}
	});

	// Permission queries - only need grade and subject permissions now
	const [getGradePermissions, { data: grades }] = useLazyGetMyGradePermissionsQuery();
	const [getTeacherSubjects, { data: teacherSubjects }] = useLazyGetMyTeacherSubjectsQuery();

	// Refs to track the last triggered values for cascading filters
	const lastGradeId = useRef(null);

	// Load chapter data
	useEffect(() => {
		if (id) {
			dispatch(getChapterAsync(id));
		}
	}, [dispatch, id]);

	// Load permissions - only grades initially
	useEffect(() => {
		getGradePermissions({});
	}, [getGradePermissions]);

	// Load subjects when grade is selected
	useEffect(() => {
		if (formData.grade && formData.grade !== lastGradeId.current) {
			lastGradeId.current = formData.grade;
			getTeacherSubjects({ grade: formData.grade });
		}
	}, [formData.grade, getTeacherSubjects]);

	// Initialize form data when chapter is loaded
	useEffect(() => {
		if (currentChapter) {
			const chapterData = {
				chapterName: currentChapter.chapterName || '',
				description: currentChapter.description || '',
				grade: currentChapter.grade?._id || '',
				subject: currentChapter.subject?._id || '',
				status: currentChapter.status || 'active'
			};

			setFormData(chapterData);

			// Set form values for CustomSelect components
			setValue('grade', chapterData.grade);
			setValue('subject', chapterData.subject);
			setValue('status', chapterData.status);
		}
	}, [currentChapter, setValue]);

	// Handle success/error messages
	useEffect(() => {
		if (success) {
			showSnackbar(t('lessonPlans.edit.messages.updateSuccess'), 'success');
			dispatch(clearSuccess());
			navigate('/lesson-plans');
		}
		if (error) {
			showSnackbar(error.message || t('lessonPlans.edit.messages.error'), 'error');
			dispatch(clearError());
		}
	}, [success, error, showSnackbar, dispatch, navigate, t]);

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleSubmit = async () => {
		// Validation
		if (!formData.chapterName || !formData.description || !formData.subject) {
			showSnackbar(t('lessonPlans.edit.validation.fillRequiredFields'), 'error');
			return;
		}

		// Prepare request data
		const data = {
			chapterName: formData.chapterName,
			description: formData.description,
			status: formData.status
		};

		dispatch(updateChapterAsync({ id: currentChapter._id, formData: data }));
	};


	if (loading && !currentChapter) {
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
			{/* Header */}
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Box display="flex" alignItems="center" gap={2}>
					<Button
						startIcon={<ICONS.ArrowBack.component />}
						onClick={() => navigate('/lesson-plans')}
						sx={{
							color: themeColors.text.primary,
							'&:hover': {
								backgroundColor: themeColors.background.secondary
							}
						}}
					>
						{t('lessonPlans.edit.backToChapters')}
					</Button>
					<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{t('lessonPlans.edit.title')}
					</Typography>
				</Box>
				{ability.can("Edit", "Chapters") && <Button
					variant="contained"
					onClick={handleSubmit}
					disabled={loading}
					startIcon={loading ? <CircularProgress size={20} /> : <ICONS.Save.component />}
					sx={{
						backgroundColor: themeColors.primary,
						color: themeColors.text.inverse,
						'&:hover': {
							backgroundColor: themeColors.primary,
							opacity: 0.9
						}
					}}
				>
					{loading ? t('lessonPlans.edit.updating') : t('lessonPlans.edit.updateChapter')}
				</Button>}
			</Box>

			{/* Error Alert */}
			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error.message || t('lessonPlans.edit.messages.error')}
				</Alert>
			)}

			{/* Class Information Display */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('lessonPlans.edit.classInformation')}
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('lessonPlans.edit.grade')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentChapter?.grade?.gradeName || t('lessonPlans.edit.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('lessonPlans.edit.form.subject')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentChapter?.subject?.subjectName || t('lessonPlans.edit.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('lessonPlans.edit.lessonPlanCount')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentChapter?.lessonPlans?.length || 0}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Published Classes */}
			{currentChapter?.publishedClasses && currentChapter.publishedClasses.length > 0 && (
				<Card sx={{
					mb: 3,
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
							{t('lessonPlans.edit.publishedClasses')}
						</Typography>
						<Grid container spacing={2}>
							{currentChapter.publishedClasses.map((published, index) => (
								<Grid item xs={12} sm={6} md={4} key={published._id || index}>
									<Box sx={{
										p: 2,
										border: `1px solid ${themeColors.border.primary}`,
										borderRadius: 1,
										backgroundColor: themeColors.background.primary
									}}>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
											{t('lessonPlans.edit.gender')}
										</Typography>
										<Typography variant="body1" fontWeight="medium" textTransform="capitalize" sx={{ mb: 1, color: themeColors.text.primary }}>
											{published.gender || t('lessonPlans.edit.notAvailable')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
											{t('lessonPlans.edit.section')}
										</Typography>
										<Typography variant="body1" fontWeight="medium" sx={{ mb: 1, color: themeColors.text.primary }}>
											{published.section?.sectionName || t('lessonPlans.edit.notAvailable')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
											{t('lessonPlans.edit.publishedDate')}
										</Typography>
										<Typography variant="body2" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
											{published.publishedAt ? moment(published.publishedAt).format('MMMM DD, YYYY [at] h:mm A') : t('lessonPlans.edit.notAvailable')}
										</Typography>
									</Box>
								</Grid>
							))}
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Chapter Form */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
						{t('lessonPlans.edit.chapterInformation')}
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label={t('lessonPlans.edit.form.chapterName')}
								value={formData.chapterName}
								onChange={(e) => handleInputChange('chapterName', e.target.value)}
								error={!formData.chapterName}
								helperText={!formData.chapterName ? t('lessonPlans.edit.form.chapterNameRequired') : ''}
								placeholder={t('lessonPlans.edit.form.enterChapterName')}
								sx={{
									'& .MuiOutlinedInput-root': {
										backgroundColor: themeColors.background.primary,
										'& fieldset': {
											borderColor: themeColors.border.primary,
										},
										'&:hover fieldset': {
											borderColor: themeColors.primary.main,
										},
										'&.Mui-focused fieldset': {
											borderColor: themeColors.primary.main,
										},
									},
									'& .MuiInputLabel-root': {
										color: themeColors.text.primary,
									},
									'& .MuiOutlinedInput-input': {
										color: themeColors.text.primary,
									}
								}}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="body2" sx={{ mb: 1, color: themeColors.text.secondary }}>{t('lessonPlans.edit.form.subject')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentChapter?.subject?.subjectName || t('lessonPlans.edit.notAvailable')}
							</Typography>
						</Grid>

						<Grid item xs={12}>
							<TextField
								fullWidth
								label={t('lessonPlans.edit.form.description')}
								multiline
								rows={4}
								value={formData.description}
								onChange={(e) => handleInputChange('description', e.target.value)}
								error={!formData.description}
								helperText={!formData.description ? t('lessonPlans.edit.form.descriptionRequired') : ''}
								placeholder={t('lessonPlans.edit.form.enterDetailedDescription')}
								sx={{
									'& .MuiOutlinedInput-root': {
										backgroundColor: themeColors.background.primary,
										'& fieldset': {
											borderColor: themeColors.border.primary,
										},
										'&:hover fieldset': {
											borderColor: themeColors.primary.main,
										},
										'&.Mui-focused fieldset': {
											borderColor: themeColors.primary.main,
										},
									},
									'& .MuiInputLabel-root': {
										color: themeColors.text.primary,
									},
									'& .MuiOutlinedInput-input': {
										color: themeColors.text.primary,
									}
								}}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<CustomSelect
								fieldName="status"
								control={control}
								fieldLabel={t('lessonPlans.edit.form.status')}
								onChangeValue={(value) => handleInputChange('status', value)}
							>
								<MenuItem value="active">{t('lessonPlans.edit.form.active')}</MenuItem>
								<MenuItem value="inactive">{t('lessonPlans.edit.form.inactive')}</MenuItem>
							</CustomSelect>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		</Box>
	);
};

export default EditChapterScreen;
