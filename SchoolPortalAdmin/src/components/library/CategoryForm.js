import React, { useEffect, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomTextArea from '../Common/CustomTextArea';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../../Redux/features/Library/categorySlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CategoryIcon from '@mui/icons-material/Category';
import { useTranslation } from 'react-i18next';

const CategoryForm = ({ close, open, label, hide, item, btnLabel }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();

  const schema = useMemo(() => object().shape({
    name: string().required(t('categoryForm.validation.nameRequired')),
    description: string(),
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
      name: '',
      description: '',
    }
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  useEffect(() => {
    if (item) {
      setValue('name', item?.name || '');
      setValue('description', item?.description || '');
    } else {
      reset();
    }
  }, [item, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      if (item) {
        await updateCategory({ id: item._id, data }).unwrap();
        showSnackbar(t('categoryForm.messages.updateSuccess'), 'success');
      } else {
        await createCategory(data).unwrap();
        showSnackbar(t('categoryForm.messages.createSuccess'), 'success');
      }
      close();
    } catch (error) {
      showSnackbar(error?.data?.message || t('categoryForm.messages.saveFailed'), 'error');
    }
  };

  // Safety check for themeColors
  if (!themeColors) {
    return <div>{t('categoryForm.loading')}</div>;
  }

  return (
    <CustomModal close={close} open={open} label={label} width={'md'} block={true}>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <CategoryIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {label}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CustomInput
                  name="name"
                  control={control}
                  label={t('categoryForm.fieldLabel.name')}
                  placeholder={t('categoryForm.placeholder.name')}
                  error={errors.name}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextArea
                  fieldName="description"
                  control={control}
                  fieldLabel={t('categoryForm.fieldLabel.description')}
                  placeholder={t('categoryForm.placeholder.description')}
                  error={errors.description}
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                  <CustomButton
                    variant="outlined"
                    onClick={close}
                    disable={isCreating || isUpdating}
                    themeColors={themeColors}
                    label={t('categoryForm.actions.cancel')}
                  />
                  <CustomButton
                    type="submit"
                    disable={isCreating || isUpdating}
                    loading={isCreating || isUpdating}
                    themeColors={themeColors}
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

export default CategoryForm;
