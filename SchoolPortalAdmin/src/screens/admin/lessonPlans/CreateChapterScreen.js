import React, { useState, useEffect } from 'react';
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
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Checkbox,
	FormControlLabel,
	FormGroup,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
	useLazyGetMyGradePermissionsQuery,
	useLazyGetMyTeacherSubjectsQuery
} from '../../../Redux/features/Admin/TeachersSlice';
import {
	useCreateChapterMutation,
	useLazyGetAvailablePublishSectionsQuery,
	usePublishChapterMutation
} from '../../../Redux/features/Admin/lessonPlansApiSlice';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const CreateChapterScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();

	// Basic info state (Grade and Subject only)
	const [basicInfo, setBasicInfo] = useState({
		grade: '',
		subject: ''
	});

	// Chapter state
	const [chapter, setChapter] = useState({
		chapterName: '',
		description: '',
		status: 'active'
	});

	const [basicInfoLocked, setBasicInfoLocked] = useState(false);
	const [publishModalOpen, setPublishModalOpen] = useState(false);
	const [createdChapterId, setCreatedChapterId] = useState(null);
	const [selectedGender, setSelectedGender] = useState('');
	const [selectedSections, setSelectedSections] = useState([]);

	const [createChapter, { data: createChapterData, isLoading: creating, isSuccess: createSuccess, error: createError }] =
		useCreateChapterMutation();
	const [publishChapter, { isLoading: publishing, error: publishError }] =
		usePublishChapterMutation();
	const [loadPublishSections, { data: publishSectionsResponse, error: publishSectionsError }] =
		useLazyGetAvailablePublishSectionsQuery();
	const availablePublishSections = publishSectionsResponse?.data || [];
	const displayError = createError || publishError || publishSectionsError;

	// Form control
	const { control, setValue } = useForm({
		defaultValues: {
			grade: '',
			subject: ''
		}
	});

	// Permission queries
	const [getGradePermissions, { data: grades }] = useLazyGetMyGradePermissionsQuery();
	const [getTeacherSubjects, { data: teacherSubjects, isLoading: subjectsLoading }] = useLazyGetMyTeacherSubjectsQuery();

	// Load permissions - only grades initially
	useEffect(() => {
		getGradePermissions();
	}, [getGradePermissions]);

	// Load teacher's subjects when grade is selected
	useEffect(() => {
		if (basicInfo.grade) {
			getTeacherSubjects({ 
				grade: basicInfo.grade
			});
		}
	}, [basicInfo.grade, getTeacherSubjects]);

	useEffect(() => {
		if (createSuccess) {
			showSnackbar(t('lessonPlans.create.messages.createSuccess'), 'success');
			setCreatedChapterId(createChapterData?.data?._id || null);
		}
	}, [createSuccess, createChapterData, showSnackbar, t]);

	const handleBasicInfoChange = (field, value) => {
		setBasicInfo(prev => ({
			...prev,
			[field]: value
		}));
		setValue(field, value);
		
		// Clear subject when grade changes
		if (field === 'grade') {
			setBasicInfo(prev => ({ ...prev, subject: '' }));
			setValue('subject', '');
		}
	};

	const lockBasicInfo = () => {
		if (!basicInfo.grade || !basicInfo.subject) {
			showSnackbar(t('lessonPlans.create.validation.fillAllBasicInfo'), 'error');
			return;
		}
		setBasicInfoLocked(true);
	};

	const unlockBasicInfo = () => {
		setBasicInfoLocked(false);
		setChapter({
			chapterName: '',
			description: '',
			status: 'active'
		});
		setCreatedChapterId(null);
	};

	const updateChapter = (field, value) => {
		setChapter(prev => ({ ...prev, [field]: value }));
	};

	const validateChapter = () => {
		if (!chapter.chapterName || !chapter.description) {
			showSnackbar(t('lessonPlans.create.validation.fillRequiredFields'), 'error');
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		if (!validateChapter()) return;

		try {
			const data = {
				chapterName: chapter.chapterName,
				description: chapter.description,
				grade: basicInfo.grade,
				subject: basicInfo.subject,
				status: 'active'
			};

			const response = await createChapter(data).unwrap();
			setCreatedChapterId(response.data?._id || null);
		} catch (error) {
			const message = error?.data?.message || error?.message || t('lessonPlans.create.messages.error');
			showSnackbar(message, 'error');
		}
	};

	const handleOpenPublishModal = async () => {
		if (!createdChapterId) {
			showSnackbar(t('lessonPlans.create.messages.createChapterFirst'), 'warning');
			return;
		}

		setPublishModalOpen(true);
	};

	const handleGenderChange = async (gender) => {
		setSelectedGender(gender);
		setSelectedSections([]);

		if (basicInfo.grade && gender) {
			try {
				await loadPublishSections({
					grade: basicInfo.grade,
					gender,
					subject: basicInfo.subject,
					chapterId: createdChapterId
				});
			} catch (error) {
				showSnackbar(t('lessonPlans.create.messages.errorLoadingSections'), 'error');
			}
		}
	};

	const handlePublish = async () => {
		if (!selectedGender || selectedSections.length === 0) {
			showSnackbar(t('lessonPlans.create.validation.selectGenderAndSections'), 'error');
			return;
		}

		try {
			const response = await publishChapter({
				chapterId: createdChapterId,
				data: {
					gender: selectedGender,
					sections: selectedSections
				}
			}).unwrap();
			const publishedCount = response.data?.publishedCount || 0;
			showSnackbar(
				t('lessonPlans.create.messages.publishSuccess', { count: publishedCount }),
				'success'
			);
			setPublishModalOpen(false);
			navigate('/lesson-plans');
		} catch (error) {
			const message = error?.data?.message || error?.message || t('lessonPlans.create.messages.publishError');
			showSnackbar(message, 'error');
		}
	};


	const getTextFieldStyles = () => ({
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
	});

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
					{t('lessonPlans.create.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
				{ability.can("Create", "Chapters") && (
					<Box display="flex" gap={2}>
						{createdChapterId && (
							<Button
								variant="outlined"
								startIcon={<ICONS.Publish.component />}
								onClick={handleOpenPublishModal}
								sx={{
									borderColor: themeColors.primary,
									color: themeColors.primary,
									backgroundColor: themeColors.background.primary,
									'&:hover': {
										backgroundColor: themeColors.background.tertiary,
										borderColor: themeColors.primary
									}
								}}
							>
								{t('lessonPlans.create.publish')}
							</Button>
						)}
						<Button
							variant="contained"
							onClick={handleSubmit}
							disabled={creating || !basicInfoLocked}
							startIcon={creating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
							sx={{
								backgroundColor: themeColors.primary,
								color: themeColors.text.inverse,
								'&:hover': {
									backgroundColor: themeColors.primary,
									opacity: 0.9
								}
							}}
						>
							{creating ? t('lessonPlans.create.creating') : t('lessonPlans.create.createChapter')}
						</Button>
					</Box>
				)}
			</Box>

			{/* Error Alert */}
			{displayError && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{displayError?.data?.message || displayError?.message || t('lessonPlans.create.messages.error')}
				</Alert>
			)}

			{/* Basic Information Section */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
						<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('lessonPlans.create.basicInformation')}
						</Typography>
						{!basicInfoLocked ? (
							<Button
								variant="contained"
								size="small"
								onClick={lockBasicInfo}
								startIcon={<ICONS.Save.component />}
								sx={{
									backgroundColor: themeColors.primary,
									color: themeColors.text.inverse,
									'&:hover': {
										backgroundColor: themeColors.primary,
										opacity: 0.9
									}
								}}
							>
								{t('lessonPlans.create.lockAndContinue')}
							</Button>
						) : (
							<Button
								variant="outlined"
								size="small"
								onClick={unlockBasicInfo}
								startIcon={<ICONS.Edit.component />}
								sx={{
									borderColor: themeColors.border.primary,
									color: themeColors.text.primary,
									backgroundColor: themeColors.background.primary,
									'&:hover': {
										backgroundColor: themeColors.background.tertiary,
										borderColor: themeColors.primary
									}
								}}
							>
								{t('lessonPlans.create.editBasicInfo')}
							</Button>
						)}
					</Box>

					<Grid container spacing={3}>
						<Grid item xs={12} sm={6} md={6}>
							<CustomSelect
								fieldName="grade"
								control={control}
								fieldLabel={t('lessonPlans.create.form.grade')}
								onChangeValue={(value) => handleBasicInfoChange('grade', value)}
								disabled={basicInfoLocked}
							>
								{grades?.data?.map((grade) => (
									<MenuItem key={grade._id} value={grade._id}>
										{grade.gradeName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>

						<Grid item xs={12} sm={6} md={6}>
							<CustomSelect
								fieldName="subject"
								control={control}
								fieldLabel={t('lessonPlans.create.form.subject')}
								onChangeValue={(value) => handleBasicInfoChange('subject', value)}
								disabled={basicInfoLocked || !basicInfo.grade || subjectsLoading}
							>
								{subjectsLoading ? (
									<MenuItem disabled>{t('lessonPlans.create.loading')}</MenuItem>
								) : teacherSubjects?.data?.map((subject) => (
									<MenuItem key={subject._id} value={subject._id}>
										{subject.subjectName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>
					</Grid>

					{basicInfoLocked && (
						<Box mt={2} p={2} sx={{
							backgroundColor: themeColors.background.primary,
							borderRadius: 1,
							border: `1px solid ${themeColors.border.primary}`
						}}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								<strong style={{ color: themeColors.text.primary }}>{t('lessonPlans.create.selectedInfo')}:</strong> {' '}
								<span style={{ color: themeColors.text.primary }}>
									{grades?.data?.find(g => g._id === basicInfo.grade)?.gradeName} - {' '}
									{teacherSubjects?.data?.find(s => s._id === basicInfo.subject)?.subjectName}
								</span>
							</Typography>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Chapter Details Section */}
			{basicInfoLocked && (
				<Card sx={{
					mb: 3,
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
							{t('lessonPlans.create.chapterDetails')}
						</Typography>

						<Grid container spacing={3}>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label={t('lessonPlans.create.form.chapterName')}
									value={chapter.chapterName}
									onChange={(e) => updateChapter('chapterName', e.target.value)}
									error={!chapter.chapterName}
									helperText={!chapter.chapterName ? t('lessonPlans.create.form.chapterNameRequired') : ''}
									placeholder={t('lessonPlans.create.form.enterChapterName')}
									sx={getTextFieldStyles()}
								/>
							</Grid>

							<Grid item xs={12}>
								<TextField
									fullWidth
									label={t('lessonPlans.create.form.description')}
									multiline
									rows={4}
									value={chapter.description}
									onChange={(e) => updateChapter('description', e.target.value)}
									error={!chapter.description}
									helperText={!chapter.description ? t('lessonPlans.create.form.descriptionRequired') : ''}
									placeholder={t('lessonPlans.create.form.enterDetailedDescription')}
									sx={getTextFieldStyles()}
								/>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Publish Modal */}
			<Dialog
				open={publishModalOpen}
				onClose={() => setPublishModalOpen(false)}
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
					{t('lessonPlans.create.publishTitle')}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<CustomSelect
								fieldName="publishGender"
								control={control}
								fieldLabel={t('lessonPlans.create.form.gender')}
								onChangeValue={handleGenderChange}
							>
								<MenuItem value="male">{t('lessonPlans.create.gender.male')}</MenuItem>
								<MenuItem value="female">{t('lessonPlans.create.gender.female')}</MenuItem>
							</CustomSelect>
						</Grid>

						{selectedGender && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" sx={{ mb: 1, color: themeColors.text.primary }}>
									{t('lessonPlans.create.selectSections')}
								</Typography>
								<FormGroup>
									{availablePublishSections.map((section) => (
										<FormControlLabel
											key={section._id}
											control={
												<Checkbox
													checked={selectedSections.includes(section._id)}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedSections([...selectedSections, section._id]);
														} else {
															setSelectedSections(selectedSections.filter(id => id !== section._id));
														}
													}}
													sx={{
														color: themeColors.primary,
														'&.Mui-checked': {
															color: themeColors.primary
														}
													}}
												/>
											}
											label={section.sectionName}
											sx={{ color: themeColors.text.primary }}
										/>
									))}
								</FormGroup>
								{availablePublishSections.length === 0 && (
									<Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>
										{t('lessonPlans.create.noSectionsAvailable')}
									</Typography>
								)}
							</Grid>
						)}
					</Grid>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() => setPublishModalOpen(false)}
						sx={{ color: themeColors.text.primary }}
					>
						{t('lessonPlans.create.cancel')}
					</Button>
					<Button
						onClick={handlePublish}
						disabled={!selectedGender || selectedSections.length === 0 || publishing}
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
						{publishing ? t('lessonPlans.create.publishing') : t('lessonPlans.create.publish')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default CreateChapterScreen;
