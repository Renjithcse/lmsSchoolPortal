import React from "react";
import { useParams } from "react-router-dom";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useGetProductByIdQuery } from "../../Redux/features/Inventory/productSlice";
import { BASE_PATH } from "../../config";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { Box, Card, CardContent, Typography, Grid, Divider, Chip } from "@mui/material";
import { useTranslation } from 'react-i18next';

const resolveImageUrl = (src) => {
    if (!src) return '';
    if (typeof src !== 'string') return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
    const trimmed = src.startsWith('/') ? src.slice(1) : src;
    return `${BASE_PATH}${trimmed}`;
};

const ViewProductScreen = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const { id } = useParams();

    // Fetch product details using the `id`
    const { data: product, isLoading, isError, error } = useGetProductByIdQuery(id);

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: themeColors.text.primary }}>
                        {t('viewProductScreen.title')}
                    </Typography>
                </Box>
                <Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        {isLoading ? (
                            <Typography sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.messages.loading')}</Typography>
                        ) : isError ? (
                            <Typography sx={{ color: themeColors.error }}>{error?.data?.message || t('viewProductScreen.messages.loadFailed')}</Typography>
                        ) : (
                            <Grid container spacing={3}>
                                {/* Left: Details */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.labels.productName')}</Typography>
                                        <Divider flexItem orientation="vertical" sx={{ mx: 1, borderColor: themeColors.border.primary }} />
                                        <Typography sx={{ color: themeColors.text.primary, fontWeight: 700 }}>{product?.data?.productName}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <Typography sx={{ color: themeColors.text.secondary, minWidth: 140 }}>{t('viewProductScreen.labels.category')}</Typography>
                                        <Typography sx={{ color: themeColors.text.primary }}>{product?.data?.productCategory?.name || t('viewProductScreen.labels.na')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <Typography sx={{ color: themeColors.text.secondary, minWidth: 140 }}>{t('viewProductScreen.labels.subCategory')}</Typography>
                                        <Typography sx={{ color: themeColors.text.primary }}>{product?.data?.subCategory?.name || t('viewProductScreen.labels.na')}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <Typography sx={{ color: themeColors.text.secondary, minWidth: 140 }}>{t('viewProductScreen.labels.status')}</Typography>
                                        <Chip size="small" label={product?.data?.productStatus || t('viewProductScreen.labels.na')} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse }} />
                                    </Box>
                                    <Divider sx={{ my: 2, borderColor: themeColors.border.primary }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.labels.author')}</Typography>
                                            <Typography sx={{ color: themeColors.text.primary }}>{product?.data?.author || t('viewProductScreen.labels.dash')}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.labels.publisher')}</Typography>
                                            <Typography sx={{ color: themeColors.text.primary }}>{product?.data?.publisher || t('viewProductScreen.labels.dash')}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.labels.publishedYear')}</Typography>
                                            <Typography sx={{ color: themeColors.text.primary }}>{product?.data?.publishedYear || t('viewProductScreen.labels.dash')}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.labels.isbn')}</Typography>
                                            <Typography sx={{ color: themeColors.text.primary }}>{product?.data?.isbn || t('viewProductScreen.labels.dash')}</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Right: Images */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ color: themeColors.text.secondary }}>{t('viewProductScreen.labels.primaryImage')}</Typography>
                                        <Box sx={{ mt: 1, width: 200, height: 200, borderRadius: 2, overflow: 'hidden', border: `1px solid ${themeColors.border.primary}` }}>
                                            {product?.data?.primaryImage ? (
                                                <img src={resolveImageUrl(product?.data?.primaryImage)} alt={t('viewProductScreen.labels.primaryImage')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text.secondary }}>{t('viewProductScreen.messages.noImage')}</Box>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ color: themeColors.text.secondary, mb: 1 }}>{t('viewProductScreen.labels.otherImages')}</Typography>
                                        <Grid container spacing={2}>
                                            {(product?.data?.otherImages || []).map((image, index) => (
                                                <Grid item xs={6} sm={4} key={index}>
                                                    <Box sx={{ borderRadius: 1, overflow: 'hidden', border: `1px solid ${themeColors.border.primary}` }}>
                                                        <img src={resolveImageUrl(image)} alt={t('viewProductScreen.labels.otherImage', { index: index + 1 })} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                                                    </Box>
                                                </Grid>
                                            ))}
                                            {(!product?.data?.otherImages || product?.data?.otherImages.length === 0) && (
                                                <Typography sx={{ color: themeColors.text.secondary, ml: 1 }}>{t('viewProductScreen.messages.noAdditionalImages')}</Typography>
                                            )}
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default ViewProductScreen;