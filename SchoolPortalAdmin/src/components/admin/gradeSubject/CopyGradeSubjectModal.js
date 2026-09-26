import React, { useMemo, useEffect, useCallback } from 'react'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomModal from '../../Common/CustomModal';
import { Box, Grid, MenuItem } from '@mui/material';
import CustomButton from '../../Common/CustomButton';
import CustomSelect from '../../Common/CustomSelect';
import CustomMultiSelect from '../../Common/CustomMultiSelect';
import { 
    useGetAvailableGendersForCopyQuery, 
    useGetAvailableSectionsForCopyQuery,
    useCopyGradeSubjectsMutation 
} from '../../../Redux/features/Admin/GradeSubject';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useLocation } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const CopyGradeSubjectModal = ({ close, open, label }) => {
	const { t } = useTranslation();
	const location = useLocation()
	const ability = useAbility();

	const state = location.state || {};


	const schema = useMemo(() => object().shape({
		gender: yup.string().required(t('gradeSubject.copy.validation.genderRequired')),
		sections: yup.array().min(1, t('gradeSubject.copy.validation.sectionsRequired'))
	}), [t]);

	const [triggerCopySubjects, { isLoading }] = useCopyGradeSubjectsMutation();
	const showSnackbar = useSnackbar();

	const {
		handleSubmit,
		control,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			gender: '',
			sections: []
		}
	});

	const selectedGender = watch('gender');
	const selectedSections = watch('sections');

	// Fetch available genders
	const { 
		data: availableGenders, 
		isLoading: isLoadingGenders,
		error: gendersError,
		refetch: refetchGenders 
	} = useGetAvailableGendersForCopyQuery(
		{ grade: state.grade },
		{ 
			skip: !state.grade || !open,
			refetchOnMountOrArgChange: true 
		}
	);

	// Fetch available sections when gender is selected
	const sectionsQueryParams = useMemo(() => {
		if (!selectedGender || !state.grade) return null;
		return { grade: state.grade, gender: selectedGender };
	}, [selectedGender, state.grade]);

	const { 
		data: availableSections, 
		isLoading: isLoadingSections,
		error: sectionsError,
		refetch: refetchSections 
	} = useGetAvailableSectionsForCopyQuery(
		sectionsQueryParams,
		{ 
			skip: !sectionsQueryParams || !open,
			refetchOnMountOrArgChange: true 
		}
	);

	// Refetch genders when modal opens
	useEffect(() => {
		if (open && state.grade) {
			refetchGenders();
		}
	}, [open, state.grade, refetchGenders]);

	// Reset sections when gender changes
	useEffect(() => {
		if (selectedGender) {
			setValue('sections', []);
		}
	}, [selectedGender, setValue]);

	// Reset form when modal closes
	useEffect(() => {
		if (!open) {
			reset({
				gender: '',
				sections: []
			});
		}
	}, [open, reset]);

	const SubmitForm = async (data) => {
		if (!state.grade || !state.gender || !state.section) {
			showSnackbar(t('gradeSubject.copy.messages.missingSourceData'), 'error');
			return;
		}

		const payload = {
			sourceFilters: {
				academicYear: state.academicYear,
				grade: state.grade,
				gender: state.gender,
				section: state.section
			},
			targetGender: data.gender,
			targetSections: data.sections
		};

		try {
			const result = await triggerCopySubjects(payload);

			if (result.error) {
				showSnackbar(result.error.data?.message || t('gradeSubject.copy.messages.error'), 'error');
				return;
			}

			if (result.data?.data?.errors && result.data.data.errors.length > 0) {
				const errorCount = result.data.data.errors.length;
				const successCount = result.data.data.created || 0;
				showSnackbar(
					t('gradeSubject.copy.messages.partialSuccess', { success: successCount, errors: errorCount }),
					'warning'
				);
			} else {
				showSnackbar(t('gradeSubject.copy.messages.success'), 'success');
			}

			reset();
			close();
		} catch (error) {
			showSnackbar(t('gradeSubject.copy.messages.error'), 'error');
		}
	};

	return (
		<CustomModal close={close} open={open} label={label} width={'md'} block={true}>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<CustomSelect
						control={control}
						error={errors.gender}
						fieldName="gender"
						fieldLabel={t('gradeSubject.copy.fields.gender')}
						size="16px"
					>
						<MenuItem value="" disabled>
							<em>{t('gradeSubject.copy.placeholders.selectGender')}</em>
						</MenuItem>
						{availableGenders?.data?.map((gender) => (
							<MenuItem key={gender} value={gender}>
								{gender === 'male' ? t('gradeSubject.copy.gender.male') : t('gradeSubject.copy.gender.female')}
							</MenuItem>
						))}
					</CustomSelect>
					{isLoadingGenders && (
						<Box sx={{ mt: 1, color: 'text.secondary', fontSize: '14px' }}>
							{t('gradeSubject.copy.loading.genders')}
						</Box>
					)}
					{gendersError && (
						<Box sx={{ mt: 1, color: 'error.main', fontSize: '14px' }}>
							{gendersError?.data?.message || t('gradeSubject.copy.messages.error')}
						</Box>
					)}
					{!isLoadingGenders && !gendersError && availableGenders?.data?.length === 0 && (
						<Box sx={{ mt: 1, color: 'warning.main', fontSize: '14px' }}>
							{t('gradeSubject.copy.messages.noAvailableGenders')}
						</Box>
					)}
				</Grid>

				{selectedGender && (
					<Grid item xs={12}>
						<CustomMultiSelect
							control={control}
							error={errors.sections}
							fieldName="sections"
							fieldLabel={t('gradeSubject.copy.fields.sections')}
							size="16px"
							value={selectedSections}
						>
							<MenuItem value="" disabled>
								<em>{t('gradeSubject.copy.placeholders.selectSections')}</em>
							</MenuItem>
							{availableSections?.data?.map((section) => (
								<MenuItem key={section._id} value={section._id}>
									{section.sectionName}
								</MenuItem>
							))}
						</CustomMultiSelect>
						{isLoadingSections && (
							<Box sx={{ mt: 1, color: 'text.secondary', fontSize: '14px' }}>
								{t('gradeSubject.copy.loading.sections')}
							</Box>
						)}
						{sectionsError && (
							<Box sx={{ mt: 1, color: 'error.main', fontSize: '14px' }}>
								{sectionsError?.data?.message || t('gradeSubject.copy.messages.error')}
							</Box>
						)}
						{!isLoadingSections && !sectionsError && availableSections?.data?.length === 0 && (
							<Box sx={{ mt: 1, color: 'warning.main', fontSize: '14px' }}>
								{t('gradeSubject.copy.messages.noAvailableSections')}
							</Box>
						)}
					</Grid>
				)}
			</Grid>
			<Box px={20} py={4}>
				{ability.can("Create", "GradeSubject") && (
					<CustomButton
						onClick={handleSubmit(SubmitForm)}
						width="90%"
						label={t('gradeSubject.copy.actions.copy')}
						isIcon={false}
						loading={isLoading || isLoadingGenders || isLoadingSections}
					/>
				)}
			</Box>
		</CustomModal>
	)
}

export default CopyGradeSubjectModal

