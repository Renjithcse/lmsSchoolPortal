import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Grid,
	Button,
	MenuItem,
	Divider,
	Alert,
	CircularProgress,
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useForm, Controller } from 'react-hook-form';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomMultiSelect from '../../../components/Common/CustomMultiSelect';
import {
	useGetEventGalleryByIdQuery,
	usePublishEventGalleryMutation,
} from '../../../Redux/features/Admin/eventGallerySlice';
import {
	getPublishToOptions,
	getTargetTypeOptions,
	getGenderOptions,
} from '../../../api/information';
import {
	useLazyGetMyGradePermissionsQuery,
	useLazyGetMySectionPermissionsQuery,
} from '../../../Redux/features/Admin/TeachersSlice';
import { useGetSettingQuery } from '../../../Redux/features/Admin/SettingsSlice';
import { useTranslation } from 'react-i18next';

const EventGalleryPublish = () => {
	const { id } = useParams();
	const { themeColors } = useThemeContext();
	const navigate = useNavigate();
	const showSnackbar = useSnackbar();
	const { t } = useTranslation();

	// RTK Query hooks
	const { data: eventRes, isLoading: isLoadingEvent } = useGetEventGalleryByIdQuery(id);
	const event = eventRes?.data;
	const [publishEventGallery, { isLoading: publishing }] = usePublishEventGalleryMutation();

	// React Hook Form setup
	const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
		defaultValues: {
			publishTo: 'All Students',
			studentTargeting: {
				academicYear: '',
				targetType: 'All Students',
				gender: 'Both',
				grades: [],
				grade: '', // Single grade for Section Wise
				sectionGender: 'Both', // Single gender for Section Wise
				sections: [],
			},
		},
	});

	// Watch form values for conditional rendering
	const watchedValues = watch();
	const publishTo = watch('publishTo');
	const targetType = watch('studentTargeting.targetType');

	// API queries - Get academicYear from settings
	const { data: settingsData, isLoading: settingsLoading } = useGetSettingQuery();
	const currentAcademicYear = settingsData?.data?.academicYear?.academicYear || settingsData?.data?.academicYear;
	const [getGradePermissions, { data: grades, isLoading: gradesLoading }] = useLazyGetMyGradePermissionsQuery();
	const [getSectionPermissions, { data: sections, isLoading: sectionsLoading }] = useLazyGetMySectionPermissionsQuery();

	// Options
	const publishToOptions = getPublishToOptions();
	const targetTypeOptions = getTargetTypeOptions();
	const genderOptions = getGenderOptions();

	// Set academicYear from settings and load grades, and pre-populate existing publish settings
	useEffect(() => {
		if (currentAcademicYear) {
			setValue('studentTargeting.academicYear', currentAcademicYear);
			getGradePermissions();
		}
	}, [currentAcademicYear, setValue, getGradePermissions]);

	// Pre-populate form with existing publish settings if event is already published
	useEffect(() => {
		if (event && event.publishTo) {
			setValue('publishTo', event.publishTo);
		}
		if (event && event.studentTargeting) {
			const targeting = event.studentTargeting;
			if (targeting.targetType) {
				setValue('studentTargeting.targetType', targeting.targetType);
			}
			if (targeting.gender) {
				setValue('studentTargeting.gender', targeting.gender);
			}
			if (targeting.grades && targeting.grades.length > 0) {
				setValue('studentTargeting.grades', targeting.grades);
			}
			if (targeting.grade && targeting.grade.gradeName) {
				setValue('studentTargeting.grade', targeting.grade.gradeName);
			}
			if (targeting.sectionGender) {
				setValue('studentTargeting.sectionGender', targeting.sectionGender);
			}
			if (targeting.sections && targeting.sections.length > 0) {
				// Convert section objects to section IDs
				const sectionIds = targeting.sections.map((section) => section._id);
				setValue('studentTargeting.sections', sectionIds);
			}
		}
	}, [event, setValue]);

	// Load sections when form is pre-populated with Section Wise targeting
	useEffect(() => {
		if (
			event &&
			event.studentTargeting &&
			event.studentTargeting.targetType === 'Section Wise' &&
			event.studentTargeting.grade &&
			event.studentTargeting.grade.gradeName &&
			event.studentTargeting.sectionGender &&
			grades?.data
		) {
			const selectedGrade = grades.data.find(
				(grade) => grade.gradeName === event.studentTargeting.grade.gradeName
			);
			if (selectedGrade) {
				getSectionPermissions({
					grade: selectedGrade._id,
					gender: event.studentTargeting.sectionGender.toLowerCase(),
				});
			}
		}
	}, [event, grades, getSectionPermissions]);

	// Load sections when Section Wise is selected
	useEffect(() => {
		if (
			targetType === 'Section Wise' &&
			watchedValues.studentTargeting?.academicYear &&
			watchedValues.studentTargeting?.grade &&
			watchedValues.studentTargeting?.sectionGender
		) {
			// Find the grade ID from the grades data
			const selectedGrade = grades?.data?.find(
				(grade) => grade.gradeName === watchedValues.studentTargeting.grade
			);
			if (selectedGrade) {
				getSectionPermissions({
					grade: selectedGrade._id,
					gender: watchedValues.studentTargeting.sectionGender.toLowerCase(),
				});
			}
		}
	}, [
		targetType,
		watchedValues.studentTargeting?.academicYear,
		watchedValues.studentTargeting?.grade,
		watchedValues.studentTargeting?.sectionGender,
		getSectionPermissions,
		grades,
	]);

	// Form submission
	const onSubmit = async (data) => {
		try {
			// Ensure academicYear is set from settings
			const academicYearValue = currentAcademicYear || data.studentTargeting.academicYear;
			
			// Convert section IDs to section objects for submission
			const studentTargeting = {
				...data.studentTargeting,
				academicYear: academicYearValue,
				// Convert grade string to grade object
				grade: data.studentTargeting.grade
					? (() => {
							const gradeObj = grades?.data?.find(
								(g) => g.gradeName === data.studentTargeting.grade
							);
							return gradeObj
								? {
										_id: gradeObj._id,
										gradeName: gradeObj.gradeName,
									}
								: data.studentTargeting.grade;
						})()
					: data.studentTargeting.grade,
				sections:
					data.studentTargeting.sections?.map((sectionId) => {
						const section = sections?.data?.find((s) => s._id === sectionId);
						return section
							? {
									_id: section._id,
									sectionName: section.sectionName,
									grade: section.grade?.gradeName || section.gradeName,
									gender: section.gender || 'Both',
								}
							: null;
					}).filter(Boolean) || [],
			};

			const publishData = {
				publishTo: data.publishTo,
				studentTargeting: studentTargeting,
			};

			await publishEventGallery({ id, data: publishData }).unwrap();
			showSnackbar(
				event.status === 'Published'
					? t('eventGallery.publish.messages.updateSuccess')
					: t('eventGallery.publish.messages.publishSuccess'),
				'success'
			);
			navigate('/event-gallery');
		} catch (error) {
			showSnackbar(
				error?.data?.message || error?.message || t('eventGallery.publish.messages.publishError'),
				'error'
			);
		}
	};

	const handleCancel = () => {
		navigate('/event-gallery');
	};

	if (isLoadingEvent || settingsLoading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					backgroundColor: themeColors.background.primary,
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!event) {
		return (
			<Box
				sx={{
					p: 3,
					backgroundColor: themeColors.background.primary,
					minHeight: '100vh',
				}}
			>
				<Alert severity="error">{t('eventGallery.publish.messages.eventNotFound')}</Alert>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				p: 3,
				backgroundColor: themeColors.background.primary,
				minHeight: '100vh',
			}}
		>
			{/* Header */}
			<Box display="flex" alignItems="center" mb={3}>
				<Button
					startIcon={<ICONS.ArrowBack.component />}
					onClick={handleCancel}
					sx={{
						mr: 2,
						color: themeColors.text.primary,
						'&:hover': {
							backgroundColor: themeColors.background.secondary,
						},
					}}
				>
					{t('eventGallery.publish.back')}
				</Button>
				<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
					{event.status === 'Published'
						? t('eventGallery.publish.updateTitle', { eventName: event.eventName })
						: t('eventGallery.publish.title', { eventName: event.eventName })}
				</Typography>
			</Box>

			{/* Event Details Card */}
			<Card
				sx={{
					border: `1px solid ${themeColors.border.primary}`,
					mb: 3,
					backgroundColor: themeColors.background.secondary,
				}}
			>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('eventGallery.publish.eventDetails')}
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
								{t('eventGallery.publish.eventName')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
								{event.eventName}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
								{t('eventGallery.publish.description')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary }}>
								{event.description}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<form onSubmit={handleSubmit(onSubmit)}>
				<Grid container spacing={3}>
					{/* Publishing Configuration */}
					<Grid item xs={12} md={8}>
						<Card
							sx={{
								border: `1px solid ${themeColors.border.primary}`,
								mb: 3,
								backgroundColor: themeColors.background.secondary,
							}}
						>
							<CardContent>
								<Typography
									variant="h6"
									fontWeight="bold"
									sx={{ mb: 2, color: themeColors.text.primary }}
								>
									{t('eventGallery.publish.publishingConfig')}
								</Typography>

								<Grid container spacing={2}>
									<Grid item xs={12}>
										<CustomSelect
											fieldName="publishTo"
											control={control}
											fieldLabel={t('eventGallery.publish.publishTo')}
											error={errors.publishTo}
										>
											{publishToOptions.map((option) => (
												<MenuItem key={option.value} value={option.value}>
													{option.label}
												</MenuItem>
											))}
										</CustomSelect>
									</Grid>

									{/* Student Targeting (only for Specific Students) */}
									{publishTo === 'Specific Students' && (
										<>
											<Grid item xs={12}>
												<Divider sx={{ my: 1 }} />
												<Typography
													variant="subtitle2"
													fontWeight="bold"
													sx={{ color: themeColors.text.primary }}
												>
													{t('eventGallery.publish.studentTargeting')}
												</Typography>
											</Grid>

											{settingsLoading && (
												<Grid item xs={12}>
													<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
														<CircularProgress size={24} />
													</Box>
												</Grid>
											)}

											{!settingsLoading && !currentAcademicYear && (
												<Grid item xs={12}>
													<Alert severity="warning">
														{t('eventGallery.publish.messages.noAcademicYearInSettings')}
													</Alert>
												</Grid>
											)}

											<Grid item xs={12}>
												<CustomSelect
													fieldName="studentTargeting.targetType"
													control={control}
													fieldLabel={t('eventGallery.publish.targetType')}
													error={errors.studentTargeting?.targetType}
												>
													{targetTypeOptions.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</CustomSelect>
											</Grid>

											{/* Gender selection for Gender Wise and Grade and Gender Wise */}
											{['Gender Wise', 'Grade and Gender Wise'].includes(targetType) && (
												<Grid item xs={12}>
													<CustomSelect
														fieldName="studentTargeting.gender"
														control={control}
														fieldLabel={t('eventGallery.publish.gender')}
														error={errors.studentTargeting?.gender}
													>
														{genderOptions.map((option) => (
															<MenuItem key={option.value} value={option.value}>
																{option.label}
															</MenuItem>
														))}
													</CustomSelect>
												</Grid>
											)}

											{/* Gender selection for Section Wise (single select) */}
											{targetType === 'Section Wise' && (
												<Grid item xs={12}>
													<CustomSelect
														fieldName="studentTargeting.sectionGender"
														control={control}
														fieldLabel={t('eventGallery.publish.gender')}
														error={errors.studentTargeting?.sectionGender}
														onChangeValue={(value) => {
															// Clear sections when gender changes
															setValue('studentTargeting.sections', []);
														}}
													>
														{genderOptions.map((option) => (
															<MenuItem key={option.value} value={option.value}>
																{option.label}
															</MenuItem>
														))}
													</CustomSelect>
												</Grid>
											)}

											{/* Grade selection for Grade Wise and Grade and Gender Wise */}
											{['Grade Wise', 'Grade and Gender Wise'].includes(targetType) && (
												<Grid item xs={12}>
													<CustomMultiSelect
														fieldName="studentTargeting.grades"
														control={control}
														fieldLabel={t('eventGallery.publish.grades')}
														error={errors.studentTargeting?.grades}
													>
														{grades?.data && Array.isArray(grades.data)
															? grades.data.map((grade) => (
																	<MenuItem key={grade._id} value={grade.gradeName}>
																		{grade.gradeName}
																	</MenuItem>
																))
															: (
																<MenuItem disabled>
																	{gradesLoading
																		? t('eventGallery.publish.loadingGrades')
																		: t('eventGallery.publish.noGrades')}
																</MenuItem>
															)}
													</CustomMultiSelect>
												</Grid>
											)}

											{/* Grade selection for Section Wise (single select) */}
											{targetType === 'Section Wise' && (
												<Grid item xs={12}>
													<CustomSelect
														fieldName="studentTargeting.grade"
														control={control}
														fieldLabel={t('eventGallery.publish.grade')}
														error={errors.studentTargeting?.grade}
														onChangeValue={(value) => {
															// Clear sections when grade changes
															setValue('studentTargeting.sections', []);
														}}
													>
														{grades?.data && Array.isArray(grades.data)
															? grades.data.map((grade) => (
																	<MenuItem key={grade._id} value={grade.gradeName}>
																		{grade.gradeName}
																	</MenuItem>
																))
															: (
																<MenuItem disabled>
																	{gradesLoading
																		? t('eventGallery.publish.loadingGrades')
																		: t('eventGallery.publish.noGrades')}
																</MenuItem>
															)}
													</CustomSelect>
												</Grid>
											)}

											{/* Section selection for Section Wise targeting */}
											{targetType === 'Section Wise' &&
												watchedValues.studentTargeting?.grade &&
												watchedValues.studentTargeting?.sectionGender && (
													<Grid item xs={12}>
														<CustomMultiSelect
															fieldName="studentTargeting.sections"
															control={control}
															fieldLabel={t('eventGallery.publish.sections')}
															error={errors.studentTargeting?.sections}
														>
															{sections?.data && Array.isArray(sections.data)
																? sections.data.map((section) => (
																		<MenuItem key={section._id} value={section._id}>
																			{section.sectionName}{' '}
																			{section.gender && section.gender !== 'Both'
																				? `(${section.gender})`
																				: ''}
																		</MenuItem>
																	))
																: (
																	<MenuItem disabled>
																		{sectionsLoading
																			? t('eventGallery.publish.loadingSections')
																			: t('eventGallery.publish.selectGradeGenderFirst')}
																	</MenuItem>
																)}
														</CustomMultiSelect>
													</Grid>
												)}
										</>
									)}
								</Grid>
							</CardContent>
						</Card>
					</Grid>

					{/* Action Buttons */}
					<Grid item xs={12} md={4}>
						<Card
							sx={{
								border: `1px solid ${themeColors.border.primary}`,
								backgroundColor: themeColors.background.secondary,
							}}
						>
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={6}>
										<Button
											fullWidth
											variant="outlined"
											onClick={handleCancel}
											sx={{
												borderColor: themeColors.border.primary,
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.primary,
												'&:hover': {
													backgroundColor: themeColors.background.tertiary,
													borderColor: themeColors.primary,
												},
											}}
										>
											{t('eventGallery.publish.cancel')}
										</Button>
									</Grid>
									<Grid item xs={6}>
										<Button
											fullWidth
											type="submit"
											variant="contained"
											disabled={publishing || !currentAcademicYear}
											startIcon={publishing ? <CircularProgress size={20} /> : <ICONS.Save.component />}
											sx={{
												backgroundColor: themeColors.primary,
												color: themeColors.text.inverse,
												'&:hover': {
													backgroundColor: themeColors.primary,
													opacity: 0.9,
												},
											}}
										>
											{publishing
												? t('eventGallery.publish.publishing')
												: event.status === 'Published'
													? t('eventGallery.publish.updateButton')
													: t('eventGallery.publish.publishButton')}
										</Button>
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			</form>
		</Box>
	);
};

export default EventGalleryPublish;
