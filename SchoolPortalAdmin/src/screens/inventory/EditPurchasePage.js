import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useGetPurchaseByIdQuery, useUpdatePurchaseMutation } from "../../Redux/features/Inventory/purchaseSlice";
import { useGetProductsQuery } from "../../Redux/features/Inventory/productSlice";
import { useGetUnitsQuery } from "../../Redux/features/Inventory/unitSlice";
import { useGetStoresQuery } from "../../Redux/features/Inventory/storeSlice";
import { useSnackbar } from "../../hooks/SnackBar";
import { Box, Card, CardContent, Typography, Grid, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const EditPurchasePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data, isLoading, isError } = useGetPurchaseByIdQuery(id);
    const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchaseMutation();
    const { data: products = {} } = useGetProductsQuery();
    const { data: unitOptions = {} } = useGetUnitsQuery();
    const { data: storesData = {} } = useGetStoresQuery();
    const showSnackbar = useSnackbar();
    const ability = useAbility();

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm();
    const { themeColors } = useThemeContext();
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => {
        if (data?.data) {
            const purchase = data.data;
            setValue("store", purchase.store?._id || purchase.store);
            setValue("purchaseCode", purchase.purchaseCode);
            setValue("supplier", purchase.supplier);
            setValue("date", purchase.date?.slice(0, 10));
            setValue("totalAmount", purchase.totalAmount);
            setSelectedProducts(
                purchase.products.map((p) => ({
                    productId: p.productId?._id || p.productId,
                    quantity: p.quantity,
                    unit: p.unit?._id || p.unit,
                    price: p.price,
                }))
            );
        }
    }, [data, setValue]);

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts[index][field] = value;
        setSelectedProducts(updatedProducts);
    };

    const addProductRow = () => {
        setSelectedProducts([...selectedProducts, { productId: "", quantity: "", price: "", unit: "" }]);
    };

    const removeProductRow = (index) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts.splice(index, 1);
        setSelectedProducts(updatedProducts);
    };

    const onSubmit = async (formData) => {
        // Validate total amount
        const productsTotal = selectedProducts.reduce(
            (sum, p) => sum + Number(p.price),
            0
        );
        if (Number(formData.totalAmount) !== productsTotal) {
            showSnackbar(
                t('editPurchase.messages.amountMismatch', { totalAmount: formData.totalAmount, productsTotal }),
                "error"
            );
            return;
        }
        try {
            await updatePurchase({
                id,
                updatedPurchase: {
                    ...formData,
                    store: formData.store,
                    products: selectedProducts.map((p) => ({
                        productId: p.productId,
                        quantity: Number(p.quantity),
                        unit: p.unit,
                        price: Number(p.price),
                        unitPrice: Number(p.price) / Number(p.quantity),
                    })),
                    totalAmount: Number(formData.totalAmount),
                },
            }).unwrap();
            showSnackbar(t('editPurchase.messages.updateSuccess'), "success");
            navigate(-1);
        } catch (error) {
            showSnackbar(t('editPurchase.messages.updateFailed'), "error");
        }
    };

    if (isLoading) return <CustomOutletBox><div className="p-6">{t('editPurchase.loading')}</div></CustomOutletBox>;
    if (isError || !data?.data) return <CustomOutletBox><div className="p-6 text-red-600">{t('editPurchase.messages.loadFailed')}</div></CustomOutletBox>;

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('editPurchase.title')}</Typography>
                    <Button onClick={() => navigate(-1)} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('editPurchase.actions.back')}</Button>
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Grid container spacing={3} component="form" onSubmit={handleSubmit(onSubmit)}>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="store" control={control} fieldLabel={t('editPurchase.labels.store')} error={errors.store}>
                                    {(storesData?.data || []).map((store) => (
                                        <MenuItem key={store._id} value={store._id}>{store.storeName}</MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="purchaseCode" control={control} fieldLabel={t('editPurchase.labels.purchaseCode')} readonly error={errors.purchaseCode} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="supplier" control={control} fieldLabel={t('editPurchase.labels.supplier')} error={errors.supplier} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="date" control={control} fieldLabel={t('editPurchase.labels.date')} type="date" error={errors.date} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput fieldName="totalAmount" control={control} fieldLabel={t('editPurchase.labels.totalAmount')} type="number" error={errors.totalAmount} />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 1 }}>{t('editPurchase.labels.products')}</Typography>
                            {selectedProducts.map((product, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                                        <Grid item xs={12} md={3}>
                                            <CustomSelect fieldName={`product_${index}`} control={control} fieldLabel={t('editPurchase.labels.product')}>
                                                <MenuItem value="">{t('editPurchase.placeholders.selectProduct')}</MenuItem>
                                                {(products?.data || []).map((p) => (
                                                    <MenuItem key={p._id} value={p._id}>{p.productName}</MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`quantity_${index}`} control={control} fieldLabel={t('editPurchase.labels.quantity')} type="number" cust_value={product.quantity} changeValue={(v) => handleProductChange(index, 'quantity', v)} />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <CustomSelect fieldName={`unit_${index}`} control={control} fieldLabel={t('editPurchase.labels.unit')}>
                                                <MenuItem value="">{t('editPurchase.placeholders.selectUnit')}</MenuItem>
                                                {(unitOptions?.data || []).map((u) => (
                                                    <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`price_${index}`} control={control} fieldLabel={t('editPurchase.labels.price')} type="number" cust_value={product.price} changeValue={(v) => handleProductChange(index, 'price', v)} />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <Button type="button" onClick={() => removeProductRow(index)} variant="outlined" sx={{ borderColor: themeColors.error, color: themeColors.error }}>{t('editPurchase.actions.remove')}</Button>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button type="button" onClick={addProductRow} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('editPurchase.actions.addProduct')}</Button>
                            </Grid>
                            <Grid item xs={12}>
                                {ability.can('Edit', 'InventoryPurchase') && (
                                    <Button type="submit" variant="contained" fullWidth disabled={isUpdating} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{isUpdating ? t('editPurchase.actions.updating') : t('editPurchase.actions.updatePurchase')}</Button>
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default EditPurchasePage;