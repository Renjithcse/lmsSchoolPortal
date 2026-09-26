import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetSaleByIdQuery } from "../../Redux/features/Inventory/saleSlice";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { Box, Card, CardContent, Typography, Grid, Button } from "@mui/material";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from 'react-i18next';

const ViewSalesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useGetSaleByIdQuery(id);

    const sale = data?.data;
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('viewSalesPage.title')}</Typography>
                    <Button onClick={() => navigate(-1)} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('viewSalesPage.actions.back')}</Button>
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        {isLoading ? (
                            <Typography align="center" sx={{ color: themeColors.text.secondary }}>{t('viewSalesPage.messages.loading')}</Typography>
                        ) : isError ? (
                            <Typography align="center" sx={{ color: themeColors.error }}>{t('viewSalesPage.messages.loadFailed')}</Typography>
                        ) : !sale ? (
                            <Typography align="center" sx={{ color: themeColors.text.secondary }}>{t('viewSalesPage.messages.noSale')}</Typography>
                        ) : (
                            <>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewSalesPage.labels.saleCode')}:</b> {sale.saleCode}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewSalesPage.labels.store')}:</b> {sale.store?.storeName}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewSalesPage.labels.userRole')}:</b> {sale.userRole}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewSalesPage.labels.user')}:</b> {sale.user?.name}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewSalesPage.labels.date')}:</b> {sale.date ? new Date(sale.date).toLocaleDateString() : ""}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography sx={{ color: themeColors.text.secondary }}><b>{t('viewSalesPage.labels.totalAmount')}:</b> ${sale.totalAmount}</Typography></Grid>
                                </Grid>
                                <Typography variant="h6" sx={{ color: themeColors.text.primary, mt: 3, mb: 1 }}>{t('viewSalesPage.labels.products')}</Typography>
                                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { border: `1px solid ${themeColors.border.primary}`, p: 1, color: themeColors.text.primary }, '& th': { backgroundColor: themeColors.background.secondary } }}>
                                    <Box component="thead">
                                        <Box component="tr">
                                            <Box component="th">{t('viewSalesPage.table.product')}</Box>
                                            <Box component="th">{t('viewSalesPage.table.batch')}</Box>
                                            <Box component="th">{t('viewSalesPage.table.unit')}</Box>
                                            <Box component="th">{t('viewSalesPage.table.quantity')}</Box>
                                            <Box component="th">{t('viewSalesPage.table.sellingPrice')}</Box>
                                            <Box component="th">{t('viewSalesPage.table.totalPrice')}</Box>
                                        </Box>
                                    </Box>
                                    <Box component="tbody">
                                        {sale.products?.map((p, idx) => (
                                            <Box component="tr" key={idx}>
                                                <Box component="td">{p.productId?.productName || p.name}</Box>
                                                <Box component="td">{p.batchCode}</Box>
                                                <Box component="td">{p.unit?.name || p.unitName}</Box>
                                                <Box component="td">{p.quantity}</Box>
                                                <Box component="td">${p.unitPrice}</Box>
                                                <Box component="td">${p.price}</Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default ViewSalesPage;