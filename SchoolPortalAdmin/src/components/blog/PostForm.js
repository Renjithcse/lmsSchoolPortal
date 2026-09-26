import React, { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, Chip, MenuItem, IconButton } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomSelect from '../Common/CustomSelect';
import CustomTextArea from '../Common/CustomTextArea';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useCreatePostMutation, useUpdatePostMutation } from '../../Redux/features/Blog/postSlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

const PostForm = ({ close, open, label, hide, item, btnLabel }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const schema = useMemo(() => object().shape({
    title: string().required(t('postForm.validation.titleRequired')).max(200, t('postForm.validation.titleMaxLength')),
    content: string().required(t('postForm.validation.contentRequired')),
    excerpt: string().max(300, t('postForm.validation.excerptMaxLength')),
    category: string().required(t('postForm.validation.categoryRequired')),
    featuredImage: string(),
  }), [t]);

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      category: '',
      featuredImage: '',
    }
  });

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();

  const categories = useMemo(() => [
    { value: 'academic', label: t('postForm.categories.academic') },
    { value: 'activities', label: t('postForm.categories.activities') },
    { value: 'news', label: t('postForm.categories.news') },
    { value: 'events', label: t('postForm.categories.events') },
    { value: 'student-life', label: t('postForm.categories.studentLife') },
    { value: 'sports', label: t('postForm.categories.sports') },
    { value: 'technology', label: t('postForm.categories.technology') },
    { value: 'other', label: t('postForm.categories.other') }
  ], [t]);

  useEffect(() => {
    if (item) {
      setValue('title', item.title || '');
      setValue('content', item.content || '');
      setValue('excerpt', item.excerpt || '');
      setValue('category', item.category || '');
      setValue('featuredImage', item.featuredImage || '');
      setTags(item.tags || []);
      setImagePreview(item.featuredImage || '');
    } else {
      reset();
      setTags([]);
      setSelectedImage(null);
      setImagePreview('');
    }
  }, [item, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      const postData = {
        ...data,
        tags: tags.join(',')
      };

      if (item) {
        await updatePost({ id: item._id, data: postData }).unwrap();
        showSnackbar(t('postForm.messages.updateSuccess'), 'success');
      } else {
        await createPost(postData).unwrap();
        showSnackbar(t('postForm.messages.createSuccess'), 'success');
      }
      
      close();
    } catch (error) {
      showSnackbar(error?.data?.message || t('postForm.messages.saveError'), 'error');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showSnackbar(t('postForm.messages.invalidImageFile'), 'error');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar(t('postForm.messages.imageSizeLimit'), 'error');
        return;
      }

      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setValue('featuredImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setValue('featuredImage', '');
  };

  return (
    <CustomModal close={close} open={open} label={label} width={'lg'} block={true}>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <ArticleIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {label}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CustomInput
                  name="title"
                  control={control}
                  label={t('postForm.fields.title')}
                  placeholder={t('postForm.placeholders.title')}
                  error={errors.title}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomSelect
                  fieldName="category"
                  control={control}
                  fieldLabel={t('postForm.fields.category')}
                  error={errors.category}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: themeColors.text.primary, 
                      mb: 1,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      fontFamily: 'Raleway, sans-serif'
                    }}
                  >
                    {t('postForm.fields.featuredImage')}
                  </Typography>
                  
                  {imagePreview ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt={t('postForm.imagePreview')}
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: `1px solid ${themeColors.border.primary}`
                        }}
                      />
                      <IconButton
                        onClick={handleRemoveImage}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.7)',
                          },
                          width: 24,
                          height: 24,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        border: `2px dashed ${themeColors.border.primary}`,
                        borderRadius: '8px',
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: themeColors.primary,
                          backgroundColor: `${themeColors.primary}08`,
                        },
                      }}
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      <ImageIcon sx={{ fontSize: 48, color: themeColors.text.secondary, mb: 1 }} />
                      <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                        {t('postForm.uploadImage')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                        {t('postForm.imageFormats')}
                      </Typography>
                    </Box>
                  )}
                  
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <CustomTextArea
                  fieldName="excerpt"
                  control={control}
                  fieldLabel={t('postForm.fields.excerpt')}
                  placeholder={t('postForm.placeholders.excerpt')}
                  error={errors.excerpt}
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextArea
                  fieldName="content"
                  control={control}
                  fieldLabel={t('postForm.fields.content')}
                  placeholder={t('postForm.placeholders.content')}
                  error={errors.content}
                  rows={10}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 1 }}>
                  {t('postForm.fields.tags')}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      sx={{
                        backgroundColor: themeColors.primary,
                        color: 'white',
                        '& .MuiChip-deleteIcon': {
                          color: 'white',
                        },
                      }}
                    />
                  ))}
                </Box>
                <Box display="flex" gap={1}>
                  <Box sx={{ flex: 1 }}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder={t('postForm.placeholders.addTag')}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: '5px',
                        backgroundColor: themeColors.background.primary,
                        color: themeColors.text.primary,
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '14px',
                        outline: 'none',
                        '&:focus': {
                          borderColor: themeColors.primary,
                          boxShadow: `0 0 0 2px ${themeColors.primary}20`
                        }
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = themeColors.primary;
                        e.target.style.boxShadow = `0 0 0 2px ${themeColors.primary}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = themeColors.border.primary;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </Box>
                  <CustomButton
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    themeColors={themeColors}
                    size="small"
                    label={t('postForm.actions.add')}
                  />
                </Box>
              </Grid>



              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                  <CustomButton
                    variant="outlined"
                    onClick={close}
                    disabled={isCreating || isUpdating}
                    themeColors={themeColors}
                    label={t('postForm.actions.cancel')}
                  />
                  <CustomButton
                    type="submit"
                    disabled={isCreating || isUpdating}
                    themeColors={themeColors}
                    label={isCreating || isUpdating ? t('postForm.actions.saving') : btnLabel}
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

export default PostForm;
