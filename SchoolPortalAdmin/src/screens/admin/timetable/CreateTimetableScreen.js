import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
	Box,
	Typography,
	Button,
	MenuItem,
	Grid,
	Card,
	CardContent,
	Chip,
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
	Breadcrumbs,
	Link
} from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomInput from '../../../components/Common/CustomInput';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import { useCreateTimetableMutation, useLazyGetAvailableSubjectsAndTeachersQuery, useLazyGetSchoolTimingsForTimetableQuery } from '../../../Redux/features/Admin/timetableApiSlice';
import { useNavigate } from 'react-router-dom';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CustomBackDrop from '../../../components/Common/CustomBackDrop';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const CreateTimetableScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();

	const [createTimetable, { isLoading: isCreating, isSuccess: createSuccess, error: createError }] =
		useCreateTimetableMutation();
	const [loadAvailableSubjects, { data: availableSubjectsResponse }] =
		useLazyGetAvailableSubjectsAndTeachersQuery();
	const [loadSchoolTimings, { data: schoolTimingsResponse }] =
		useLazyGetSchoolTimingsForTimetableQuery();

	const availableSubjects = availableSubjectsResponse?.data?.subjects || [];
	const schoolTimings = schoolTimingsResponse?.data;

	// Debug schoolTimings when it changes
	useEffect(() => {
		if (schoolTimings) {
			console.log('School timings received:', schoolTimings);
			console.log('School timings structure:', {
				hasTimings: !!schoolTimings.timings,
				hasPeriodDuration: !!schoolTimings.periodDuration,
				hasBreaks: !!schoolTimings.breaks,
				timingsObject: schoolTimings.timings || schoolTimings
			});
		}
	}, [schoolTimings]);

	// React Hook Form
	const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
		defaultValues: {
			name: '',
			academicYear: '',
			term: '',
			grade: '',
			gender: '',
			section: '',
			status: 'draft'
		}
	});

	// Watch form values for cascading effects
	const watchedValues = watch();

	// Additional state for timetable data
	const [weeklyTimetable, setWeeklyTimetable] = useState({
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: []
	});

	const [isAutoGenerating, setIsAutoGenerating] = useState(false);

	// API calls - using same structure as AttendanceReportMenu
	const { data: academicYear, isFetching: academicLoading } = useGetAcademicYearQuery();
	const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
	const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

	// Refs to track the last triggered values for cascading filters
	const lastAcademicYear = useRef(null);
	const lastGradeId = useRef(null);

	// Trigger grades when component loads
	useEffect(() => {
		triggerGrades({});
	}, [triggerGrades]);

	// Cascading filter effects - using same logic as AttendanceReportMenu
	useEffect(() => {
		if (watchedValues.academicYear && watchedValues.academicYear !== lastAcademicYear.current) {
			lastAcademicYear.current = watchedValues.academicYear;
			// Trigger grades for the selected academic year
			triggerGrades({ academicYear: watchedValues.academicYear });
			// Clear dependent fields
			setValue('grade', '');
			setValue('gender', '');
			setValue('section', '');
		}
	}, [watchedValues.academicYear, triggerGrades, setValue]);

	useEffect(() => {
		if (watchedValues.grade && watchedValues.grade !== lastGradeId.current) {
			lastGradeId.current = watchedValues.grade;
			const data = { grade: watchedValues.grade };
			if (watchedValues.academicYear) data.academicYear = watchedValues.academicYear;

			triggerGenders(data);

			// Clear dependent fields when grade changes
			setValue('gender', '');
			setValue('section', '');
		}
	}, [watchedValues.grade, watchedValues.academicYear, triggerGenders, setValue]);

	// Trigger sections when gender changes (requires both grade and gender)
	useEffect(() => {
		if (watchedValues.gender && watchedValues.grade) {
			const data = { grade: watchedValues.grade, gender: watchedValues.gender };
			if (watchedValues.academicYear) data.academicYear = watchedValues.academicYear;

			triggerSections(data);
		}
	}, [watchedValues.gender, watchedValues.grade, watchedValues.academicYear, triggerSections]);

	useEffect(() => {
		if (createSuccess) {
			showSnackbar(t('timetable.create.messages.createSuccess'), 'success');
			navigate('/timetable');
		}
	}, [createSuccess, showSnackbar, navigate, t]);

	useEffect(() => {
		if (createError) {
			const message = createError?.data?.message || createError?.message || t('timetable.create.messages.genericError');
			showSnackbar(message, 'error');
		}
	}, [createError, showSnackbar, t]);

	// Fetch school timings when grade and gender are selected
	useEffect(() => {
		if (watchedValues.grade && watchedValues.gender) {
			console.log('Fetching school timings for:', { gradeId: watchedValues.grade, gender: watchedValues.gender });
			loadSchoolTimings({
				gradeId: watchedValues.grade,
				gender: watchedValues.gender
			});
		}
	}, [watchedValues.grade, watchedValues.gender, loadSchoolTimings]);

	// Fetch available subjects and teachers when all required fields are selected
	useEffect(() => {
		if (watchedValues.academicYear && watchedValues.grade && watchedValues.gender && watchedValues.section) {
			loadAvailableSubjects({
				academicYear: watchedValues.academicYear,
				grade: watchedValues.grade,
				gender: watchedValues.gender,
				section: watchedValues.section
			});
		}
	}, [watchedValues.academicYear, watchedValues.grade, watchedValues.gender, watchedValues.section, loadAvailableSubjects]);



	const onSubmit = (data) => {
		console.log('Form data before validation:', data);
		console.log('Weekly timetable data:', weeklyTimetable);

		if (!data.name || !data.academicYear || !data.term || !data.grade || !data.gender || !data.section) {
			console.log('Validation failed - missing required fields:', data);
			showSnackbar(t('timetable.create.messages.fillRequiredFields'), 'error');
			return;
		}

		// Check if we have any periods
		const totalPeriods = Object.values(weeklyTimetable).reduce((total, day) => total + day.length, 0);
		if (totalPeriods === 0) {
			showSnackbar(t('timetable.create.messages.addPeriods'), 'error');
			return;
		}

		// Clean and prepare weekly timetable data for backend
		console.log('Raw weeklyTimetable before cleaning:', weeklyTimetable);

		const cleanedWeeklyTimetable = {};

		Object.keys(weeklyTimetable).forEach(day => {
			console.log(`Processing ${day}:`, weeklyTimetable[day]);

			// Process all periods (both class and break periods)
			const allPeriods = weeklyTimetable[day]
				.map((period, index) => {
					console.log(`Processing period ${period.period}:`, period);

					if (period.isBreak) {
						// For break periods, preserve the original structure
						const cleanBreakPeriod = {
							period: period.period,
							startTime: period.startTime,
							endTime: period.endTime,
							duration: period.duration,
							isBreak: true,
							breakType: period.breakType || 'short'
						};

						// Include break name if available
						if (period.breakName && period.breakName.trim() !== '') {
							cleanBreakPeriod.breakName = period.breakName;
						}

						// For break periods, don't include subject field to avoid ObjectId casting issues
						console.log(`Clean break period result:`, cleanBreakPeriod);
						return cleanBreakPeriod;
					} else {
						// For class periods, clean and validate the data
						const cleanPeriod = {
							period: period.period,
							startTime: period.startTime,
							endTime: period.endTime,
							duration: period.duration,
							isBreak: false
						};

						// Use gradeSubject ID if selected
						if (period.gradeSubject && period.gradeSubject.trim() !== '') {
							cleanPeriod.gradeSubject = period.gradeSubject;
							console.log(`Added gradeSubject ${period.gradeSubject} to period ${period.period}`);
						} else {
							console.log(`Skipping empty gradeSubject for period ${period.period}`);
						}

						console.log(`Clean class period result:`, cleanPeriod);
						return cleanPeriod;
					}
				});

			cleanedWeeklyTimetable[day] = allPeriods;
			console.log(`${day} cleaned periods (including breaks):`, allPeriods);
		});

		console.log('Final cleaned weeklyTimetable:', cleanedWeeklyTimetable);

		// Combine form data with cleaned weekly timetable
		const submitData = {
			...data,
			weeklyTimetable: cleanedWeeklyTimetable
		};

		console.log('Creating timetable with cleaned data:', submitData);

		// Calculate totals for logging
		const submittedTotalPeriods = Object.values(cleanedWeeklyTimetable).reduce((total, day) => total + day.length, 0);
		const submittedClassPeriods = Object.values(cleanedWeeklyTimetable).reduce((total, day) =>
			total + day.filter(period => !period.isBreak).length, 0);
		const submittedBreakPeriods = Object.values(cleanedWeeklyTimetable).reduce((total, day) =>
			total + day.filter(period => period.isBreak).length, 0);

		console.log('Total periods being submitted:', submittedTotalPeriods);
		console.log('Class periods:', submittedClassPeriods, 'Break periods:', submittedBreakPeriods);
		createTimetable(submitData);
	};

	const handleCancel = () => {
		navigate('/timetable');
	};



	// Auto-generate periods based on school timings
	const generatePeriodsFromSchoolTimings = useCallback(() => {
		if (!schoolTimings) {
			showSnackbar(t('timetable.create.messages.fetchTimingsFirst'), 'warning');
			return;
		}

		// Extract from the correct structure based on backend response
		const timings = schoolTimings.timings || schoolTimings;
		const {
			startTime,
			endTime,
			periodDuration,
			lunchStartTime,
			lunchEndTime,
			breaks = []
		} = timings;

		// Helper function to convert time string to minutes
		const timeToMinutes = (timeString) => {
			const [hours, mins] = timeString.split(':').map(Number);
			return hours * 60 + mins;
		};

		// Helper function to convert minutes to time string
		const minutesToTime = (minutes) => {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
		};

		// Create a list of all break periods including lunch
		const allBreaks = [...breaks];

		// Add lunch break if defined
		if (lunchStartTime && lunchEndTime) {
			allBreaks.push({
				name: 'Lunch Break',
				startTime: lunchStartTime,
				endTime: lunchEndTime,
				duration: timeToMinutes(lunchEndTime) - timeToMinutes(lunchStartTime)
			});
		}

		// Sort breaks by start time
		allBreaks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

		// Generate periods for each day
		const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const newWeeklyTimetable = {};

		days.forEach(day => {
			const periods = [];
			let currentTimeMinutes = timeToMinutes(startTime);
			const endTimeMinutes = timeToMinutes(endTime);
			let periodNumber = 1;
			let classPeriodNumber = 1;

			while (currentTimeMinutes < endTimeMinutes) {
				// Check if current time conflicts with any break
				const conflictingBreak = allBreaks.find(breakItem => {
					const breakStart = timeToMinutes(breakItem.startTime);
					const breakEnd = timeToMinutes(breakItem.endTime);
					return currentTimeMinutes < breakEnd && (currentTimeMinutes + periodDuration) > breakStart;
				});

				if (conflictingBreak) {
					// Add the break period
					const breakType = conflictingBreak.name.toLowerCase().includes('lunch') ? 'lunch' :
						conflictingBreak.name.toLowerCase().includes('assembly') ? 'assembly' : 'short';

					periods.push({
						period: periodNumber,
						startTime: conflictingBreak.startTime,
						endTime: conflictingBreak.endTime,
						duration: conflictingBreak.duration,
						isBreak: true,
						breakType: breakType,
						breakName: conflictingBreak.name // Store the break name separately
					});

					// Move current time to end of break
					currentTimeMinutes = timeToMinutes(conflictingBreak.endTime);
					periodNumber++;
				} else {
					// Check if we have enough time for a full period
					if (currentTimeMinutes + periodDuration <= endTimeMinutes) {
						// Check if this period would conflict with any upcoming break
						const nextBreak = allBreaks.find(breakItem => {
							const breakStart = timeToMinutes(breakItem.startTime);
							return breakStart > currentTimeMinutes && breakStart < (currentTimeMinutes + periodDuration);
						});

						if (nextBreak) {
							// Adjust period to end before the break
							const adjustedDuration = timeToMinutes(nextBreak.startTime) - currentTimeMinutes;
							if (adjustedDuration >= 15) { // Minimum 15 minutes for a period
								periods.push({
									period: classPeriodNumber,
									subject: '',
									startTime: minutesToTime(currentTimeMinutes),
									endTime: nextBreak.startTime,
									duration: adjustedDuration,
									isBreak: false,
									breakType: ''
								});
								periodNumber++;
								classPeriodNumber++;
							}
							currentTimeMinutes = timeToMinutes(nextBreak.startTime);
						} else {
							// Add normal period
							periods.push({
								period: classPeriodNumber,
								subject: '',
								startTime: minutesToTime(currentTimeMinutes),
								endTime: minutesToTime(currentTimeMinutes + periodDuration),
								duration: periodDuration,
								isBreak: false,
								breakType: ''
							});

							currentTimeMinutes += periodDuration;
							periodNumber++;
							classPeriodNumber++;
						}
					} else {
						// Not enough time for another period
						break;
					}
				}
			}

			newWeeklyTimetable[day] = periods;
		});

		setWeeklyTimetable(newWeeklyTimetable);

		// Debug: Log the generated timetable structure
		console.log('Generated Weekly Timetable:', newWeeklyTimetable);
		console.log('Sample Monday periods:', newWeeklyTimetable.monday.slice(0, 3));

		const totalGeneratedPeriods = Object.values(newWeeklyTimetable).reduce((total, day) => total + day.length, 0);
		showSnackbar(t('timetable.create.messages.periodsGenerated', { count: totalGeneratedPeriods }), 'success');
	}, [schoolTimings, showSnackbar, setWeeklyTimetable, t]);

	// Separate effect to trigger auto-generation when school timings are received
	useEffect(() => {
		if (schoolTimings) {
			console.log('📋 School timings received, checking if we should auto-generate...');

			const hasAllRequiredFields = watchedValues.academicYear && watchedValues.grade && watchedValues.gender && watchedValues.section;
			const hasNoPeriods = Object.values(weeklyTimetable).reduce((total, day) => total + day.length, 0) === 0;

			console.log('Auto-generation check:', {
				hasAllRequiredFields,
				hasSchoolTimings: !!schoolTimings,
				hasNoPeriods,
				watchedValues: {
					academicYear: !!watchedValues.academicYear,
					grade: !!watchedValues.grade,
					gender: !!watchedValues.gender,
					section: !!watchedValues.section
				}
			});

			if (hasAllRequiredFields && hasNoPeriods) {
				console.log('🚀 All conditions met! Auto-generating periods...');
				setIsAutoGenerating(true);

				// Small delay to show loading state
				const timer = setTimeout(() => {
					try {
						generatePeriodsFromSchoolTimings();
						console.log('✅ Auto-generation completed successfully');
					} catch (error) {
						console.error('❌ Auto-generation failed:', error);
						showSnackbar(t('timetable.create.messages.autoGenerationFailed'), 'error');
					} finally {
						setIsAutoGenerating(false);
					}
				}, 200);

				return () => clearTimeout(timer);
			} else {
				console.log('⏸️ Not all conditions met for auto-generation');
			}
		}
	}, [schoolTimings]);

	// Separate effect to check when all form fields are filled
	useEffect(() => {
		const hasAllRequiredFields = watchedValues.academicYear && watchedValues.grade && watchedValues.gender && watchedValues.section;

		if (hasAllRequiredFields) {
			console.log('📝 All required fields filled:', watchedValues);

			if (schoolTimings) {
				const hasNoPeriods = Object.values(weeklyTimetable).reduce((total, day) => total + day.length, 0) === 0;

				if (hasNoPeriods) {
					console.log('🚀 Triggering auto-generation from form completion...');
					setIsAutoGenerating(true);

					const timer = setTimeout(() => {
						try {
							generatePeriodsFromSchoolTimings();
							console.log('✅ Auto-generation from form completion successful');
						} catch (error) {
							console.error('❌ Auto-generation from form completion failed:', error);
							showSnackbar(t('timetable.create.messages.autoGenerationFailed'), 'error');
						} finally {
							setIsAutoGenerating(false);
						}
					}, 200);

					return () => clearTimeout(timer);
				}
			} else {
				console.log('📋 Form complete but waiting for school timings...');
			}
		}
	}, [watchedValues.academicYear, watchedValues.grade, watchedValues.gender, watchedValues.section]);

	const updatePeriod = (day, index, field, value) => {
		// Only allow updating certain fields (gradeSubject and period number for class periods)
		const allowedFields = ['gradeSubject', 'period'];

		if (allowedFields.includes(field)) {
			setWeeklyTimetable(prev => ({
				...prev,
				[day]: prev[day].map((period, i) =>
					i === index ? { ...period, [field]: value } : period
				)
			}));
		}
	};

	const days = useMemo(() => [
		{ key: 'monday', label: t('timetable.create.days.monday') },
		{ key: 'tuesday', label: t('timetable.create.days.tuesday') },
		{ key: 'wednesday', label: t('timetable.create.days.wednesday') },
		{ key: 'thursday', label: t('timetable.create.days.thursday') },
		{ key: 'friday', label: t('timetable.create.days.friday') },
		{ key: 'saturday', label: t('timetable.create.days.saturday') },
		{ key: 'sunday', label: t('timetable.create.days.sunday') }
	], [t]);


	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
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
						onClick={() => navigate('/timetable')}
					>
						{t('timetable.breadcrumbs.timetable')} • {t('timetable.breadcrumbs.list')}
					</Link>
					<Typography sx={{ color: themeColors.text.primary }}>
						{t('timetable.breadcrumbs.create')}
					</Typography>
				</Breadcrumbs>

				{/* Header */}
				{ability.can("Create", "Timetable") && <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
					<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{t('timetable.create.title')}
					</Typography>
					<Box display="flex" gap={2}>
						<Button
							variant="outlined"
							onClick={handleCancel}
							color="inherit"
						>
							{t('timetable.create.actions.cancel')}
						</Button>
						<Button
							variant="contained"
							onClick={handleSubmit(onSubmit)}
							disabled={isCreating}
							startIcon={isCreating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
						>
							{isCreating ? t('timetable.create.actions.creating') : t('timetable.create.actions.create')}
						</Button>
					</Box>
				</Box>}

				{/* Basic Information */}
				<Paper sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
					<Box sx={{ p: 3 }}>
						<Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
							{t('timetable.create.sections.basicInfo')}
						</Typography>
						<Grid container spacing={3}>
							<Grid item xs={12}>
								<CustomInput
									control={control}
									fieldName="name"
									fieldLabel={t('timetable.create.form.name')}
									placeholder={t('timetable.create.form.namePlaceholder')}
									error={errors.name}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<CustomSelect
									control={control}
									fieldName="academicYear"
									fieldLabel={t('timetable.create.form.academicYear')}
									disabled={academicLoading}
									error={errors.academicYear}
								>
									{academicYear?.map((yearObj) => (
										<MenuItem key={yearObj._id} value={yearObj._id}>
											{yearObj.academicYear}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>

							<Grid item xs={12} sm={6} md={4}>
								<CustomSelect
									control={control}
									fieldName="term"
									fieldLabel={t('timetable.create.form.term')}
									error={errors.term}
								>
									<MenuItem value="Term 1">{t('timetable.create.form.term1')}</MenuItem>
									<MenuItem value="Term 2">{t('timetable.create.form.term2')}</MenuItem>
									<MenuItem value="Term 3">{t('timetable.create.form.term3')}</MenuItem>
								</CustomSelect>
							</Grid>

							<Grid item xs={12} sm={6} md={4}>
								<CustomSelect
									control={control}
									fieldName="grade"
									fieldLabel={t('timetable.create.form.grade')}
									disabled={gradeLoading}
									error={errors.grade}
								>
									{grades?.data?.map((grade) => (
										<MenuItem key={grade._id} value={grade._id}>
											{grade.gradeName}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>

							<Grid item xs={12} sm={6} md={4}>
								<CustomSelect
									control={control}
									fieldName="gender"
									fieldLabel={t('timetable.create.form.gender')}
									disabled={genderLoading}
									error={errors.gender}
								>
									{genders?.data?.map((gender) => (
										<MenuItem key={gender} value={gender}>
											{gender.charAt(0).toUpperCase() + gender.slice(1)}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>

							<Grid item xs={12} sm={6} md={4}>
								<CustomSelect
									control={control}
									fieldName="section"
									fieldLabel={t('timetable.create.form.section')}
									disabled={sectionLoading}
									error={errors.section}
								>
									{sections?.data?.map((section) => (
										<MenuItem key={section._id} value={section._id}>
											{section.sectionName}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>

							<Grid item xs={12} sm={6} md={4}>
								<CustomSelect
									control={control}
									fieldName="status"
									fieldLabel={t('timetable.create.form.status')}
									error={errors.status}
								>
									<MenuItem value="draft">{t('timetable.create.form.statusDraft')}</MenuItem>
									<MenuItem value="published">{t('timetable.create.form.statusPublished')}</MenuItem>
									<MenuItem value="archived">{t('timetable.create.form.statusArchived')}</MenuItem>
								</CustomSelect>
							</Grid>


						</Grid>
					</Box>
				</Paper>

				{/* Timetable Schedule */}
				{watchedValues.academicYear && watchedValues.grade && watchedValues.gender && watchedValues.section && (
					<Paper sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<Box sx={{ p: 3 }}>
							<Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
								{t('timetable.create.sections.schedule')}
							</Typography>

							{isAutoGenerating && (
								<Alert severity="info" sx={{ mb: 3 }}>
									<Box display="flex" alignItems="center" gap={1}>
										<CircularProgress size={20} />
										<Typography>{t('timetable.create.messages.autoGenerating')}</Typography>
									</Box>
								</Alert>
							)}

							{weeklyTimetable.monday.length > 0 && (
								<>
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell sx={{ fontWeight: 'bold', backgroundColor: themeColors.background.secondary }}>
														{t('timetable.create.table.day')}
													</TableCell>
													{weeklyTimetable.monday
														.filter(period => !period.isBreak)
														.sort((a, b) => a.period - b.period)
														.map((period, index) => (
															<TableCell
																key={index}
																align="center"
																sx={{
																	fontWeight: 'bold',
																	backgroundColor: themeColors.background.secondary,
																	color: themeColors.text.primary,
																	minWidth: 150
																}}
															>
																<Box>
																	<Typography variant="caption" fontWeight="bold">
																		{t('timetable.create.table.period', { number: period.period })}
																	</Typography>
																	<Typography variant="caption" display="block">
																		{period.startTime} - {period.endTime}
																	</Typography>
																	<Typography variant="caption" display="block" color="text.secondary">
																		{t('timetable.create.table.duration', { minutes: period.duration })}
																	</Typography>
																</Box>
															</TableCell>
														))}
												</TableRow>
											</TableHead>
											<TableBody>
												{days.map((day) => (
													<TableRow key={day.key}>
														<TableCell
															sx={{
																fontWeight: 'bold',
																backgroundColor: themeColors.background.secondary,
																position: 'sticky',
																left: 0,
																zIndex: 1
															}}
														>
															{day.label}
														</TableCell>
														{weeklyTimetable[day.key]
															.filter(period => !period.isBreak)
															.sort((a, b) => a.period - b.period)
															.map((period, periodIndex) => (
																<TableCell key={periodIndex} align="center" sx={{ p: 1 }}>
																	<Box
																		component="select"
																		value={period.gradeSubject || ''}
																		onChange={(e) => updatePeriod(day.key, weeklyTimetable[day.key].findIndex(p => p === period), 'gradeSubject', e.target.value)}
																		sx={{
																			width: '100%',
																			height: '35px',
																			padding: '4px 8px',
																			border: `1px solid ${themeColors.border.primary}`,
																			borderRadius: '4px',
																			backgroundColor: themeColors.background.primary,
																			color: themeColors.text.primary,
																			fontSize: '12px',
																			fontFamily: 'Raleway, sans-serif',
																			'&:focus': {
																				outline: 'none',
																				borderColor: themeColors.primary,
																				boxShadow: `0 0 0 2px ${themeColors.primary}20`
																			}
																		}}
																	>
																		<option value="">{t('timetable.create.table.selectSubject')}</option>
																		{availableSubjects.map((gradeSubject) => (
																			<option key={gradeSubject._id} value={gradeSubject._id}>
																				{gradeSubject.subject?.subjectName} {gradeSubject.teacher ? `- ${gradeSubject.teacher.employeeName}` : `(${t('timetable.create.table.noTeacher')})`}
																			</option>
																		))}
																	</Box>
																</TableCell>
															))}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>

									{/* Break Timings Information */}
									<Box sx={{ mt: 3, mb: 3 }}>
										<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
											{t('timetable.create.sections.breakTimings')}
										</Typography>
										<Grid container spacing={2}>
											{(() => {
												// Get breaks from the first day that has breaks, or from any day
												const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
												let breaks = [];

												for (const day of allDays) {
													if (weeklyTimetable[day] && weeklyTimetable[day].length > 0) {
														const dayBreaks = weeklyTimetable[day].filter(period => period.isBreak);
														if (dayBreaks.length > 0) {
															breaks = dayBreaks;
															break;
														}
													}
												}

												return breaks.map((breakPeriod, index) => (
													<Grid item xs={12} sm={6} md={4} key={index}>
														<Card sx={{
															backgroundColor: `${themeColors.warning}15`,
															border: `1px solid ${themeColors.warning}`,
															borderRadius: 2
														}}>
															<CardContent sx={{ p: 2 }}>
																<Box display="flex" alignItems="center" gap={1}>
																	<Chip
																		label={breakPeriod.breakName || breakPeriod.breakType || t('timetable.create.break')}
																		color="warning"
																		size="small"
																		sx={{ fontWeight: 'bold' }}
																	/>
																</Box>
																<Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
																	{breakPeriod.startTime} - {breakPeriod.endTime}
																</Typography>
																<Typography variant="caption" color="text.secondary">
																	{t('timetable.create.breakDuration', { minutes: breakPeriod.duration })}
																</Typography>
															</CardContent>
														</Card>
													</Grid>
												));
											})()}
											{(() => {
												// Check if any day has breaks
												const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
												const hasBreaks = allDays.some(day =>
													weeklyTimetable[day] && weeklyTimetable[day].some(period => period.isBreak)
												);

												if (!hasBreaks) {
													return (
														<Grid item xs={12}>
															<Alert severity="info">
																{t('timetable.create.messages.noBreaks')}
															</Alert>
														</Grid>
													);
												}
												return null;
											})()}
										</Grid>
									</Box>

								</>
							)}

							{weeklyTimetable.monday.length === 0 && (
								<Alert severity="info">
									{t('timetable.create.messages.noPeriodsScheduled')}
								</Alert>
							)}
						</Box>
					</Paper>
				)}

				<CustomBackDrop open={isCreating} />
			</Box>
		</CustomOutletBox>
	);
};

export default CreateTimetableScreen;
