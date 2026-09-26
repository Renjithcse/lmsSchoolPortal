import { Box, Grid, MenuItem, Typography, Paper, Container, Fade } from '@mui/material'
import React, { useEffect, useState, useMemo } from 'react'
import CustomSelect from '../Common/CustomSelect'
import { set, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomButton from '../Common/CustomButton';
import UiBlocker from '../Common/UiBlocker';
import { useNavigate } from 'react-router-dom';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import { useGetAcademicYearQuery, useLazyGetAllGradesByAcademicQuery, useLazyGetAllSectionByAcademicYearGradeGenderQuery, useLazyGetAllSubjectsByAcademicYearGradeGenderSectionQuery, useLazyGetAllSubjectsByAcademicYearGradeQuery } from '../../Redux/features/commonSlice';
import { useLazyListExamsQuery } from '../../Redux/features/MarkEntry';
import { useLazyGetMyGenderPermissionsQuery, useLazyGetMyGradePermissionsQuery, useLazyGetMySectionPermissionsQuery, useLazyGetMySubjectPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import { capitalize } from 'lodash-es';
import { useTranslation } from 'react-i18next';

const Header = ({ hide, resetRoute, successRoute, onHide, onSelectionChange, title }) => {
	const { t } = useTranslation();
	// const count = useSelector((state) => state.counter.value);
	const { themeColors } = useThemeContext();

	const schema = useMemo(() => object().shape({
		academic_id: yup.object().required(t('examMark.header.validation.academicRequired')),
		term: yup.string().required(t('examMark.header.validation.termRequired')),
		grade_id: yup.object().required(t('examMark.header.validation.gradeRequired')),
		subject_id: yup.string().required(t('examMark.header.validation.subjectRequired')),
	}), [t]);

	const {
		handleSubmit,
		control,
		watch,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema),

	});

	const academic = watch('academic_id')
	const grade = watch('grade_id')
	const gender = watch('gender')
	const subject = watch('subject_id')
	const section = watch('section')
	const term = watch('term')
	const exam = watch('exam')

	const { data: academicYear, isLoading: academicLoading } = useGetAcademicYearQuery();
	const [triggerGrade, { data: grades, refetch: gradeRefetch, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery()
	const [triggerGender, { data: genders, isLoading: genderLoading }] = useLazyGetMyGenderPermissionsQuery()
	// const [triggerSubject, { data: subjects, isLoading: subjectsLoading }] = useLazyGetAllSubjectsByAcademicYearGradeGenderSectionQuery()
	// const [triggerSection, { data: sections, isLoading: sectionsLoading }] = useLazyGetAllSectionByAcademicYearGradeGenderQuery()
	const [triggerSection, { data: sections , isFetching: sectionsLoading}] = useLazyGetMySectionPermissionsQuery()
	const [triggerSubject, { data: subjects, isFetching: subjectsLoading }]= useLazyGetMySubjectPermissionsQuery()
	const [getExams, { data: exams, isLoading }] = useLazyListExamsQuery();



	console.log({ sections })


	const [showSubmit, setShowSubmit] = useState(true);



	const navigate = useNavigate()

	// Function to get subject name by ID
	const getSubjectName = (subjectId) => {
		if (!subjects?.data || !subjectId) return '';
		const subject = subjects.data.find(sub => sub._id === subjectId);
		return subject ? subject.subjectName : '';
	}

	// Function to get exam name by ID
	const getExamName = (examId) => {
		if (!exams?.data || !examId) return '';
		const exam = exams.data.find(exam => exam._id === examId);
		return exam ? exam.examName : '';
	}

	// Function to generate title from selected values
	const generateTitle = () => {
		const parts = [];
		if (academic?.academicYear) parts.push(academic.academicYear);
		if (term) parts.push(term);
		if (exam) parts.push(getExamName(exam));
		if (grade?.gradeName) parts.push(grade.gradeName);
		if (gender) parts.push(capitalize(gender));
		if (section?.sectionName) parts.push(section.sectionName);
		if (subject) parts.push(getSubjectName(subject));
		return parts.join(' • ');
	}

	useEffect(() => {
		if (academic && grade && gender) {
			triggerSection({ academicYear: academic?._id, grade: grade?._id, gender })
		}
	}, [academic, grade, gender])

	useEffect(() => {
		if (academic && term) {
			getExams({ academicYear: academic?._id, term: term })
		}
	}, [academic, term])

	useEffect(() => {
		setShowSubmit(true)
		navigate(resetRoute)
	}, [academic, term, grade, subject])

	useEffect(() => {
		if (academic) {
			triggerGrade(academic?._id)
		}
	}, [academic])

	useEffect(() => {
		if (academic && grade) {
			triggerGender({ academicYear: academic?._id, grade: grade?._id })
		}
	}, [academic, grade])

	useEffect(() => {
		if (academic && grade && gender && section) {
			triggerSubject({ academicYear: academic?._id, grade: grade?._id, gender, section: section?._id })
		}
	}, [academic, grade, gender, section])

	// Notify parent component of selection changes
	useEffect(() => {
		if (onSelectionChange) {
			const title = generateTitle();
			onSelectionChange({
				title,
				values: { academic, term, exam, grade, gender, section, subject }
			});
		}
	}, [academic, term, exam, grade, gender, section, subject, onSelectionChange])

	const onsubmit = (data) => {
		setShowSubmit(false)
		let datas = {
			academicYear: data?.academic_id?._id,
			grade: data?.grade_id?._id,
			gender: data?.gender,
			section: data?.section._id,
			term: data?.term,
			subject: data?.subject_id,
			examName: data?.exam
		}

		// console.log({datas});

		// Hide the form after submission
		if (onHide) {
			onHide()
		}

		navigate(successRoute, { state: datas })
	}


	return (
		<Fade in={true} timeout={500}>
			<Container maxWidth="xl" sx={{ py: 1 }}>
				<Paper 
					elevation={0}
					sx={{
						background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
						borderRadius: 3,
						overflow: 'hidden',
						position: 'relative',
						'&::before': {
							content: '""',
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							background: 'rgba(255, 255, 255, 0.1)',
							backdropFilter: 'blur(10px)',
						}
					}}
				>
					<Box sx={{ p: 2, position: 'relative', zIndex: 1 }}>
						{/* Title Section */}
						{title && (
							<Box sx={{ mb: 2, textAlign: 'center' }}>
								<Typography 
									variant="h5" 
									sx={{ 
										color: 'white', 
										fontWeight: 700,
										fontSize: '1.5rem',
										textShadow: '0 2px 4px rgba(0,0,0,0.3)',
										mb: 0.5
									}}
								>
									{title}
								</Typography>
								<Typography 
									variant="body2" 
									sx={{ 
										color: 'rgba(255, 255, 255, 0.8)', 
										fontSize: '0.9rem',
										fontWeight: 400
									}}
								>
									{t('examMark.header.subtitle')}
								</Typography>
							</Box>
						)}
						
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.academicYear')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.academic_id}
										fieldName="academic_id"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="" disabled>
											<em>{t('examMark.header.selectAcademic')}</em>
										</MenuItem>
										{academicYear && academicYear?.map((res, i) => (
											<MenuItem key={res?._id} value={res}>
												{res?.academicYear}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.term')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.term}
										fieldName="term"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="" disabled>
											<em>{t('examMark.header.selectTerm')}</em>
										</MenuItem>
										{academic?.terms && academic?.terms?.map((res, i) => (
											<MenuItem key={res} value={res}>
												{res}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.examName')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.exam}
										fieldName="exam"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="" disabled>
											<em>{t('examMark.header.selectExam')}</em>
										</MenuItem>
										{exams?.data && exams?.data?.map((res, i) => (
											<MenuItem key={res} value={res?._id}>
												{res?.examName}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.grade')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.grade_id}
										fieldName="grade_id"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="">
											<em>{t('examMark.header.selectGrade')}</em>
										</MenuItem>
										{grades?.data && grades?.data?.map((res, i) => (
											<MenuItem key={res?._id} value={res}>
												{res?.gradeName}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.gender')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.gender}
										fieldName="gender"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="" disabled>
											<em>{t('examMark.header.selectGender')}</em>
										</MenuItem>
										{genders?.data?.map((res, i) => (
											<MenuItem key={res} value={res}>
												{capitalize(res)}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.section')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.section}
										fieldName="section"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="">
											<em>{t('examMark.header.selectSection')}</em>
										</MenuItem>
										{sections?.data && sections?.data?.map((res, i) => (
											<MenuItem key={res?._id} value={res}>
												{res?.sectionName}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							<Grid item xs={12} sm={6} md={2.5}>
								<Box sx={{ 
									background: themeColors.background.primary, 
									borderRadius: 2, 
									p: 1.5,
									boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
									border: `1px solid ${themeColors.border.primary}`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
									}
								}}>
									<Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
										{t('examMark.header.subject')}
									</Typography>
									<CustomSelect
										view={hide}
										control={control}
										error={errors.subject_id}
										fieldName="subject_id"
										fieldLabel=""
										size="14px"
									>
										<MenuItem value="" disabled>
											<em>{t('examMark.header.selectSubject')}</em>
										</MenuItem>
										{subjects && subjects?.data?.map((res, i) => (
											<MenuItem key={res?._id} value={res?._id}>
												{res?.subjectName}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							{/* {showSubmit && ( */}
								<Grid item xs={12} sm={6} md={2}>
									<CustomButton
										onClick={handleSubmit(onsubmit)}
										width="100%"
										label={t('examMark.header.submit')}
										isIcon={false}
										sx={{
											background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
											borderRadius: 2,
											boxShadow: `0 4px 16px ${themeColors.primary}30`,
											transition: 'all 0.3s ease',
											'&:hover': {
												transform: 'translateY(-1px)',
												boxShadow: `0 6px 20px ${themeColors.primary}40`,
											}
										}}
									/>
								</Grid>
							{/* )} */}
						</Grid>
					</Box>
				</Paper>
				<UiBlocker open={academicLoading || gradeLoading || subjectsLoading || isLoading || sectionsLoading} />
			</Container>
		</Fade>
	)
}

export default Header