import React, { useEffect, useMemo } from 'react'
import { useSnackbar } from '../../../hooks/SnackBar';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Grid } from '@mui/material';
import CustomModal from '../../Common/CustomModal'
import CustomInput from '../../Common/CustomInput';
import CustomButton from '../../Common/CustomButton';
import { createReligion, updateReligion } from '../../../api/religion';
import UiBlocker from '../../Common/UiBlocker';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const ReligionForm = ({ close, open, label, hide, item, }) => {
	const { t } = useTranslation();
	const showSnackbar = useSnackbar();
	const queryClient = useQueryClient();
	const ability  = useAbility();

	const schema = useMemo(() => object().shape({
		religionName: yup.string().required(t('religion.form.validation.religionNameRequired')),
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
			setValue('religionName', item?.religionName);
		}
	}, [item]);

	const { mutate, isPending } = useMutation({
		mutationFn: item ? updateReligion : createReligion,
		onSuccess: async (data) => {
			showSnackbar(item ? t('religion.form.messages.updateSuccess') : t('religion.form.messages.createSuccess'), 'success');
			await queryClient.invalidateQueries({ queryKey: ["religionlist"] })
			close()
		},
		onError: (error, variables, context) => {
			showSnackbar(error?.message, 'error');
		},
	});


	const SubmitForm = (data) => {
		const value = {
			religionName: data?.religionName,
			status: 'Active'

		}
		const updateValue = {
			id: item?._id,
			religionName: data?.religionName,
			status: 'Active'

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
						placeholder={t('religion.form.placeholder')}
						readonly={hide}
						control={control}
						error={errors.religionName}
						fieldName="religionName"
						fieldLabel={t('religion.form.fieldLabel')}
					/>
				</Grid>
			</Grid>
			{!hide &&
				<Box px={20} py={4} >
					{(ability.can("Create", "Religion") || ability.can("Edit", "Religion")) && <CustomButton
						disable={isPending}
						onClick={handleSubmit(SubmitForm)}
						width="100%"
						label={item ? t('religion.form.actions.update') : t('religion.form.actions.save')}
						isIcon={false}
					/>}
				</Box>}
			<UiBlocker open={isPending} />
		</CustomModal>
	)
}

export default ReligionForm