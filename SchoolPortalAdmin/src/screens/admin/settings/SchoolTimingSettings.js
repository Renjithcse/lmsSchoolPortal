import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, IconButton, Divider, Chip, FormControlLabel, Switch } from '@mui/material';
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, array, boolean, number } from "yup";
import CustomInput from '../../../components/Common/CustomInput';
import CustomButton from '../../../components/Common/CustomButton';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetSettingQuery, useUpdateSettingMutation } from '../../../Redux/features/Admin/SettingsSlice';
import { useGetAllGradeQuery } from '../../../Redux/features/Admin/TeachersSlice';
import UiBlocker from '../../../components/Common/UiBlocker';
import { MenuItem } from '@mui/material';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

// Utility function to calculate total hours and periods
const calculateTimings = (startTime, endTime, lunchStartTime, lunchEndTime, breaks = [], periodDuration = 45) => {
	if (!startTime || !endTime || !lunchStartTime || !lunchEndTime) {
		return { totalHours: 0, totalPeriods: 0 };
	}

	// Convert time strings to minutes since midnight
	const timeToMinutes = (timeStr) => {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return hours * 60 + minutes;
	};

	const startMinutes = timeToMinutes(startTime);
	const endMinutes = timeToMinutes(endTime);
	const lunchStartMinutes = timeToMinutes(lunchStartTime);
	const lunchEndMinutes = timeToMinutes(lunchEndTime);

	// Calculate total school time in minutes
	const totalSchoolMinutes = endMinutes - startMinutes;

	// Calculate lunch break duration in minutes
	const lunchBreakMinutes = lunchEndMinutes - lunchStartMinutes;

	// Calculate other breaks duration in minutes
	const otherBreaksMinutes = breaks.reduce((total, breakItem) => {
		if (breakItem.startTime && breakItem.endTime) {
			const breakStart = timeToMinutes(breakItem.startTime);
			const breakEnd = timeToMinutes(breakItem.endTime);
			return total + (breakEnd - breakStart);
		}
		return total;
	}, 0);

	// Calculate actual teaching time (total time minus all breaks)
	const teachingMinutes = totalSchoolMinutes - lunchBreakMinutes - otherBreaksMinutes;

	// Debug logging
	console.log('Timing Calculation Debug:');
	console.log('Start Time:', startTime, 'End Time:', endTime);
	console.log('Lunch Start:', lunchStartTime, 'Lunch End:', lunchEndTime);
	console.log('Total School Minutes:', totalSchoolMinutes);
	console.log('Lunch Break Minutes:', lunchBreakMinutes);
	console.log('Other Breaks Minutes:', otherBreaksMinutes);
	console.log('Teaching Minutes:', teachingMinutes);
	console.log('Period Duration:', periodDuration);

	// Convert to hours (rounded to 2 decimal places)
	const totalHours = Math.round((teachingMinutes / 60) * 100) / 100;

	// Calculate total periods based on period duration
	const totalPeriods = Math.round(teachingMinutes / periodDuration);

	console.log('Calculated Total Hours:', totalHours);
	console.log('Calculated Total Periods:', totalPeriods);

	return { totalHours, totalPeriods };
};

// Utility function to calculate break duration
const calculateBreakDuration = (startTime, endTime) => {
	if (!startTime || !endTime) {
		return 0;
	}

	// Convert time strings to minutes since midnight
	const timeToMinutes = (timeStr) => {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return hours * 60 + minutes;
	};

	const startMinutes = timeToMinutes(startTime);
	const endMinutes = timeToMinutes(endTime);

	// Calculate duration in minutes
	const durationMinutes = endMinutes - startMinutes;

	console.log('Break Duration Calculation:');
	console.log('Start Time:', startTime, 'End Time:', endTime);
	console.log('Start Minutes:', startMinutes, 'End Minutes:', endMinutes);
	console.log('Duration Minutes:', durationMinutes);

	// Return duration in minutes (ensure it's not negative)
	return Math.max(0, durationMinutes);
};

