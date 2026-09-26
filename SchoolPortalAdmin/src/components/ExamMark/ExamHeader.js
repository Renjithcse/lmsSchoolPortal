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

const ExamHeader = ({ hide, resetRoute, successRoute }) => {
    const { t, i18n } = useTranslation();

    // const count = useSelector((state) => state.counter.value);
    
    const schema = useMemo(() => object().shape({
		academic_id: yup.object().required(t('examHeader.validation.academicRequired')),
		term: yup.string().required(t('examHeader.validation.termRequired'))
	}), [t, i18n.language]);

	const {
		handleSubmit,
		control,
        watch,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema),

	});

    const academic = watch('academic_id')
    const term = watch('term')

    const { data: academicYear, isLoading: academicLoading } = useGetAcademicYearQuery();


	const [showSubmit, setShowSubmit] = useState(true);



	const navigate = useNavigate()

    


	useEffect(() => {
		setShowSubmit(true)
		navigate(resetRoute)
	}, [academic, term])

    
    


    
	
	
	



	

	const onsubmit = (data) => {
		setShowSubmit(false)
		let datas = {
			academicYear: data?.academic_id?._id,
			term: data?.term
		}
		navigate(successRoute, { state: datas })
	}


	return (
		<>
		<Box sx={{ border: `1px solid ${COLORS.primary}`, p: 3, background: COLORS.sidebarHover, borderRadius: 2, boxShadow: 4 }}>
			<Grid container spacing={2}>
				<Grid item xl={2} lg={4}>
					<CustomSelect
						view={hide}
						control={control}
						error={errors.academic_id}
						fieldName="academic_id"
						fieldLabel={t('examHeader.academic')}
						size="16px"
						// value={academic?.academicYear}
					>
						<MenuItem value="" disabled >
							<em>{t('examHeader.selectAcademic')}</em>
						</MenuItem>
						{academicYear && academicYear?.map((res, i) => (
							<MenuItem key={res?._id} value={res}>
								{res?.academicYear}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				<Grid item xl={2} lg={4}>
					<CustomSelect
						view={hide}
						control={control}
						error={errors.term}
						fieldName="term"
						fieldLabel={t('examHeader.term')}
						size="16px"
					>
						<MenuItem value="" disabled >
							<em>{t('examHeader.selectTerm')}</em>
						</MenuItem>
						{academic?.terms && academic?.terms?.map((res, i) => (
							<MenuItem key={res} value={res}>
								{res}
							</MenuItem>
						))}

					</CustomSelect>

				</Grid>
				{showSubmit && <Grid item xl={2} lg={2} >
					<br />
					<CustomButton
						onClick={handleSubmit(onsubmit)}
						width="100%"
						label={t('examHeader.submit')}
						isIcon={false}
					/>
				</Grid>}

			</Grid>

		</Box>
		</>
	)
}

export default ExamHeader