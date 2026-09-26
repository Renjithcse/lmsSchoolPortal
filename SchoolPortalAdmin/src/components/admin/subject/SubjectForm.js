import React, { useEffect, useState, useMemo } from 'react'
import CustomModal from '../../Common/CustomModal'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useSnackbar } from '../../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Grid } from '@mui/material';
import CustomInput from '../../Common/CustomInput';
import CustomButton from '../../Common/CustomButton';
import { createSubject, updateSubject } from '../../../api/subject';
import UiBlocker from '../../Common/UiBlocker';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const SubjectForm = ({ close, open, label, hide, item, }) => {
	const { t } = useTranslation();
	const showSnackbar = useSnackbar();
	const queryClient = useQueryClient();
	const ability  = useAbility();

	const schema = useMemo(() => object().shape({
		subjectName: yup.string().required(t('subject.form.validation.subjectNameRequired')),
	}), [t]);


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


	useEffect(() => {
		if (item) {
			setValue('subjectName', item?.subjectName);
		}
	}, [item]);

	const { mutate, isPending } = useMutation({
		mutationFn: item ? updateSubject : createSubject,
		onSuccess: async (data) => {
			showSnackbar(item ? t('subject.form.messages.updateSuccess') : t('subject.form.messages.createSuccess'), 'success');
			await queryClient.invalidateQueries({ queryKey: ["subjectlist"] })
			close()
		},
		onError: (error, variables, context) => {
			showSnackbar(error?.message, 'error');
		},
	});



	const SubmitForm = (data) => {
		const value = {
			subjectName: data?.subjectName,

		}
		const updateValue = {
			id: item?._id,
			subjectName: data?.subjectName,

		}

		if (item) {
			mutate(updateValue)
		} else {
			mutate(value)
		}
	}
	return (
		<CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
			<Grid container spacing={2}>
				<Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
					<CustomInput
						placeholder={t('subject.form.placeholder')}
						readonly={hide}
						control={control}
						error={errors.subjectName}
						fieldName="subjectName"
						fieldLabel={t('subject.form.fieldLabel')}
					/>

				</Grid>
			</Grid>
			{!hide &&
				<Box px={20} py={4} >
					{ability.can("Create", "Subject") && <CustomButton
						disable={isPending}
						onClick={handleSubmit(SubmitForm)}
						width="100%"
						label={item ? t('subject.form.actions.update') : t('subject.form.actions.save')}
						isIcon={false}
					/>}
				</Box>}
			<UiBlocker open={isPending} />
		</CustomModal>
	)
}

export default SubjectForm