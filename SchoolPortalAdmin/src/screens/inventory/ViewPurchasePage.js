import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useGetPurchaseByIdQuery } from "../../Redux/features/Inventory/purchaseSlice";
import { Box, Card, CardContent, Typography, Grid, Button, Divider } from "@mui/material";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from 'react-i18next';

const ViewPurchasePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useGetPurchaseByIdQuery(id);
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    if (isLoading) return <CustomOutletBox><Box sx={{ p: 4, color: themeColors.text.secondary }}>{t('viewPurchasePage.messages.loading')}</Box></CustomOutletBox>;
    if (isError || !data?.data) return <CustomOutletBox><Box sx={{ p: 4, color: themeColors.error }}>{t('viewPurchasePage.messages.loadFailed')}</Box></CustomOutletBox>;

    const purchase = data.data;

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('viewPurchasePage.title')}</Typography>
                    <Button onClick={() => navigate(-1)} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>
                        {t('viewPurchasePage.actions.back')}
                    </Button>
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewPurchasePage.labels.purchaseCode')}:</b> {purchase.purchaseCode}</Typography></Grid>
                            <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewPurchasePage.labels.store')}:</b> {purchase.store?.storeName}</Typography></Grid>
                            <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewPurchasePage.labels.supplier')}:</b> {purchase.supplier}</Typography></Grid>
                            <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewPurchasePage.labels.date')}:</b> {new Date(purchase.date).toLocaleDateString()}</Typography></Grid>
                            <Grid item xs={12}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewPurchasePage.labels.totalAmount')}:</b> ${purchase.totalAmount}</Typography></Grid>
                        </Grid>
                        <Divider sx={{ my: 2, borderColor: themeColors.border.primary }} />
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 1 }}>{t('viewPurchasePage.labels.products')}</Typography>
                        <ul style={{ paddingInlineStart: 16, margin: 0 }}>
                            {purchase.products.map((product, idx) => (
                                <li key={idx} style={{ color: themeColors.text.secondary }}>
                                    {product.productId?.productName} - {product.quantity} {product.unit?.name} {t('viewPurchasePage.labels.at')} ${product.price} {t('viewPurchasePage.labels.each')}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default ViewPurchasePage;