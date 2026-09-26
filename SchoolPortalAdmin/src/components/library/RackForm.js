import React, { useEffect, useMemo } from 'react';
import { Box, Grid, TextField, Typography, Card, CardContent, Avatar } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, number } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomTextArea from '../Common/CustomTextArea';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useCreateRackMutation, useUpdateRackMutation } from '../../Redux/features/Library/rackSlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import StorageIcon from '@mui/icons-material/Storage';
import { useTranslation } from 'react-i18next';

const RackForm = ({ close, open, label, hide, item, btnLabel }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();

  const schema = useMemo(() => object().shape({
    rackNumber: string().required(t('rackForm.validation.rackNumberRequired')),
    description: string(),
    numberOfRows: number()
      .typeError(t('rackForm.validation.numberOfRowsNumber'))
      .positive(t('rackForm.validation.numberOfRowsPositive'))
      .integer(t('rackForm.validation.numberOfRowsInteger'))
      .required(t('rackForm.validation.numberOfRowsRequired')),
  }), [t]);

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      rackNumber: '',
      description: '',
      numberOfRows: 1
    }
  });

  useEffect(() => {
    if (item) {
      setValue('rackNumber', item?.rackNumber || '');
      setValue('description', item?.description || '');
      setValue('numberOfRows', item?.numberOfRows || 1);
    } else {
      reset();
    }
  }, [item, setValue, reset]);

  const [createRack, { isLoading: isCreating }] = useCreateRackMutation();
  const [updateRack, { isLoading: isUpdating }] = useUpdateRackMutation();

  // Safety check for themeColors - moved after all hooks
  if (!themeColors) {
    return null; // or a loading spinner
  }

  const onSubmit = async (data) => {
    try {
      if (item) {
        await updateRack({ id: item._id, data }).unwrap();
        showSnackbar(t('rackForm.messages.updateSuccess'), 'success');
      } else {
        await createRack(data).unwrap();
        showSnackbar(t('rackForm.messages.createSuccess'), 'success');
      }
      close();
    } catch (error) {
      showSnackbar(error?.data?.message || t('rackForm.messages.error'), 'error');
    }
  };

  return (
    <CustomModal close={close} open={open} label={label} width={'sm'} btnLabel={btnLabel} block={true}>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <StorageIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('rackForm.rackDetails')}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CustomInput
                  name="rackNumber"
                  control={control}
                  label={t('rackForm.fieldLabel.rackNumber')}
                  placeholder={t('rackForm.placeholder.rackNumber')}
                  error={errors.rackNumber}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextArea
                  fieldName="description"
                  control={control}
                  fieldLabel={t('rackForm.fieldLabel.description')}
                  placeholder={t('rackForm.placeholder.description')}
                  error={errors.description}
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomInput
                  name="numberOfRows"
                  control={control}
                  label={t('rackForm.fieldLabel.numberOfRows')}
                  placeholder={t('rackForm.placeholder.numberOfRows')}
                  error={errors.numberOfRows}
                  themeColors={themeColors}
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                  <CustomButton
                    variant="outlined"
                    onClick={close}
                    disable={isCreating || isUpdating}
                    label={t('rackForm.actions.cancel')}
                  />
                  <CustomButton
                    type="submit"
                    disable={isCreating || isUpdating}
                    loading={isCreating || isUpdating}
                    label={btnLabel}
                  />
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <UiBlocker open={isCreating || isUpdating} />
    </CustomModal>
  );
};

export default RackForm;
