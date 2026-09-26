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
import { createNationality, updateNationality } from '../../../api/nationality';
import { useTranslation } from 'react-i18next';

const NationalityForm = ({ close, open, label, hide, item, }) => {
  const { t } = useTranslation();
  const showSnackbar = useSnackbar();
  const queryClient = useQueryClient();

  const schema = useMemo(() => object().shape({
    nationality: yup.string().required(t('nationality.form.validation.nationalityRequired')),
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
      setValue('nationality', item?.nationality);
    }
  }, [item]);

  const { mutate } = useMutation({
    mutationFn: item ? updateNationality : createNationality,
    onSuccess: async (data) => {
      showSnackbar(item ? t('nationality.form.messages.updateSuccess') : t('nationality.form.messages.createSuccess'), 'success');
      await queryClient.invalidateQueries({ queryKey: ["nationalitylist"] })
      close()
    },
    onError: (error, variables, context) => {
      showSnackbar(error?.message, 'error');
    },
  });



  const SubmitForm = (data) => {
    const value = {
      nationality: data?.nationality,

    }
    const updateValue = {
      id: item?.id,
      nationality: data?.nationality,

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
            placeholder={ t('nationality.form.placeholder') }
            readonly={ hide }
            control={ control }
            error={ errors.nationality }
            fieldName="nationality"
            fieldLabel={t('nationality.form.fieldLabel')}
          />
        </Grid>
      </Grid>
      { !hide &&
        <Box px={ 20 } py={ 4 } >
          <CustomButton
            onClick={ handleSubmit(SubmitForm) }
            width="100%"
            label={ item ? t('nationality.form.actions.update') : t('nationality.form.actions.save') }
            isIcon={ false }
          />
        </Box> }
    </CustomModal>
  )
}

export default NationalityForm