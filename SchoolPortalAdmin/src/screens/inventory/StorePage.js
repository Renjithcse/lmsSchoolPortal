import React, { useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useGetStoresQuery, useCreateStoreMutation, useDeleteStoreMutation, useUpdateStoreMutation } from '../../Redux/features/Inventory/storeSlice';
import { Box, Card, CardContent, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import CustomInput from '../../components/Common/CustomInput';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../../hooks/SnackBar';

const StorePage = () => {
    const { data: storesData = [], isLoading } = useGetStoresQuery();
    const [createStore] = useCreateStoreMutation();
    const [deleteStore] = useDeleteStoreMutation();
    const [updateStore] = useUpdateStoreMutation();
    const ability = useAbility();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStore, setNewStore] = useState({ storeName: '', location: '' });
    const [editModalOpen, setEditModalOpen] = useState(false);
const [editStore, setEditStore] = useState({ _id: '', storeName: '', location: '' });

    const handleAdd = () => {
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!newStore.storeName.trim() || !newStore.location.trim()) {
            showSnackbar(t('storePage.messages.fillAllFields'), 'error');
            return;
        }
        const res = await createStore(newStore);
        if (res?.error) {
            showSnackbar(res?.error?.data?.message ?? t('storePage.messages.createFailed'), 'error');
        } else {
            showSnackbar(t('storePage.messages.createSuccess'), 'success');
            setNewStore({ storeName: '', location: '' });
            setIsModalOpen(false);
        }
    };

    const handleCancel = () => {
        setNewStore({ storeName: '', location: '' });
        setIsModalOpen(false);
    };

    const handleEdit = (id) => {
        const store = storesData?.data?.find((s) => s._id === id);
        if (store) {
            setEditStore({ _id: store._id, storeName: store.storeName, location: store.location });
            setEditModalOpen(true);
        }
    };
    
    const handleEditSave = async () => {
        if (!editStore.storeName.trim() || !editStore.location.trim()) {
            showSnackbar(t('storePage.messages.fillAllFields'), 'error');
            return;
        }
        const res = await updateStore({ id: editStore._id, updatedStore: { storeName: editStore.storeName, location: editStore.location } });
        if (res?.error) {
            showSnackbar(res?.error?.data?.message ?? t('storePage.messages.updateFailed'), 'error');
        } else {
            showSnackbar(t('storePage.messages.updateSuccess'), 'success');
            setEditModalOpen(false);
            setEditStore({ _id: '', storeName: '', location: '' });
        }
    };

    const handleDelete = async (id) => {
        const res = await deleteStore(id);
        if (res?.error) {
            showSnackbar(res?.error?.data?.message ?? t('storePage.messages.deleteFailed'), 'error');
        } else {
            showSnackbar(t('storePage.messages.deleteSuccess'), 'success');
        }
    };

    const stores = storesData?.data || [];

    const { themeColors } = useThemeContext();
    const { control } = useForm();
    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('storePage.title')}</Typography>
                    {ability.can('Create', 'InventoryStore') && (
                        <Button variant="contained" onClick={handleAdd} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('storePage.actions.addStore')}</Button>
                    )}
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Table sx={{ '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('storePage.table.sn')}</TableCell>
                                    <TableCell>{t('storePage.table.storeName')}</TableCell>
                                    <TableCell>{t('storePage.table.location')}</TableCell>
                                    <TableCell>{t('storePage.table.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}>{t('storePage.messages.loading')}</TableCell></TableRow>
                                ) : stores.length === 0 ? (
                                    <TableRow><TableCell colSpan={4}>{t('storePage.messages.noStores')}</TableCell></TableRow>
                                ) : (
                                    stores.map((store, idx) => (
                                        <TableRow key={store._id}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{store.storeName}</TableCell>
                                            <TableCell>{store.location}</TableCell>
                                            <TableCell>
                                                {ability.can('Edit', 'InventoryStore') && <Tooltip title={t('storePage.actions.edit')}><IconButton onClick={() => handleEdit(store._id)} sx={{ color: themeColors.accent }}><EditIcon /></IconButton></Tooltip>}
                                                {ability.can('Delete', 'InventoryStore') && <Tooltip title={t('storePage.actions.delete')}><IconButton onClick={() => handleDelete(store._id)} sx={{ color: themeColors.error }}><DeleteIcon /></IconButton></Tooltip>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={isModalOpen} onClose={handleCancel} fullWidth maxWidth="sm" PaperProps={{ sx: { backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` } }}>
                <DialogTitle sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('storePage.dialog.addTitle')}</DialogTitle>
                <DialogContent>
                    <CustomInput fieldName="store_name" control={control} fieldLabel={t('storePage.labels.storeName')} cust_value={newStore.storeName} changeValue={(v) => setNewStore({ ...newStore, storeName: v })} />
                    <Box sx={{ mt: 2 }}>
                        <CustomInput fieldName="store_location" control={control} fieldLabel={t('storePage.labels.location')} cust_value={newStore.location} changeValue={(v) => setNewStore({ ...newStore, location: v })} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('storePage.actions.cancel')}</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('storePage.actions.save')}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` } }}>
                <DialogTitle sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('storePage.dialog.editTitle')}</DialogTitle>
                <DialogContent>
                    <CustomInput fieldName="edit_store_name" control={control} fieldLabel={t('storePage.labels.storeName')} cust_value={editStore.storeName} changeValue={(v) => setEditStore({ ...editStore, storeName: v })} />
                    <Box sx={{ mt: 2 }}>
                        <CustomInput fieldName="edit_store_location" control={control} fieldLabel={t('storePage.labels.location')} cust_value={editStore.location} changeValue={(v) => setEditStore({ ...editStore, location: v })} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModalOpen(false)} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('storePage.actions.cancel')}</Button>
                    <Button onClick={handleEditSave} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('storePage.actions.save')}</Button>
                </DialogActions>
            </Dialog>
        </CustomOutletBox>
    );
};

export default StorePage;