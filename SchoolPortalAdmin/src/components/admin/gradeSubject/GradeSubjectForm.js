import React, { useEffect, useMemo } from 'react'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomModal from '../../Common/CustomModal';
import { Box, Grid, MenuItem } from '@mui/material';
import CustomButton from '../../Common/CustomButton';
import CustomSelect from '../../Common/CustomSelect';
import { SUBJECT_TYPE } from '../../../constant';
import CustomMultiSelect from '../../Common/CustomMultiSelect';
import { useCreateGradeSubjectMutation, useUnassignedGradeSubjectsQuery } from '../../../Redux/features/Admin/GradeSubject';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useLocation } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
const GradeSubjectForm = ({ close, open, label, data }) => {
	const { t } = useTranslation();
	const location = useLocation()
	const ability  = useAbility();

	const schema = useMemo(() => object().shape({
		type: yup.string().required(t('gradeSubject.form.validation.typeRequired')),
		subjects: yup.array().required(t('gradeSubject.form.validation.subjectsRequired'))
	}), [t]);

	const { data: subjectLists, refetch } = useUnassignedGradeSubjectsQuery(location.state)
	const [triggerCreateSubject, { isLoading}] = useCreateGradeSubjectMutation()
	const showSnackbar = useSnackbar()

	useEffect(() => {
		refetch()
	}, [])
	


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
			subjects: []
		}
	});


	const subjects = watch('subjects')


	const SubmitForm = async(datas) => {

		let value = {
			...location?.state,
			...datas
		}

		const subjects = await triggerCreateSubject(value)

		console.log({subjects})

		if(subjects.error){
			showSnackbar(subjects.error.data.message, 'error')
            return
		}
		else{
			showSnackbar(t('gradeSubject.form.messages.createSuccess'), 'success')
			reset()
            close()
		}


		//mutate(value)
	}

	return (
		<CustomModal close={close} open={open} label={label} width={'md'} block={true}>
			<Grid container spacing={2}>
				<Grid item xs={12} md={12} lg={6}>
					<CustomSelect
						control={control}
						error={errors.type}
						fieldName="type"
						fieldLabel={t('gradeSubject.form.type')}
						size="16px"
					>
						<MenuItem value="" disabled >
							<em>{t('gradeSubject.form.selectSubject')}</em>
						</MenuItem>
						{SUBJECT_TYPE && SUBJECT_TYPE.map((res, i) => (
							<MenuItem value={res.value} >
								{res?.name}
							</MenuItem>
						))}

					</CustomSelect>
				</Grid>
				<Grid item xl={12} lg={6}>
					<CustomMultiSelect
						control={control}
						error={errors.subjects}
						fieldName="subjects"
						fieldLabel={t('gradeSubject.form.subject')}
						size="16px"
						value={subjects}
					>
						{subjectLists && subjectLists?.data?.map((option) => (
							<MenuItem key={option._id} value={option._id}>
								{option.subjectName}
							</MenuItem>
						))}

					</CustomMultiSelect>
				</Grid>
			</Grid>
			<Box px={20} py={4} >
				{(ability.can("Create", "GradeSubject") || ability.can("Edit", "GradeSubject")) && <CustomButton
					onClick={handleSubmit(SubmitForm)}
					width="90%"
					label={t('gradeSubject.form.actions.save')}
					isIcon={false}
					loading={isLoading}
				/>}
			</Box>
		</CustomModal>
	)
}

export default GradeSubjectForm