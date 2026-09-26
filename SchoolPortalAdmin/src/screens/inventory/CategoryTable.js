import React, { useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import ConfirmationDialog from "../../components/Inputs/ConfirmationDialog";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation, useGetCategoriesQuery } from "../../Redux/features/Inventory/categorySlice";
import { Box, Card, CardContent, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from "@mui/material";
import { useForm } from "react-hook-form";
import CustomInput from "../../components/Common/CustomInput";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';
import { useSnackbar } from "../../hooks/SnackBar";

const CategoryTable = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    const { data: categories = [], isLoading, isError, error } = useGetCategoriesQuery();
    const [addCategory] = useCreateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();
    const [updateCategory] = useUpdateCategoryMutation();
    const ability = useAbility();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: "", description: "" });
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const { control } = useForm();

    const handleAdd = () => {
        setNewCategory({ name: "", description: "" });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setNewCategory({ name: category.name, description: category.description });
        setSelectedCategory(category);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditMode) {
                await updateCategory({ id: selectedCategory._id, updatedCategory: { ...newCategory }  }).unwrap();
                showSnackbar(t('categoryTable.messages.updateSuccess'), 'success');
            } else {
                await addCategory(newCategory).unwrap();
                showSnackbar(t('categoryTable.messages.createSuccess'), 'success');
            }
            setNewCategory({ name: "", description: "" });
            setIsModalOpen(false);
        } catch (err) {
            showSnackbar(t('categoryTable.messages.saveFailed'), 'error');
            console.error(err);
        }
    };

    const handleCancel = () => {
        setNewCategory({ name: "", description: "" });
        setIsModalOpen(false);
    };

    const handleDelete = (category) => {
        setCategoryToDelete(category);
        setIsConfirmationOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteCategory(categoryToDelete._id).unwrap();
            showSnackbar(t('categoryTable.messages.deleteSuccess'), 'success');
            setIsConfirmationOpen(false);
            setCategoryToDelete(null);
        } catch (err) {
            showSnackbar(t('categoryTable.messages.deleteFailed'), 'error');
            console.error(err);
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('categoryTable.title')}</Typography>
                    {ability.can('Create', 'InventoryCategory') && (
                        <Button variant="contained" onClick={handleAdd} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('categoryTable.actions.addCategory')}</Button>
                    )}
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        {isLoading ? (
                            <Typography sx={{ color: themeColors.text.secondary }}>{t('categoryTable.loading')}</Typography>
                        ) : isError ? (
                            <Typography sx={{ color: themeColors.error }}>{t('categoryTable.error', { error: error?.data?.message || t('categoryTable.messages.loadFailed') })}</Typography>
                        ) : (
                            <Table sx={{ '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('categoryTable.table.sno')}</TableCell>
                                        <TableCell>{t('categoryTable.table.name')}</TableCell>
                                        <TableCell>{t('categoryTable.table.description')}</TableCell>
                                        <TableCell>{t('categoryTable.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(categories?.data || []).map((category, index) => (
                                        <TableRow key={category._id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{category.name}</TableCell>
                                            <TableCell>{category.description}</TableCell>
                                            <TableCell>
                                                {ability.can("Edit", "InventoryCategory") && <Tooltip title={t('categoryTable.actions.edit')}><IconButton onClick={() => handleEdit(category)} sx={{ color: themeColors.accent }}><EditIcon /></IconButton></Tooltip>}
                                                {ability.can("Delete", "InventoryCategory") && <Tooltip title={t('categoryTable.actions.delete')}><IconButton onClick={() => handleDelete(category)} sx={{ color: themeColors.error }}><DeleteIcon /></IconButton></Tooltip>}
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
                <DialogTitle sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{isEditMode ? t('categoryTable.dialog.editTitle') : t('categoryTable.dialog.addTitle')}</DialogTitle>
                <DialogContent>
                    <CustomInput fieldName="category_name" control={control} fieldLabel={t('categoryTable.labels.name')} cust_value={newCategory.name} changeValue={(v) => setNewCategory({ ...newCategory, name: v })} />
                    <Box sx={{ mt: 2 }}>
                        <CustomInput fieldName="category_description" control={control} fieldLabel={t('categoryTable.labels.description')} cust_value={newCategory.description} changeValue={(v) => setNewCategory({ ...newCategory, description: v })} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('categoryTable.actions.cancel')}</Button>
                    {ability.can('Create', 'InventoryCategory') && (
                        <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('categoryTable.actions.save')}</Button>
                    )}
                </DialogActions>
            </Dialog>

            {isConfirmationOpen && (
                <ConfirmationDialog
                    isOpen={isConfirmationOpen}
                    onClose={() => setIsConfirmationOpen(false)}
                    title={t('categoryTable.delete.title')}
                    message={t('categoryTable.delete.message', { name: categoryToDelete?.name })}
                    onConfirm={confirmDelete}
                />
            )}
        </CustomOutletBox>
    );
};

export default CategoryTable;