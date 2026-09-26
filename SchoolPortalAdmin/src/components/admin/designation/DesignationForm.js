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
import { createDesignation, updateDesignation } from '../../../api/designation';
import { useTranslation } from 'react-i18next';

const DesignationForm = ({ close, open, label, hide, item, }) => {
  const { t } = useTranslation();
  const showSnackbar = useSnackbar();
  const queryClient = useQueryClient();

  const schema = useMemo(() => object().shape({
    designation: yup.string().required(t('designation.form.validation.designationRequired')),
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
      setValue('designation', item?.designation);
    }
  }, [item]);

  const { mutate } = useMutation({
    mutationFn: item ? updateDesignation : createDesignation,
    onSuccess: async (data) => {
      showSnackbar(item ? t('designation.form.messages.updateSuccess') : t('designation.form.messages.createSuccess'), 'success');
      await queryClient.invalidateQueries({ queryKey: ["designationlist"] })
      close()
    },
    onError: (error, variables, context) => {
      showSnackbar(error?.message, 'error');
    },
  });



  const SubmitForm = (data) => {
    const value = {
      designation: data?.designation,

    }
    const updateValue = {
      id: item?.id,
      designation: data?.designation,

    }

    if (item) {
      mutate(updateValue)
    } else {
      mutate(value)
    }
  }
  return (
    <CustomModal close={ close } open={ open } label={ label } width={ 'sm' } block={ true }>
      <Grid container spacing={ 2 }>
        <Grid item xl={ 12 } lg={ 12 } md={ 12 } sm={ 12 } xs={ 12 }>
          <CustomInput
            placeholder={ t('designation.form.placeholder') }
            readonly={ hide }
            control={ control }
            error={ errors.designation }
            fieldName="designation"
            fieldLabel={t('designation.form.fieldLabel')}
          />

        </Grid>
      </Grid>
      { !hide &&
        <Box px={ 20 } py={ 4 } >
          <CustomButton
            onClick={ handleSubmit(SubmitForm) }
            width="100%"
            label={ item ? t('designation.form.actions.update') : t('designation.form.actions.save') }
            isIcon={ false }
          />
        </Box> }
    </CustomModal>
  )
}

export default DesignationForm