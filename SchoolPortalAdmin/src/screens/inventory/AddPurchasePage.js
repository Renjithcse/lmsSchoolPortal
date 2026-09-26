import React, { useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useForm } from "react-hook-form";
import { useCreatePurchaseMutation } from "../../Redux/features/Inventory/purchaseSlice";
import { useGetProductsQuery } from "../../Redux/features/Inventory/productSlice";
import { useGetUnitsQuery } from "../../Redux/features/Inventory/unitSlice";
import { useGetStoresQuery } from "../../Redux/features/Inventory/storeSlice";
import { useSnackbar } from "../../hooks/SnackBar";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');

const AddPurchasePage = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        defaultValues: {
            store: "",
            purchaseCode: `PUR-${yyyy}${mm}${dd}-${today.getHours()}${today.getMinutes()}${today.getSeconds()}`,
            supplier: "",
            date: dayjs().format("YYYY-MM-DD"),
            totalAmount: "",
        },
    });

    const navigate = useNavigate();
    const ability = useAbility();

    const [selectedProducts, setSelectedProducts] = useState([]);
    const { data: products = {}, isLoading: isProductsLoading } = useGetProductsQuery();
    const { data: unitOptions = {}, isLoading: isUnitsLoading } = useGetUnitsQuery();
    const { data: storesData = {}, isLoading: isStoresLoading } = useGetStoresQuery();
    const [createPurchase, { isLoading }] = useCreatePurchaseMutation();
    const showSnackbar = useSnackbar();

    const addProductRow = () => {
        setSelectedProducts([
            ...selectedProducts,
            { productId: "", quantity: "", price: "", unit: "", unitPrice: "", sellingPrice: "" }
        ]);
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts[index][field] = value;

        // Auto-calculate unitPrice if quantity and price are present
        const quantity = Number(updatedProducts[index].quantity);
        const price = Number(updatedProducts[index].price);
        if (quantity > 0 && price > 0) {
            updatedProducts[index].unitPrice = (price / quantity).toFixed(2);
        } else {
            updatedProducts[index].unitPrice = "";
        }

        setSelectedProducts(updatedProducts);
    };

    const removeProductRow = (index) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts.splice(index, 1);
        setSelectedProducts(updatedProducts);
    };

    const onSubmit = async (data) => {
        // Calculate the sum of all products' (quantity * price)
        const productsTotal = selectedProducts.reduce(
            (sum, p) => sum + Number(p.price),
            0
        );

        if (Number(data.totalAmount) !== productsTotal) {
            showSnackbar(
                t('addPurchase.messages.amountMismatch', { totalAmount: data.totalAmount, productsTotal }),
                "error"
            );
            return;
        }
        try {
            const purchaseData = {
                ...data,
                store: data.store, // store is already the _id
                products: selectedProducts.map((p) => ({
                    productId: p.productId,
                    quantity: Number(p.quantity),
                    unit: p.unit,
                    price: Number(p.price),
                    unitPrice: Number(p.unitPrice),
                    sellingPrice: Number(p.sellingPrice),
                })),
                totalAmount: Number(data.totalAmount),
            };

            await createPurchase(purchaseData).unwrap();
            showSnackbar(t('addPurchase.messages.createSuccess'), "success");
            reset();
            setSelectedProducts([]);
            navigate(-1)
        } catch (error) {
            console.error("Failed to add purchase:", error);
            showSnackbar(t('addPurchase.messages.createFailed'), "error");
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                    <Typography variant="h4" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('addPurchase.title')}</Typography>
                </Box>

                <Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="store" control={control} fieldLabel={t('addPurchase.labels.store')} error={errors.store}>
                                    {isStoresLoading ? (
                                        <MenuItem value="" disabled>{t('addPurchase.loading')}</MenuItem>
                                    ) : (
                                        [<MenuItem key="empty-store" value=""></MenuItem>,
                                        ...(storesData?.data || []).map((store) => (
                                            <MenuItem key={store._id} value={store._id}>{store.storeName}</MenuItem>
                                        ))]
                                    )}
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="purchaseCode" control={control} fieldLabel={t('addPurchase.labels.purchaseCode')} placeholder={t('addPurchase.placeholders.purchaseCode')} error={errors.purchaseCode} readonly />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="supplier" control={control} fieldLabel={t('addPurchase.labels.supplier')} placeholder={t('addPurchase.placeholders.supplier')} error={errors.supplier} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="date" control={control} fieldLabel={t('addPurchase.labels.date')} type="date" error={errors.date} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="totalAmount" control={control} fieldLabel={t('addPurchase.labels.totalAmount')} type="number" placeholder={t('addPurchase.placeholders.totalAmount')} error={errors.totalAmount} />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, color: themeColors.text.primary }}>{t('addPurchase.labels.products')}</Typography>
                                {selectedProducts.map((product, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                                        <Grid item xs={12} md={2}>
                                            <CustomSelect fieldName={`product_${index}`} control={control} fieldLabel={t('addPurchase.labels.product')}>
                                                {isProductsLoading ? (
                                                    <MenuItem value="" disabled>{t('addPurchase.loading')}</MenuItem>
                                                ) : (
                                                    [<MenuItem key={`p-empty-${index}`} value=""></MenuItem>,
                                                    ...((products?.data || []).map((p) => (
                                                        <MenuItem key={p._id} value={p._id}>{p.productName}</MenuItem>
                                                    )))]
                                                )}
                                            </CustomSelect>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomSelect fieldName={`unit_${index}`} control={control} fieldLabel={t('addPurchase.labels.unit')}>
                                                {isUnitsLoading ? (
                                                    <MenuItem value="" disabled>{t('addPurchase.loading')}</MenuItem>
                                                ) : (
                                                    [<MenuItem key={`u-empty-${index}`} value=""></MenuItem>,
                                                    ...((unitOptions?.data || []).map((u) => (
                                                        <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                                                    )))]
                                                )}
                                            </CustomSelect>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`quantity_${index}`} control={control} fieldLabel={t('addPurchase.labels.quantity')} type="number" cust_value={product.quantity} changeValue={(v) => handleProductChange(index, 'quantity', v)} />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`price_${index}`} control={control} fieldLabel={t('addPurchase.labels.totalPrice')} type="number" cust_value={product.price} changeValue={(v) => handleProductChange(index, 'price', v)} />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`unitPrice_${index}`} control={control} fieldLabel={t('addPurchase.labels.unitPrice')} type="number" readonly cust_value={product.unitPrice} />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`sellingPrice_${index}`} control={control} fieldLabel={t('addPurchase.labels.sellingPrice')} type="number" cust_value={product.sellingPrice} changeValue={(v) => handleProductChange(index, 'sellingPrice', v)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button type="button" onClick={() => removeProductRow(index)} variant="outlined" sx={{ borderColor: themeColors.error, color: themeColors.error, '&:hover': { borderColor: themeColors.error, backgroundColor: themeColors.error + '1A' } }}>
                                                {t('addPurchase.actions.remove')}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button type="button" onClick={addProductRow} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>
                                    {t('addPurchase.actions.addProduct')}
                                </Button>
                            </Grid>

                            <Grid item xs={12}>
                                {ability.can('Create', 'InventoryPurchase') && (
                                <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>
                                        {isLoading ? t('addPurchase.actions.adding') : t('addPurchase.actions.addPurchase')}
                                    </Button>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default AddPurchasePage;