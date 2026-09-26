import React, { useEffect, useState, useMemo } from 'react'
import CustomModal from '../Common/CustomModal'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useSnackbar } from '../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGrade, updateGrade } from '../../api/grade';
import { Box, Grid } from '@mui/material';
import CustomInput from '../Common/CustomInput';
import CustomButton from '../Common/CustomButton';
import { newExam, updateExam } from '../../api/onlineExam';
import { useTranslation } from 'react-i18next';

const NewExam = ({ close, open, label, hide, data, state }) => {

	const { t } = useTranslation();
	const showSnackbar = useSnackbar();
	const queryClient = useQueryClient();

	const schema = useMemo(() => object().shape({
		examName: yup.string().required(t('onlineExam.newExam.validation.examNameRequired')),
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
			examName: null
		}

	});


	useEffect(() => {
		reset({
			examName: data?.examName || ''
		});
	}, [data, reset]);

	const { mutate, isPending } = useMutation({
		mutationFn: data ? updateExam : newExam,
		onSuccess: async (data) => {
			showSnackbar(data ? t('onlineExam.newExam.messages.updateSuccess') : t('onlineExam.newExam.messages.createSuccess'), 'success');
			await queryClient.invalidateQueries({ queryKey: ['onlineExam', state] })
			close()
		},
		onError: (error, variables, context) => {
			showSnackbar(error?.message, 'error');
		},
	});

	



	const SubmitForm = (datas) => {
		const value = {
			examName: datas?.examName,
			...state
		}

		if (data) {
			value['id'] = data?._id
		}
		mutate(value)
	}


	return (
		<CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
			<Grid container spacing={2}>
				<Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
					<CustomInput
						placeholder={t('onlineExam.newExam.placeholder.examName')}
						readonly={hide}
						control={control}
						error={errors.examName}
						fieldName="examName"
						fieldLabel={t('onlineExam.newExam.fieldLabel.examName')}
					/>

				</Grid>
			</Grid>
			{!hide &&
				<Box px={20} py={4} >
					<CustomButton
						onClick={handleSubmit(SubmitForm)}
						width="100%"
						label={data ? t('onlineExam.newExam.actions.update') : t('onlineExam.newExam.actions.save')}
						isIcon={false}
						loading={isPending}
					/>
				</Box>}
		</CustomModal>
	)
}

export default NewExam