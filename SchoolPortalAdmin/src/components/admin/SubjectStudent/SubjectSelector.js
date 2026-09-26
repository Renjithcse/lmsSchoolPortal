import { Box, Grid, MenuItem } from '@mui/material'
import React, { useEffect, useState, useMemo } from 'react'
import CustomSelect from '../../Common/CustomSelect'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { COLORS } from '../../../assets/colors';
import CustomButton from '../../Common/CustomButton';
import { academicYearList } from '../../../api/SubjectSelector';
import { useQuery } from '@tanstack/react-query';
import { useGetAcademicYearQuery, useLazyGetAllGradesByAcademicQuery, useLazyGetAllSectionByAcademicYearGradeGenderQuery, useLazyGetAllSubjectsByAcademicYearGradeGenderSectionQuery } from '../../../Redux/features/commonSlice';
import UiBlocker from '../../Common/UiBlocker';
import { GENDER } from '../../../constant';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SubjectSelector = ({route, params}) => {
	const { t, i18n } = useTranslation();
	const [terms, setTerms] = useState([]);

	const navigate = useNavigate()

	const { data: academicYears, isLoading: academicYearLoading } = useGetAcademicYearQuery()
	const [triggerGrades, { isLoading: gradeLoading, data: grades }] = useLazyGetAllGradesByAcademicQuery()
	const [triggerSection, { isLoading: sectionLoading, data: sections }] = useLazyGetAllSectionByAcademicYearGradeGenderQuery()
	const [triggerSubject, { isLoading: subjectLoading, data: subjects }] = useLazyGetAllSubjectsByAcademicYearGradeGenderSectionQuery()

	const schema = useMemo(() => object().shape({
		academicYear: yup.string().required(t('subjectSelector.validation.academicYearRequired')),
		grade: yup.string().required(t('subjectSelector.validation.gradeRequired')),
		gender: yup.string().required(t('subjectSelector.validation.genderRequired')),
		section: yup.string().required(t('subjectSelector.validation.sectionRequired')),
		subject: yup.string().required(t('subjectSelector.validation.subjectRequired')),
	}), [t, i18n.language]);

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
		defaultValues: {

		}

	});

	const academicYear = watch('academicYear')
	const grade = watch('grade')
	const gender = watch('gender')
	const section = watch('section')
	const subject = watch('subject')

	useEffect(() => {
		if(academicYear){
			let academic = academicYears?.find(aca => aca?._id === academicYear)
			if (academic) {
				triggerGrades(academicYear)
				setTerms(academic?.terms)
			}
		}
		
	}, [academicYear])

	useEffect(() => {
		if (academicYear && grade && gender) {
			triggerSection({ academicYear, grade, gender })
		}
	}, [academicYear, grade, gender])


	useEffect(() => {
		if (academicYear && grade && gender && section) {
			if(params){
				console.log({params})
				triggerSubject({ academicYear, grade, gender, section, ...params })
			}
			else{
				triggerSubject({ academicYear, grade, gender, section })
			}
		}
	}, [academicYear, grade, gender, section, params])

	useEffect(() => {
		if (academicYear && grade && gender && section && subject) {
			navigate(route)
		}
	}, [academicYear, grade, gender, section, subject])



	const onSubmit = async(data) => {
		navigate('list', { state: structuredClone(data) });
	}





	return (
		<Box sx={{ border: `1px solid ${COLORS.primary}`, p: 3, background: COLORS.sidebarHover, borderRadius: 2, boxShadow: 4 }}>
			<Grid container spacing={2}>
				<Grid item md={4} lg={2}>
					<CustomSelect
						control={control}
						error={errors.academicYear}
						fieldName="academicYear"
						fieldLabel={t('subjectSelector.fields.academic')}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.placeholders.selectAcademicYear')}</em>
						</MenuItem>
						{academicYears?.map((res, i) => (
							<MenuItem key={i} value={res._id}>
								{res?.academicYear}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				{/* <Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.term}
						fieldName="term"
						fieldLabel="Term"
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>Select Term</em>
						</MenuItem>
						{terms?.map((res, i) => (
							<MenuItem value={res}>
								{res}
							</MenuItem>
						))}
					</CustomSelect>

				</Grid> */}
				<Grid item md={4} lg={2}>
					<CustomSelect
						control={control}
						error={errors.grade}
						fieldName="grade"
						fieldLabel={t('subjectSelector.fields.grade')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.placeholders.selectGrade')}</em>
						</MenuItem>
						{grades?.data?.map((res, i) => (
							<MenuItem key={i} value={res._id}>
								{res?.gradeName}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item md={4} lg={2}>
					<CustomSelect
						control={control}
						error={errors.gender}
						fieldName="gender"
						fieldLabel={t('subjectSelector.fields.gender')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.placeholders.selectGender')}</em>
						</MenuItem>
						{GENDER && GENDER?.map((res, i) => (
							<MenuItem key={i} value={res.value} >
								{res?.name}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item md={4} lg={2}>
					<CustomSelect
						control={control}
						error={errors.grade_id}
						fieldName="section"
						fieldLabel={t('subjectSelector.fields.section')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.placeholders.selectSection')}</em>
						</MenuItem>
						{sections?.data?.map((res, i) => (
							<MenuItem key={i} value={res._id} >
								{res?.sectionName}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item md={4} lg={2}>
					<CustomSelect
						control={control}
						error={errors.subject}
						fieldName="subject"
						fieldLabel={t('subjectSelector.fields.subject')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.placeholders.selectSubject')}</em>
						</MenuItem>
						{subjects?.data?.map((res, i) => (
							<MenuItem key={i} value={res?.subject._id} >
								{res?.subject?.subjectName}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item lg={2} >
					<div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 20 }}>
						<CustomButton
							onClick={handleSubmit(onSubmit)}
							label={t('subjectSelector.actions.submit')}
							isIcon={false}
							width="150px"
						/>
					</div>
				</Grid>
				<UiBlocker open={academicYearLoading || gradeLoading || sectionLoading || subjectLoading} />
			</Grid>

		</Box>
	)
}

export default SubjectSelector