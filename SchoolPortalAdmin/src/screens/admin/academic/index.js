
import React, { useCallback, useEffect, useState } from 'react'
import CustomOutletBox from '../../../components/Common/CustomOutletBox'
import CustomAddButton from '../../../components/Common/CustomAddButton'
import { useNavigate } from 'react-router-dom'
import useModal from '../../../hooks/modalHook'
import AcademicForm from '../../../components/admin/academic/AcademicForm'
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip } from '@mui/material'
import { ICONS } from '../../../assets/icons'
import DataTable from '../../../components/Common/CustomTable';
import { useQuery } from '@tanstack/react-query'
import { deleteAcademic, getAcademic } from '../../../api/academic'
import moment from 'moment/moment'
import CustomDelete from '../../../components/Common/CustomDelete'
import CustomBackDrop from '../../../components/Common/CustomBackDrop'
import ErrorInfo from '../../../components/Common/ErrorInfo'
import { useSnackbar } from '../../../hooks/SnackBar'
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext'
import { useAbility } from '../../../AbilityContext'
import { useTranslation } from 'react-i18next'
import { useIsAdmin } from '../../../hooks/useAuth'
import { useSelector } from 'react-redux'
const AcademicScreen = () => {

    const showSnackbar = useSnackbar()
    const { themeColors } = useThemeContext();
    const ability = useAbility();
    const { t } = useTranslation();
    const isAdmin = useSelector(state => state.auth.role) === 'admin';
    // console.log({isAdmin})
    const { modal, openModal, closeModal } = useModal();
    const { data, isError, isLoading, isFetched, refetch, error } = useQuery({ 
        queryKey: ['academicget'], 
        queryFn: getAcademic ,
        retry: (failureCount, error) => {
            // Stop retrying if the error status is 403
            console.log({failureCount, error: error?.response})
            if (error?.response?.status === 403) {
                showSnackbar(error?.response?.data?.message, 'error');
              return false;
            }
            // Retry for other errors up to 3 attempts
            return failureCount < 3;
        },
    });
    const [item, setItem] = useState(null);
    const [_id, set_id] = useState(null);


    
    



    const columns = [

        {
            field: 'SN',
            headerName: t('academic.table.columns.sn'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

        },
        {
            field: 'created',
            headerName: t('academic.table.columns.createdDate'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => moment(params?.row?.created_at).format("DD-MM-YYYY hh:mm A")
        },

        {
            field: 'academicYear',
            headerName: t('academic.table.columns.academic'),
            flex: 1,
            // valueGetter: (params) => (moment(params.row.expiry, "YYYY-MM-DD").format('DD/MM/YYYY')),
            headerAlign: 'center',
            align: 'center',
        },

        {
            field: 'terms',
            headerName: t('academic.table.columns.terms'),
            flex: 2,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            renderCell: ({ row }) => (
                <Box display="flex" flexWrap="wrap" gap={0.5} justifyContent="center" width="100%">
                    {(row?.terms || []).map((term, idx) => (
                        <Chip
                            key={idx}
                            label={term}
                            size="small"
                            sx={{
                                height: 22,
                                backgroundColor: `${themeColors.primary}22`,
                                color: themeColors.text.primary,
                                border: `1px solid ${themeColors.primary}`,
                                '& .MuiChip-label': { px: 0.75, fontSize: '0.75rem' }
                            }}
                        />
                    ))}
                </Box>
            )
        },


        {
            field: 'Action',
            headerName: t('academic.table.columns.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={ 'center' } gap={ 1 } direction={ 'row' }>
                    {ability.can("Read", "Academic") && <Tooltip title={ t('academic.actions.view') }>
                        <IconButton
                            size="small"
                            onClick={ (e) => { e.stopPropagation(); setItem(null); openView(row); } }
                            sx={{
                                color: themeColors.primary,
                                '&:hover': { backgroundColor: themeColors.primary, color: '#fff' }
                            }}
                        >
                            <ICONS.RemoveRedEyeIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {(ability.can("Edit", "Academic") || isAdmin) && <Tooltip title={ t('academic.actions.edit') }>
                        <IconButton
                            size="small"
                            onClick={ (e) => { e.stopPropagation(); setItem(null); openEdit(row); } }
                            sx={{
                                color: themeColors.accent,
                                '&:hover': { backgroundColor: themeColors.accent, color: '#fff' }
                            }}
                        >
                            <ICONS.BorderColorIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {(ability.can("Delete", "Academic") || isAdmin) && <Tooltip title={ t('academic.actions.delete') }>
                        <IconButton
                            size="small"
                            onClick={ (e) => { e.stopPropagation(); OpenDelete(row?._id); } }
                            sx={{
                                color: themeColors.error,
                                '&:hover': { backgroundColor: themeColors.error, color: '#fff' }
                            }}
                        >
                            <ICONS.DeleteForeverIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                </Stack>
            ),
        }
    ];




    const OpenDelete = useCallback((id) => {
        set_id(id);
        openModal('deleteModal');
    }, [modal]);

    const closeDelete = useCallback(() => {
        closeModal('deleteModal');
    }, [modal]);

    const openAdd = useCallback(() => {
        openModal('addModal');
    }, [modal]);

    const closeAdd = useCallback(() => {
        closeModal('addModal');
    }, [modal]);

    const openEdit = useCallback((item) => {
        setItem(item)
        openModal('editModal');
    }, [modal]);

    const closeEdit = useCallback(() => {

        closeModal('editModal');
    }, [modal,]);

    const openView = useCallback((item) => {
        setItem(item)
        openModal('viewModal');
    }, [modal]);

    const closeView = useCallback(() => {

        closeModal('viewModal');
    }, [modal]);

    

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
                    sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
                >
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('academic.title')}</Typography>
                    {ability.can("Create", "Academic") && <CustomAddButton ClickEvent={ openAdd } label={ t('academic.actions.add') } justifyContent={ 'flex-end' } />}
                </Box>

                <Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <DataTable
                            rows={ data?.data || [] }
                            columns={ columns }
                            id={ "_id" }
                            sx={{
                                '& .MuiDataGrid-root': { border: 'none', backgroundColor: 'transparent', color: themeColors.text.primary },
                                '& .MuiDataGrid-cell': { borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary, backgroundColor: themeColors.background.primary },
                                '& .MuiDataGrid-columnHeaders': { backgroundColor: themeColors.background.secondary, borderBottom: `2px solid ${themeColors.border.primary}`, color: themeColors.text.primary, fontWeight: 'bold' },
                                '& .MuiDataGrid-row': { backgroundColor: themeColors.background.primary, '&:hover': { backgroundColor: themeColors.background.secondary } },
                                '& .MuiDataGrid-footerContainer': { backgroundColor: themeColors.background.secondary, borderTop: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary },
                                '& .MuiTablePagination-root': { color: themeColors.text.primary },
                                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: themeColors.text.secondary },
                                '& .MuiIconButton-root': { color: themeColors.text.primary },
                                '& .MuiButtonBase-root.Mui-disabled': { color: themeColors.text.secondary },
                            }}
                        />
                    </CardContent>
                </Card>
            </Box>
            
            { modal.deleteModal && <CustomDelete
                open={ modal.deleteModal }
                onClose={ closeDelete }
                heading={ t('academic.delete.heading') }
                paragraph={ t('academic.delete.paragraph') }
                fun={ deleteAcademic }
                _id={ _id }
                fetch={ 'academicget' } /> }
            { modal.addModal && <AcademicForm open={ modal.addModal } close={ closeAdd } label={ t('academic.form.create') } hide={ false } id={ false } /> }
            { modal.editModal && <AcademicForm open={ modal.editModal } close={ closeEdit } label={ t('academic.form.edit') } hide={ false } id={ false } item={ item } /> }
            { modal.viewModal && <AcademicForm open={ modal.viewModal } close={ closeView } label={ t('academic.form.view') } hide={ true } id={ false } item={ item } /> }
            { isLoading && < CustomBackDrop loading={ isLoading } /> }
        </CustomOutletBox>
    )
}

export default AcademicScreen
