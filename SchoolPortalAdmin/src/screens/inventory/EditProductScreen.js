import React, { useEffect } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useGetProductByIdQuery, useUpdateProductMutation } from "../../Redux/features/Inventory/productSlice";
import { useGetCategoriesQuery } from "../../Redux/features/Inventory/categorySlice";
import { useLazyGetSubCategoryByCategoryIdQuery } from "../../Redux/features/Inventory/subCategorySlice";
import { convertToBase64 } from "../../helpers/ImageHelper";
import { useSnackbar } from "../../hooks/SnackBar";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Card, CardContent, Typography, Grid, TextField, Button, MenuItem } from "@mui/material";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import ImagePicker from "../../components/Inputs/ImagePicker";
import MultiImagePicker from "../../components/Inputs/MultiImagePicker";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const EditProductScreen = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const { data: product, isLoading: isProductLoading } = useGetProductByIdQuery(id);
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategoriesQuery();
    const [triggerSubCategory, { data: subCategories = [], isLoading: isSubCategoriesLoading }] = useLazyGetSubCategoryByCategoryIdQuery();
    const { themeColors } = useThemeContext();
    const ability = useAbility();

    const schema = React.useMemo(() => yup.object().shape({
        productName: yup.string().required(t('editProduct.validation.productNameRequired')),
        productCategory: yup.string().required(t('editProduct.validation.categoryRequired')),
        subCategory: yup.string().required(t('editProduct.validation.subCategoryRequired')),
        productStatus: yup.string().required(t('editProduct.validation.statusRequired')),
        productCode: yup.string().required(t('editProduct.validation.productCodeRequired')),
        primaryImage: yup
            .mixed()
            .test("fileType", t('editProduct.validation.onlyImagesAllowed'), (value) => {
                if (!value) return true;
                
                // Handle base64 strings (from ImagePicker)
                if (typeof value === 'string') {
                    return value.startsWith('data:image/jpeg;base64,') ||
                           value.startsWith('data:image/png;base64,') ||
                           value.startsWith('data:image/jpg;base64,');
                }
                
                // Handle File objects
                return !value[0] || ["image/jpeg", "image/png", "image/jpg"].includes(value[0]?.type);
            }),
        otherImages: yup
            .mixed()
            .test("fileType", t('editProduct.validation.onlyImagesAllowed'), (value) => {
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
            .typeError(t('editProduct.validation.publishedYearNumber'))
            .min(1900, t('editProduct.validation.publishedYearMin'))
            .max(new Date().getFullYear(), t('editProduct.validation.publishedYearMax', { year: new Date().getFullYear() }))
            .nullable(),
        isbn: yup.string().nullable(),
    }), [t]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const showSnackbar = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        if (product) {
            reset({
                productName: product?.data?.productName || "",
                productCategory: product?.data?.productCategory?._id || "",
                subCategory: product?.data?.subCategory?._id || "",
                productStatus: product?.data?.productStatus || "In Stock",
                productCode: product?.data?.productCode || "",
                author: product?.data?.author || "",
                publisher: product?.data?.publisher || "",
                publishedYear: product?.data?.publishedYear || "",
                isbn: product?.data?.isbn || "",
                primaryImage: product?.data?.primaryImage || null,
                otherImages: product?.data?.otherImages || [],
            });
            if (product?.data?.productCategory?._id) {
                triggerSubCategory(product?.data?.productCategory?._id);
            }
        }
    }, [product, reset, triggerSubCategory]);

    useEffect(() => {
        if (subCategories && product?.data?.subCategory?._id) {
            setValue("subCategory", product?.data?.subCategory?._id);
        }
    }, [subCategories, setValue, product]);

    const selectedCategory = watch("productCategory");

    useEffect(() => {
        if (selectedCategory) {
            setValue("subCategory", ""); // Reset subcategory when category changes
            triggerSubCategory(selectedCategory);
        }
    }, [selectedCategory, triggerSubCategory, setValue]);

    const onSubmit = async (data) => {
        try {
            const formData = { ...data };

            // Primary Image may already be base64 from ImagePicker
            if (data.primaryImage) {
                if (typeof data.primaryImage === 'string') {
                    formData.primaryImage = data.primaryImage;
                } else if (data.primaryImage[0]) {
                    formData.primaryImage = await convertToBase64(data.primaryImage[0]);
                } else {
                    formData.primaryImage = null;
                }
            } else {
                formData.primaryImage = null;
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

            await updateProduct({ id, updatedProduct: formData }).unwrap();
            showSnackbar(t('editProduct.messages.updateSuccess'), "success");
            navigate(-1);
        } catch (error) {
            showSnackbar(t('editProduct.messages.updateFailed'), "error");
            console.error("Failed to update product:", error);
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 4, p: 2, borderRadius: 2, backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                    <Typography variant="h4" fontWeight={800} align="center" sx={{ color: themeColors.text.primary }}>
                        {t('editProduct.title')}
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ color: themeColors.text.secondary, mt: 1 }}>
                        {t('editProduct.subtitle')}
                    </Typography>
                </Box>
                <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        {isProductLoading ? (
                            <Typography sx={{ color: themeColors.text.secondary }}>{t('editProduct.loading')}</Typography>
                        ) : (
                            <Grid container spacing={3} component="form" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="productName" control={control} fieldLabel={t('editProduct.labels.productName')} placeholder={t('editProduct.placeholders.productName')} error={errors.productName} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="productCode" control={control} fieldLabel={t('editProduct.labels.productCode')} placeholder={t('editProduct.placeholders.productCode')} error={errors.productCode} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomSelect fieldName="productCategory" control={control} fieldLabel={t('editProduct.labels.category')} error={errors.productCategory}>
                                        {isCategoriesLoading ? (
                                            <MenuItem value="" disabled>{t('editProduct.loading')}</MenuItem>
                                        ) : (
                                            [<MenuItem key="empty-cat" value=""></MenuItem>,
                                            ...(categories?.data || []).map((category) => (
                                                <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>
                                            ))]
                                        )}
                                    </CustomSelect>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomSelect fieldName="subCategory" control={control} fieldLabel={t('editProduct.labels.subCategory')} error={errors.subCategory}>
                                        {isSubCategoriesLoading ? (
                                            <MenuItem value="" disabled>{t('editProduct.loading')}</MenuItem>
                                        ) : (
                                            [<MenuItem key="empty-sub" value=""></MenuItem>,
                                            ...(subCategories?.data || []).map((subCategory) => (
                                                <MenuItem key={subCategory._id} value={subCategory._id}>{subCategory.name}</MenuItem>
                                            ))]
                                        )}
                                    </CustomSelect>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="author" control={control} fieldLabel={t('editProduct.labels.author')} placeholder={t('editProduct.placeholders.author')} error={errors.author} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="publisher" control={control} fieldLabel={t('editProduct.labels.publisher')} placeholder={t('editProduct.placeholders.publisher')} error={errors.publisher} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="publishedYear" control={control} fieldLabel={t('editProduct.labels.publishedYear')} placeholder={t('editProduct.placeholders.publishedYear')} type="number" max={new Date().getFullYear()} error={errors.publishedYear} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomInput fieldName="isbn" control={control} fieldLabel={t('editProduct.labels.isbn')} placeholder={t('editProduct.placeholders.isbn')} error={errors.isbn} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <ImagePicker fieldName="primaryImage" control={control} fieldLabel={t('editProduct.labels.primaryImage')} defaultValue={product?.data?.primaryImage || null} />
                                    {errors.primaryImage && (
                                        <Typography sx={{ color: themeColors.error, fontSize: 12, mt: 0.5, pl: 1 }}>
                                            {errors.primaryImage.message}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <MultiImagePicker fieldName="otherImages" control={control} fieldLabel={t('editProduct.labels.otherImages')} defaultValue={product?.data?.otherImages || []} />
                                    {errors.otherImages && (
                                        <Typography sx={{ color: themeColors.error, fontSize: 12, mt: 0.5, pl: 1 }}>
                                            {errors.otherImages.message}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CustomSelect fieldName="productStatus" control={control} fieldLabel={t('editProduct.labels.status')} error={errors.productStatus}>
                                        <MenuItem value={'In Stock'}>{t('editProduct.status.inStock')}</MenuItem>
                                        <MenuItem value={'Low Stock'}>{t('editProduct.status.lowStock')}</MenuItem>
                                        <MenuItem value={'Out of Stock'}>{t('editProduct.status.outOfStock')}</MenuItem>
                                    </CustomSelect>
                                </Grid>
                                <Grid item xs={12}>
                                    {ability.can('Edit', 'InventoryProducts') && (
                                        <Button type="submit" variant="contained" fullWidth disabled={isUpdating} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>
                                            {isUpdating ? t('editProduct.actions.updating') : t('editProduct.actions.updateProduct')}
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default EditProductScreen;