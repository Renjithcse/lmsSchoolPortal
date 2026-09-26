import React, { useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import ConfirmationDialog from "../../components/Inputs/ConfirmationDialog";
import { useGetUnitsQuery, useCreateUnitMutation, useDeleteUnitMutation } from "../../Redux/features/Inventory/unitSlice";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { Box, Card, CardContent, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm } from "react-hook-form";
import CustomInput from "../../components/Common/CustomInput";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../../hooks/SnackBar';

const UnitPage = () => {
    const { themeColors } = useThemeContext();
    const { control } = useForm();
    const { data: units = [], isLoading, isError, error } = useGetUnitsQuery();
    const [createUnit] = useCreateUnitMutation();
    const [deleteUnit] = useDeleteUnitMutation();
    const ability = useAbility();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [newUnit, setNewUnit] = useState({ name: "" });
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState(null);

    const handleAdd = () => {
        setNewUnit({ name: "" });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (unit) => {
        setNewUnit({ name: unit.name });
        setSelectedUnit(unit);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            await createUnit(newUnit).unwrap();
            showSnackbar(t('unitPage.messages.createSuccess'), 'success');
            setNewUnit({ name: "" });
            setIsModalOpen(false);
        } catch (err) {
            showSnackbar(err?.data?.message ?? t('unitPage.messages.createFailed'), 'error');
            console.error(err);
        }
    };

    const handleCancel = () => {
        setNewUnit({ name: "" });
        setIsModalOpen(false);
    };

    const handleDelete = (unit) => {
        setUnitToDelete(unit);
        setIsConfirmationOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteUnit(unitToDelete._id).unwrap();
            showSnackbar(t('unitPage.messages.deleteSuccess'), 'success');
            setIsConfirmationOpen(false);
            setUnitToDelete(null);
        } catch (err) {
            showSnackbar(err?.data?.message ?? t('unitPage.messages.deleteFailed'), 'error');
            console.error(err);
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('unitPage.title')}</Typography>
                    {ability.can('Create', 'InventoryUnit') && (
                        <Button variant="contained" onClick={handleAdd} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('unitPage.actions.addUnit')}</Button>
                    )}
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        {isLoading ? (
                            <Typography sx={{ color: themeColors.text.secondary }}>{t('unitPage.messages.loading')}</Typography>
                        ) : isError ? (
                            <Typography sx={{ color: themeColors.error }}>{error?.data?.message || t('unitPage.messages.loadFailed')}</Typography>
                        ) : (
                            <Table sx={{ '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('unitPage.table.sn')}</TableCell>
                                        <TableCell>{t('unitPage.table.name')}</TableCell>
                                        <TableCell>{t('unitPage.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(units?.data || []).map((unit, index) => (
                                        <TableRow key={unit._id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{unit.name}</TableCell>
                                            <TableCell>
                                                {ability.can('Delete', 'InventoryUnit') && <Tooltip title={t('unitPage.actions.delete')}><IconButton onClick={() => handleDelete(unit)} sx={{ color: themeColors.error }}><DeleteIcon /></IconButton></Tooltip>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={isModalOpen} onClose={handleCancel} fullWidth maxWidth="sm" PaperProps={{ sx: { backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` } }}>
                <DialogTitle sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{isEditMode ? t('unitPage.dialog.editTitle') : t('unitPage.dialog.addTitle')}</DialogTitle>
                <DialogContent>
                    <CustomInput fieldName="unit_name" control={control} fieldLabel={t('unitPage.labels.name')} cust_value={newUnit.name} changeValue={(v) => setNewUnit({ ...newUnit, name: v })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('unitPage.actions.cancel')}</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('unitPage.actions.save')}</Button>
                </DialogActions>
            </Dialog>

            {isConfirmationOpen && (
                <ConfirmationDialog
                    isOpen={isConfirmationOpen}
                    onClose={() => setIsConfirmationOpen(false)}
                    title={t('unitPage.delete.title')}
                    message={t('unitPage.delete.message', { name: unitToDelete?.name })}
                    onConfirm={confirmDelete}
                />
            )}
        </CustomOutletBox>
    );
};

export default UnitPage;