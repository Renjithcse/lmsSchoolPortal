import React, { useMemo, useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useNavigate } from "react-router-dom";
import { useGetPurchasesQuery, useDeletePurchaseMutation } from "../../Redux/features/Inventory/purchaseSlice";
import ConfirmationDialog from "../../components/Inputs/ConfirmationDialog";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useForm } from "react-hook-form";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';
import { useSnackbar } from "../../hooks/SnackBar";

const PurchaseTableView = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
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
    // Fetch purchases from API
    const { data: purchasesData = [], isLoading, isError } = useGetPurchasesQuery();
    const [deletePurchase] = useDeletePurchaseMutation();

    // Extract unique stores for filter dropdown
    const stores = useMemo(() => {
        const names = new Set(
            (purchasesData?.data || []).map((p) => p.store?.storeName || p.store || "")
        );
        return Array.from(names).filter(Boolean);
    }, [purchasesData]);

    // Filter purchases
    const filteredPurchases = (purchasesData?.data || []).filter((purchase) => {
        const codeMatch = (purchase.purchaseCode || "").toLowerCase().includes(searchTerm.toLowerCase());
        const storeName = purchase.store?.storeName || purchase.store || "";
        const storeMatch = selectedStore === "" || storeName === selectedStore;
        return codeMatch && storeMatch;
    });

    const addPurchase = () => {
        navigate("/inventory/purchase/add");
    };

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await deletePurchase(deleteId).unwrap();
                showSnackbar(t('purchaseTable.messages.deleteSuccess'), 'success');
                setDeleteId(null);
            } catch (err) {
                showSnackbar(err?.data?.message || t('purchaseTable.messages.deleteFailed'), 'error');
            }
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('purchaseTable.title')}</Typography>
                    {ability.can('Create', 'InventoryPurchase') && (
                        <Button onClick={addPurchase} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('purchaseTable.actions.addPurchase')}</Button>
                    )}
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="searchTerm" control={control} fieldLabel={t('purchaseTable.labels.searchByCode')} placeholder={t('purchaseTable.placeholders.enterCode')} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="store" control={control} fieldLabel={t('purchaseTable.labels.store')}>
                                    <MenuItem value="">{t('purchaseTable.filters.allStores')}</MenuItem>
                                    {stores.map((name) => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                        </Grid>
                        {isLoading ? (
                            <Typography align="center" sx={{ color: themeColors.text.secondary }}>{t('purchaseTable.loading')}</Typography>
                        ) : isError ? (
                            <Typography align="center" sx={{ color: themeColors.error }}>{t('purchaseTable.messages.loadFailed')}</Typography>
                        ) : (
                            <Table sx={{
                                '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary },
                                '& td, & th': { borderColor: themeColors.border.primary },
                                '& td': { color: themeColors.text.primary }
                            }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('purchaseTable.table.store')}</TableCell>
                                        <TableCell>{t('purchaseTable.table.purchaseCode')}</TableCell>
                                        <TableCell>{t('purchaseTable.table.supplier')}</TableCell>
                                        <TableCell>{t('purchaseTable.table.date')}</TableCell>
                                        <TableCell>{t('purchaseTable.table.totalAmount')}</TableCell>
                                        <TableCell>{t('purchaseTable.table.products')}</TableCell>
                                        <TableCell>{t('purchaseTable.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPurchases.map((purchase) => (
                                        <TableRow key={purchase._id || purchase.id}>
                                            <TableCell>{purchase.store?.storeName || purchase.store}</TableCell>
                                            <TableCell>{purchase.purchaseCode}</TableCell>
                                            <TableCell>{purchase.supplier}</TableCell>
                                            <TableCell>{purchase.date ? new Date(purchase.date).toLocaleDateString() : ''}</TableCell>
                                            <TableCell>${purchase.totalAmount}</TableCell>
                                            <TableCell>
                                                <ul style={{ paddingInlineStart: 16, margin: 0 }}>
                                                    {(purchase.products || []).map((product, index) => (
                                                        <li key={index} style={{ color: themeColors.text.secondary }}>
                                                            {product.productId?.productName || product.name} - {product.quantity} {product.unit?.name || product.unit} {t('purchaseTable.table.at')} ${product.unitPrice} {t('purchaseTable.table.each')}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell>
                                                {ability.can('Read', 'InventoryPurchase') && <Tooltip title={t('purchaseTable.actions.view')}><IconButton onClick={() => navigate(`/inventory/purchase/view/${purchase._id || purchase.id}`)} sx={{ color: themeColors.primary }}><VisibilityIcon /></IconButton></Tooltip>}
                                                {ability.can('Edit', 'InventoryPurchase') && <Tooltip title={t('purchaseTable.actions.edit')}><IconButton onClick={() => navigate(`/inventory/purchase/edit/${purchase._id || purchase.id}`)} sx={{ color: themeColors.accent }}><EditIcon /></IconButton></Tooltip>}
                                                {ability.can('Delete', 'InventoryPurchase') && <Tooltip title={t('purchaseTable.actions.delete')}><IconButton onClick={() => setDeleteId(purchase._id || purchase.id)} sx={{ color: themeColors.error }}><DeleteIcon /></IconButton></Tooltip>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!isLoading && !isError && filteredPurchases.length === 0 && (
                            <Typography align="center" sx={{ color: themeColors.text.secondary, mt: 2 }}>{t('purchaseTable.messages.noPurchases')}</Typography>
                        )}
                    </CardContent>
                </Card>
                <ConfirmationDialog
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    title={t('purchaseTable.delete.title')}
                    message={t('purchaseTable.delete.message')}
                />
            </Box>
        </CustomOutletBox>
    );
};

export default PurchaseTableView;