// Helper component for rendering override forms
const OverrideForm = ({
	index,
	fields,
	removeFunction,
	showGrade = false,
	showGender = false,
	title,
	control,
	errors,
	themeColors,
	gradesData,
	watch,
	setValue,
	t
}) => {
	const { fields: overrideBreakFields, append: appendOverrideBreak, remove: removeOverrideBreak } = useFieldArray({
		control,
		name: `${fields}.${index}.breaks`
	});

	// Watch timing fields for automatic calculation
	const watchedStartTime = watch(`${fields}.${index}.startTime`);
	const watchedEndTime = watch(`${fields}.${index}.endTime`);
	const watchedLunchStartTime = watch(`${fields}.${index}.lunchStartTime`);
	const watchedLunchEndTime = watch(`${fields}.${index}.lunchEndTime`);
	const watchedPeriodDuration = watch(`${fields}.${index}.periodDuration`);
	const watchedBreaks = watch(`${fields}.${index}.breaks`);

	// Calculate and update total hours and periods when timing fields change
	React.useEffect(() => {
		if (watchedStartTime && watchedEndTime && watchedLunchStartTime && watchedLunchEndTime && watchedPeriodDuration) {
			const { totalHours, totalPeriods } = calculateTimings(
				watchedStartTime,
				watchedEndTime,
				watchedLunchStartTime,
				watchedLunchEndTime,
				watchedBreaks || [],
				watchedPeriodDuration
			);

			setValue(`${fields}.${index}.totalHours`, totalHours);
			setValue(`${fields}.${index}.totalPeriods`, totalPeriods);
		}
	}, [watchedStartTime, watchedEndTime, watchedLunchStartTime, watchedLunchEndTime, watchedPeriodDuration, watchedBreaks, setValue, fields, index]);

	// Calculate break durations when break start/end times change
	React.useEffect(() => {
		if (watchedBreaks) {
			watchedBreaks.forEach((breakItem, breakIndex) => {
				if (breakItem.startTime && breakItem.endTime) {
					const duration = calculateBreakDuration(breakItem.startTime, breakItem.endTime);
					setValue(`${fields}.${index}.breaks.${breakIndex}.duration`, duration);
				}
			});
		}
	}, [watchedBreaks, setValue, fields, index]);


	// Function to recalculate all values on blur
	const recalculateOnBlur = () => {
		// Recalculate total hours and periods
		if (watchedStartTime && watchedEndTime && watchedLunchStartTime && watchedLunchEndTime && watchedPeriodDuration) {
			const { totalHours, totalPeriods } = calculateTimings(
				watchedStartTime,
				watchedEndTime,
				watchedLunchStartTime,
				watchedLunchEndTime,
				watchedBreaks || [],
				watchedPeriodDuration
			);

			setValue(`${fields}.${index}.totalHours`, totalHours);
			setValue(`${fields}.${index}.totalPeriods`, totalPeriods);
		}

		// Recalculate break durations
		if (watchedBreaks) {
			watchedBreaks.forEach((breakItem, breakIndex) => {
				if (breakItem.startTime && breakItem.endTime) {
					const duration = calculateBreakDuration(breakItem.startTime, breakItem.endTime);
					setValue(`${fields}.${index}.breaks.${breakIndex}.duration`, duration);
				}
			});
		}
	};

	// Function to recalculate break duration when break end time is blurred
	const recalculateBreakDurationOnBlur = (breakIndex) => {
		console.log('Break duration calculation triggered for break index:', breakIndex);
		const currentBreaks = watchedBreaks || [];
		const breakItem = currentBreaks[breakIndex];

		console.log('Current breaks:', currentBreaks);
		console.log('Break item:', breakItem);

		if (breakItem && breakItem.startTime && breakItem.endTime) {
			const duration = calculateBreakDuration(breakItem.startTime, breakItem.endTime);
			console.log('Calculated duration:', duration);
			setValue(`${fields}.${index}.breaks.${breakIndex}.duration`, duration);
		}
	};

	return (
		<Card sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, mb: 2 }}>
			<CardContent sx={{ p: 2 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
					<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{title} {index + 1}
					</Typography>
					<IconButton
						onClick={() => removeFunction(index)}
						sx={{ color: themeColors.error }}
						size="small"
					>
						<DeleteIcon />
					</IconButton>
				</Box>

				<Grid container spacing={2}>
					{showGrade && (
						<Grid item xs={12} md={6}>
							<CustomSelect
								fieldName={`${fields}.${index}.grade`}
								control={control}
								fieldLabel={t('settings.schoolTimings.form.grade')}
								error={errors[fields]?.[index]?.grade}
								themeColors={themeColors}
							>
								<MenuItem value="">{t('settings.schoolTimings.form.selectGrade')}</MenuItem>
								{gradesData?.map((grade) => (
									<MenuItem key={grade._id} value={grade._id}>
										{grade.gradeName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>
					)}

					{showGender && (
						<Grid item xs={12} md={6}>
							<CustomSelect
								fieldName={`${fields}.${index}.gender`}
								control={control}
								fieldLabel={t('settings.schoolTimings.form.gender')}
								error={errors[fields]?.[index]?.gender}
								themeColors={themeColors}
							>
								<MenuItem value="">{t('settings.schoolTimings.form.selectGender')}</MenuItem>
								<MenuItem value="male">{t('settings.schoolTimings.form.male')}</MenuItem>
								<MenuItem value="female">{t('settings.schoolTimings.form.female')}</MenuItem>
							</CustomSelect>
						</Grid>
					)}

					<Grid item xs={12} md={6}>
						<CustomInput
							name={`${fields}.${index}.startTime`}
							control={control}
							label={t('settings.schoolTimings.form.startTime')}
							placeholder="08:00"
							error={errors[fields]?.[index]?.startTime}
							themeColors={themeColors}
							type="time"
							onBlur={recalculateOnBlur}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<CustomInput
							name={`${fields}.${index}.endTime`}
							control={control}
							label={t('settings.schoolTimings.form.endTime')}
							placeholder="15:00"
							error={errors[fields]?.[index]?.endTime}
							themeColors={themeColors}
							type="time"
							onBlur={recalculateOnBlur}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<CustomInput
							name={`${fields}.${index}.lunchStartTime`}
							control={control}
							label={t('settings.schoolTimings.form.lunchStartTime')}
							placeholder="12:00"
							error={errors[fields]?.[index]?.lunchStartTime}
							themeColors={themeColors}
							type="time"
							onBlur={recalculateOnBlur}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<CustomInput
							name={`${fields}.${index}.lunchEndTime`}
							control={control}
							label={t('settings.schoolTimings.form.lunchEndTime')}
							placeholder="13:00"
							error={errors[fields]?.[index]?.lunchEndTime}
							themeColors={themeColors}
							type="time"
							onBlur={recalculateOnBlur}
						/>
					</Grid>

					<Grid item xs={12}>
						<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 2 }}>
							{t('settings.schoolTimings.durationSettings')}
						</Typography>
					</Grid>

					<Grid item xs={12} md={4}>
						<CustomInput
							name={`${fields}.${index}.totalHours`}
							control={control}
							label={t('settings.schoolTimings.form.totalHours')}
							placeholder="7"
							error={errors[fields]?.[index]?.totalHours}
							themeColors={themeColors}
							type="number"
							inputProps={{ min: 1, max: 12, readOnly: true }}
							sx={{ '& .MuiInputBase-input': { backgroundColor: themeColors.background.secondary } }}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<CustomInput
							name={`${fields}.${index}.periodDuration`}
							control={control}
							label={t('settings.schoolTimings.form.periodDuration')}
							placeholder="45"
							error={errors[fields]?.[index]?.periodDuration}
							themeColors={themeColors}
							type="number"
							inputProps={{ min: 15, max: 120 }}
							onBlur={recalculateOnBlur}
						/>
					</Grid>

					<Grid item xs={12} md={4}>
						<CustomInput
							name={`${fields}.${index}.totalPeriods`}
							control={control}
							label={t('settings.schoolTimings.form.totalPeriods')}
							placeholder="8"
							error={errors[fields]?.[index]?.totalPeriods}
							themeColors={themeColors}
							type="number"
							inputProps={{ min: 1, max: 15, readOnly: true }}
							sx={{ '& .MuiInputBase-input': { backgroundColor: themeColors.background.secondary } }}
						/>
					</Grid>

					{/* Breaks Section */}
					<Grid item xs={12}>
						<Box display="flex" alignItems="center" justifyContent="space-between" mt={2} mb={2}>
							<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
								{t('settings.schoolTimings.breaks')}
							</Typography>
							<IconButton
								onClick={() => appendOverrideBreak({ name: '', startTime: '', endTime: '', duration: '' })}
								sx={{
									color: themeColors.primary,
									backgroundColor: themeColors.background.primary,
									'&:hover': { backgroundColor: themeColors.background.secondary }
								}}
								size="small"
							>
								<AddIcon />
							</IconButton>
						</Box>
					</Grid>

					{overrideBreakFields.map((breakField, breakIndex) => (
						<Grid item xs={12} key={breakField.id}>
							<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.secondary}`, p: 2 }}>
								<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
									<Typography variant="body2" fontWeight="bold" sx={{ color: themeColors.text.secondary }}>
										{t('settings.schoolTimings.break')} {breakIndex + 1}
									</Typography>
									<IconButton
										onClick={() => removeOverrideBreak(breakIndex)}
										sx={{ color: themeColors.error }}
										size="small"
									>
										<DeleteIcon />
									</IconButton>
								</Box>
								<Grid container spacing={2}>
									<Grid item xs={12} md={3}>
										<CustomInput
											name={`${fields}.${index}.breaks.${breakIndex}.name`}
											control={control}
											label={t('settings.schoolTimings.form.breakName')}
											placeholder={t('settings.schoolTimings.form.morningBreak')}
											error={errors[fields]?.[index]?.breaks?.[breakIndex]?.name}
											themeColors={themeColors}
										/>
									</Grid>
									<Grid item xs={12} md={3}>
										<CustomInput
											name={`${fields}.${index}.breaks.${breakIndex}.startTime`}
											control={control}
											label={t('settings.schoolTimings.form.startTime')}
											placeholder="10:00"
											error={errors[fields]?.[index]?.breaks?.[breakIndex]?.startTime}
											themeColors={themeColors}
											type="time"
											onBlur={recalculateOnBlur}
										/>
									</Grid>
									<Grid item xs={12} md={3}>
										<CustomInput
											name={`${fields}.${index}.breaks.${breakIndex}.endTime`}
											control={control}
											label={t('settings.schoolTimings.form.endTime')}
											placeholder="10:15"
											error={errors[fields]?.[index]?.breaks?.[breakIndex]?.endTime}
											themeColors={themeColors}
											type="time"
											inputProps={{
												onBlur: () => {
													console.log('Break end time onBlur triggered');
													recalculateBreakDurationOnBlur(breakIndex);
												}
											}}
										/>
									</Grid>
									<Grid item xs={12} md={3}>
										<CustomInput
											name={`${fields}.${index}.breaks.${breakIndex}.duration`}
											control={control}
											label={t('settings.schoolTimings.form.duration')}
											placeholder="15"
											error={errors[fields]?.[index]?.breaks?.[breakIndex]?.duration}
											themeColors={themeColors}
											type="number"
											inputProps={{ min: 1, max: 60, readOnly: true }}
											sx={{ '& .MuiInputBase-input': { backgroundColor: themeColors.background.secondary } }}
										/>
									</Grid>
								</Grid>
							</Card>
						</Grid>
					))}
				</Grid>
			</CardContent>
		</Card>
	);
};

const SchoolTimingSettings = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const [activeSection, setActiveSection] = useState('default');
	const { t } = useTranslation();

	const ability = useAbility();

	const schema = object().shape({
		default: object().shape({
			startTime: string().required(t('settings.schoolTimings.validation.startTimeRequired')),
			endTime: string().required(t('settings.schoolTimings.validation.endTimeRequired')),
			lunchStartTime: string().required(t('settings.schoolTimings.validation.lunchStartTimeRequired')),
			lunchEndTime: string().required(t('settings.schoolTimings.validation.lunchEndTimeRequired')),
			totalHours: number()
				.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
				.min(1, t('settings.schoolTimings.validation.totalHoursMin'))
				.max(12, t('settings.schoolTimings.validation.totalHoursMax'))
				.required(t('settings.schoolTimings.validation.totalHoursRequired')),
			periodDuration: number()
				.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
				.min(15, t('settings.schoolTimings.validation.periodDurationMin'))
				.max(120, t('settings.schoolTimings.validation.periodDurationMax'))
				.required(t('settings.schoolTimings.validation.periodDurationRequired')),
			totalPeriods: number()
				.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
				.min(1, t('settings.schoolTimings.validation.totalPeriodsMin'))
				.max(15, t('settings.schoolTimings.validation.totalPeriodsMax'))
				.required(t('settings.schoolTimings.validation.totalPeriodsRequired')),
			breaks: array().of(
				object().shape({
					name: string().required(t('settings.schoolTimings.validation.breakNameRequired')),
					startTime: string().required(t('settings.schoolTimings.validation.breakStartTimeRequired')),
					endTime: string().required(t('settings.schoolTimings.validation.breakEndTimeRequired')),
					duration: string().required(t('settings.schoolTimings.validation.breakDurationRequired'))
				})
			)
		}),
		gradeOverrides: array().of(
			object().shape({
				grade: string().required(t('settings.schoolTimings.validation.gradeRequired')),
				startTime: string(),
				endTime: string(),
				lunchStartTime: string(),
				lunchEndTime: string(),
				totalHours: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(1, t('settings.schoolTimings.validation.totalHoursMin'))
					.max(12, t('settings.schoolTimings.validation.totalHoursMax')),
				periodDuration: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(15, t('settings.schoolTimings.validation.periodDurationMin'))
					.max(120, t('settings.schoolTimings.validation.periodDurationMax')),
				totalPeriods: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(1, t('settings.schoolTimings.validation.totalPeriodsMin'))
					.max(15, t('settings.schoolTimings.validation.totalPeriodsMax')),
				breaks: array().of(
					object().shape({
						name: string().required(t('settings.schoolTimings.validation.breakNameRequired')),
						startTime: string().required(t('settings.schoolTimings.validation.breakStartTimeRequired')),
						endTime: string().required(t('settings.schoolTimings.validation.breakEndTimeRequired')),
						duration: string().required(t('settings.schoolTimings.validation.breakDurationRequired'))
					})
				)
			})
		),
		genderOverrides: array().of(
			object().shape({
				gender: string().required(t('settings.schoolTimings.validation.genderRequired')),
				startTime: string(),
				endTime: string(),
				lunchStartTime: string(),
				lunchEndTime: string(),
				totalHours: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(1, t('settings.schoolTimings.validation.totalHoursMin'))
					.max(12, t('settings.schoolTimings.validation.totalHoursMax')),
				periodDuration: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(15, t('settings.schoolTimings.validation.periodDurationMin'))
					.max(120, t('settings.schoolTimings.validation.periodDurationMax')),
				totalPeriods: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(1, t('settings.schoolTimings.validation.totalPeriodsMin'))
					.max(15, t('settings.schoolTimings.validation.totalPeriodsMax')),
				breaks: array().of(
					object().shape({
						name: string().required(t('settings.schoolTimings.validation.breakNameRequired')),
						startTime: string().required(t('settings.schoolTimings.validation.breakStartTimeRequired')),
						endTime: string().required(t('settings.schoolTimings.validation.breakEndTimeRequired')),
						duration: string().required(t('settings.schoolTimings.validation.breakDurationRequired'))
					})
				)
			})
		),
		gradeGenderOverrides: array().of(
			object().shape({
				grade: string().required(t('settings.schoolTimings.validation.gradeRequired')),
				gender: string().required(t('settings.schoolTimings.validation.genderRequired')),
				startTime: string(),
				endTime: string(),
				lunchStartTime: string(),
				lunchEndTime: string(),
				totalHours: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(1, t('settings.schoolTimings.validation.totalHoursMin'))
					.max(12, t('settings.schoolTimings.validation.totalHoursMax')),
				periodDuration: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(15, t('settings.schoolTimings.validation.periodDurationMin'))
					.max(120, t('settings.schoolTimings.validation.periodDurationMax')),
				totalPeriods: number()
					.typeError(t('settings.schoolTimings.validation.mustBeNumber'))
					.min(1, t('settings.schoolTimings.validation.totalPeriodsMin'))
					.max(15, t('settings.schoolTimings.validation.totalPeriodsMax')),
				breaks: array().of(
					object().shape({
						name: string().required(t('settings.schoolTimings.validation.breakNameRequired')),
						startTime: string().required(t('settings.schoolTimings.validation.breakStartTimeRequired')),
						endTime: string().required(t('settings.schoolTimings.validation.breakEndTimeRequired')),
						duration: string().required(t('settings.schoolTimings.validation.breakDurationRequired'))
					})
				)
			})
		)
	});

	const {
		handleSubmit,
		control,
		setValue,
		reset,
		watch,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			default: {
				startTime: "08:00",
				endTime: "15:00",
				lunchStartTime: "12:00",
				lunchEndTime: "13:00",
				totalHours: 7,
				periodDuration: 45,
				totalPeriods: 8,
				breaks: []
			},
			gradeOverrides: [],
			genderOverrides: [],
			gradeGenderOverrides: []
		}
	});

	const { fields: breakFields, append: appendBreak, remove: removeBreak } = useFieldArray({
		control,
		name: "default.breaks"
	});

	const { fields: gradeOverrideFields, append: appendGradeOverride, remove: removeGradeOverride } = useFieldArray({
		control,
		name: "gradeOverrides"
	});

	const { fields: genderOverrideFields, append: appendGenderOverride, remove: removeGenderOverride } = useFieldArray({
		control,
		name: "genderOverrides"
	});

	const { fields: gradeGenderOverrideFields, append: appendGradeGenderOverride, remove: removeGradeGenderOverride } = useFieldArray({
		control,
		name: "gradeGenderOverrides"
	});

	const { data: settingsData, isLoading, refetch } = useGetSettingQuery();
	const { data: gradesData } = useGetAllGradeQuery();
	const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();

	useEffect(() => {
		if (settingsData?.data?.schoolTimings) {
			const schoolTimings = settingsData.data.schoolTimings;

			const defaultTimings = schoolTimings.default || {
				startTime: "08:00",
				endTime: "15:00",
				lunchStartTime: "12:00",
				lunchEndTime: "13:00",
				totalHours: 7,
				periodDuration: 45,
				totalPeriods: 8,
				breaks: []
			};

			// Use reset instead of setValue to properly initialize field arrays
			reset({
				default: defaultTimings,
				gradeOverrides: schoolTimings.gradeOverrides || [],
				genderOverrides: schoolTimings.genderOverrides || [],
				gradeGenderOverrides: schoolTimings.gradeGenderOverrides || []
			});
		}
	}, [settingsData, reset]);

	// Watch default timing fields for automatic calculation
	const watchedDefaultStartTime = watch('default.startTime');
	const watchedDefaultEndTime = watch('default.endTime');
	const watchedDefaultLunchStartTime = watch('default.lunchStartTime');
	const watchedDefaultLunchEndTime = watch('default.lunchEndTime');
	const watchedDefaultPeriodDuration = watch('default.periodDuration');
	const watchedDefaultBreaks = watch('default.breaks');

	// Calculate and update default total hours and periods when timing fields change
	useEffect(() => {
		if (watchedDefaultStartTime && watchedDefaultEndTime && watchedDefaultLunchStartTime && watchedDefaultLunchEndTime && watchedDefaultPeriodDuration) {
			const { totalHours, totalPeriods } = calculateTimings(
				watchedDefaultStartTime,
				watchedDefaultEndTime,
				watchedDefaultLunchStartTime,
				watchedDefaultLunchEndTime,
				watchedDefaultBreaks || [],
				watchedDefaultPeriodDuration
			);

			setValue('default.totalHours', totalHours);
			setValue('default.totalPeriods', totalPeriods);
		}
	}, [watchedDefaultStartTime, watchedDefaultEndTime, watchedDefaultLunchStartTime, watchedDefaultLunchEndTime, watchedDefaultPeriodDuration, watchedDefaultBreaks, setValue]);

	// Calculate default break durations when break start/end times change
	useEffect(() => {
		if (watchedDefaultBreaks) {
			watchedDefaultBreaks.forEach((breakItem, breakIndex) => {
				if (breakItem.startTime && breakItem.endTime) {
					const duration = calculateBreakDuration(breakItem.startTime, breakItem.endTime);
					setValue(`default.breaks.${breakIndex}.duration`, duration);
				}
			});
		}
	}, [watchedDefaultBreaks, setValue]);

	// Function to recalculate default values on blur
	const recalculateDefaultOnBlur = () => {
		// Recalculate total hours and periods
		if (watchedDefaultStartTime && watchedDefaultEndTime && watchedDefaultLunchStartTime && watchedDefaultLunchEndTime && watchedDefaultPeriodDuration) {
			const { totalHours, totalPeriods } = calculateTimings(
				watchedDefaultStartTime,
				watchedDefaultEndTime,
				watchedDefaultLunchStartTime,
				watchedDefaultLunchEndTime,
				watchedDefaultBreaks || [],
				watchedDefaultPeriodDuration
			);

			setValue('default.totalHours', totalHours);
			setValue('default.totalPeriods', totalPeriods);
		}

		// Recalculate break durations
		if (watchedDefaultBreaks) {
			watchedDefaultBreaks.forEach((breakItem, breakIndex) => {
				if (breakItem.startTime && breakItem.endTime) {
					const duration = calculateBreakDuration(breakItem.startTime, breakItem.endTime);
					setValue(`default.breaks.${breakIndex}.duration`, duration);
				}
			});
		}
	};

	// Function to recalculate default break duration when break end time is blurred
	const recalculateDefaultBreakDurationOnBlur = (breakIndex) => {
		console.log('Default break duration calculation triggered for break index:', breakIndex);
		const currentBreaks = watchedDefaultBreaks || [];
		const breakItem = currentBreaks[breakIndex];

		console.log('Current default breaks:', currentBreaks);
		console.log('Default break item:', breakItem);

		if (breakItem && breakItem.startTime && breakItem.endTime) {
			const duration = calculateBreakDuration(breakItem.startTime, breakItem.endTime);
			console.log('Calculated default break duration:', duration);
			setValue(`default.breaks.${breakIndex}.duration`, duration);
		}
	};

	const onSubmit = async (data) => {
		try {
			await updateSetting({
				id: settingsData.data._id,
				data: {
					schoolTimings: data
				}
			}).unwrap();
			showSnackbar(t('settings.schoolTimings.messages.updateSuccess'), 'success');
			refetch();
		} catch (error) {
			showSnackbar(error?.data?.message || t('settings.schoolTimings.messages.updateError'), 'error');
		}
	};

	const addBreak = () => {
		appendBreak({
			name: '',
			startTime: '',
			endTime: '',
			duration: ''
		});
	};

	const addGradeOverride = () => {
		appendGradeOverride({
			grade: '',
			startTime: '',
			endTime: '',
			lunchStartTime: '',
			lunchEndTime: '',
			totalHours: '',
			periodDuration: '',
			totalPeriods: '',
			breaks: []
		});
	};

	const addGenderOverride = () => {
		appendGenderOverride({
			gender: '',
			startTime: '',
			endTime: '',
			lunchStartTime: '',
			lunchEndTime: '',
			totalHours: '',
			periodDuration: '',
			totalPeriods: '',
			breaks: []
		});
	};

	const addGradeGenderOverride = () => {
		appendGradeGenderOverride({
			grade: '',
			gender: '',
			startTime: '',
			endTime: '',
			lunchStartTime: '',
			lunchEndTime: '',
			totalHours: '',
			periodDuration: '',
			totalPeriods: '',
			breaks: []
		});
	};


	const sections = [
		{ id: 'default', label: t('settings.schoolTimings.sections.default'), icon: <AccessTimeIcon /> },
		{ id: 'gradeOverrides', label: t('settings.schoolTimings.sections.gradeOverrides'), icon: <AccessTimeIcon /> },
		{ id: 'genderOverrides', label: t('settings.schoolTimings.sections.genderOverrides'), icon: <AccessTimeIcon /> },
		{ id: 'gradeGenderOverrides', label: t('settings.schoolTimings.sections.gradeGenderOverrides'), icon: <AccessTimeIcon /> }
	];

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
				<Typography>{t('settings.schoolTimings.loading')}</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box display="flex" alignItems="center" gap={1.5} mb={3}>
				<Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
					<AccessTimeIcon sx={{ fontSize: 20 }} />
				</Avatar>
				<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
					{t('settings.schoolTimings.title')}
				</Typography>
			</Box>

			{/* Section Navigation */}
			<Box mb={3}>
				<Box display="flex" gap={1} flexWrap="wrap">
					{sections.map((section) => (
						<Chip
							key={section.id}
							label={section.label}
							onClick={() => setActiveSection(section.id)}
							variant={activeSection === section.id ? "filled" : "outlined"}
							sx={{
								backgroundColor: activeSection === section.id ? themeColors.primary : 'transparent',
								color: activeSection === section.id ? 'white' : themeColors.text.primary,
								borderColor: themeColors.border.primary,
								'&:hover': {
									backgroundColor: activeSection === section.id ? themeColors.primary : `${themeColors.primary}22`,
								}
							}}
						/>
					))}
				</Box>
			</Box>

			<form onSubmit={handleSubmit(onSubmit)}>
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<CardContent sx={{ p: 3 }}>
						{activeSection === 'default' && (
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 3 }}>
									{t('settings.schoolTimings.defaultTimings')}
								</Typography>

								<Grid container spacing={3}>
									{/* Basic Timings */}
									<Grid item xs={12}>
										<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
											{t('settings.schoolTimings.schoolHours')}
										</Typography>
									</Grid>

									<Grid item xs={12} md={6}>
										<CustomInput
											name="default.startTime"
											control={control}
											label={t('settings.schoolTimings.form.schoolStartTime')}
											placeholder="08:00"
											error={errors.default?.startTime}
											themeColors={themeColors}
											type="time"
											onBlur={recalculateDefaultOnBlur}
										/>
									</Grid>

									<Grid item xs={12} md={6}>
										<CustomInput
											name="default.endTime"
											control={control}
											label={t('settings.schoolTimings.form.schoolEndTime')}
											placeholder="15:00"
											error={errors.default?.endTime}
											themeColors={themeColors}
											type="time"
											onBlur={recalculateDefaultOnBlur}
										/>
									</Grid>

									{/* Lunch Timings */}
									<Grid item xs={12}>
										<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 2 }}>
											{t('settings.schoolTimings.lunchTimings')}
										</Typography>
									</Grid>

									<Grid item xs={12} md={6}>
										<CustomInput
											name="default.lunchStartTime"
											control={control}
											label={t('settings.schoolTimings.form.lunchStartTime')}
											placeholder="12:00"
											error={errors.default?.lunchStartTime}
											themeColors={themeColors}
											type="time"
											onBlur={recalculateDefaultOnBlur}
										/>
									</Grid>

									<Grid item xs={12} md={6}>
										<CustomInput
											name="default.lunchEndTime"
											control={control}
											label={t('settings.schoolTimings.form.lunchEndTime')}
											placeholder="13:00"
											error={errors.default?.lunchEndTime}
											themeColors={themeColors}
											type="time"
											onBlur={recalculateDefaultOnBlur}
										/>
									</Grid>

									{/* Duration Settings */}
									<Grid item xs={12}>
										<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 2 }}>
											{t('settings.schoolTimings.durationSettings')}
										</Typography>
									</Grid>

									<Grid item xs={12} md={4}>
										<CustomInput
											name="default.totalHours"
											control={control}
											label={t('settings.schoolTimings.form.totalHours')}
											placeholder="7"
											error={errors.default?.totalHours}
											themeColors={themeColors}
											type="number"
											inputProps={{ min: 1, max: 12, readOnly: true }}
											sx={{ '& .MuiInputBase-input': { backgroundColor: themeColors.background.secondary } }}
										/>
									</Grid>

									<Grid item xs={12} md={4}>
										<CustomInput
											name="default.periodDuration"
											control={control}
											label={t('settings.schoolTimings.form.periodDuration')}
											placeholder="45"
											error={errors.default?.periodDuration}
											themeColors={themeColors}
											type="number"
											inputProps={{ min: 15, max: 120 }}
											onBlur={recalculateDefaultOnBlur}
										/>
									</Grid>

									<Grid item xs={12} md={4}>
										<CustomInput
											name="default.totalPeriods"
											control={control}
											label={t('settings.schoolTimings.form.totalPeriods')}
											placeholder="8"
											error={errors.default?.totalPeriods}
											themeColors={themeColors}
											type="number"
											inputProps={{ min: 1, max: 15, readOnly: true }}
											sx={{ '& .MuiInputBase-input': { backgroundColor: themeColors.background.secondary } }}
										/>
									</Grid>

									{/* Breaks */}
									<Grid item xs={12}>
										<Box display="flex" alignItems="center" justifyContent="space-between" mb={2} mt={2}>
											<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
												{t('settings.schoolTimings.breaks')}
											</Typography>
											<IconButton
												onClick={addBreak}
												sx={{
													backgroundColor: themeColors.primary,
													color: 'white',
													'&:hover': {
														backgroundColor: themeColors.primary,
														opacity: 0.8
													}
												}}
												size="small"
											>
												<AddIcon />
											</IconButton>
										</Box>
									</Grid>

									{breakFields.map((field, index) => (
										<React.Fragment key={field.id}>
											<Grid item xs={12}>
												<Card sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
													<CardContent sx={{ p: 2 }}>
														<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
															<Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
																{t('settings.schoolTimings.break')} {index + 1}
															</Typography>
															<IconButton
																onClick={() => removeBreak(index)}
																sx={{ color: themeColors.error }}
																size="small"
															>
																<DeleteIcon />
															</IconButton>
														</Box>

														<Grid container spacing={2}>
															<Grid item xs={12} md={6}>
																<CustomInput
																	name={`default.breaks.${index}.name`}
																	control={control}
																	label={t('settings.schoolTimings.form.breakName')}
																	placeholder={t('settings.schoolTimings.form.morningBreak')}
																	error={errors.default?.breaks?.[index]?.name}
																	themeColors={themeColors}
																/>
															</Grid>

															<Grid item xs={12} md={6}>
																<CustomInput
																	name={`default.breaks.${index}.duration`}
																	control={control}
																	label={t('settings.schoolTimings.form.duration')}
																	placeholder="15"
																	error={errors.default?.breaks?.[index]?.duration}
																	themeColors={themeColors}
																	type="number"
																	inputProps={{ min: 1, max: 60, readOnly: true }}
																	sx={{ '& .MuiInputBase-input': { backgroundColor: themeColors.background.secondary } }}
																/>
															</Grid>

															<Grid item xs={12} md={6}>
																<CustomInput
																	name={`default.breaks.${index}.startTime`}
																	control={control}
																	label={t('settings.schoolTimings.form.startTime')}
																	placeholder="10:00"
																	error={errors.default?.breaks?.[index]?.startTime}
																	themeColors={themeColors}
																	type="time"
																	onBlur={recalculateDefaultOnBlur}
																/>
															</Grid>

															<Grid item xs={12} md={6}>
																<CustomInput
																	name={`default.breaks.${index}.endTime`}
																	control={control}
																	label={t('settings.schoolTimings.form.endTime')}
																	placeholder="10:15"
																	error={errors.default?.breaks?.[index]?.endTime}
																	themeColors={themeColors}
																	type="time"
																	inputProps={{
																		onBlur: () => {
																			console.log('Default break end time onBlur triggered');
																			recalculateDefaultBreakDurationOnBlur(index);
																		}
																	}}
																/>
															</Grid>
														</Grid>
													</CardContent>
												</Card>
											</Grid>
										</React.Fragment>
									))}
								</Grid>
							</Box>
						)}

						{activeSection === 'gradeOverrides' && (
							<Box>
								<Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
									<Box>
										<Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
											{t('settings.schoolTimings.gradeSpecificOverrides')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{t('settings.schoolTimings.gradeSpecificOverridesDescription')}
										</Typography>
									</Box>
									<IconButton
										onClick={addGradeOverride}
										sx={{
											backgroundColor: themeColors.primary,
											color: 'white',
											'&:hover': {
												backgroundColor: themeColors.primary,
												opacity: 0.8
											}
										}}
									>
										<AddIcon />
									</IconButton>
								</Box>

								{gradeOverrideFields.map((field, index) => (
									<OverrideForm
										key={field.id}
										index={index}
										fields="gradeOverrides"
										removeFunction={removeGradeOverride}
										showGrade={true}
										title={t('settings.schoolTimings.gradeOverride')}
										control={control}
										errors={errors}
										themeColors={themeColors}
										gradesData={gradesData}
										watch={watch}
										setValue={setValue}
										t={t}
									/>
								))}

								{gradeOverrideFields.length === 0 && (
									<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
										<Typography sx={{ color: themeColors.text.secondary }}>
											{t('settings.schoolTimings.noGradeOverrides')}
										</Typography>
									</Box>
								)}
							</Box>
						)}

						{activeSection === 'genderOverrides' && (
							<Box>
								<Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
									<Box>
										<Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
											{t('settings.schoolTimings.genderSpecificOverrides')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{t('settings.schoolTimings.genderSpecificOverridesDescription')}
										</Typography>
									</Box>
									<IconButton
										onClick={addGenderOverride}
										sx={{
											backgroundColor: themeColors.primary,
											color: 'white',
											'&:hover': {
												backgroundColor: themeColors.primary,
												opacity: 0.8
											}
										}}
									>
										<AddIcon />
									</IconButton>
								</Box>

								{genderOverrideFields.map((field, index) => (
									<OverrideForm
										key={field.id}
										index={index}
										fields="genderOverrides"
										removeFunction={removeGenderOverride}
										showGender={true}
										title={t('settings.schoolTimings.genderOverride')}
										control={control}
										errors={errors}
										themeColors={themeColors}
										gradesData={gradesData}
										watch={watch}
										setValue={setValue}
										t={t}
									/>
								))}

								{genderOverrideFields.length === 0 && (
									<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
										<Typography sx={{ color: themeColors.text.secondary }}>
											{t('settings.schoolTimings.noGenderOverrides')}
										</Typography>
									</Box>
								)}
							</Box>
						)}

						{activeSection === 'gradeGenderOverrides' && (
							<Box>
								<Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
									<Box>
										<Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
											{t('settings.schoolTimings.gradeGenderCombinedOverrides')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{t('settings.schoolTimings.gradeGenderCombinedOverridesDescription')}
										</Typography>
									</Box>
									<IconButton
										onClick={addGradeGenderOverride}
										sx={{
											backgroundColor: themeColors.primary,
											color: 'white',
											'&:hover': {
												backgroundColor: themeColors.primary,
												opacity: 0.8
											}
										}}
									>
										<AddIcon />
									</IconButton>
								</Box>

								{gradeGenderOverrideFields.map((field, index) => (
									<OverrideForm
										key={field.id}
										index={index}
										fields="gradeGenderOverrides"
										removeFunction={removeGradeGenderOverride}
										showGrade={true}
										showGender={true}
										title={t('settings.schoolTimings.gradeGenderOverride')}
										control={control}
										errors={errors}
										themeColors={themeColors}
										gradesData={gradesData}
										watch={watch}
										setValue={setValue}
										t={t}
									/>
								))}

								{gradeGenderOverrideFields.length === 0 && (
									<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
										<Typography sx={{ color: themeColors.text.secondary }}>
											{t('settings.schoolTimings.noGradeGenderOverrides')}
										</Typography>
									</Box>
								)}
							</Box>
						)}

						<Divider sx={{ my: 3, borderColor: themeColors.border.primary }} />

						{ability.can("Edit", "Settings") && <Box display="flex" gap={2} justifyContent="flex-end">
							<CustomButton
								variant="outlined"
								onClick={() => reset()}
								disable={isUpdating}
								themeColors={themeColors}
								label={t('settings.schoolTimings.actions.reset')}
							/>
							<CustomButton
								type="submit"
								disable={isUpdating}
								loading={isUpdating}
								themeColors={themeColors}
								label={t('settings.schoolTimings.actions.saveSettings')}
							/>
						</Box>}
					</CardContent>
				</Card>
			</form>

			<UiBlocker open={isUpdating} />
		</Box>
	);
};

export default SchoolTimingSettings;
