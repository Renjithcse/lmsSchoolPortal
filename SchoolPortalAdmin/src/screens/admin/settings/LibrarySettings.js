import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, number, min } from "yup";
import CustomInput from '../../../components/Common/CustomInput';
import CustomButton from '../../../components/Common/CustomButton';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import LibraryIcon from '@mui/icons-material/LocalLibrary';
import { useGetSettingQuery, useUpdateSettingMutation } from '../../../Redux/features/Admin/SettingsSlice';
import UiBlocker from '../../../components/Common/UiBlocker';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const LibrarySettings = () => {
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();
  const ability = useAbility();
  const { t } = useTranslation();

  const schema = object().shape({
    maxBooksForStudent: number()
      .typeError(t('settings.library.validation.mustBeNumber'))
      .min(1, t('settings.library.validation.mustBeAtLeast1'))
      .required(t('settings.library.validation.required')),
    maxBooksForTeacher: number()
      .typeError(t('settings.library.validation.mustBeNumber'))
      .min(1, t('settings.library.validation.mustBeAtLeast1'))
      .required(t('settings.library.validation.required')),
    bookIssueDuration: number()
      .typeError(t('settings.library.validation.mustBeNumber'))
      .min(1, t('settings.library.validation.mustBeAtLeast1Day'))
      .required(t('settings.library.validation.required')),
    maxRenewals: number()
      .typeError(t('settings.library.validation.mustBeNumber'))
      .min(0, t('settings.library.validation.cannotBeNegative'))
      .required(t('settings.library.validation.required')),
    finePerDay: number()
      .typeError(t('settings.library.validation.mustBeNumber'))
      .min(0, t('settings.library.validation.cannotBeNegative'))
      .required(t('settings.library.validation.required')),
    gracePeriod: number()
      .typeError(t('settings.library.validation.mustBeNumber'))
      .min(0, t('settings.library.validation.cannotBeNegative'))
      .required(t('settings.library.validation.required')),
  });

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      maxBooksForStudent: 3,
      maxBooksForTeacher: 5,
      bookIssueDuration: 14,
      maxRenewals: 2,
      finePerDay: 1,
      gracePeriod: 3,
    }
  });

  const { data: settingsData, isLoading, refetch } = useGetSettingQuery();
  const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();

  useEffect(() => {
    if (settingsData?.data?.librarySettings) {
      const librarySettings = settingsData.data.librarySettings;
      setValue('maxBooksForStudent', librarySettings.maxBooksForStudent);
      setValue('maxBooksForTeacher', librarySettings.maxBooksForTeacher);
      setValue('bookIssueDuration', librarySettings.bookIssueDuration);
      setValue('maxRenewals', librarySettings.maxRenewals);
      setValue('finePerDay', librarySettings.finePerDay);
      setValue('gracePeriod', librarySettings.gracePeriod);
    }
  }, [settingsData, setValue]);

  const onSubmit = async (data) => {
    try {
      await updateSetting({
        id: settingsData.data._id,
        data: {
          librarySettings: data
        }
      }).unwrap();
      showSnackbar(t('settings.library.messages.updateSuccess'), 'success');
      refetch();
    } catch (error) {
      showSnackbar(error?.data?.message || t('settings.library.messages.updateError'), 'error');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>{t('settings.library.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
          <LibraryIcon sx={{ fontSize: 20 }} />
        </Avatar>
        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
          {t('settings.library.title')}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Book Limits */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
              {t('settings.library.bookLimits')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomInput
              name="maxBooksForStudent"
              control={control}
              label={t('settings.library.form.maxBooksForStudent')}
              placeholder={t('settings.library.form.enterMaxBooksPerStudent')}
              error={errors.maxBooksForStudent}
              themeColors={themeColors}
              type="number"
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomInput
              name="maxBooksForTeacher"
              control={control}
              label={t('settings.library.form.maxBooksForTeacher')}
              placeholder={t('settings.library.form.enterMaxBooksPerTeacher')}
              error={errors.maxBooksForTeacher}
              themeColors={themeColors}
              type="number"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Issue Duration */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 2 }}>
              {t('settings.library.issueDurationRenewals')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomInput
              name="bookIssueDuration"
              control={control}
              label={t('settings.library.form.bookIssueDuration')}
              placeholder={t('settings.library.form.enterIssueDuration')}
              error={errors.bookIssueDuration}
              themeColors={themeColors}
              type="number"
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomInput
              name="maxRenewals"
              control={control}
              label={t('settings.library.form.maximumRenewals')}
              placeholder={t('settings.library.form.enterMaxRenewals')}
              error={errors.maxRenewals}
              themeColors={themeColors}
              type="number"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Fines & Grace Period */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 2 }}>
              {t('settings.library.finesGracePeriod')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomInput
              name="finePerDay"
              control={control}
              label={t('settings.library.form.finePerDay')}
              placeholder={t('settings.library.form.enterFineAmount')}
              error={errors.finePerDay}
              themeColors={themeColors}
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomInput
              name="gracePeriod"
              control={control}
              label={t('settings.library.form.gracePeriod')}
              placeholder={t('settings.library.form.enterGracePeriod')}
              error={errors.gracePeriod}
              themeColors={themeColors}
              type="number"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {ability.can("Edit", "Settings") && <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <CustomButton
                variant="outlined"
                onClick={() => reset()}
                disable={isUpdating}
                themeColors={themeColors}
                label={t('settings.library.actions.reset')}
              />
              <CustomButton
                type="submit"
                disable={isUpdating}
                loading={isUpdating}
                themeColors={themeColors}
                label={t('settings.library.actions.saveSettings')}
              />
            </Box>
          </Grid>}
        </Grid>
      </form>

      <UiBlocker open={isUpdating} />
    </Box>
  );
};

export default LibrarySettings;
