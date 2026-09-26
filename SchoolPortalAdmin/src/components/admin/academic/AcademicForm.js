import React, { useEffect, useState, useMemo } from 'react'
import { Autocomplete, Box, Chip, Grid, TextField, Typography, Card, CardContent, Avatar } from '@mui/material'
import CustomModal from '../../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomInput from '../../Common/CustomInput';
import CustomButton from '../../Common/CustomButton';
import CustomChip from '../../Common/CustomChip';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAcademic, updateAcademic } from '../../../api/academic';
import UiBlocker from '../../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';

const AcademicForm = ({ close, open, label, hide, item, btnLabel }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();

  const showSnackbar = useSnackbar();
  const [chips, setChips] = useState([]);
  const queryClient = useQueryClient();

  const schema = useMemo(() => object().shape({
    academicYear: yup.string().matches(/^\d{4}-\d{4}$/, t('academic.form.validation.formatError')).required(t('academic.form.validation.academicYearRequired')),
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
      setValue('academicYear', item?.academicYear);
      setChips(item?.terms?.map((res) => res))

    }
  }, [item]);

  const { mutate, isPending } = useMutation({
    mutationFn: item ? updateAcademic : createAcademic,
    onSuccess: async (data) => {
      showSnackbar(item ? t('academic.form.messages.updateSuccess') : t('academic.form.messages.createSuccess'), 'success');
      await queryClient.invalidateQueries({ queryKey: ["academicget"] })
      close()
    },
    onError: (error, variables, context) => {
      showSnackbar(error?.message, 'error');
    },
  });

  console.log({ isPending })


  const SubmitForm = (data) => {

    const value = {
      academicYear: data?.academicYear,
      terms: chips,
    }
    const updateValue = {
      id: item?._id,
      academicYear: data?.academicYear,
      terms: chips,
    }
    if (chips.length === 0) { return false }
    if (item) {
      mutate(updateValue)
    } else {
      mutate(value)
    }
  }

  return (
    <CustomModal close={ close } open={ open } label={ label } width={ 'sm' } btnLabel={ btnLabel } block={ true }>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <CalendarMonthIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('academic.form.title')}
            </Typography>
          </Box>

          <Grid container spacing={ 2 }>
            <Grid item xl={ 12 } lg={ 12 } md={ 12 } sm={ 12 } xs={ 12 }>
              <CustomInput
                placeholder={ t('academic.form.placeholder') }
                readonly={ hide }
                control={ control }
                error={ errors.academicYear }
                fieldName="academicYear"
                fieldLabel={t('academic.form.fieldLabel')}
              />
            </Grid>
            <Grid item xl={ 12 } lg={ 12 } md={ 12 } sm={ 12 } xs={ 12 }>
              { !hide ? (
                <CustomChip
                  hide={ hide }
                  chips={ chips }
                  setChips={ setChips }
                  fieldLabel={ t('academic.form.termsLabel') }
                />
              ) : (
                <Box px={ 1 } py={ 1 } sx={{ border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary, borderRadius: 1 }} display={ 'flex' } gap={ 1 } flexWrap="wrap">
                  { chips.map((res, idx) => (
                    <Typography key={idx} sx={{ px: 1, background: `${themeColors.primary}22`, borderRadius: 5, color: themeColors.text.primary }}>
                      { res }
                    </Typography>
                  )) }
                </Box>
              )}
            </Grid>
          </Grid>

          { !hide && (
            <Box px={ 0 } pt={ 3 }>
              <CustomButton
                disable={ isPending }
                onClick={ handleSubmit(SubmitForm) }
                width="100%"
                label={ item ? t('academic.form.actions.update') : t('academic.form.actions.save') }
                isIcon={ false }
              />
            </Box>
          ) }
        </CardContent>
      </Card>
      <UiBlocker open={ isPending } />
    </CustomModal>
  )
}

export default AcademicForm