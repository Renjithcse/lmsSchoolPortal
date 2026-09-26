import React, { useState, useEffect } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useForm } from "react-hook-form";
import { useCreateSaleMutation, useLazyGetProductsByStoreQuery } from "../../Redux/features/Inventory/saleSlice";
import { useGetUnitsQuery } from "../../Redux/features/Inventory/unitSlice";
import { useGetStoresQuery } from "../../Redux/features/Inventory/storeSlice";
import { useSnackbar } from "../../hooks/SnackBar";
import { useNavigate } from "react-router-dom";
import { useGetUserByRoleQuery, useLazyGetUserByRoleQuery } from "../../Redux/features/auth/userSlice";
import { Box, Card, CardContent, Typography, Grid, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const AddSalesPage = () => {
    const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm({
        defaultValues: {
            userRole: "student",
            user: "",
            store: "",
        },
    });

    const ability = useAbility();
    const { t } = useTranslation();

    const navigate = useNavigate();
    const { themeColors } = useThemeContext();
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [createSale, { isLoading }] = useCreateSaleMutation();
    const [triggerProducts, { data: products = {}, isLoading: isProductsLoading }] = useLazyGetProductsByStoreQuery();
    const { data: storesData = {}, isLoading: isStoresLoading } = useGetStoresQuery();
    const [triggerUsers, { data: usersData = {}, isLoading: isUsersLoading }] = useLazyGetUserByRoleQuery();
    const showSnackbar = useSnackbar();

    // Watch store and userRole for dynamic data
    const storeId = watch("store");
    const userRole = watch("userRole");

    // Fetch products for selected store
    useEffect(() => {
        if (storeId) {
            triggerProducts(storeId);
            setSelectedProducts([]); // Clear products if store changes
        }
    }, [storeId, triggerProducts]);

    // Fetch products for selected store
    useEffect(() => {
        if (userRole) {
            triggerUsers(userRole);
            setSelectedProducts([]); // Clear products if store changes
        }
    }, [userRole, triggerProducts]);

    // Calculate total amount
    const productsTotal = selectedProducts.reduce(
        (sum, p) => sum + Number(p.price),
        0
    );

    const addProductRow = () => {
        setSelectedProducts([...selectedProducts, { batchCode: "", name: "", productId: "", purchasePrice: "", sellingPrice: "", stockId: "", unitId: '', unitName: '', remainingQuantity: "", quantity: "", price: "" }]);
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts[index][field] = value;

        if (field === "stockId") {

            // Find the selected product details from products.data
            const selectedProductData = products?.data?.find((p) => p.stockId === value);

            // Always update sellingPrice if product changes or if quantity changes and product is selected
            if (selectedProductData) {
                updatedProducts[index] = {
                    ...updatedProducts[index],
                    // Only copy the fields you need from the API object
                    productId: selectedProductData.productId,
                    stockId: selectedProductData.stockId,
                    name: selectedProductData.name,
                    unit: selectedProductData.unitId,
                    unitName: selectedProductData.unitName,
                    unitPrice: selectedProductData.sellingPrice,
                    purchasePrice: selectedProductData.purchasePrice,
                    batchCode: selectedProductData.batchCode,
                    remainingQuantity: selectedProductData.remainingQuantity,
                    // Keep quantity and price as-is or reset as needed
                };
            } else {
                updatedProducts[index].sellingPrice = "";
            }
        }

        // Calculate total price if both sellingPrice and quantity are present
        const qty = Number(field === "quantity" ? value : updatedProducts[index].quantity);
        const sp = updatedProducts[index].unitPrice || 0;
        updatedProducts[index].price = qty > 0 && sp > 0 ? (qty * sp).toFixed(2) : "";

        setSelectedProducts(updatedProducts);
    };

    const removeProductRow = (index) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts.splice(index, 1);
        setSelectedProducts(updatedProducts);
    };

    const onSubmit = async (data) => {
        if (!data.store) {
            showSnackbar(t('addSale.messages.storeRequired'), "error");
            return;
        }
        if (selectedProducts.length === 0) {
            showSnackbar(t('addSale.messages.productRequired'), "error");
            return;
        }
        // Validate all product fields
        for (const p of selectedProducts) {
            if (!p.productId || !p.quantity || !p.unit || !p.price) {
                showSnackbar(t('addSale.messages.fillAllFields'), "error");
                return;
            }
        }
        try {
            const saleData = {
                user: data.user,
                userRole: data.userRole,
                store: data.store,
                products: selectedProducts,
                totalAmount: productsTotal,
            };

            // console.log({saleData});
            // return false

            const saleRes = await createSale(saleData).unwrap();
            showSnackbar(t('addSale.messages.createSuccess'), "success");
            reset();
            setSelectedProducts([]);
            const popup = window.open(`/invoice/${saleRes?.data?._id}`, 'popup', 'width=800,height=600');
    if (popup) {
      popup.focus();
    }
            //navigate(`/inventory/sales/invoice/${saleRes?.data?._id}`)
        } catch (error) {
            console.error("Failed to add sale:", error);
            showSnackbar(error?.data?.message || t('addSale.messages.createFailed'), "error");
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Typography variant="h5" sx={{ mb: 3, color: themeColors.text.primary, fontWeight: 800 }}>{t('addSale.title')}</Typography>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Grid container spacing={3} component="form" onSubmit={handleSubmit(onSubmit)}>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="store" control={control} fieldLabel={t('addSale.labels.store')} error={errors.store}>
                                    {isStoresLoading ? (
                                        <MenuItem value="" disabled>{t('addSale.loading')}</MenuItem>
                                    ) : (
                                        (storesData?.data || []).map((store) => (
                                            <MenuItem key={store._id} value={store._id}>{store.storeName}</MenuItem>
                                        ))
                                    )}
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="userRole" control={control} fieldLabel={t('addSale.labels.userRole')} error={errors.userRole}>
                                    <MenuItem value="student">{t('addSale.userRoles.student')}</MenuItem>
                                    <MenuItem value="teacher">{t('addSale.userRoles.teacher')}</MenuItem>
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomSelect fieldName="user" control={control} fieldLabel={userRole ? t(`addSale.userRoles.${userRole}`) : t('addSale.labels.user')} error={errors.user}>
                                    {isUsersLoading ? (
                                        <MenuItem value="" disabled>{t('addSale.loading')}</MenuItem>
                                    ) : (
                                        [<MenuItem key="empty-user" value=""></MenuItem>,
                                        ...((usersData?.data || []).map((user) => (
                                            <MenuItem key={user._id} value={user._id}>{user.name} ({user.email})</MenuItem>
                                        )))]
                                    )}
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 1 }}>{t('addSale.labels.products')}</Typography>
                                {selectedProducts.map((product, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: themeColors.border.primary } }}>
                                                <InputLabel sx={{ color: themeColors.text.secondary }}>{t('addSale.labels.product')}</InputLabel>
                                                <Select value={product.stockId} onChange={(e) => handleProductChange(index, 'stockId', e.target.value)} sx={{ backgroundColor: themeColors.background.primary, color: themeColors.text.primary }}>
                                                    <MenuItem value="">{t('addSale.placeholders.selectProduct')}</MenuItem>
                                                    {isProductsLoading ? (
                                                        <MenuItem disabled>{t('addSale.loading')}</MenuItem>
                                                    ) : (
                                                        (products?.data || []).map((p) => (
                                                            <MenuItem key={p.stockId} value={p.stockId}>{p.name}</MenuItem>
                                                        ))
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <CustomInput fieldName={`quantity_${index}`} control={control} fieldLabel={t('addSale.labels.quantity')} type="number" cust_value={product.quantity} changeValue={(v) => handleProductChange(index, 'quantity', v)} />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <CustomInput fieldName={`unitPrice_${index}`} control={control} fieldLabel={t('addSale.labels.sellingPrice')} type="number" readonly cust_value={product.unitPrice || ''} />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <CustomInput fieldName={`total_${index}`} control={control} fieldLabel={t('addSale.labels.totalPrice')} type="number" readonly cust_value={product.price} />
                                        </Grid>
                                        <Grid item xs={12} md={1}>
                                            <Button type="button" onClick={() => removeProductRow(index)} variant="outlined" sx={{ borderColor: themeColors.error, color: themeColors.error }}>{t('addSale.actions.remove')}</Button>
                                        </Grid>
                                    </Grid>
                                ))}
                                {ability.can('Create', 'InventorySales') && (
                                    <Button type="button" onClick={addProductRow} variant="contained" disabled={!storeId} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('addSale.actions.addProduct')}</Button>
                                )}
                            </Grid>
                            {selectedProducts.length > 0 && (
                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <Typography sx={{ mr: 1, fontWeight: 700, color: themeColors.text.primary }}>{t('addSale.labels.totalAmount')}:</Typography>
                                    <Typography sx={{ color: themeColors.primary, fontWeight: 800 }}>${productsTotal}</Typography>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                {ability.can('Create', 'InventorySales') && (
                                <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{isLoading ? t('addSale.actions.adding') : t('addSale.actions.addSale')}</Button>
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default AddSalesPage;