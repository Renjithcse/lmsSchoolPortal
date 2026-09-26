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
import { createCity, updateCity } from '../../../api/city';
import { useTranslation } from 'react-i18next';

const CityForm = ({ close, open, label, hide, item, }) => {
  const { t } = useTranslation();
  const showSnackbar = useSnackbar();
  const queryClient = useQueryClient();

  const schema = useMemo(() => object().shape({
    cityName: yup.string().required(t('city.form.validation.cityNameRequired')),
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
      setValue('cityName', item?.cityName);
    }
  }, [item]);

  const { mutate } = useMutation({
    mutationFn: item ? updateCity : createCity,
    onSuccess: async (data) => {
      showSnackbar(item ? t('city.form.messages.updateSuccess') : t('city.form.messages.createSuccess'), 'success');
      await queryClient.invalidateQueries({ queryKey: ["citylist"] })
      close()
    },
    onError: (error, variables, context) => {
      showSnackbar(error?.message, 'error');
    },
  });



  const SubmitForm = (data) => {
    const value = {
      cityName: data?.cityName,

    }
    const updateValue = {
      id: item?.id,
      cityName: data?.cityName,

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
            placeholder={ t('city.form.placeholder') }
            readonly={ hide }
            control={ control }
            error={ errors.cityName }
            fieldName="cityName"
            fieldLabel={t('city.form.fieldLabel')}
          />
        </Grid>
      </Grid>
      { !hide &&
        <Box px={ 20 } py={ 4 } >
          <CustomButton
            onClick={ handleSubmit(SubmitForm) }
            width="100%"
            label={ item ? t('city.form.actions.update') : t('city.form.actions.save') }
            isIcon={ false }
          />
        </Box> }
    </CustomModal>
  )
}

export default CityForm