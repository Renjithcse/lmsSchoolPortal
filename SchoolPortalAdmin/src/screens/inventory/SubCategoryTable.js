import React, { useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import ConfirmationDialog from "../../components/Inputs/ConfirmationDialog";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import {
    useGetSubCategoriesQuery,
    useCreateSubCategoryMutation,
    useUpdateSubCategoryMutation,
    useDeleteSubCategoryMutation,
} from "../../Redux/features/Inventory/subCategorySlice";
import { useGetCategoriesQuery } from "../../Redux/features/Inventory/categorySlice";
import { useSnackbar } from "../../hooks/SnackBar";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from "@mui/material";
import { useForm } from "react-hook-form";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const SubCategoryTable = () => {
    const { themeColors } = useThemeContext();
    const { data: subCategories = [], isLoading, isError, error } = useGetSubCategoriesQuery();
    const { data: categories = [] } = useGetCategoriesQuery();
    const [createSubCategory] = useCreateSubCategoryMutation();
    const [updateSubCategory] = useUpdateSubCategoryMutation();
    const [deleteSubCategory] = useDeleteSubCategoryMutation();
    const ability = useAbility();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [newSubCategory, setNewSubCategory] = useState({ categoryId: "", name: "", description: "" });
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);
    const { control } = useForm();

    const handleAdd = () => {
        setNewSubCategory({ categoryId: "", name: "", description: "" });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (subCategory) => {
        setNewSubCategory({
            categoryId: subCategory?.categoryId?._id || subCategory?.categoryId || "",
            name: subCategory.name,
            description: subCategory.description,
        });
        setSelectedSubCategory(subCategory);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditMode) {
                await updateSubCategory({ id: selectedSubCategory._id, updatedSubCategory: { name: newSubCategory.name, description: newSubCategory.description, categoryId: newSubCategory.categoryId } }).unwrap();
                showSnackbar(t('subCategoryTable.messages.updateSuccess'), 'success');
            } else {
                await createSubCategory(newSubCategory).unwrap();
                showSnackbar(t('subCategoryTable.messages.createSuccess'), 'success');
            }
            setNewSubCategory({ categoryId: "", name: "", description: "" });
            setIsModalOpen(false);
        } catch (err) {
            showSnackbar(err?.data?.message ?? t('subCategoryTable.messages.saveFailed'), 'error');
            console.error(err);
        }
    };

    const handleCancel = () => {
        setNewSubCategory({ categoryId: "", name: "", description: "" });
        setIsModalOpen(false);
    };

    const handleDelete = (subCategory) => {
        setSubCategoryToDelete(subCategory);
        setIsConfirmationOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteSubCategory(subCategoryToDelete._id).unwrap();
            showSnackbar(t('subCategoryTable.messages.deleteSuccess'), 'success');
            setIsConfirmationOpen(false);
            setSubCategoryToDelete(null);
        } catch (err) {
            showSnackbar(err?.data?.message ?? t('subCategoryTable.messages.deleteFailed'), 'error');
            console.error(err);
        }
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('subCategoryTable.title')}</Typography>
                    {ability.can('Create', 'InventorySubCategory') && (
                        <Button variant="contained" onClick={handleAdd} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('subCategoryTable.actions.addSubCategory')}</Button>
                    )}
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        {isLoading ? (
                            <Typography sx={{ color: themeColors.text.secondary }}>{t('subCategoryTable.messages.loading')}</Typography>
                        ) : isError ? (
                            <Typography sx={{ color: themeColors.error }}>{error?.data?.message || t('subCategoryTable.messages.loadFailed')}</Typography>
                        ) : (
                            <Table sx={{ '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('subCategoryTable.table.sn')}</TableCell>
                                        <TableCell>{t('subCategoryTable.table.category')}</TableCell>
                                        <TableCell>{t('subCategoryTable.table.name')}</TableCell>
                                        <TableCell>{t('subCategoryTable.table.description')}</TableCell>
                                        <TableCell>{t('subCategoryTable.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(subCategories?.data || []).map((subCategory, index) => (
                                        <TableRow key={subCategory._id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{subCategory?.categoryId?.name || t('subCategoryTable.table.na')}</TableCell>
                                            <TableCell>{subCategory.name}</TableCell>
                                            <TableCell>{subCategory.description}</TableCell>
                                            <TableCell>
                                                {ability.can('Edit', 'InventorySubCategory') && <Tooltip title={t('subCategoryTable.actions.edit')}><IconButton onClick={() => handleEdit(subCategory)} sx={{ color: themeColors.accent }}><EditIcon /></IconButton></Tooltip>}
                                                {ability.can('Delete', 'InventorySubCategory') && <Tooltip title={t('subCategoryTable.actions.delete')}><IconButton onClick={() => handleDelete(subCategory)} sx={{ color: themeColors.error }}><DeleteIcon /></IconButton></Tooltip>}
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
                <DialogTitle sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{isEditMode ? t('subCategoryTable.dialog.editTitle') : t('subCategoryTable.dialog.addTitle')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1.5 }}>
                        <CustomSelect fieldName="category_select" control={control} fieldLabel={t('subCategoryTable.labels.category')} onChangeValue={(val) => setNewSubCategory({ ...newSubCategory, categoryId: val })}>
                            <MenuItem value="">{t('subCategoryTable.placeholders.selectCategory')}</MenuItem>
                            {(categories?.data || []).map((category) => (
                                <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>
                            ))}
                        </CustomSelect>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <CustomInput fieldName="subcategory_name" control={control} fieldLabel={t('subCategoryTable.labels.name')} cust_value={newSubCategory.name} changeValue={(v) => setNewSubCategory({ ...newSubCategory, name: v })} />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <CustomInput fieldName="subcategory_description" control={control} fieldLabel={t('subCategoryTable.labels.description')} cust_value={newSubCategory.description} changeValue={(v) => setNewSubCategory({ ...newSubCategory, description: v })} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} variant="outlined" sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('subCategoryTable.actions.cancel')}</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('subCategoryTable.actions.save')}</Button>
                </DialogActions>
            </Dialog>

            {isConfirmationOpen && (
                <ConfirmationDialog
                    isOpen={isConfirmationOpen}
                    onClose={() => setIsConfirmationOpen(false)}
                    title={t('subCategoryTable.delete.title')}
                    message={t('subCategoryTable.delete.message', { name: subCategoryToDelete?.name })}
                    onConfirm={confirmDelete}
                />
            )}
        </CustomOutletBox>
    );
};

export default SubCategoryTable;