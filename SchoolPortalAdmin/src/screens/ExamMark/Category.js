import React, { Fragment, useEffect, useState } from 'react'
import CustomOutletBox from '../../components/Common/CustomOutletBox'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from '@mui/material';
import CustomAddButton from '../../components/Common/CustomAddButton';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useConfirmCategoryMutation, useDeleteCategoryMutation, useGetCategoryQuery } from '../../Redux/features/MarkEntry';
import UiBlocker from '../../components/Common/UiBlocker';
import ConfirmationDialog from '../../components/Inputs/ConfirmationDialog';
import { useSnackbar } from '../../hooks/SnackBar';
import Button from '../../components/Inputs/Button';
import CustomLoader from '../../components/Common/CustomLoader';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTranslation } from 'react-i18next';

const Category = () => {
    const location = useLocation();
    const state = location.state;
    const showSnackbar = useSnackbar()
    const navigate = useNavigate()
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConfirm, setIsConfirm] = useState(false);
    const [id, setId] = useState(null);

    const handleOpenDialog = (id) => {
        setId(id);
        setIsDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setId(null);
    };

    const handleCloseConfirmDialog = (() => {
        setIsConfirm(false);
    })

    const handleConfirmation = () => {
        setIsConfirm(false);
    }

    const { data: categoryData, isLoading } = useGetCategoryQuery(state)

    console.log({categoryData})

    const [deleteCategory, { isLoading: isDeleteLoading }] = useDeleteCategoryMutation()
    const [triggerConfirmation, { isLoading: confirmLoading}] = useConfirmCategoryMutation()

    const handleConfirm = async () => {
        setIsDialogOpen(false);
        let deleted = await deleteCategory(id);
        if (deleted.error) {
            showSnackbar(deleted.error?.data?.message, 'error');
        }
        else {
            showSnackbar(t('category.messages.deleteSuccess'), 'success');
        }
    };

    useEffect(() => {
        if(categoryData?.data?.mode === "newMarkEntry"){
            navigate('/exammark/mark-entry', { state: {...location?.state,...categoryData?.data}})
        }
        else if(categoryData?.data?.mode === "updateMark"){
            navigate('/exammark/edit-mark', { state: {...location?.state,...categoryData?.data}})
        }
    }, [categoryData?.data?.mode])
    

    const openAdd = () => {
        navigate('new', { state: state })
    }

    const editCategory = (data) => {
        navigate('new', { state: { ...state, category: data } })
    }

    const confirmCategory = async () => {
        setIsConfirm(false);
        try {
            const response = await triggerConfirmation(location.state).unwrap();

            if (response?.status === 'warning') {
                showSnackbar(response?.message || t('category.messages.futureDateWarning'), 'warning');
                return;
            }

            showSnackbar(response?.message || t('category.messages.confirmSuccess'), 'success');

            const markEntryState = {
                ...location.state,
                ...(response?.data || categoryData?.data || {}),
            };

            navigate('/exammark/mark-entry', { state: markEntryState });
        } catch (err) {
            const message = err?.data?.message || err?.message || t('category.messages.confirmFailed');
            showSnackbar(message, 'error');
        }
    };


    if(!isLoading && categoryData?.data?.mode === "category"){
        return (
            <Box sx={{ p: 3 }}>
                {state && (
                    <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        sx={{ 
                            p: 2, 
                            mb: 2,
                            borderBottom: `2px solid ${themeColors.primary}`,
                            backgroundColor: themeColors.background.primary,
                            borderRadius: 1
                        }}
                    >
                        <Typography 
                            variant="h5" 
                            fontWeight="bold" 
                            sx={{ color: themeColors.primary }}
                        >
                            {t('category.title')}
                        </Typography>
                        <CustomAddButton ClickEvent={openAdd} label={t('category.actions.add')} justifyContent={'flex-end'} />
                    </Box>
                )}
                
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: 2,
                        boxShadow: 3
                    }}
                >
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: themeColors.primary }}>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        fontFamily: 'Raleway, sans-serif'
                                    }} 
                                    rowSpan={2}
                                >
                                    {t('category.table.categoryName')}
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        fontFamily: 'Raleway, sans-serif'
                                    }} 
                                    rowSpan={2}
                                >
                                    {t('category.table.mark')}
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        fontFamily: 'Raleway, sans-serif'
                                    }} 
                                    colSpan={2}
                                >
                                    {t('category.table.subCategory')}
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        fontFamily: 'Raleway, sans-serif'
                                    }} 
                                    rowSpan={2}
                                >
                                    {t('category.table.action')}
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: themeColors.primary }}>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        fontFamily: 'Raleway, sans-serif'
                                    }}
                                >
                                    {t('category.table.subCategoryName')}
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        fontFamily: 'Raleway, sans-serif'
                                    }}
                                >
                                    {t('category.table.mark')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categoryData?.data?.categories?.map((row, index) => (
                                <Fragment key={row?._id}>
                                    <TableRow 
                                        sx={{ 
                                            backgroundColor: themeColors.background.primary,
                                            '&:hover': {
                                                backgroundColor: themeColors.background.hover
                                            }
                                        }}
                                    >
                                        <TableCell 
                                            sx={{ 
                                                border: `1px solid ${themeColors.border.primary}`,
                                                color: themeColors.text.primary,
                                                fontFamily: 'Raleway, sans-serif',
                                                fontWeight: 500
                                            }} 
                                            rowSpan={row?.subCategory?.length}
                                        >
                                            {row.categoryName}
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                border: `1px solid ${themeColors.border.primary}`,
                                                color: themeColors.text.primary,
                                                fontFamily: 'Raleway, sans-serif',
                                                fontWeight: 500
                                            }} 
                                            rowSpan={row?.subCategory?.length}
                                        >
                                            {row.mark}
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                border: `1px solid ${themeColors.border.primary}`,
                                                color: themeColors.text.secondary,
                                                fontFamily: 'Raleway, sans-serif'
                                            }}
                                        >
                                            {row?.subCategory?.[0]?.name}
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                border: `1px solid ${themeColors.border.primary}`,
                                                color: themeColors.text.secondary,
                                                fontFamily: 'Raleway, sans-serif'
                                            }}
                                        >
                                            {row?.subCategory?.[0]?.mark}
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                border: `1px solid ${themeColors.border.primary}`,
                                                color: themeColors.text.primary
                                            }} 
                                            rowSpan={row?.subCategory?.length}
                                        >
                                            <Box display="flex" gap={1}>
                                                <Tooltip title={t('category.actions.edit')}>
                                                    <IconButton
                                                        onClick={() => editCategory(row)}
                                                        sx={{ 
                                                            color: themeColors.primary,
                                                            '&:hover': {
                                                                backgroundColor: `${themeColors.primary}20`
                                                            }
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('category.actions.delete')}>
                                                    <IconButton
                                                        onClick={() => handleOpenDialog(row?._id)}
                                                        sx={{ 
                                                            color: themeColors.error,
                                                            '&:hover': {
                                                                backgroundColor: `${themeColors.error}20`
                                                            }
                                                        }}
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    {row?.subCategory?.slice(1).map((subRow, subIndex) => (
                                        <TableRow 
                                            key={subRow?._id} 
                                            sx={{ 
                                                backgroundColor: themeColors.background.primary,
                                                '&:hover': {
                                                    backgroundColor: themeColors.background.hover
                                                }
                                            }}
                                        >
                                            <TableCell 
                                                sx={{ 
                                                    border: `1px solid ${themeColors.border.primary}`,
                                                    color: themeColors.text.secondary,
                                                    fontFamily: 'Raleway, sans-serif'
                                                }}
                                            >
                                                {subRow.name}
                                            </TableCell>
                                            <TableCell 
                                                sx={{ 
                                                    border: `1px solid ${themeColors.border.primary}`,
                                                    color: themeColors.text.secondary,
                                                    fontFamily: 'Raleway, sans-serif'
                                                }}
                                            >
                                                {subRow.mark}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
    
                {categoryData?.data?.categories?.length > 0 && (
                    <Box display="flex" justifyContent="center" p={3}>
                        <Button label={t('category.actions.confirm')} onClick={confirmCategory} backgroundColor={'red'} />
                    </Box>
                )}
                
                <UiBlocker open={isLoading || isDeleteLoading || confirmLoading} />
                <ConfirmationDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    onConfirm={handleConfirm}
                    message={t('category.delete.message')}
                    title={t('category.delete.title')}
                />
                <ConfirmationDialog
                    isOpen={isConfirm}
                    onClose={handleCloseConfirmDialog}
                    onConfirm={handleConfirmation}
                    message={t('category.confirm.message')}
                    title={t('category.confirm.title')}
                />
            </Box>
        )
    }
    else{
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
                <CustomLoader />
            </Box>
        )
    }
}

export default Category