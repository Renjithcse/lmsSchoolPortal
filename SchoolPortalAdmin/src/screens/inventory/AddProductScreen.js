import React, { useEffect, useMemo } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCreateProductMutation } from "../../Redux/features/Inventory/productSlice";
import { useGetCategoriesQuery } from "../../Redux/features/Inventory/categorySlice";
import { useLazyGetSubCategoryByCategoryIdQuery } from "../../Redux/features/Inventory/subCategorySlice";
import { useGetUnitsQuery } from "../../Redux/features/Inventory/unitSlice";
import { convertToBase64 } from "../../helpers/ImageHelper";
import { useSnackbar } from "../../hooks/SnackBar";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Grid, TextField, Button, MenuItem } from "@mui/material";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import ImagePicker from "../../components/Inputs/ImagePicker";
import MultiImagePicker from "../../components/Inputs/MultiImagePicker";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const AddProductScreen = () => {
    const { themeColors } = useThemeContext();
    const showSnackbar = useSnackbar();
    const navigate = useNavigate();
    const ability = useAbility();
    const { t } = useTranslation();

    const schema = React.useMemo(() => yup.object().shape({
        productName: yup.string().required(t('addProduct.validation.productNameRequired')),
        productCategory: yup.string().required(t('addProduct.validation.categoryRequired')),
        subCategory: yup.string().required(t('addProduct.validation.subCategoryRequired')),
        productStatus: yup.string().required(t('addProduct.validation.statusRequired')),
        productCode: yup.string().required(t('addProduct.validation.productCodeRequired')),
        primaryImage: yup
            .mixed()
            .required(t('addProduct.validation.primaryImageRequired'))
            .test("fileType", t('addProduct.validation.onlyImagesAllowed'), (value) => {
                if (!value) return false;
                if (typeof value === 'string') return true; // already base64 from ImagePicker
                return ["image/jpeg", "image/png", "image/jpg"].includes(value[0]?.type);
            }),
        otherImages: yup
            .mixed()
            .test("fileType", t('addProduct.validation.onlyImagesAllowed'), (value) => {
                if (!value || value.length === 0) return true;
                
                // Handle base64 strings (from MultiImagePicker)
                if (typeof value[0] === 'string') {
                    return value.every(item => 
                        item && (
                            item.startsWith('data:image/jpeg;base64,') ||
                            item.startsWith('data:image/png;base64,') ||
                            item.startsWith('data:image/jpg;base64,')
                        )
                    );
                }
                
                // Handle File objects
                return Array.from(value).every((file) =>
                    ["image/jpeg", "image/png", "image/jpg"].includes(file.type)
                );
            }),
        author: yup.string().nullable(),
        publisher: yup.string().nullable(),
        publishedYear: yup
        .number()
        .transform((value, originalValue) => originalValue === "" ? null : value)
        .typeError(t('addProduct.validation.publishedYearNumber'))
        .min(1900, t('addProduct.validation.publishedYearMin'))
        .max(new Date().getFullYear(), t('addProduct.validation.publishedYearMax', { year: new Date().getFullYear() }))
        .nullable(),
        isbn: yup.string().nullable(),
    }), [t]);

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
        reset
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            productStatus: "In Stock"
        }
    });

    const [createProduct, { isLoading }] = useCreateProductMutation();
    const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategoriesQuery();
    const [triggerSubCategory, { data: subCategories = [], isLoading: isSubCategoriesLoading }] = useLazyGetSubCategoryByCategoryIdQuery();
    const { data: unitsData = [], isLoading: isUnitsLoading } = useGetUnitsQuery();

    const selectedCategory = watch("productCategory");

    useEffect(() => {
        if (selectedCategory) {
            triggerSubCategory(selectedCategory);
        }
    }, [selectedCategory, triggerSubCategory]);

    // Memoize options for performance
    const categoryOptions = useMemo(() => categories?.data || [], [categories]);
    const subCategoryOptions = useMemo(() => subCategories?.data || [], [subCategories]);
    const unitOptions = useMemo(() => unitsData?.data || [], [unitsData]);

    const onSubmit = async (data) => {
        try {
            const formData = { ...data };

            // Use base64 from ImagePicker or convert if file
            if (data.primaryImage) {
                if (typeof data.primaryImage === 'string') {
                    formData.primaryImage = data.primaryImage;
                } else if (data.primaryImage[0]) {
                    formData.primaryImage = await convertToBase64(data.primaryImage[0]);
                }
            }

            // Other Images may be base64 list from MultiImagePicker or FileList
            if (data.otherImages && data.otherImages.length > 0) {
                if (typeof data.otherImages[0] === 'string') {
                    formData.otherImages = data.otherImages;
                } else {
                    const otherImagesFiles = Array.from(data.otherImages);
                    formData.otherImages = await Promise.all(
                        otherImagesFiles.map((file) => convertToBase64(file))
                    );
                }
            } else {
                formData.otherImages = [];
            }
            

            await createProduct(formData).unwrap();
            reset();
            showSnackbar(t('addProduct.messages.createSuccess'), "success");
            navigate(-1);
        } catch (error) {
            showSnackbar(t('addProduct.messages.createFailed'), "error");
            console.error("Failed to create product:", error);
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 4, p: 2, borderRadius: 2, backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                    <Typography variant="h4" fontWeight={800} align="center" sx={{ color: themeColors.text.primary }}>
                        {t('addProduct.title')}
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ color: themeColors.text.secondary, mt: 1 }}>
                        {t('addProduct.subtitle')}
                    </Typography>
                </Box>
                <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Box component="form" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="productName" control={control} fieldLabel={t('addProduct.labels.productName')} placeholder={t('addProduct.placeholders.productName')} error={errors.productName} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="productCode" control={control} fieldLabel={t('addProduct.labels.productCode')} placeholder={t('addProduct.placeholders.productCode')} error={errors.productCode} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomSelect fieldName="productCategory" control={control} fieldLabel={t('addProduct.labels.category')} error={errors.productCategory}>
                                        {isCategoriesLoading ? (
                                            <MenuItem value="" disabled>{t('addProduct.loading')}</MenuItem>
                                        ) : (
                                            [<MenuItem key="empty-cat" value=""></MenuItem>,
                                            ...categoryOptions.map((category) => (
                                                <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>
                                            ))]
                                        )}
                                    </CustomSelect>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomSelect fieldName="subCategory" control={control} fieldLabel={t('addProduct.labels.subCategory')} error={errors.subCategory}>
                                        {isSubCategoriesLoading ? (
                                            <MenuItem value="" disabled>{t('addProduct.loading')}</MenuItem>
                                        ) : (
                                            [<MenuItem key="empty-sub" value=""></MenuItem>,
                                            ...subCategoryOptions.map((sub) => (
                                                <MenuItem key={sub._id} value={sub._id}>{sub.name}</MenuItem>
                                            ))]
                                        )}
                                    </CustomSelect>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="author" control={control} fieldLabel={t('addProduct.labels.author')} placeholder={t('addProduct.placeholders.author')} error={errors.author} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="publisher" control={control} fieldLabel={t('addProduct.labels.publisher')} placeholder={t('addProduct.placeholders.publisher')} error={errors.publisher} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="publishedYear" control={control} fieldLabel={t('addProduct.labels.publishedYear')} placeholder={t('addProduct.placeholders.publishedYear')} type="number" max={new Date().getFullYear()} error={errors.publishedYear} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="isbn" control={control} fieldLabel={t('addProduct.labels.isbn')} placeholder={t('addProduct.placeholders.isbn')} error={errors.isbn} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <ImagePicker fieldName="primaryImage" control={control} fieldLabel={t('addProduct.labels.primaryImage')} />
                                    {errors.primaryImage && (
                                        <Typography sx={{ color: themeColors.error, fontSize: 12, mt: 0.5, pl: 1 }}>
                                            {errors.primaryImage.message}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <MultiImagePicker fieldName="otherImages" control={control} fieldLabel={t('addProduct.labels.otherImages')} />
                                    {errors.otherImages && (
                                        <Typography sx={{ color: themeColors.error, fontSize: 12, mt: 0.5, pl: 1 }}>
                                            {errors.otherImages.message}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomSelect fieldName="productStatus" control={control} fieldLabel={t('addProduct.labels.status')} error={errors.productStatus} defaultValue="In Stock">
                                        <MenuItem value={'In Stock'}>{t('addProduct.status.inStock')}</MenuItem>
                                        <MenuItem value={'Low Stock'}>{t('addProduct.status.lowStock')}</MenuItem>
                                        <MenuItem value={'Out of Stock'}>{t('addProduct.status.outOfStock')}</MenuItem>
                                    </CustomSelect>
                                </Grid>
                                <Grid item xs={12}>
                                    {ability.can('Create', 'InventoryProducts') && (
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={isLoading}
                                        sx={{
                                            backgroundColor: themeColors.primary,
                                            color: themeColors.text.inverse,
                                            '&:hover': { backgroundColor: themeColors.primary }
                                        }}
                                    >
                                        {isLoading ? t('addProduct.actions.saving') : t('addProduct.actions.addProduct')}
                                    </Button>)}
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default AddProductScreen;