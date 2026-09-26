import React, { useEffect, useMemo, useState } from 'react';
import { Box, Breadcrumbs, Card, CardContent, Grid, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'lodash-es';
import { useSnackbar } from '../../hooks/SnackBar';
import CustomButton from '../../components/Common/CustomButton';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object } from 'yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';

import {
	useLazyGetMyGradePermissionsQuery,
	useLazyGetMyGenderPermissionsQuery,
	useLazyGetMySectionPermissionsQuery,
	useLazyGetMySubjectPermissionsQuery,
} from '../../Redux/features/Admin/TeachersSlice';

import { useGetSubjectFeedbackStudentsQuery, useCreateSubjectFeedbackMutation } from '../../Redux/features/Feedback/SubjectFeedbackSlice';
import { useDispatch, useSelector } from 'react-redux';
import {
	setGender,
	setGradeId,
	setSectionId,
	setSubjectFeedbackType,
	setSubjectId,
} from '../../Redux/features/Feedback/subjectFeedbackFilterSlice';

const SubjectFeedback = () => {
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();

	const dispatch = useDispatch();
	const { gradeId, gender, sectionId, subjectId, type } = useSelector((state) => state.subjectFeedbackFilters);
	const [academicStudentIds, setAcademicStudentIds] = useState([]);

	const [triggerGrades, { data: gradesRes, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [triggerGender, { data: gendersRes, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
	const [triggerSections, { data: sectionsRes, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();
	const [triggerSubjects, { data: subjectsRes, isFetching: subjectLoading }] = useLazyGetMySubjectPermissionsQuery();

	const grades = gradesRes?.data || [];
	const genders = gendersRes?.data || [];
	const sections = sectionsRes?.data || [];
	const subjects = subjectsRes?.data || [];

	useEffect(() => {
		// Loads using current academicYear (backend defaults to settings academicYear)
		triggerGrades();
	}, [triggerGrades]);

	useEffect(() => {
		if (gradeId) {
			setAcademicStudentIds([]);
			triggerGender({ grade: gradeId });
		}
	}, [gradeId, triggerGender]);

	useEffect(() => {
		if (gradeId && gender) {
			setAcademicStudentIds([]);
			triggerSections({ grade: gradeId, gender });
		}
	}, [gradeId, gender, triggerSections]);

	useEffect(() => {
		if (gradeId && gender && sectionId) {
			setAcademicStudentIds([]);
			triggerSubjects({ grade: gradeId, gender, section: sectionId });
		}
	}, [gradeId, gender, sectionId, triggerSubjects]);

	const { data: studentsRes, isLoading: studentsLoading } = useGetSubjectFeedbackStudentsQuery(
		{ grade: gradeId, gender, section: sectionId },
		{ skip: !gradeId || !gender || !sectionId, refetchOnMountOrArgChange: true }
	);
	const students = studentsRes?.data || [];

	const schema = useMemo(
		() =>
			object().shape({
				feedback: yup.string().trim().required(t('feedback.subject.validation.feedbackRequired')),
				feedbackDate: yup.string().required(t('feedback.subject.validation.dateRequired')),
			}),
		[t]
	);

	const {
		handleSubmit,
		register,
		reset,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: { feedback: '', feedbackDate: new Date().toISOString().slice(0, 10) },
	});

	const [triggerCreate, { isLoading: isSaving }] = useCreateSubjectFeedbackMutation();

	const onSubmit = async (data) => {
		if (!gradeId || !gender || !sectionId) {
			showSnackbar(t('feedback.subject.messages.selectClassFirst'), 'error');
			return;
		}
		if (!subjectId) {
			showSnackbar(t('feedback.subject.messages.selectSubjectFirst'), 'error');
			return;
		}
		if (!academicStudentIds.length) {
			showSnackbar(t('feedback.subject.messages.selectStudentFirst'), 'error');
			return;
		}

		const baseData = {
			grade: gradeId,
			gender,
			section: sectionId,
			subject: subjectId,
			feedback: data.feedback,
			feedbackDate: data.feedbackDate,
			type,
		};

		for (const academicStudentId of academicStudentIds) {
			const res = await triggerCreate({
				...baseData,
				academicStudentId,
			});
			if (res?.error) {
				showSnackbar(res?.error?.data?.message || t('feedback.subject.messages.error'), 'error');
				return;
			}
		}

		showSnackbar(t('feedback.subject.messages.success'), 'success');
		// Back to list; filters persist in RTK
		navigate('/feedback/subject');
	};

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
				<Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/feedback')}
					>
						{t('feedback.breadcrumbs.feedback')}
					</Link>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/feedback/subject')}
					>
						{t('feedback.breadcrumbs.subjectFeedback')} • {t('feedback.breadcrumbs.list')}
					</Link>
					<Typography sx={{ color: themeColors.text.primary }}>{t('feedback.breadcrumbs.new')}</Typography>
				</Breadcrumbs>

				<Box mb={2}>
					<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
						{t('feedback.subject.title')}
					</Typography>
					<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
						{t('feedback.subject.subtitle')}
					</Typography>
				</Box>

				<Card sx={{ 
					borderRadius: 2, 
					boxShadow: 2, 
					border: `1px solid ${themeColors.border.primary}`, 
					mb: 2,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}>
								<TextField
									select
									fullWidth
									size="small"
									value={gradeId}
									onChange={(e) => dispatch(setGradeId(e.target.value))}
									label={t('feedback.subject.fields.grade')}
									disabled={gradeLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectGrade')}</em>
									</MenuItem>
									{grades.map((g) => (
										<MenuItem key={g._id} value={g._id}>
											{g.gradeName}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							<Grid item xs={12} md={4}>
								<TextField
									select
									fullWidth
									size="small"
									value={gender}
									onChange={(e) => dispatch(setGender(e.target.value))}
									label={t('feedback.subject.fields.gender')}
									disabled={!gradeId || genderLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectGender')}</em>
									</MenuItem>
									{genders.map((g) => (
										<MenuItem key={g} value={g}>
											{capitalize(g)}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField
									select
									fullWidth
									size="small"
									value={sectionId}
									onChange={(e) => dispatch(setSectionId(e.target.value))}
									label={t('feedback.subject.fields.section')}
									disabled={!gradeId || !gender || sectionLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectSection')}</em>
									</MenuItem>
									{sections.map((s) => (
										<MenuItem key={s._id} value={s._id}>
											{s.sectionName}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField
									select
									fullWidth
									size="small"
									value={type}
									onChange={(e) => dispatch(setSubjectFeedbackType(e.target.value))}
									label={t('feedback.subject.fields.type')}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="feedback">{t('feedback.types.feedback')}</MenuItem>
									<MenuItem value="discipline">{t('feedback.types.discipline')}</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField
									fullWidth
									type="date"
									size="small"
									label={t('feedback.subject.fields.date')}
									InputLabelProps={{ shrink: true }}
									{...register('feedbackDate')}
									error={!!errors.feedbackDate}
									helperText={errors.feedbackDate?.message}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								/>
							</Grid>
							
						</Grid>
					</CardContent>
				</Card>

				<Card sx={{ 
					borderRadius: 2, 
					boxShadow: 2, 
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<TextField
									select
									fullWidth
									size="small"
									value={subjectId}
									onChange={(e) => dispatch(setSubjectId(e.target.value))}
									label={t('feedback.subject.fields.subject')}
									disabled={!gradeId || !gender || !sectionId || subjectLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectSubject')}</em>
									</MenuItem>
									{subjects.map((s) => (
										<MenuItem key={s._id} value={s._id}>
											{s.subjectName}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									select
									fullWidth
									size="small"
									value={academicStudentIds}
									onChange={(e) => {
										const value = e.target.value;
										setAcademicStudentIds(typeof value === 'string' ? value.split(',') : value);
									}}
									label={t('feedback.subject.fields.student')}
									disabled={!gradeId || !gender || !sectionId || studentsLoading}
									SelectProps={{
										multiple: true,
										renderValue: (selected) => {
											const selectedLabels = students
												.filter((s) => selected.includes(s.academicStudentId))
												.map((s) => (s.studentID ? `${s.studentID} - ${s.studentName}` : s.studentName));
											return selectedLabels.join(', ');
										},
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									{students.map((s) => (
										<MenuItem key={s.academicStudentId} value={s.academicStudentId}>
											{s.studentID ? `${s.studentID} - ${s.studentName}` : s.studentName}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							

							<Grid item xs={12}>
								<TextField
									fullWidth
									multiline
									minRows={4}
									label={t('feedback.subject.fields.feedback')}
									placeholder={t('feedback.subject.placeholders.feedback')}
									{...register('feedback')}
									error={!!errors.feedback}
									helperText={errors.feedback?.message}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										},
										'& .MuiInputBase-input': {
											color: themeColors.text.primary
										}
									}}
								/>
							</Grid>
						</Grid>

						<Stack direction="row" justifyContent="flex-end" mt={3}>
							<CustomButton
								onClick={handleSubmit(onSubmit)}
								label={t('feedback.subject.actions.submit')}
								isIcon={false}
								width="180px"
								loading={isSaving}
								disable={!gradeId || !gender || !sectionId || !subjectId || academicStudentIds.length === 0}
							/>
						</Stack>
					</CardContent>
				</Card>
			</Box>
		</CustomOutletBox>
	);
};

export default SubjectFeedback;

