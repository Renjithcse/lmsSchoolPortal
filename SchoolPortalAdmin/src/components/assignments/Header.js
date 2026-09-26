import { Box, Grid, MenuItem } from '@mui/material'
import React, { useEffect, useState, useMemo } from 'react'
import CustomSelect from '../Common/CustomSelect'
import { set, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomButton from '../Common/CustomButton';
import UiBlocker from '../Common/UiBlocker';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../assets/colors';
import { useSelector } from 'react-redux';
import { useGetAcademicYearQuery, useLazyGetAllGradesByAcademicQuery, useLazyGetAllSubjectsByAcademicYearGradeQuery } from '../../Redux/features/commonSlice';
import { useTranslation } from 'react-i18next';

const Header = ({ hide, resetRoute, successRoute, onHide }) => {
    const { t } = useTranslation();

    // const count = useSelector((state) => state.counter.value);
    
    const schema = useMemo(() => object().shape({
		academic_id: yup.object().required(t('assignments.header.validation.academicRequired')),
		term: yup.string().required(t('assignments.header.validation.termRequired')),
		grade_id: yup.object().required(t('assignments.header.validation.gradeRequired')),
		subject_id: yup.string().required(t('assignments.header.validation.subjectRequired')),
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
    const subject = watch('subject_id')
    const term = watch('term')

    const { data: academicYear, isLoading: academicLoading } = useGetAcademicYearQuery();
    const [triggerGrade, { data: grades, isLoading: gradeLoading }] = useLazyGetAllGradesByAcademicQuery()
    const [triggerSubject, { data: subjects, isLoading: subjectsLoading }] = useLazyGetAllSubjectsByAcademicYearGradeQuery()


	const [showSubmit, setShowSubmit] = useState(true);



	const navigate = useNavigate()

    


	useEffect(() => {
		setShowSubmit(true)
		navigate(resetRoute)
	}, [academic, term, grade, subject])

    useEffect(() => {
        if(academic){
            triggerGrade(academic?._id)
        }
    }, [academic])
    


    useEffect(() => {
        if(grade){
            triggerSubject({academic: academic?._id, grade:grade?._id})
        }
    }, [grade])
    
	
	
	



	

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
		
		navigate(successRoute, { state: datas })
	}


	return (
		<>
		<Box sx={{ border: `1px solid ${COLORS.primary}`, p: 3, background: COLORS.sidebarHover, borderRadius: 2, boxShadow: 4 }}>
			<Grid container spacing={2}>
				<Grid item xl={2} lg={2} md={4} sm={12} xs={12}>
					<CustomSelect
						view={hide}
						control={control}
						error={errors.academic_id}
						fieldName="academic_id"
						fieldLabel={t('assignments.header.fields.academic')}
						size="16px"
						// value={academic?.academicYear}
					>
						<MenuItem value="" disabled >
							<em>{t('assignments.header.placeholders.selectAcademic')}</em>
						</MenuItem>
						{academicYear && academicYear?.map((res, i) => (
							<MenuItem key={res?._id} value={res}>
								{res?.academicYear}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item xl={2} lg={2} md={4} sm={12} xs={12}>
					<CustomSelect
						view={hide}
						control={control}
						error={errors.term}
						fieldName="term"
						fieldLabel={t('assignments.header.fields.term')}
						size="16px"
					>
						<MenuItem value="" disabled >
							<em>{t('assignments.header.placeholders.selectTerm')}</em>
						</MenuItem>
						{academic?.terms && academic?.terms?.map((res, i) => (
							<MenuItem key={res} value={res}>
								{res}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item xl={2} lg={2} md={4} sm={12} xs={12}>
					<CustomSelect
						view={hide}
						control={control}
						error={errors.grade_id}
						fieldName="grade_id"
						fieldLabel={t('assignments.header.fields.grade')}
						size="16px"
					>
						<MenuItem value="" >
							<em>{t('assignments.header.placeholders.selectGrade')}</em>
						</MenuItem>
						{grades?.data?.grades && grades?.data?.grades?.map((res, i) => (
							<MenuItem key={res?._id} value={res} >
								{res?.gradeName}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item xl={2} lg={2} md={4} sm={12} xs={12}>
					<CustomSelect
						view={hide}
						control={control}
						error={errors.subject_id}
						fieldName="subject_id"
						fieldLabel={t('assignments.header.fields.subject')}
						size="16px"
					>
						<MenuItem value="" disabled >
							<em>{t('assignments.header.placeholders.selectSubject')}</em>
						</MenuItem>
						{subjects && subjects?.data?.map((res, i) => (
							<MenuItem key={res?.subjectId} value={res.subjectId} >
								{res?.subjectName}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item xl={2} lg={2} md={4} sm={12} xs={12}></Grid>
				{showSubmit && <Grid item xl={2} lg={2} md={4} sm={12} xs={12} mt={2}>
					<CustomButton
						onClick={handleSubmit(onsubmit)}
						width="100%"
						label={t('assignments.header.submit')}
						isIcon={false}
					/>
				</Grid>}

			</Grid>

		</Box>
		<UiBlocker open={ academicLoading || gradeLoading || subjectsLoading} />
		</>
	)
}

export default Header