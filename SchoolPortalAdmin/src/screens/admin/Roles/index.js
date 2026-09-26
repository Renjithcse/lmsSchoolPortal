import React, { useCallback, useState } from 'react'
import CustomOutletBox from '../../../components/Common/CustomOutletBox'
import CustomAddButton from '../../../components/Common/CustomAddButton'
import { useNavigate } from 'react-router-dom'
import useModal from '../../../hooks/modalHook'
import AcademicForm from '../../../components/admin/academic/AcademicForm'
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton } from '@mui/material'
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext'
import { ICONS } from '../../../assets/icons'
import DataTable from '../../../components/Common/CustomTable';
import { deleteAcademic, getAcademic } from '../../../api/academic'
import moment from 'moment/moment'
import CustomDelete from '../../../components/Common/CustomDelete'
import CustomBackDrop from '../../../components/Common/CustomBackDrop'
import { useQuery } from '@tanstack/react-query'
import { useDeleteRoleMutation, useListRolesQuery } from '../../../Redux/features/Admin/RolesSlice'
import ConfirmationDialog from '../../../components/Inputs/ConfirmationDialog'
import { useSnackbar } from '../../../hooks/SnackBar'
import { useAbility } from '../../../AbilityContext'
import { useTranslation } from 'react-i18next'

const Roles = () => {

    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const { modal, openModal, closeModal } = useModal();
    // const { data, isError, isLoading, isFetched, refetch } = useQuery({ queryKey: ['academicget'], queryFn: getAcademic });
    const [item, setItem] = useState(null);
    const [_id, set_id] = useState(null);
    const { data, isLoading } = useListRolesQuery()
    const [triggerDelete, { isLoading: deleteLoading }] = useDeleteRoleMutation()
    const navigate = useNavigate()
    const ability = useAbility()
    const showSnackbar = useSnackbar()

    console.log({ data })

    const OpenDelete = useCallback((id) => {
        set_id(id);
        openModal('deleteModal');
    }, [modal]);

    const closeDelete = useCallback(() => {
        closeModal('deleteModal');
    }, [modal]);

    const openAdd = useCallback(() => {
        navigate('add')
    }, []);


    const openEdit = useCallback((item) => {
        navigate(`edit/${item}`, { state: 'edit' })
    }, [modal]);


    const openView = useCallback((item) => {
        navigate(`edit/${item}`, { state: 'view' })
    }, [modal]);

    const deleteRole = async() => {
        closeDelete();
        const deleted = await triggerDelete(_id);

        if(deleted?.error){
            showSnackbar(t('roles.messages.deleteError'), "error");
        }
        else{
            showSnackbar(t('roles.messages.deleteSuccess'), "success");
            set_id('')
        }

    }


    const columns = [

        {
            field: 'SN',
            headerName: t('roles.table.columns.sno'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

        },
        {
            field: 'roleName',
            headerName: t('roles.table.columns.roleName'),
            flex: 1,
            // valueGetter: (params) => (moment(params.row.expiry, "YYYY-MM-DD").format('DD/MM/YYYY')),
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'Action',
            headerName: t('roles.table.columns.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={'center'} gap={1} direction={'row'}>
                    {ability.can("Read", "Roles") && <Tooltip title={t('roles.actions.view')}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openView(row?.slug); }}
                            sx={{ color: themeColors.primary, '&:hover': { backgroundColor: themeColors.primary, color: '#fff' } }}>
                            <ICONS.RemoveRedEyeIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}

                    {ability.can("Edit", "Roles") && <Tooltip title={t('roles.actions.edit')}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row?.slug); }}
                            sx={{ color: themeColors.accent, '&:hover': { backgroundColor: themeColors.accent, color: '#fff' } }}>
                            <ICONS.BorderColorIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {ability.can("Delete", "Roles") && <Tooltip title={t('roles.actions.delete')}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); OpenDelete(row?._id); }}
                            sx={{ color: themeColors.error, '&:hover': { backgroundColor: themeColors.error, color: '#fff' } }}>
                            <ICONS.DeleteForeverIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                </Stack>
            ),
        }
    ];


    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
                    sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
                >
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('roles.title')}</Typography>
                    {ability.can("Create", "Roles") && <CustomAddButton ClickEvent={openAdd} label={t('roles.actions.add')} justifyContent={'flex-end'} />}
                </Box>
                <Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <DataTable
                            rows={data?.data?.length > 0 ? data?.data : []}
                            columns={columns}
                            id={"_id"}
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
            {modal.deleteModal && <ConfirmationDialog
                isOpen={modal.deleteModal}
                onClose={closeDelete}
                onConfirm={deleteRole}
                message={t('roles.delete.message')}
                title={t('roles.delete.title')}
            />}
            {isLoading && < CustomBackDrop loading={isLoading || deleteLoading} />}
        </CustomOutletBox>
    )
}

export default Roles