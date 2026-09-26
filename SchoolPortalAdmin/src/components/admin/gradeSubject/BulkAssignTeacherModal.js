import React, { useMemo, useEffect, useState } from 'react'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomModal from '../../Common/CustomModal';
import { Box, Grid, MenuItem, Typography, Chip, Stack } from '@mui/material';
import CustomButton from '../../Common/CustomButton';
import CustomSelect from '../../Common/CustomSelect';
import { 
    useGetAllTeachersQuery,
    useBulkAssignTeacherMutation 
} from '../../../Redux/features/Admin/GradeSubject';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const BulkAssignTeacherModal = ({ close, open, label, selectedSubjects = [] }) => {
	const { t } = useTranslation();
	const ability = useAbility();
	const [capturedSubjects, setCapturedSubjects] = useState([]);

	// Capture selectedSubjects when modal opens
	useEffect(() => {
		if (open && selectedSubjects && selectedSubjects.length > 0) {
			console.log('BulkAssignTeacherModal - capturing selectedSubjects:', selectedSubjects);
			setCapturedSubjects(selectedSubjects);
		} else if (!open) {
			// Clear captured subjects when modal closes
			setCapturedSubjects([]);
		}
	}, [open, selectedSubjects]);

	const schema = useMemo(() => object().shape({
		teacher: yup.string().required(t('gradeSubject.bulkAssign.validation.teacherRequired'))
	}), [t]);

	const [triggerBulkAssign, { isLoading }] = useBulkAssignTeacherMutation();
	const showSnackbar = useSnackbar();

	const {
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			teacher: ''
		}
	});

	// Fetch all teachers
	const { 
		data: teachersData, 
		isLoading: isLoadingTeachers,
	} = useGetAllTeachersQuery(
		{},
		{ 
			skip: !open,
			refetchOnMountOrArgChange: true 
		}
	);

	// Reset form when modal closes
	useEffect(() => {
		if (!open) {
			reset({
				teacher: ''
			});
		}
	}, [open, reset]);

	const SubmitForm = async (data) => {
		// Use capturedSubjects instead of selectedSubjects prop
		const subjectsToUse = capturedSubjects.length > 0 ? capturedSubjects : selectedSubjects;
		
		console.log('SubmitForm - subjectsToUse:', subjectsToUse);
		console.log('SubmitForm - subjectsToUse.length:', subjectsToUse?.length);
		console.log('SubmitForm - capturedSubjects:', capturedSubjects);
		console.log('SubmitForm - selectedSubjects prop:', selectedSubjects);
		
		if (!subjectsToUse || !Array.isArray(subjectsToUse) || subjectsToUse.length === 0) {
			showSnackbar(t('gradeSubject.bulkAssign.messages.noSubjectsSelected'), 'error');
			return;
		}

		const gradeSubjectIds = subjectsToUse
			.filter(subject => subject && (subject._id || subject.id))
			.map(subject => subject._id || subject.id);
		
		if (gradeSubjectIds.length === 0) {
			showSnackbar(t('gradeSubject.bulkAssign.messages.noSubjectsSelected'), 'error');
			return;
		}

		const payload = {
			gradeSubjectIds,
			teacher: data.teacher
		};

		try {
			const result = await triggerBulkAssign(payload);

			if (result.error) {
				showSnackbar(result.error.data?.message || t('gradeSubject.bulkAssign.messages.error'), 'error');
				return;
			}

			const updatedCount = result.data?.data?.updated || 0;
			showSnackbar(
				t('gradeSubject.bulkAssign.messages.success', { count: updatedCount }),
				'success'
			);

			reset();
			close();
		} catch (error) {
			showSnackbar(t('gradeSubject.bulkAssign.messages.error'), 'error');
		}
	};

	return (
		<CustomModal close={close} open={open} label={label} width={'md'} block={true}>
			<Grid container spacing={2}>
				{(capturedSubjects.length > 0 || selectedSubjects.length > 0) && (
					<Grid item xs={12}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
								{t('gradeSubject.bulkAssign.selectedSubjects')} ({(capturedSubjects.length > 0 ? capturedSubjects : selectedSubjects).length})
							</Typography>
							<Box sx={{ 
								maxHeight: '150px', 
								overflowY: 'auto',
								p: 1,
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1
							}}>
								<Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
									{(capturedSubjects.length > 0 ? capturedSubjects : selectedSubjects).map((subject, index) => (
										<Chip
											key={subject._id || subject.id || index}
											label={subject.subject?.subjectName || subject.subjectName || `Subject ${index + 1}`}
											size="small"
											sx={{ mb: 0.5 }}
										/>
									))}
								</Stack>
							</Box>
						</Box>
					</Grid>
				)}

				<Grid item xs={12}>
					<CustomSelect
						control={control}
						error={errors.teacher}
						fieldName="teacher"
						fieldLabel={t('gradeSubject.bulkAssign.fields.teacher')}
						size="16px"
					>
						<MenuItem value="" disabled>
							<em>{t('gradeSubject.bulkAssign.placeholders.selectTeacher')}</em>
						</MenuItem>
						{teachersData?.data?.map((teacher) => (
							<MenuItem key={teacher._id} value={teacher._id}>
								{teacher.employeeId ? `${teacher.employeeId} - ${teacher.employeeName}` : teacher.employeeName}
							</MenuItem>
						))}
					</CustomSelect>
					{isLoadingTeachers && (
						<Box sx={{ mt: 1, color: 'text.secondary', fontSize: '14px' }}>
							{t('gradeSubject.bulkAssign.loading.teachers')}
						</Box>
					)}
				</Grid>
			</Grid>
			<Box px={20} py={4}>
				{ability.can("Edit", "GradeSubject") && (
					<CustomButton
						onClick={handleSubmit(SubmitForm)}
						width="90%"
						label={t('gradeSubject.bulkAssign.actions.assign')}
						isIcon={false}
						loading={isLoading || isLoadingTeachers}
						disabled={(capturedSubjects.length === 0 && selectedSubjects.length === 0)}
					/>
				)}
			</Box>
		</CustomModal>
	)
}

export default BulkAssignTeacherModal

