import React, { useCallback, useEffect, useState } from 'react';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CustomAddButton from '../../../components/Common/CustomAddButton';
import { useNavigate } from 'react-router-dom';
import useModal from '../../../hooks/modalHook';
import TermHistoryForm from '../../../components/admin/termHistory/TermHistoryForm';
import { 
    Box, 
    Stack, 
    Tooltip, 
    Card, 
    CardContent, 
    Typography, 
    IconButton, 
    Chip,
    TextField,
    MenuItem,
    Grid,
    Button
} from '@mui/material';
import { ICONS } from '../../../assets/icons';
import DataTable from '../../../components/Common/CustomTable';
import { useQuery } from '@tanstack/react-query';
import { deleteTermHistory, getTermHistories, setActiveTerm, createTermHistory, updateTermHistory } from '../../../api/termHistory';
import moment from 'moment/moment';
import ConfirmationDialog from '../../../components/Inputs/ConfirmationDialog';
import CustomBackDrop from '../../../components/Common/CustomBackDrop';
import ErrorInfo from '../../../components/Common/ErrorInfo';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const TermHistoryScreen = () => {
    const showSnackbar = useSnackbar();
    const { themeColors } = useThemeContext();
    const queryClient = useQueryClient();
    const ability = useAbility();
    const { t } = useTranslation();

    const isAdmin = useSelector(state => state.auth.role) === 'admin';


    const { modal, openModal, closeModal } = useModal();

    // Custom close function to close all modals
    const handleCloseModal = useCallback(() => {
        closeModal('add');
        closeModal('edit');
        closeModal('delete');
    }, [closeModal]);

    // Close only delete modal
    const handleCloseDeleteModal = useCallback(() => {
        closeModal('delete');
    }, [closeModal]);
    const [item, setItem] = useState(null);
    const [_id, set_id] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        academicYear: '',
        term: ''
    });

    const { data, isError, isLoading, isFetched, refetch, error, isFetching } = useQuery({ 
        queryKey: ['termHistories', filters], 
        queryFn: () => getTermHistories(filters),
        retry: (failureCount, error) => {
            if (error?.response?.status === 403) {
                showSnackbar(error?.response?.data?.message, 'error');
                return false;
            }
            return failureCount < 3;
        },
        enabled: true, // Ensure query is enabled
    });



    // Delete mutation
    const { mutate: deleteMutate, isPending: deletePending } = useMutation({
        mutationFn: deleteTermHistory,
        onSuccess: async () => {
            showSnackbar(t('termHistory.messages.deleteSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ["termHistories"] });
            set_id(null);
        },
        onError: (error) => {
            showSnackbar(error?.response?.data?.message || error?.message || t('termHistory.messages.deleteError'), 'error');
        },
    });

    // Set active term mutation
    const { mutate: setActiveMutate, isPending: setActivePending } = useMutation({
        mutationFn: setActiveTerm,
        onSuccess: async () => {
            showSnackbar(t('termHistory.messages.activateSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ["termHistories"] });
        },
        onError: (error) => {
            showSnackbar(error?.response?.data?.message || t('termHistory.messages.activateError'), 'error');
        },
    });

    // Create/Update term history mutation
    const { mutate: createUpdateMutate, isPending: createUpdatePending } = useMutation({
        mutationFn: (data) => data.id ? updateTermHistory(data) : createTermHistory(data),
        onSuccess: async (data) => {
            showSnackbar(data.id ? t('termHistory.messages.updateSuccess') : t('termHistory.messages.createSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ["termHistories"] });
            await queryClient.invalidateQueries({ queryKey: ["academicget"] });
        },
        onError: (error) => {
            console.log({error})
            showSnackbar(error?.response?.data?.message || error?.message || t('termHistory.messages.genericError'), 'error');
        },
    });

    const handleDelete = useCallback((id) => {
        set_id(id);
        openModal('delete');
    }, [openModal]);

    const handleEdit = useCallback((row) => {
        setItem(row);
        openModal('edit');
    }, [openModal]);

    const handleAdd = useCallback(() => {
        console.log('Add button clicked!'); // Debug log
        setItem(null);
        openModal('add');
        console.log('Modal state after opening:', modal); // Debug log
    }, [openModal, modal]);

    const handleSetActive = useCallback((id) => {
        setActiveMutate(id);
    }, [setActiveMutate]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            page: 1 // Reset to first page when filtering
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const handlePageSizeChange = (newPageSize) => {
        setFilters(prev => ({
            ...prev,
            limit: newPageSize,
            page: 1
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return '#10B981';
            case 'Upcoming':
                return '#F59E0B';
            case 'Completed':
                return '#6B7280';
            default:
                return '#6B7280';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Active':
                return t('termHistory.status.active');
            case 'Upcoming':
                return t('termHistory.status.upcoming');
            case 'Completed':
                return t('termHistory.status.completed');
            default:
                return status;
        }
    };

    const columns = [
        {
            field: 'SN',
            headerName: t('termHistory.table.sn'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: 'academicYearName',
            headerName: t('termHistory.table.academicYear'),
            flex: 1.5,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'term',
            headerName: t('termHistory.table.term'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'startDate',
            headerName: t('termHistory.table.startDate'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => moment(params.row.startDate).format("DD-MM-YYYY")
        },
        {
            field: 'endDate',
            headerName: t('termHistory.table.endDate'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => moment(params.row.endDate).format("DD-MM-YYYY")
        },
        {
            field: 'duration',
            headerName: t('termHistory.table.duration'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={t('termHistory.duration', { count: params.row.duration })}
                    size="small"
                    sx={{
                        height: 24,
                        backgroundColor: `${themeColors.primary}22`,
                        color: themeColors.primary,
                        border: `1px solid ${themeColors.primary}`,
                        '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                    }}
                />
            )
        },
        {
            field: 'status',
            headerName: t('termHistory.table.status'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.row.status)}
                    size="small"
                    sx={{
                        height: 24,
                        backgroundColor: `${getStatusColor(params.row.status)}22`,
                        color: getStatusColor(params.row.status),
                        border: `1px solid ${getStatusColor(params.row.status)}`,
                        '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                    }}
                />
            )
        },
        {
            field: 'created_at',
            headerName: t('termHistory.table.createdDate'),
            flex: 1.5,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => moment(params.row.created_at).format("DD-MM-YYYY hh:mm A")
        },
        {
            field: 'actions',
            headerName: t('termHistory.table.actions'),
            flex: 2,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            renderCell: (params) => (
                <Box display="flex" gap={0.5} justifyContent="center">
                    {(ability.can("Edit", "TermHistory") && isAdmin) && <Tooltip title={t('termHistory.actions.edit')}>
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(params.row)}
                            sx={{
                                color: themeColors.primary,
                                '&:hover': {
                                    backgroundColor: `${themeColors.primary}22`,
                                }
                            }}
                        >
                            <ICONS.BorderColorIcon.component />
                        </IconButton>
                    </Tooltip>}
                    
                    {(!params.row.isActive && (ability.can("Edit", "TermHistory")) || isAdmin) && (
                        <Tooltip title={t('termHistory.actions.setActive')}>
                            <IconButton
                                size="small"
                                onClick={() => handleSetActive(params.row._id)}
                                disabled={setActivePending}
                                sx={{
                                    color: '#10B981',
                                    '&:hover': {
                                        backgroundColor: '#10B98122',
                                    },
                                    '&:disabled': {
                                        color: themeColors.text.secondary,
                                    }
                                }}
                            >
                                <ICONS.CheckCircleIcon.component />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {(ability.can("Delete", "TermHistory") || isAdmin) && <Tooltip title={t('termHistory.actions.delete')}>
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(params.row._id)}
                            sx={{
                                color: '#EF4444',
                                '&:hover': {
                                    backgroundColor: '#EF444422',
                                }
                            }}
                        >
                            <ICONS.DeleteForeverIcon.component />
                        </IconButton>
                    </Tooltip>}
                </Box>
            )
        }
    ];

    return (
        <>
            <CustomOutletBox>
                <Box sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                            {t('termHistory.title')}
                        </Typography>
                        <CustomAddButton ClickEvent={handleAdd} label={t('termHistory.actions.add')} />
                    </Box>

                    {/* Filters */}
                    <Card sx={{ mb: 3, backgroundColor: themeColors.background.secondary }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                {t('termHistory.filters.title')}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('termHistory.filters.termName')}
                                        value={filters.term}
                                        onChange={(e) => handleFilterChange('term', e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: themeColors.background.primary,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => setFilters({
                                            page: 1,
                                            limit: 10,
                                            academicYear: '',
                                            term: ''
                                        })}
                                        sx={{
                                            borderColor: themeColors.border.primary,
                                            color: themeColors.text.primary,
                                            '&:hover': {
                                                borderColor: themeColors.primary,
                                                color: themeColors.primary,
                                            }
                                        }}
                                    >
                                        {t('termHistory.filters.clear')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Data Table */}
                    {isLoading || createUpdatePending ? (
                        <CustomBackDrop open={isLoading || createUpdatePending} />
                    ) : isError ? (
                        <ErrorInfo error={error} onRetry={refetch} />
                    ) : (
                        <DataTable
                            rows={data?.data?.data?.termHistories || data?.data?.termHistories || []}
                            columns={columns}
                            loading={isLoading || isFetching}
                            pagination={{
                                page: filters.page - 1,
                                pageSize: filters.limit,
                                total: data?.data?.data?.pagination?.total || data?.data?.pagination?.total || 0,
                                onPageChange: (newPage) => handlePageChange(newPage + 1),
                                onPageSizeChange: handlePageSizeChange
                            }}
                            id={"_id"}
                        />
                    )}
                </Box>
            </CustomOutletBox>

            {/* Add/Edit Modal */}
            <TermHistoryForm
                open={modal.addModal || modal.editModal}
                close={handleCloseModal}
                label={modal.addModal ? t('termHistory.modal.add') : t('termHistory.modal.edit')}
                item={modal.editModal ? item : null}
                btnLabel={modal.addModal ? t('termHistory.modal.addButton') : t('termHistory.modal.updateButton')}
                onSubmit={createUpdateMutate}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                isOpen={modal.deleteModal}
                onClose={handleCloseDeleteModal}
                onConfirm={() => {
                    deleteMutate(_id);
                    handleCloseDeleteModal();
                }}
                title={t('termHistory.delete.title')}
                message={t('termHistory.delete.message')}
            />
        </>
    );
};

export default TermHistoryScreen;

