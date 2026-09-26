import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetSaleByIdQuery } from "../../Redux/features/Inventory/saleSlice";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { Box, Card, CardContent, Typography, Grid, Button, Divider, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from 'react-i18next';

const InvoicePage = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const { data, isLoading, isError } = useGetSaleByIdQuery(id);
    const sale = data?.data;
    const printRef = useRef();
    const navigate = useNavigate();
    const { themeColors } = useThemeContext();

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return (
        <CustomOutletBox>
            <Box sx={{ p: 4 }}>
                <Typography align="center" sx={{ color: themeColors.text.secondary }}>{t('invoice.loading')}</Typography>
            </Box>
        </CustomOutletBox>
    );
    if (isError || !sale) return (
        <CustomOutletBox>
            <Box sx={{ p: 4 }}>
                <Typography align="center" sx={{ color: themeColors.error }}>{t('invoice.messages.loadFailed')}</Typography>
            </Box>
        </CustomOutletBox>
    );

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Card sx={{ maxWidth: 900, mx: 'auto', borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Box ref={printRef}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${themeColors.border.primary}` }}>
                                <Grid item>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('invoice.title')}</Typography>
                                    <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }}>{t('invoice.subtitle')}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.invoiceNo')}: <b>{sale.saleCode}</b></Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.date')}: <b>{sale.date ? new Date(sale.date).toLocaleDateString('en-SA') : ''}</b></Typography>
                                    </Box>
                                </Grid>
                                <Grid item textAlign="right">
                                    <Typography variant="subtitle1" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>{t('invoice.storeName')}</Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{sale.store?.storeName}</Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>{t('invoice.vatNo')}: <b>1234567890</b></Typography>
                                </Grid>
                            </Grid>

                            <Grid container justifyContent="space-between" sx={{ mb: 2 }}>
                                <Grid item>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.customer')}: <b>{sale.user?.studentName || sale?.user?.employeeName}</b></Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.role')}: <b>{sale.userRole}</b></Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.customerId')}: <b>{sale.user?._id}</b></Typography>
                                </Grid>
                            </Grid>

                            <Table size="small" sx={{ mb: 2, border: `1px solid ${themeColors.border.primary}`, '& th': { backgroundColor: themeColors.background.secondary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">{t('invoice.table.sno')}</TableCell>
                                        <TableCell>{t('invoice.table.product')}</TableCell>
                                        <TableCell align="center">{t('invoice.table.quantity')}</TableCell>
                                        <TableCell align="center">{t('invoice.table.unit')}</TableCell>
                                        <TableCell align="center">{t('invoice.table.unitPrice')}</TableCell>
                                        <TableCell align="center">{t('invoice.table.total')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sale.products?.map((p, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell align="center">{idx + 1}</TableCell>
                                            <TableCell>{p.productId?.productName || p.name}</TableCell>
                                            <TableCell align="center">{p.quantity}</TableCell>
                                            <TableCell align="center">{p.unit?.name || p.unitName}</TableCell>
                                            <TableCell align="center">{Number(p.unitPrice).toFixed(2)}</TableCell>
                                            <TableCell align="center">{Number(p.price).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Grid container justifyContent="flex-end" sx={{ mb: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <Grid container justifyContent="space-between">
                                        <Grid item>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.subtotal')}:</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="body2" sx={{ color: themeColors.text.primary }}>{Number(sale.totalAmount).toFixed(2)}</Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container justifyContent="space-between">
                                        <Grid item>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('invoice.vat')}:</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="body2" sx={{ color: themeColors.text.primary }}>{(Number(sale.totalAmount) * 0.15).toFixed(2)}</Typography>
                                        </Grid>
                                    </Grid>
                                    <Divider sx={{ my: 1, borderColor: themeColors.border.primary }} />
                                    <Grid container justifyContent="space-between">
                                        <Grid item>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>{t('invoice.totalWithVat')}:</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>{(Number(sale.totalAmount) * 1.15).toFixed(2)}</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>{t('invoice.thankYou')}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button onClick={handlePrint} variant="contained" sx={{ mr: 2, backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('invoice.actions.print')}</Button>
                            <Button onClick={() => navigate(-1)} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('invoice.actions.back')}</Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default InvoicePage;