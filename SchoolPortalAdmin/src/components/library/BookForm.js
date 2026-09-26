import React, { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, MenuItem } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, number } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomTextArea from '../Common/CustomTextArea';
import CustomSelect from '../Common/CustomSelect';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useCreateBookMutation, useUpdateBookMutation } from '../../Redux/features/Library/bookSlice';
import { useListRacksQuery } from '../../Redux/features/Library/rackSlice';
import { useListBookCatalogsQuery } from '../../Redux/features/Library/bookCatalogSlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import BookIcon from '@mui/icons-material/Book';
import CustonImageUpload from '../Common/CustomFileUpload';
import { useTranslation } from 'react-i18next';

const BookForm = ({ close, open, label, hide, item, btnLabel }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Image upload handlers
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Convert to base64 for preview and upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        setPreviewUrl(base64String);
        setValue('coverImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setValue('coverImage', '');
  };

  const schema = useMemo(() => object().shape({
    bookCatalog: string().required(t('bookForm.validation.bookCatalogRequired')),
    copyNumber: string().required(t('bookForm.validation.copyNumberRequired')),
    rack: string().required(t('bookForm.validation.rackRequired')),
    row: number()
      .typeError(t('bookForm.validation.rowNumber'))
      .positive(t('bookForm.validation.rowPositive'))
      .required(t('bookForm.validation.rowRequired')),
    position: number()
      .typeError(t('bookForm.validation.positionNumber'))
      .positive(t('bookForm.validation.positionPositive'))
      .required(t('bookForm.validation.positionRequired')),
    condition: string().oneOf(['excellent', 'good', 'fair', 'poor'], t('bookForm.validation.conditionValid')).required(t('bookForm.validation.conditionRequired')),
    description: string(),
    coverImage: string(),
  }), [t]);

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      bookCatalog: '',
      copyNumber: '',
      rack: '',
      row: '',
      position: '',
      condition: t('bookForm.defaultCondition'),
      description: '',
    }
  });

  const watchedRack = watch('rack');
  const watchedRow = watch('row');

  // Fetch racks and book catalogs
  const { data: racksData } = useListRacksQuery();
  const { data: catalogsData } = useListBookCatalogsQuery({ limit: 1000 });

  // Generate row options based on selected rack
  const selectedRack = racksData?.find(rack => rack._id === watchedRack);
  const rowOptions = selectedRack ? Array.from({ length: selectedRack.numberOfRows }, (_, i) => i + 1) : [];

  useEffect(() => {
    if (item) {
      setValue('bookCatalog', item?.bookCatalog?._id || item?.bookCatalog);
      setValue('copyNumber', item?.copyNumber);
      setValue('rack', item?.rack?._id);
      setValue('row', item?.row);
      setValue('position', item?.position);
      setValue('condition', item?.condition || t('bookForm.defaultCondition'));
      setValue('description', item?.description);
      
      // Handle existing cover image
      if (item.coverImage) {
        setPreviewUrl(item.coverImage);
        setImageFile(true); // Indicate there's an existing image
        setValue('coverImage', item.coverImage);
      } else {
        setPreviewUrl(null);
        setImageFile(null);
        setValue('coverImage', '');
      }
    } else {
      reset();
      setPreviewUrl(null);
      setImageFile(null);
    }
  }, [item, setValue, reset]);

  const [createBook, { isLoading: isCreating }] = useCreateBookMutation();
  const [updateBook, { isLoading: isUpdating }] = useUpdateBookMutation();

  const onSubmit = async (data) => {
    try {
      if (item) {
        await updateBook({ id: item._id, data }).unwrap();
        showSnackbar(t('bookForm.messages.updateSuccess'), 'success');
      } else {
        await createBook(data).unwrap();
        showSnackbar(t('bookForm.messages.createSuccess'), 'success');
      }
      close();
    } catch (error) {
      showSnackbar(error?.data?.message || t('bookForm.messages.error'), 'error');
    }
  };



  return (
    <CustomModal close={close} open={open} label={label} width={'lg'} btnLabel={btnLabel} block={true}>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <BookIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('bookForm.bookDetails')}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              {/* Book Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                  {t('bookForm.sections.bookInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomSelect
                  fieldName="bookCatalog"
                  control={control}
                  fieldLabel={t('bookForm.fieldLabel.bookCatalog')}
                  error={errors.bookCatalog}
                  themeColors={themeColors}
                >
                  <MenuItem value="">{t('bookForm.selectBook')}</MenuItem>
                  {catalogsData?.data?.catalogs?.map((catalog) => (
                    <MenuItem key={catalog._id} value={catalog._id}>
                      {catalog.title} - {catalog.author} ({catalog.isbn})
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="copyNumber"
                  control={control}
                  label={t('bookForm.fieldLabel.copyNumber')}
                  placeholder={t('bookForm.placeholder.copyNumber')}
                  error={errors.copyNumber}
                  themeColors={themeColors}
                />
              </Grid>

              {/* Location Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1, mt: 2 }}>
                  {t('bookForm.sections.locationInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomSelect
                  fieldName="rack"
                  control={control}
                  fieldLabel={t('bookForm.fieldLabel.rack')}
                  error={errors.rack}
                  themeColors={themeColors}
                  onChangeValue={(value) => {
                    setValue('row', '');
                    setValue('position', '');
                  }}
                >
                  <MenuItem value="">{t('bookForm.selectRack')}</MenuItem>
                  {racksData?.map((rack) => (
                    <MenuItem key={rack._id} value={rack._id}>
                      {rack.rackNumber} - {rack.description || t('bookForm.noDescription')}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomSelect
                  fieldName="row"
                  control={control}
                  fieldLabel={t('bookForm.fieldLabel.row')}
                  error={errors.row}
                  themeColors={themeColors}
                  onChangeValue={(value) => {
                    setValue('position', '');
                  }}
                >
                  <MenuItem value="">{t('bookForm.selectRow')}</MenuItem>
                  {rowOptions.map((rowNumber) => (
                    <MenuItem key={rowNumber} value={rowNumber}>
                      {t('bookForm.rowNumber', { number: rowNumber })}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomInput
                  name="position"
                  control={control}
                  label={t('bookForm.fieldLabel.position')}
                  placeholder={t('bookForm.placeholder.position')}
                  error={errors.position}
                  themeColors={themeColors}
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1, mt: 2 }}>
                  {t('bookForm.sections.additionalInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomSelect
                  fieldName="condition"
                  control={control}
                  fieldLabel={t('bookForm.fieldLabel.condition')}
                  error={errors.condition}
                  themeColors={themeColors}
                >
                  <MenuItem value="excellent">{t('bookForm.condition.excellent')}</MenuItem>
                  <MenuItem value="good">{t('bookForm.condition.good')}</MenuItem>
                  <MenuItem value="fair">{t('bookForm.condition.fair')}</MenuItem>
                  <MenuItem value="poor">{t('bookForm.condition.poor')}</MenuItem>
                </CustomSelect>
              </Grid>

              {/* Cover Image Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                  {t('bookForm.sections.coverImage')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CustonImageUpload
                    fieldName="coverImage"
                    control={control}
                    fieldLabel=""
                    error={errors.coverImage}
                    onChangeImage={handleImageChange}
                    previewUrl={previewUrl}
                    imageFile={imageFile}
                    Not={true}
                  />
                  {previewUrl && (
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        variant="square"
                        src={previewUrl}
                        sx={{ width: 80, height: 80, border: `2px solid ${themeColors.border.primary}` }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <CustomTextArea
                  fieldName="description"
                  control={control}
                  fieldLabel={t('bookForm.fieldLabel.description')}
                  placeholder={t('bookForm.placeholder.description')}
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
                    label={t('bookForm.actions.cancel')}
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

export default BookForm;
