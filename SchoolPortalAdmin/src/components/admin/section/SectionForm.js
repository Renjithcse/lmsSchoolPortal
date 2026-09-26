import React, { useEffect, useState, useMemo } from 'react'
import { Box, Grid, } from '@mui/material'
import CustomModal from '../../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomInput from '../../Common/CustomInput';
import CustomButton from '../../Common/CustomButton';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSection, updateSection } from '../../../api/section';
import UiBlocker from '../../Common/UiBlocker';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const SectionForm = ({ close, open, label, hide, item, btnLabel }) => {
  const { t } = useTranslation();
  console.log({ item })
  const showSnackbar = useSnackbar();
  const queryClient = useQueryClient();
  const ability  = useAbility();

  const schema = useMemo(() => object().shape({
    sectionName: yup.string().required(t('section.form.validation.sectionNameRequired')),
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
      setValue('sectionName', item?.sectionName);


    }
  }, [item]);

  const { mutate, isPending } = useMutation({
    mutationFn: item ? updateSection : createSection,
    onSuccess: async (data) => {
      showSnackbar(item ? t('section.form.messages.updateSuccess') : t('section.form.messages.createSuccess'), 'success');
      await queryClient.invalidateQueries({ queryKey: ["sectionList"] })
      close()
    },
    onError: (error, variables, context) => {
      showSnackbar(error?.message, 'error');
    },
  });



  const SubmitForm = (data) => {
    console.log({ data })
    if (item) {
      data['id'] = item?._id;
      data['status'] = item?.status
    }
    console.log({ data })
    mutate(data)
  }

  return (
    <CustomModal close={ close } open={ open } label={ label } width={ 'sm' } btnLabel={ btnLabel } block={ true }>
      <Grid container spacing={ 2 }>
        <Grid item xl={ 12 } lg={ 12 } md={ 12 } sm={ 12 } xs={ 12 }>
          <CustomInput
            placeholder={ t('section.form.placeholder') }
            readonly={ hide }
            control={ control }
            error={ errors.sectionName }
            fieldName="sectionName"
            fieldLabel={t('section.form.fieldLabel')}
          />

        </Grid>

      </Grid>
      { !hide &&
        <Box px={ 20 } py={ 4 } >
          {(ability.can("Create", "Section") || ability.can("Edit", "Section")) && <CustomButton
            onClick={ handleSubmit(SubmitForm) }
            width="100%"
            label={ item ? t('section.form.actions.update') : t('section.form.actions.save') }
            isIcon={ false }
          />}
        </Box> }
      <UiBlocker open={ isPending } />
    </CustomModal>
  )
}

export default SectionForm