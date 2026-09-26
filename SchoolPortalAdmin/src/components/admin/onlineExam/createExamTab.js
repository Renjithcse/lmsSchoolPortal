import { Box, Grid, MenuItem, Typography, Paper, Container, Fade } from '@mui/material'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import CustomSelect from '../../Common/CustomSelect'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomButton from '../../Common/CustomButton';
import UiBlocker from '../../Common/UiBlocker';
import { useNavigate } from 'react-router-dom';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMySubjectPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const CreateExamTab = ({ hide, resetRoute, onFilterChange, initialValues, onHide, onSelectionChange, title }) => {
	const { t } = useTranslation();
	const [showSubmit, setShowSubmit] = useState(true);
	const { themeColors } = useTheme();
	
	// Refs to track the last triggered values
	const lastYearId = useRef(null);
	const lastGradeId = useRef(null);

	const { data: academicYear, isFetching: academicLoading } = useGetAcademicYearQuery()

	const [triggerGrades, { data: grades, refetch: gradeRefetch, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery()

	const [triggerSubjects, { data: subjects, isFetching: subjectLoading }]= useLazyGetMySubjectPermissionsQuery()

	const naviagate = useNavigate()

	const schema = useMemo(() => object().shape({
		academic_id: yup.object().required(t('exams.createTab.validation.academicRequired')),
		term: yup.string().required(t('exams.createTab.validation.termRequired')),
		grade_id: yup.object().required(t('exams.createTab.validation.gradeRequired')),
		subject_id: yup.string().required(t('exams.createTab.validation.subjectRequired')),
	}), [t]);

	const {
		handleSubmit,
		control,
		setValue,
		setError,
		reset,
		formState: { errors },
		watch
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: initialValues || {}
	});

	const year = watch('academic_id')
	const grade = watch('grade_id')
	const subject = watch('subject_id')
	const term = watch('term')

	// Memoize the IDs to prevent unnecessary re-renders
	const yearId = useMemo(() => year?._id, [year?._id])
	const gradeId = useMemo(() => grade?._id, [grade?._id])

	// Function to get subject name by ID
	const getSubjectName = useCallback((subjectId) => {
		if (!subjects?.data || !subjectId) return '';
		const subject = subjects.data.find(sub => sub._id === subjectId);
		return subject ? subject.subjectName : '';
	}, [subjects?.data])

	// Function to generate title from selected values
	const generateTitle = useCallback(() => {
		const parts = [];
		if (year?.academicYear) parts.push(year.academicYear);
		if (term) parts.push(term);
		if (grade?.gradeName) parts.push(grade.gradeName);
		if (subject) parts.push(getSubjectName(subject));
		return parts.join(' • ');
	}, [year?.academicYear, term, grade?.gradeName, subject, getSubjectName])

	// Set initial values if provided
	useEffect(() => {
		if (initialValues) {
			Object.keys(initialValues).forEach(key => {
				if (initialValues[key]) {
					setValue(key, initialValues[key])
				}
			})
		}
	}, [initialValues, setValue])

	useEffect(() => {
		if (!hide) {
			setShowSubmit(true)
			naviagate(resetRoute)
		}
	}, [year, grade, subject, hide])

	useEffect(() => {
		if(yearId && yearId !== lastYearId.current){
			const data = {
				academicYear: yearId
			}
			triggerGrades(data)
			lastYearId.current = yearId;
		}
	}, [yearId])

	useEffect(() => {
		if(yearId && gradeId && (yearId !== lastYearId.current || gradeId !== lastGradeId.current)){
			const data = {
                academicYear: yearId,
                grade: gradeId
            }
            triggerSubjects(data)
            lastYearId.current = yearId;
            lastGradeId.current = gradeId;
		}
	}, [yearId, gradeId])

	// Handle filter changes
	useEffect(() => {
		if (onFilterChange && (year || grade || subject)) {
			const filterData = {
				academic_id: year,
				term: subject,
				grade_id: grade,
				subject_id: subject
			}
			onFilterChange(filterData)
		}
	}, [year, grade, subject])

	// Notify parent component of selection changes
	useEffect(() => {
		if (onSelectionChange) {
			const title = generateTitle();
			onSelectionChange({
				title,
				values: { year, term, grade, subject }
			});
		}
	}, [year, term, grade, subject])

	const onsubmit = (data) => {
		setShowSubmit(false)
		let datas = {
			academicYear: data?.academic_id?._id,
			grade: data?.grade_id?._id,
			term: data?.term,
			subjectId: data?.subject_id
		}
		
		// Hide the form after submission
		if (onHide) {
			onHide()
		}
		
		naviagate('list', { state: datas })
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
									{t('exams.createTab.subtitle')}
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
										{t('exams.createTab.academicYear')}
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
											<em>{t('exams.createTab.selectAcademic')}</em>
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
										{t('exams.createTab.term')}
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
											<em>{t('exams.createTab.selectTerm')}</em>
										</MenuItem>
										{year?.terms && year?.terms?.map((res, i) => (
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
										{t('exams.createTab.grade')}
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
											<em>{t('exams.createTab.selectGrade')}</em>
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
										{t('exams.createTab.subject')}
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
											<em>{t('exams.createTab.selectSubject')}</em>
										</MenuItem>
										{subjects && subjects?.data?.map((res, i) => (
											<MenuItem key={res?._id} value={res._id}>
												{res?.subjectName}
											</MenuItem>
										))}
									</CustomSelect>
								</Box>
							</Grid>

							{showSubmit && (
								<Grid item xs={12} sm={6} md={2}>
									<CustomButton
										onClick={handleSubmit(onsubmit)}
										width="100%"
										label={t('exams.createTab.submit')}
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
							)}
						</Grid>
					</Box>
				</Paper>
				<UiBlocker open={academicLoading || gradeLoading || gradeRefetch || subjectLoading} />
			</Container>
		</Fade>
	)
}

export default CreateExamTab