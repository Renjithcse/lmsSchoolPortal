import React, { useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useNavigate } from "react-router-dom";
import { useGetSalesQuery, useDeleteSaleMutation } from "../../Redux/features/Inventory/saleSlice";
import { useGetStoresQuery } from "../../Redux/features/Inventory/storeSlice";
import ConfirmationDialog from "../../components/Inputs/ConfirmationDialog";
import { Box, Card, CardContent, Typography, Grid, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip, Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useForm } from "react-hook-form";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../../hooks/SnackBar';

const SalesPage = () => {
    const { control, watch } = useForm({
        defaultValues: {
            searchTerm: "",
            store: "",
        },
    });
    const searchTerm = watch("searchTerm") || "";
    const selectedStore = watch("store") || "";
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();
    const ability = useAbility();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    // Fetch sales and stores from API
    const { data: salesData, isLoading, isError } = useGetSalesQuery();
    const { data: storesData } = useGetStoresQuery();
    const [deleteSale] = useDeleteSaleMutation();

    // Prepare stores for filter dropdown
    const { themeColors } = useThemeContext();
    const stores = storesData?.data || [];

    // Filter sales
    const filteredSales = (salesData?.data || []).filter(
        (sale) =>
            sale.saleCode?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedStore === "" || (sale.store?._id === selectedStore))
    );

    const addSale = () => {
        navigate("/inventory/sales/add");
    };

    const handleDelete = async () => {
        if (deleteId) {
            const res = await deleteSale(deleteId);
            if (res?.error) {
                showSnackbar(res?.error?.data?.message ?? t('salesPage.messages.deleteFailed'), 'error');
            } else {
                showSnackbar(t('salesPage.messages.deleteSuccess'), 'success');
            }
            setDeleteId(null);
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('salesPage.title')}</Typography>
                    {ability.can('Create', 'InventorySales') && (
                        <Button onClick={addSale} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('salesPage.actions.addSale')}</Button>
                    )}
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="searchTerm" control={control} fieldLabel={t('salesPage.labels.searchByCode')} placeholder={t('salesPage.placeholders.enterCode')} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="store" control={control} fieldLabel={t('salesPage.labels.store')}>
                                    <MenuItem value="">{t('salesPage.filters.allStores')}</MenuItem>
                                    {stores.map((store) => (
                                        <MenuItem key={store._id} value={store._id}>{store.storeName}</MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                        </Grid>
                        {isLoading ? (
                            <Typography align="center" sx={{ color: themeColors.text.secondary }}>{t('salesPage.messages.loading')}</Typography>
                        ) : isError ? (
                            <Typography align="center" sx={{ color: themeColors.error }}>{t('salesPage.messages.loadFailed')}</Typography>
                        ) : (
                            <Table sx={{ '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('salesPage.table.store')}</TableCell>
                                        <TableCell>{t('salesPage.table.salesCode')}</TableCell>
                                        <TableCell>{t('salesPage.table.userRole')}</TableCell>
                                        <TableCell>{t('salesPage.table.userName')}</TableCell>
                                        <TableCell>{t('salesPage.table.date')}</TableCell>
                                        <TableCell>{t('salesPage.table.totalAmount')}</TableCell>
                                        <TableCell>{t('salesPage.table.products')}</TableCell>
                                        <TableCell>{t('salesPage.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredSales.map((sale) => (
                                        <TableRow key={sale._id}>
                                            <TableCell>{sale.store?.storeName}</TableCell>
                                            <TableCell>{sale.saleCode}</TableCell>
                                            <TableCell>{sale.userRole}</TableCell>
                                            <TableCell>{sale.user?.name}</TableCell>
                                            <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                                            <TableCell>${sale.totalAmount}</TableCell>
                                            <TableCell>
                                                <ul style={{ paddingInlineStart: 16, margin: 0 }}>
                                                    {(sale.products || []).map((product, idx) => (
                                                        <li key={idx} style={{ color: themeColors.text.secondary }}>
                                                            {product.productId?.productName} - {product.quantity} {product.unit?.name} {t('salesPage.table.at')} ${product.unitPrice} {t('salesPage.table.each')}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell>
                                                {ability.can('Read', 'InventorySales') && <Tooltip title={t('salesPage.actions.view')}><IconButton onClick={() => navigate(`/inventory/sales/view/${sale._id}`)} sx={{ color: themeColors.primary }}><VisibilityIcon /></IconButton></Tooltip>}
                                                {/* <Tooltip title="Delete"><IconButton onClick={() => setDeleteId(sale._id)} sx={{ color: themeColors.error }}><DeleteIcon /></IconButton></Tooltip> */}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!isLoading && !isError && filteredSales.length === 0 && (
                            <Typography align="center" sx={{ color: themeColors.text.secondary, mt: 2 }}>{t('salesPage.messages.noSales')}</Typography>
                        )}
                    </CardContent>
                </Card>
                <ConfirmationDialog
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    title={t('salesPage.delete.title')}
                    message={t('salesPage.delete.message')}
                />
            </Box>
        </CustomOutletBox>
    );
};

export default SalesPage;