import React, { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, MenuItem, CardMedia } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, number } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomTextArea from '../Common/CustomTextArea';
import CustomSelect from '../Common/CustomSelect';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useCreateBookCatalogMutation, useUpdateBookCatalogMutation } from '../../Redux/features/Library/bookCatalogSlice';
import { useListCategoriesQuery } from '../../Redux/features/Library/categorySlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import BookIcon from '@mui/icons-material/Book';
import CustonImageUpload from '../Common/CustomFileUpload';
import { useTranslation } from 'react-i18next';

const BookCatalogForm = ({ close, open, label, hide, item, btnLabel }) => {
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
    isbn: string().required(t('bookCatalogForm.validation.isbnRequired')),
    title: string().required(t('bookCatalogForm.validation.titleRequired')),
    author: string().required(t('bookCatalogForm.validation.authorRequired')),
    publisher: string(),
    publicationYear: number()
      .typeError(t('bookCatalogForm.validation.publicationYearNumber'))
      .min(1900, t('bookCatalogForm.validation.publicationYearMin'))
      .max(new Date().getFullYear(), t('bookCatalogForm.validation.publicationYearMax')),
    edition: string(),
    category: string().required(t('bookCatalogForm.validation.categoryRequired')),
    subject: string(),
    language: string(),
    pages: number()
      .typeError(t('bookCatalogForm.validation.pagesNumber'))
      .positive(t('bookCatalogForm.validation.pagesPositive')),
    price: number()
      .typeError(t('bookCatalogForm.validation.priceNumber'))
      .min(0, t('bookCatalogForm.validation.priceMin')),
    description: string(),
    coverImage: string(),
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
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      publicationYear: new Date().getFullYear(),
      edition: '',
      category: '',
      subject: '',
      language: t('bookCatalogForm.defaultLanguage'),
      pages: '',
      price: '',
      description: '',
    }
  });

  const [createBookCatalog, { isLoading: isCreating }] = useCreateBookCatalogMutation();
  const [updateBookCatalog, { isLoading: isUpdating }] = useUpdateBookCatalogMutation();

  // Fetch categories
  const { data: categoriesData } = useListCategoriesQuery();

  useEffect(() => {
    if (item) {
      setValue('isbn', item?.isbn || '');
      setValue('title', item?.title || '');
      setValue('author', item?.author || '');
      setValue('publisher', item?.publisher || '');
      setValue('publicationYear', item?.publicationYear || new Date().getFullYear());
      setValue('edition', item?.edition || '');
      setValue('category', item?.category?._id || item?.category || '');
      setValue('subject', item?.subject || '');
      setValue('language', item?.language || t('bookCatalogForm.defaultLanguage'));
      setValue('pages', item?.pages || '');
      setValue('price', item?.price || '');
      setValue('description', item?.description || '');
      
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

  const onSubmit = async (data) => {
    try {
      if (item) {
        await updateBookCatalog({ id: item._id, data }).unwrap();
        showSnackbar(t('bookCatalogForm.messages.updateSuccess'), 'success');
      } else {
        await createBookCatalog(data).unwrap();
        showSnackbar(t('bookCatalogForm.messages.createSuccess'), 'success');
      }
      close();
    } catch (error) {
      showSnackbar(error?.data?.message || t('bookCatalogForm.messages.saveFailed'), 'error');
    }
  };

  if (!themeColors) {
    return <div>{t('bookCatalogForm.loading')}</div>;
  }

  return (
    <CustomModal close={close} open={open} label={label} width={'lg'} block={true}>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <BookIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {label}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                  {t('bookCatalogForm.sections.basicInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="isbn"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.isbn')}
                  placeholder={t('bookCatalogForm.placeholder.isbn')}
                  error={errors.isbn}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="title"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.title')}
                  placeholder={t('bookCatalogForm.placeholder.title')}
                  error={errors.title}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="author"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.author')}
                  placeholder={t('bookCatalogForm.placeholder.author')}
                  error={errors.author}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="publisher"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.publisher')}
                  placeholder={t('bookCatalogForm.placeholder.publisher')}
                  error={errors.publisher}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomInput
                  name="publicationYear"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.publicationYear')}
                  placeholder={t('bookCatalogForm.placeholder.publicationYear')}
                  error={errors.publicationYear}
                  themeColors={themeColors}
                  type="number"
                  inputProps={{ min: 1900, max: new Date().getFullYear() }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomInput
                  name="edition"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.edition')}
                  placeholder={t('bookCatalogForm.placeholder.edition')}
                  error={errors.edition}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomInput
                  name="pages"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.pages')}
                  placeholder={t('bookCatalogForm.placeholder.pages')}
                  error={errors.pages}
                  themeColors={themeColors}
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </Grid>

              {/* Category Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1, mt: 2 }}>
                  {t('bookCatalogForm.sections.categoryInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomSelect
                  fieldName="category"
                  control={control}
                  fieldLabel={t('bookCatalogForm.fieldLabel.category')}
                  error={errors.category}
                  themeColors={themeColors}
                >
                  <MenuItem value="">{t('bookCatalogForm.selectCategory')}</MenuItem>
                  {categoriesData?.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="subject"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.subject')}
                  placeholder={t('bookCatalogForm.placeholder.subject')}
                  error={errors.subject}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="language"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.language')}
                  placeholder={t('bookCatalogForm.placeholder.language')}
                  error={errors.language}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="price"
                  control={control}
                  label={t('bookCatalogForm.fieldLabel.price')}
                  placeholder={t('bookCatalogForm.placeholder.price')}
                  error={errors.price}
                  themeColors={themeColors}
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              {/* Cover Image Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                  {t('bookCatalogForm.sections.coverImage')}
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
                  fieldLabel={t('bookCatalogForm.fieldLabel.description')}
                  placeholder={t('bookCatalogForm.placeholder.description')}
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
                    label={t('bookCatalogForm.actions.cancel')}
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

export default BookCatalogForm;
