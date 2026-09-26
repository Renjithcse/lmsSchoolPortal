import React, { useEffect, useState, useMemo } from 'react'
import CustomModal from '../../Common/CustomModal'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useSnackbar } from '../../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGrade, updateGrade } from '../../../api/grade';
import { Box, Grid } from '@mui/material';
import CustomInput from '../../Common/CustomInput';
import CustomButton from '../../Common/CustomButton';
import UiBlocker from '../../Common/UiBlocker';
import { useTranslation } from 'react-i18next';

const GradeForm = ({ close, open, label, hide, item, }) => {
  const { t } = useTranslation();
  const showSnackbar = useSnackbar();
  const queryClient = useQueryClient();

  const schema = useMemo(() => object().shape({
    gradeName: yup.string().required(t('grade.form.validation.gradeNameRequired')),
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
      setValue('gradeName', item?.gradeName);
    }
  }, [item]);

  const { mutate, isPending } = useMutation({
    mutationFn: item ? updateGrade : createGrade,
    onSuccess: async (data) => {
      showSnackbar(item ? t('grade.form.messages.updateSuccess') : t('grade.form.messages.createSuccess'), 'success');
      await queryClient.invalidateQueries({ queryKey: ["gradelist"] })
      close()
    },
    onError: (error, variables, context) => {
      showSnackbar(error?.message, 'error');
    },
  });



  const SubmitForm = (data) => {
    const value = {
      gradeName: data?.gradeName,
      status: "Active"

    }
    const updateValue = {
      id: item?._id,
      gradeName: data?.gradeName,
      status: "Active"

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
            placeholder={t('grade.form.placeholder')}
            readonly={hide}
            control={control}
            error={errors.gradeName}
            fieldName="gradeName"
            fieldLabel={t('grade.form.fieldLabel')}
          />

        </Grid>
      </Grid>
      {!hide &&
        <Box px={20} py={4} >
          <CustomButton
            disable={isPending}
            onClick={handleSubmit(SubmitForm)}
            width="100%"
            label={item ? t('grade.form.actions.update') : t('grade.form.actions.save')}
            isIcon={false}
          />
        </Box>}
      <UiBlocker open={isPending} />
    </CustomModal>
  )
}

export default GradeForm