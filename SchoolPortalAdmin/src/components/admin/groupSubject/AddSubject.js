import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useSnackbar } from '../../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomModal from '../../Common/CustomModal';
import useModal from '../../../hooks/modalHook';
import { Box, Grid, MenuItem } from '@mui/material';
import CustomButton from '../../Common/CustomButton';
import CustomSelect from '../../Common/CustomSelect';
import { GENDER, SUBJECT_TYPE } from '../../../constant';
import { createGradeSubject, editGradeSubject } from '../../../api/gradeSubject';
import CustomInput from '../../Common/CustomInput';
import { useLocation } from 'react-router-dom';
import { useCreateGroupSubjectMutation, useUnassignedGroupSubjectsQuery, useUpdateGroupSubjectMutation } from '../../../Redux/features/Admin/GroupSubjects';
import CustomMultiSelect from '../../Common/CustomMultiSelect';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
const AddSubject = ({ close, open, label, data }) => {
	const { t } = useTranslation();
	const location = useLocation()
	const ability  = useAbility();
	const schema = useMemo(() => object().shape({
		groupName: yup.string().required(t('groupSubject.form.validation.groupNameRequired')),
		subjects: yup.array().required(t('groupSubject.form.validation.subjectsRequired')),
	}), [t]);

	const { data: subjectLists, refetch } = useUnassignedGroupSubjectsQuery(location.state)
	const [triggerCreateSubject, { isLoading }] = useCreateGroupSubjectMutation()
	const [triggerupdateSubject, { isLoading: updateLoading }] = useUpdateGroupSubjectMutation()
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
		defaultValues: !data ? {
			subjects: []
		} : {
			subjects: data?.subjects?.map(sub => sub?._id),
			groupName: data?.groupName
		}

	});



	const subjects = watch('subjects')










	const SubmitForm = async (datas) => {
		const values = {
			...location?.state,
			...datas
		}

		if (!data) {

			const subjects = await triggerCreateSubject(values)

			if (subjects.error) {
				showSnackbar(t('groupSubject.form.messages.createError'), 'error')
				return
			}
			else {
				showSnackbar(t('groupSubject.form.messages.createSuccess'), 'success')
				reset()
				close()
			}
		}
		else{
			const subjects = await triggerupdateSubject({ id: data?._id, data: values })

            if (subjects.error) {
                showSnackbar(t('groupSubject.form.messages.updateError'), 'error')
                return
            }
            else {
                showSnackbar(t('groupSubject.form.messages.updateSuccess'), 'success')
                reset()
                close()
            }
		}
	}

	return (
		<CustomModal close={close} open={open} label={label} width={'md'} block={true}>
			<Grid container spacing={2}>
				<Grid item xs={12} md={12} lg={6}>
					<CustomInput
						placeholder={t('groupSubject.form.placeholder')}
						control={control}
						error={errors.groupName}
						fieldName="groupName"
						fieldLabel={t('groupSubject.form.groupName')}
					/>

				</Grid>
				<Grid item xs={12} md={12} lg={6}>
					<CustomMultiSelect
						control={control}
						error={errors.subjects}
						fieldName="subjects"
						fieldLabel={t('groupSubject.form.subjects')}
						size="16px"
						value={subjects}
					>
						<MenuItem value="" disabled >
							<em>{t('groupSubject.form.selectSubject')}</em>
						</MenuItem>
						{subjectLists?.data?.map((res, i) => (
							<MenuItem value={res?.subject?._id} >
								{res?.subject?.subjectName}
							</MenuItem>
						))}
						{data && data?.subjects.map((res, i) => (
							<MenuItem value={res?.subject?._id} >
								{res?.subject?.subjectName}
							</MenuItem>
						))}
					</CustomMultiSelect>
				</Grid>
				<Grid item xs={12} md={12} lg={12} sx={{ display: 'flex', justifyContent: 'center' }}>
					<br />
					{(ability.can("Create", "GroupSubject") || ability.can("Edit", "GroupSubject")) && <CustomButton
						onClick={handleSubmit(SubmitForm)}
						//width="40%"
						label={data ? t('groupSubject.form.actions.update') : t('groupSubject.form.actions.save')}
						isIcon={false}
						loading={isLoading || updateLoading}
					/>}
				</Grid>
			</Grid>



		</CustomModal>
	)
}

export default AddSubject