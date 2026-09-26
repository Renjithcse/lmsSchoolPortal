import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    TextField,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Breadcrumbs,
    Link
} from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import {
    useGetAllInformationQuery,
    useDeleteInformationMutation,
    usePublishInformationMutation,
    useArchiveInformationMutation,
    useGetInformationStatsQuery
} from '../../../Redux/features/Admin/informationApiSlice';
import {
    getInformationCategories,
    getStatusOptions,
    getPriorityOptions,
    getPublishToOptions
} from '../../../api/information';
import moment from 'moment';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const InformationScreen = () => {
    const { themeColors, currentTheme } = useTheme();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const ability = useAbility();
    const { t } = useTranslation();

    // Local state for filters - must be declared before RTK Query hooks
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        category: '',
        status: '',
        priority: '',
        publishTo: '',
        search: ''
    });

    const { data: stats } = useGetInformationStatsQuery();
    
    // Debug stats structure
    console.log('Stats data:', stats);
    console.log('Stats overview:', stats?.data?.overview);
    
    // Safe stats extraction with correct API response structure
    const safeStats = {
        total: stats?.data?.overview?.total ?? 0,
        published: stats?.data?.overview?.published ?? 0,
        draft: stats?.data?.overview?.draft ?? 0,
        archived: stats?.data?.overview?.archived ?? 0
    };
    
    console.log('Safe stats:', safeStats);
    const [deleteInformation] = useDeleteInformationMutation();
    const [publishInformation] = usePublishInformationMutation();
    const [archiveInformation] = useArchiveInformationMutation();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInformation, setSelectedInformation] = useState(null);

    // React Hook Form setup for filters
    const { control } = useForm({
        defaultValues: {
            category: '',
            status: '',
            priority: '',
            publishTo: ''
        }
    });

    // Filter options
    const categoryOptions = getInformationCategories();
    const statusOptions = getStatusOptions();
    const priorityOptions = getPriorityOptions();
    const publishToOptions = getPublishToOptions();

    // Serialize filters - remove empty strings for proper RTK Query caching
    const serializedFilters = useMemo(() => {
        const serialized = { ...filters };
        // Remove empty string values to ensure proper cache key generation
        Object.keys(serialized).forEach(key => {
            if (serialized[key] === '') {
                delete serialized[key];
            }
        });
        return serialized;
    }, [filters]);

    // RTK Query hooks - use serialized filters
    const { 
        data: informationData, 
        isLoading: loading, 
        error 
    } = useGetAllInformationQuery(serializedFilters);

    // Extract data from RTK Query response
    const information = informationData?.data?.information || [];
    const total = informationData?.total || 0;

    // Filter handlers - moved before conditional return
    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
    }, []);

    const handlePageChange = useCallback((event, newPage) => {
        setFilters(prev => ({ ...prev, page: newPage + 1 }));
    }, []);

    const handleRowsPerPageChange = useCallback((event) => {
        setFilters(prev => ({ 
            ...prev, 
            limit: parseInt(event.target.value, 10), 
            page: 1 
        }));
    }, []);

    // Theme colors logic - after all hooks
    // Debug theme colors
    console.log('Current theme:', currentTheme);
    console.log('Theme colors:', themeColors);
    
    // Fallback colors in case theme is not working
    const fallbackColors = {
        primary: '#059669',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        text: {
            primary: '#064e3b',
            secondary: '#6b7280',
            disabled: '#9ca3af',
            inverse: '#ffffff'
        },
        border: {
            primary: '#d1fae5'
        }
    };
    
    // Use theme colors or fallback
    const colors = themeColors || fallbackColors;
    
    // Check if theme colors are properly loaded
    if (!themeColors) {
        console.error('Theme colors not loaded!');
        return <div>Loading theme...</div>;
    }

    // Data is automatically fetched by RTK Query hooks
    // Error handling is automatic with RTK Query

    // CRUD operations
    const handleCreate = () => {
        navigate('/information/create');
    };

    const handleEdit = (id) => {
        navigate(`/information/edit/${id}`);
    };

    const handleView = (id) => {
        navigate(`/information/view/${id}`);
    };

    const handleDelete = (info) => {
        setSelectedInformation(info);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedInformation) {
            try {
                await deleteInformation(selectedInformation._id).unwrap();
                showSnackbar(t('information.messages.deleteSuccess'), 'success');
                setDeleteDialogOpen(false);
                setSelectedInformation(null);
            } catch (error) {
                showSnackbar(error.data?.message || error.message || t('information.messages.deleteError'), 'error');
            }
        }
    };

    const handlePublish = async (id) => {
        try {
            await publishInformation(id).unwrap();
            showSnackbar(t('information.messages.publishSuccess'), 'success');
        } catch (error) {
            showSnackbar(error.data?.message || error.message || t('information.messages.publishError'), 'error');
        }
    };

    const handleArchive = async (id) => {
        try {
            await archiveInformation(id).unwrap();
            showSnackbar(t('information.messages.archiveSuccess'), 'success');
        } catch (error) {
            showSnackbar(error.data?.message || error.message || t('information.messages.archiveError'), 'error');
        }
    };

    // Get status chip color
    const getStatusColor = (status) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption?.color || colors.primary;
    };

    // Get priority chip color
    const getPriorityColor = (priority) => {
        const priorityOption = priorityOptions.find(opt => opt.value === priority);
        return priorityOption?.color || colors.primary;
    };

    return (
        <Box sx={{ 
            p: 3,
            backgroundColor: colors.background.primary,
            minHeight: '100vh'
        }}>
            {/* Breadcrumbs */}
            <Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: colors.text.secondary } }}>
                <Link
                    underline="hover"
                    sx={{ color: colors.text.secondary, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    {t('timetable.breadcrumbs.admin')}
                </Link>
                <Typography sx={{ color: colors.text.primary }}>
                    {t('information.title')}
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: colors.text.primary }}>
                    {t('information.title')}
                </Typography>
                {ability.can('Create', 'Information') &&  <Button
                    variant="contained"
                    startIcon={<ICONS.Add.component />}
                    onClick={handleCreate}
                    sx={{ 
                        backgroundColor: colors.primary,
                        color: colors.text.inverse,
                        '&:hover': {
                            backgroundColor: colors.primary,
                            opacity: 0.9
                        }
                    }}
                >
                    {t('information.actions.create')}
                </Button>}
            </Box>

            {/* Statistics Cards */}
            {stats && stats.data && stats.data.overview && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            border: `1px solid ${colors.border.primary}`,
                            backgroundColor: colors.background.secondary,
                            '&:hover': {
                                backgroundColor: colors.background.tertiary,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: colors.primary }}>
                        {safeStats.total}
                    </Typography>
                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                    {t('information.stats.total')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            border: `1px solid ${colors.border.primary}`,
                            backgroundColor: colors.background.secondary,
                            '&:hover': {
                                backgroundColor: colors.background.tertiary,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" fontWeight="bold" sx={{ color: colors.success }}>
                                    {safeStats.published}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                    {t('information.stats.published')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            border: `1px solid ${colors.border.primary}`,
                            backgroundColor: colors.background.secondary,
                            '&:hover': {
                                backgroundColor: colors.background.tertiary,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" fontWeight="bold" sx={{ color: colors.warning }}>
                                    {safeStats.draft}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                    {t('information.stats.draft')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ 
                            border: `1px solid ${colors.border.primary}`,
                            backgroundColor: colors.background.secondary,
                            '&:hover': {
                                backgroundColor: colors.background.tertiary,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" fontWeight="bold" sx={{ color: colors.text.disabled }}>
                                    {safeStats.archived}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                    {t('information.stats.archived')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Card sx={{ 
                mb: 3, 
                border: `1px solid ${colors.border.primary}`,
                backgroundColor: colors.background.secondary
            }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={2}>
                            <CustomSelect
                                fieldName="category"
                                control={control}
                                fieldLabel={t('information.filters.category')}
                                onChangeValue={(value) => handleFilterChange('category', value)}
                            >
                                <MenuItem value="">{t('information.filters.allCategories')}</MenuItem>
                                {categoryOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <CustomSelect
                                fieldName="status"
                                control={control}
                                fieldLabel={t('information.filters.status')}
                                onChangeValue={(value) => handleFilterChange('status', value)}
                            >
                                <MenuItem value="">{t('information.filters.allStatus')}</MenuItem>
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <CustomSelect
                                fieldName="priority"
                                control={control}
                                fieldLabel={t('information.filters.priority')}
                                onChangeValue={(value) => handleFilterChange('priority', value)}
                            >
                                <MenuItem value="">{t('information.filters.allPriorities')}</MenuItem>
                                {priorityOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <CustomSelect
                                fieldName="publishTo"
                                control={control}
                                fieldLabel={t('information.filters.publishTo')}
                                onChangeValue={(value) => handleFilterChange('publishTo', value)}
                            >
                                <MenuItem value="">{t('information.filters.allTargets')}</MenuItem>
                                {publishToOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label={t('information.filters.search')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder={t('information.filters.searchPlaceholder')}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: colors.background.primary,
                                        border: `1px solid ${colors.border.primary}`,
                                        color: colors.text.primary,
                                        '&:hover': {
                                            borderColor: colors.primary
                                        },
                                        '&.Mui-focused': {
                                            borderColor: colors.primary,
                                            boxShadow: `0 0 0 2px ${colors.primary}20`
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: colors.text.secondary,
                                        '&.Mui-focused': {
                                            color: colors.primary
                                        }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: colors.text.primary,
                                        '&::placeholder': {
                                            color: colors.text.secondary,
                                            opacity: 1
                                        }
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Information Table */}
            <Card sx={{ 
                border: `1px solid ${colors.border.primary}`,
                backgroundColor: colors.background.secondary
            }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: colors.background.tertiary }}>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.title')}</TableCell>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.category')}</TableCell>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.status')}</TableCell>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.priority')}</TableCell>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.publishTo')}</TableCell>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.publishedDate')}</TableCell>
                                <TableCell sx={{ 
                                    color: colors.text.primary, 
                                    fontWeight: 'bold',
                                    backgroundColor: colors.background.tertiary
                                }}>{t('information.table.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : information.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                            {t('information.table.noData')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                information.map((info) => (
                                    <TableRow 
                                        key={info._id}
                                        sx={{ 
                                            backgroundColor: colors.background.secondary,
                                            '&:hover': {
                                                backgroundColor: colors.background.tertiary
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ color: colors.text.primary }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                                                {info.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                {info.description.length > 50 
                                                    ? `${info.description.substring(0, 50)}...` 
                                                    : info.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ color: colors.text.primary }}>
                                        <Chip 
                                            label={info.category} 
                                            size="small"
                                            sx={{ 
                                                backgroundColor: `${colors.primary}20`,
                                                color: colors.primary,
                                                fontWeight: 'medium'
                                            }}
                                        />
                                        </TableCell>
                                        <TableCell sx={{ color: colors.text.primary }}>
                                                <Chip
                                                label={info.scheduledPublishDate && info.status === 'Draft' 
                                                    ? `${info.status} (${t('information.form.scheduledFor')} ${moment(info.scheduledPublishDate).format('MMM DD, YYYY HH:mm')})`
                                                    : info.status} 
                                                size="small"
                                                sx={{
                                                    backgroundColor: getStatusColor(info.status),
                                                    color: 'white'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: colors.text.primary }}>
                                            <Chip 
                                                label={info.priority} 
                                                size="small"
                                                sx={{ 
                                                    backgroundColor: getPriorityColor(info.priority),
                                                    color: 'white'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: colors.text.primary }}>{info.publishTo}</TableCell>
                                        <TableCell sx={{ color: colors.text.primary }}>
                                            {info.publishedAt 
                                                ? moment(info.publishedAt).format('MMM DD, YYYY')
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell sx={{ color: colors.text.primary }}>
                                            <Box display="flex" gap={1}>
                                                {ability.can('view', 'Information') && <Tooltip title={t('information.actions.view')}>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleView(info._id)}
                                                        sx={{ 
                                                            color: colors.text.primary,
                                                            '&:hover': {
                                                                backgroundColor: colors.background.tertiary
                                                            }
                                                        }}
                                                    >
                                                        <ICONS.Visibility.component />
                                                    </IconButton>
                                                </Tooltip>}
                                                {ability.can('Edit', 'Information') && <Tooltip title={t('information.actions.edit')}>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleEdit(info._id)}
                                                        sx={{ 
                                                            color: colors.text.primary,
                                                            '&:hover': {
                                                                backgroundColor: colors.background.tertiary
                                                            }
                                                        }}
                                                    >
                                                        <ICONS.Edit.component />
                                                    </IconButton>
                                                </Tooltip>}
                                                {(info.status === 'Draft' && ability.can('Publish', 'Information')) && (
                                                    <Tooltip title={t('information.actions.publish')}>
                                                        <IconButton 
                                                            size="small"
                                                        onClick={() => handlePublish(info._id)}
                                                        sx={{ 
                                                            color: colors.success,
                                                            '&:hover': {
                                                                backgroundColor: `${colors.success}20`
                                                            }
                                                        }}
                                                        >
                                                            <ICONS.Check.component />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {(info.status === 'Published' && ability.can('Archive', 'Information')) && (
                                                    <Tooltip title={t('information.actions.archive')}>
                                                        <IconButton 
                                                            size="small"
                                                        onClick={() => handleArchive(info._id)}
                                                        sx={{ 
                                                            color: colors.warning,
                                                            '&:hover': {
                                                                backgroundColor: `${colors.warning}20`
                                                            }
                                                        }}
                                                        >
                                                            <ICONS.Archive.component />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {ability.can('Delete', 'Information') && <Tooltip title={t('information.actions.delete')}>
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleDelete(info)}
                                                        sx={{ 
                                                            color: colors.error,
                                                            '&:hover': {
                                                                backgroundColor: `${colors.error}20`
                                                            }
                                                        }}
                                                    >
                                                        <ICONS.Delete.component />
                                                    </IconButton>
                                                </Tooltip>}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={total}
                    rowsPerPage={filters.limit}
                    page={filters.page - 1}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    sx={{
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderTop: `1px solid ${colors.border.primary}`,
                        '& .MuiTablePagination-toolbar': {
                            color: colors.text.primary,
                            backgroundColor: colors.background.secondary
                        },
                        '& .MuiTablePagination-selectLabel': {
                            color: colors.text.primary
                        },
                        '& .MuiTablePagination-displayedRows': {
                            color: colors.text.primary
                        },
                        '& .MuiTablePagination-select': {
                            color: colors.text.primary,
                            backgroundColor: colors.background.primary,
                            border: `1px solid ${colors.border.primary}`,
                            '&:hover': {
                                borderColor: colors.primary
                            },
                            '&.Mui-focused': {
                                borderColor: colors.primary,
                                boxShadow: `0 0 0 2px ${colors.primary}20`
                            }
                        },
                        '& .MuiTablePagination-selectIcon': {
                            color: colors.text.primary
                        },
                        '& .MuiIconButton-root': {
                            color: colors.text.primary,
                            '&:hover': {
                                backgroundColor: colors.background.tertiary
                            },
                            '&.Mui-disabled': {
                                color: colors.text.disabled
                            }
                        }
                    }}
                />
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: colors.background.secondary,
                        border: `1px solid ${colors.border.primary}`
                    }
                }}
            >
                <DialogTitle sx={{ color: colors.text.primary }}>{t('information.delete.title')}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: colors.text.primary }}>
                        {t('information.delete.message', { title: selectedInformation?.title })}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ color: colors.text.primary }}
                    >
                        {t('information.delete.cancel')}
                    </Button>
                    <Button 
                        onClick={confirmDelete} 
                        color="error" 
                        variant="contained"
                        disabled={loading}
                        sx={{
                            backgroundColor: colors.error,
                            '&:hover': {
                                backgroundColor: colors.error,
                                opacity: 0.9
                            }
                        }}
                    >
                        {t('information.delete.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InformationScreen;
