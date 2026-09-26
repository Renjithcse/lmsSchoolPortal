import { Box, Grid, MenuItem } from '@mui/material'
import React, { useState } from 'react'
import CustomSelect from './CustomSelect'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { COLORS } from '../../assets/colors';
import CustomButton from './CustomButton';
import { academicYearList } from '../../api/SubjectSelector';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const SubjectSelector = () => {
    const { t } = useTranslation();
    const [terms, setTerms] = useState([]);

	
    const { data, isError, isLoading, isFetched, refetch } = useQuery({ queryKey: ['academicget'], queryFn: academicYearList });


    console.log({data})


	const schema = object().shape({

	});

	const {
		handleSubmit,
		control,
		setValue,
		setError,
		reset,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {

		}

	});


    const academicYearChange = (e) => {
        let selected = data?.data?.data?.find(item => item.id === e.target.value);
        if(selected){
            setTerms(selected?.terms)
        }
    }





	return (
		<Box sx={{ border: `1px solid ${COLORS.primary}`, p: 3, background: COLORS.sidebarHover, borderRadius: 2, boxShadow: 4 }}>
			<Grid container spacing={2}>
				<Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.academic_id}
						fieldName="academic_id"
						fieldLabel={t('subjectSelector.academic')}
						size="16px"
						onChangeValue={academicYearChange}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.selectAcademic')}</em>
						</MenuItem>
						{data?.data?.data?.map((res, i) => (
							<MenuItem value={res.id}>
								{res?.academicYear}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.term}
						fieldName="term"
						fieldLabel={t('subjectSelector.term')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.selectTerm')}</em>
						</MenuItem>
                        {terms?.map((res, i) => (
                            <MenuItem value={res.termName}>
                                {res?.termName}
                            </MenuItem>
                        ))}
					</CustomSelect>

				</Grid>
				<Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.grade}
						fieldName="grade"
						fieldLabel={t('subjectSelector.grade')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.selectGrade')}</em>
						</MenuItem>
						{data && data[0]?.data?.data?.data?.map((res, i) => (
							<MenuItem value={res.id}>
								{res?.academicYear}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.gender}
						fieldName="gender"
						fieldLabel={t('subjectSelector.gender')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.selectGender')}</em>
						</MenuItem>
						{data && data[1]?.data?.data?.data?.map((res, i) => (
							<MenuItem value={res.id} >
								{res?.gradeName}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.grade_id}
						fieldName="section"
						fieldLabel={t('subjectSelector.section')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.selectSection')}</em>
						</MenuItem>
						{data && data[1]?.data?.data?.data?.map((res, i) => (
							<MenuItem value={res.id} >
								{res?.gradeName}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item md={4} lg={3}>
					<CustomSelect
						control={control}
						error={errors.subject_id}
						fieldName="subject_id"
						fieldLabel={t('subjectSelector.subject')}
						size="16px"
						onChangeValue={null}
					>
						<MenuItem value="" disabled >
							<em>{t('subjectSelector.selectSubject')}</em>
						</MenuItem>
						{data && data[2]?.data?.data?.data?.map((res, i) => (
							<MenuItem value={res.id} >
								{res?.subjectName}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item  lg={6} >
                    <div style={{display:"flex", justifyContent:"flex-end", paddingTop: 20}}>
					<CustomButton
						onClick={null}
						label={t('subjectSelector.submit')}
						isIcon={false}
                        width="150px"
					/>
                    </div>
				</Grid>

			</Grid>

		</Box>
	)
}

export default SubjectSelector