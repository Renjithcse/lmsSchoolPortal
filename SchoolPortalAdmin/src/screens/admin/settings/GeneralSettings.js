import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Grid, Typography, Avatar, MenuItem } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string } from "yup";
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomInput from '../../../components/Common/CustomInput';
import CustomButton from '../../../components/Common/CustomButton';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import SchoolIcon from '@mui/icons-material/School';
import { useGetSettingQuery, useUpdateSettingMutation } from '../../../Redux/features/Admin/SettingsSlice';
import { useListAcademicYearsQuery } from '../../../Redux/features/Admin/academicSlice';
import UiBlocker from '../../../components/Common/UiBlocker';
import { useAbility } from '../../../AbilityContext';
import { useQuery } from '@tanstack/react-query';
import { getTermHistories } from '../../../api/termHistory';
import { useTranslation } from 'react-i18next';

const GeneralSettings = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const ability = useAbility();
	const { t } = useTranslation();

	const schema = object().shape({
		academicYear: string().required(t('settings.general.form.academicYearRequired')),
		term: string().required(t('settings.general.form.termRequired')),
		attendanceModificationTime: string().matches(
			/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
			t('settings.general.form.timeFormatError')
		),
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
			academicYear: '',
			term: '',
			attendanceModificationTime: '23:59',
		}
	});

	const { data: settingsData, isLoading, refetch } = useGetSettingQuery();
	const { data: academicYearsData } = useListAcademicYearsQuery();
	const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();

	// Watch academicYear to fetch terms when it changes
	const watchAcademicYear = watch('academicYear');

	// Fetch terms from termHistory filtered by selected academic year
	const { data: termHistoriesData, isLoading: termsLoading } = useQuery({
		queryKey: ['termHistories', watchAcademicYear],
		queryFn: () => getTermHistories({
			academicYear: watchAcademicYear || undefined,
			isActive: true
		}),
		enabled: !!watchAcademicYear, // Only fetch when academic year is selected
		retry: 2
	});

	// Extract unique terms from termHistory
	const availableTerms = useMemo(() => {
		if (!termHistoriesData?.data?.data?.termHistories) return [];

		const terms = termHistoriesData.data.data.termHistories.map(th => th.term);
		// Remove duplicates and sort
		return [...new Set(terms)].sort();
	}, [termHistoriesData]);

	// Track previous academic year to detect user changes
	const prevAcademicYearRef = useRef(null);

	// Clear term when academic year changes (but not on initial load)
	useEffect(() => {
		if (watchAcademicYear && prevAcademicYearRef.current !== null && prevAcademicYearRef.current !== watchAcademicYear) {
			setValue('term', '');
		}
		prevAcademicYearRef.current = watchAcademicYear;
	}, [watchAcademicYear, setValue]);

	useEffect(() => {
		if (settingsData?.data) {
			const academicYearId = settingsData.data.academicYear?._id || settingsData.data.academicYear || '';
			setValue('academicYear', academicYearId);
			setValue('term', settingsData.data.term || '');
			setValue('attendanceModificationTime', settingsData.data.attendanceSettings?.modificationTime || '23:59');
			// Set the ref after initial load to prevent clearing term
			prevAcademicYearRef.current = academicYearId;
		}
	}, [settingsData, setValue]);

	const onSubmit = async (data) => {
		try {
			await updateSetting({
				id: settingsData.data._id,
				data: {
					academicYear: data.academicYear,
					term: data.term,
					attendanceSettings: {
						modificationTime: data.attendanceModificationTime
					}
				}
			}).unwrap();
			showSnackbar(t('settings.general.messages.updateSuccess'), 'success');
			refetch();
		} catch (error) {
			showSnackbar(error?.data?.message || t('settings.general.messages.updateError'), 'error');
		}
	};

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
				<Typography>{t('settings.general.loading')}</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box display="flex" alignItems="center" gap={1.5} mb={3}>
				<Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
					<SchoolIcon sx={{ fontSize: 20 }} />
				</Avatar>
				<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
					{t('settings.general.title')}
				</Typography>
			</Box>

			<form onSubmit={handleSubmit(onSubmit)}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
							{t('settings.general.academicConfiguration')}
						</Typography>
					</Grid>

					<Grid item xs={12} md={6}>
						<CustomSelect
							fieldName="academicYear"
							control={control}
							fieldLabel={t('settings.general.form.academicYear')}
							error={errors.academicYear}
							themeColors={themeColors}
						>
							{academicYearsData?.map((academicYear) => (
								<MenuItem key={academicYear._id} value={academicYear._id}>
									{academicYear.academicYear}
								</MenuItem>
							))}
						</CustomSelect>
					</Grid>

					<Grid item xs={12} md={6}>
						<CustomSelect
							fieldName="term"
							control={control}
							fieldLabel={t('settings.general.form.currentTerm')}
							error={errors.term}
							themeColors={themeColors}
							disabled={!watchAcademicYear || termsLoading}
							onChangeValue={(value) => {
								// Optional: handle term change if needed
							}}
						>
							{availableTerms.map((term, index) => (
								<MenuItem key={index} value={term}>
									{term}
								</MenuItem>
							))}
						</CustomSelect>
					</Grid>

					<Grid item xs={12}>
						<Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 2 }}>
							{t('settings.general.attendanceSettings')}
						</Typography>
					</Grid>

					<Grid item xs={12} md={6}>
						<CustomInput
							name="attendanceModificationTime"
							control={control}
							label={t('settings.general.form.attendanceModificationTime')}
							placeholder="23:59"
							error={errors.attendanceModificationTime}
							themeColors={themeColors}
							type="time"
						/>
						<Typography variant="caption" sx={{ color: themeColors.text.secondary, mt: 0.5, display: 'block' }}>
							{t('settings.general.form.attendanceModificationTimeHelper')}
						</Typography>
					</Grid>

					{ability.can("Edit", "Settings") && <Grid item xs={12}>
						<Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
							<CustomButton
								variant="outlined"
								onClick={() => reset()}
								disable={isUpdating}
								themeColors={themeColors}
								label={t('settings.general.actions.reset')}
							/>
							<CustomButton
								type="submit"
								disable={isUpdating}
								loading={isUpdating}
								themeColors={themeColors}
								label={t('settings.general.actions.saveSettings')}
							/>
						</Box>
					</Grid>}
				</Grid>
			</form>

			<UiBlocker open={isUpdating} />
		</Box>
	);
};

export default GeneralSettings;
