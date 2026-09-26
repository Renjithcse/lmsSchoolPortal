import { 
    Box, 
    Grid, 
    Skeleton, 
    Typography, 
    Card, 
    CardContent, 
    Button, 
    Stack,
    Chip,
    Divider,
    Alert,
    IconButton,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    useMediaQuery,
    useTheme
} from "@mui/material"
import ExamPublishedCard from "../../components/OnlineExam/ExamPublishedCard"
import { useLocation, useOutletContext, useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query";
import { listAllPublishedExams } from "../../api/onlineExam";
import CustomAddButton from "../../components/Common/CustomAddButton";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useCallback, useState, useEffect } from "react";
import useModal from "../../hooks/modalHook";
import NewPublish from "../../components/OnlineExam/NewPublish";
import DeleteDialog from "../../components/Common/DeleteDialog";
import { deletePublishedExam } from "../../api/onlineExam";
import DataTable from "../../components/Common/CustomTable";
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    School as SchoolIcon,
    PublishedWithChanges as PublishedIcon,
    Schedule as ScheduleIcon,
    People as PeopleIcon,
    ViewModule as CardViewIcon,
    ViewList as TableViewIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Quiz as QuizIcon
} from '@mui/icons-material';
import { Link } from "react-router-dom";
import dayjs from 'dayjs';
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import EditPublish from "../../components/OnlineExam/EditPublish";

export default function PublishedExams() {
    const params = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const ability = useAbility();
    const { modal, openModal, closeModal } = useModal();
    const [title, setTitle] = useState('');
    const [viewMode, setViewMode] = useState(isMobile ? 'card' : 'table');
    const [selectedPublish, setSelectedPublish] = useState(null);

    const exam = useOutletContext();

    // Update view mode when screen size changes
    useEffect(() => {
        setViewMode(isMobile ? 'card' : 'table');
    }, [isMobile]);

    const { data, isLoading, refetch } = useQuery({ 
        queryKey: ['publishedExams', params?.id], 
        queryFn: (state) => listAllPublishedExams(params?.id), 
        enabled: !!params?.id 
    });

    // Transform data to ensure proper ID field
    const transformedData = data?.data?.map((item, index) => ({
        ...item,
        id: item._id || item.id || `row-${index}`,
        exam: exam // Add exam context to each row
    })) || [];

    console.log('Published Exams Data:', data);
    console.log('Transformed Data:', transformedData);

    const openAdd = useCallback(() => {
        setTitle(t('publishedExams.titles.newPublish'));
        openModal('addModal');
    }, [openModal, t]);

    const closeAdd = useCallback(() => {
        closeModal('addModal');
        refetch()
    }, [closeModal]);

    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // Edit and Delete handlers
    const handleEditPublish = useCallback((publishData) => {
        setSelectedPublish(publishData);
        setTitle(t('publishedExams.titles.editPublish'));
        openModal('editModal');
    }, [openModal, t]);

    const handleDeletePublish = useCallback((publishData) => {
        setSelectedPublish(publishData);
        setTitle(t('publishedExams.titles.publish'));
        openModal('deleteModal');
    }, [openModal, t]);

    const closeEditModal = useCallback(() => {
        closeModal('editModal');
        setSelectedPublish(null);
        refetch();
    }, [closeModal]);

    const closeDeleteModal = useCallback(() => {
        closeModal('deleteModal');
        setSelectedPublish(null);
        refetch();
    }, [closeModal]);

    // Calculate statistics
    const totalPublished = data?.results || 0;
    const activePublished = data?.data?.filter(item => item.status === 'active')?.length || 0;
    const totalAttended = data?.data?.reduce((sum, item) => sum + (item.attendedUsers || 0), 0) || 0;
    const totalSelected = data?.data?.reduce((sum, item) => sum + (item.totalUsersSelected || 0), 0) || 0;

    // Table columns configuration - memoized with t dependency
    const columns = useMemo(() => [
        {
            field: 'gender',
            headerName: t('publishedExams.table.gender'),
            flex: 1,
            minWidth: 200,
            renderCell: (params) => {
                // Handle object values properly
                const genderValue = typeof params.value === 'object' ? params.value?.name || params.value?.genderName || t('publishedExams.table.all') : params.value || t('publishedExams.table.all');
                const sectionValue = typeof params.row.section === 'object' ? params.row.section?.sectionName || params.row.section?.name || t('publishedExams.table.allSections') : params.row.section || t('publishedExams.table.allSections');
                
                return (
                    <Box>
                        <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                            {genderValue}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, fontSize: '0.75rem' }}>
                            {sectionValue}
                        </Typography>
                    </Box>
                );
            },
        },
        {
            field: 'startDate',
            headerName: t('publishedExams.table.startDate'),
            width: 140,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                        {t('publishedExams.table.startTime')}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'endDate',
            headerName: t('publishedExams.table.endDate'),
            width: 140,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                        {t('publishedExams.table.endTime')}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'attendance',
            headerName: t('publishedExams.table.users'),
            width: 180,
            renderCell: (params) => (
                <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center">
                        <PeopleIcon sx={{ fontSize: 16, color: themeColors.info, mr: 1 }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                {params.row.totalUsersSelected || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                {t('publishedExams.table.selected')}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center">
                        <ScheduleIcon sx={{ fontSize: 16, color: themeColors.warning, mr: 1 }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                {params.row.attendedUsers || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                {t('publishedExams.table.attended')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: t('publishedExams.table.status'),
            width: 120,
            renderCell: (params) => {
                const now = dayjs();
                const start = dayjs(params.row.startDate);
                const end = dayjs(params.row.endDate);

                if (!start.isValid() || !end.isValid()) {
                    return (
                        <Chip
                            label={t('publishedExams.table.dash')}
                            size="small"
                            sx={{
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.text.secondary,
                                fontWeight: 600,
                                fontSize: '0.75rem'
                            }}
                        />
                    );
                }

                const isActive = (now.isAfter(start) || now.isSame(start)) && (now.isBefore(end) || now.isSame(end));
                const isUpcoming = now.isBefore(start);
                const label = isUpcoming ? t('publishedExams.table.upcoming') : (isActive ? t('publishedExams.table.active') : t('publishedExams.table.ended'));
                const bg = isUpcoming ? themeColors.info : (isActive ? themeColors.success : themeColors.error);

                return (
                    <Chip
                        label={label}
                        size="small"
                        sx={{
                            backgroundColor: bg,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                        }}
                    />
                );
            },
        },
        {
            field: 'actions',
            headerName: t('publishedExams.table.actions'),
            width: 200,
            sortable: false,
            renderCell: (params) => {
                const handleView = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('View published exam clicked:', params.row);
                    navigate(`/online-exam/${exam?.slug}/published/${params.row._id}`);
                };

                const handleEdit = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Edit published exam clicked:', params.row);
                    handleEditPublish(params.row);
                };

                const handleDelete = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('published exam clicked:', params.row);
                    handleDeletePublish(params.row);
                };

                return (
                    <Box display="flex" gap={1}>
                        {ability.can("Read", "PublishedExams") && <Tooltip title={t('publishedExams.actions.viewDetails')}>
                            <IconButton
                                size="small"
                                onClick={handleView}
                                sx={{
                                    backgroundColor: themeColors.background.secondary,
                                    color: themeColors.primary,
                                    '&:hover': { 
                                        backgroundColor: themeColors.primary,
                                        color: 'white'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>}
                        {ability.can("Edit", "PublishedExams") && <Tooltip title={t('publishedExams.actions.editPublish')}>
                            <IconButton
                                size="small"
                                onClick={handleEdit}
                                sx={{
                                    backgroundColor: themeColors.background.secondary,
                                    color: themeColors.primary,
                                    '&:hover': { 
                                        backgroundColor: themeColors.primary,
                                        color: 'white'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>}
                        {ability.can("Delete", "PublishedExams") && <Tooltip title={t('publishedExams.actions.deletePublish')}>
                            <IconButton
                                size="small"
                                onClick={handleDelete}
                                sx={{
                                    backgroundColor: themeColors.background.secondary,
                                    color: themeColors.error,
                                    '&:hover': { 
                                        backgroundColor: themeColors.error,
                                        color: 'white'
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>}
                    </Box>
                );
            },
        },
    ], [t, themeColors, ability, handleEditPublish, handleDeletePublish, navigate, exam]);
    
    return (
        <Box sx={{ p: 3 }}>
            {/* Statistics Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <PublishedIcon sx={{ color: themeColors.primary }} />
                                <Box ml={1}>
                                    <Typography variant="body2" color={themeColors.text.secondary}>
                                        {t('publishedExams.statistics.totalPublished')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.primary }}>
                                        {totalPublished}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <SchoolIcon sx={{ color: themeColors.success }} />
                                <Box ml={1}>
                                    <Typography variant="body2" color={themeColors.text.secondary}>
                                        {t('publishedExams.statistics.activePublished')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.success }}>
                                        {activePublished}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon sx={{ color: themeColors.info }} />
                                <Box ml={1}>
                                    <Typography variant="body2" color={themeColors.text.secondary}>
                                        {t('publishedExams.statistics.totalAttended')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.info }}>
                                        {totalAttended}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <ScheduleIcon sx={{ color: themeColors.warning }} />
                                <Box ml={1}>
                                    <Typography variant="body2" color={themeColors.text.secondary}>
                                        {t('publishedExams.statistics.totalSelected')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.warning }}>
                                        {totalSelected}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                    {t('publishedExams.title')}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                border: `1px solid ${themeColors.border.primary}`,
                                color: themeColors.text.secondary,
                                '&.Mui-selected': {
                                    backgroundColor: themeColors.primary,
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: themeColors.accent,
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: themeColors.background.secondary,
                                }
                            }
                        }}
                    >
                        <ToggleButton value="card" aria-label={t('publishedExams.views.card')}>
                            <CardViewIcon sx={{ fontSize: 18 }} />
                        </ToggleButton>
                        <ToggleButton value="table" aria-label={t('publishedExams.views.table')}>
                            <TableViewIcon sx={{ fontSize: 18 }} />
                        </ToggleButton>
                    </ToggleButtonGroup>
                    
                    {ability.can("Create", "PublishedExams") && <Tooltip title={t('publishedExams.actions.addNewPublish')}>
                        <IconButton
                            onClick={openAdd}
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: themeColors.accent,
                                },
                                width: 56,
                                height: 56
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>}
                </Box>
            </Box>

            {/* Content */}
            {viewMode === 'card' ? (
                // Card View
                isLoading ? (
                    <Grid container spacing={3}>
                        {[...Array(8)].map((_, index) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                <Card sx={{ 
                                    borderRadius: 2, 
                                    boxShadow: 2,
                                    backgroundColor: themeColors.background.primary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <CardContent>
                                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                                        <Skeleton variant="text" sx={{ mt: 1 }} />
                                        <Skeleton variant="text" width="60%" />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : data?.results > 0 ? (
                    <Grid container spacing={3}>
                        {data?.data?.map((item, index) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                <ExamPublishedCard
                                    data={item}
                                    exam={exam}
                                    onEdit={handleEditPublish}
                                    onDelete={handleDeletePublish}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                                <PublishedIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
                                <Typography variant="h6" color={themeColors.text.secondary} gutterBottom>
                                    {t('publishedExams.messages.noPublishedExams')}
                                </Typography>
                                <Typography variant="body2" color={themeColors.text.secondary} textAlign="center" mb={3}>
                                    {t('publishedExams.messages.startPublishing')}
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={openAdd}
                                    sx={{ 
                                        borderRadius: 2,
                                        backgroundColor: themeColors.primary,
                                        '&:hover': {
                                            backgroundColor: themeColors.accent,
                                        }
                                    }}
                                >
                                    {t('publishedExams.actions.publishFirstExam')}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )
            ) : (
                // Table View
                <Box sx={{ p: 2 }}>
                    {isLoading ? (
                        <Box>
                            {[...Array(5)].map((_, index) => (
                                <Skeleton 
                                    key={index}
                                    variant="rectangular" 
                                    width="100%" 
                                    height={60} 
                                    sx={{ mb: 1, borderRadius: '8px' }}
                                />
                            ))}
                        </Box>
                    ) : data?.results > 0 ? (
                        <DataTable
                            rows={transformedData}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            autoHeight
                            id="id"
                            bg="transparent"
                            sx={{
                                '& .MuiDataGrid-root': {
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: themeColors.text.primary,
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: `1px solid ${themeColors.border.primary}`,
                                    color: themeColors.text.primary,
                                    backgroundColor: themeColors.background.primary,
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: themeColors.background.secondary,
                                    borderBottom: `2px solid ${themeColors.border.primary}`,
                                    color: themeColors.text.primary,
                                    fontWeight: 'bold',
                                },
                                '& .MuiDataGrid-row': {
                                    backgroundColor: themeColors.background.primary,
                                    '&:hover': {
                                        backgroundColor: themeColors.background.secondary,
                                    },
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    backgroundColor: themeColors.background.secondary,
                                    borderTop: `1px solid ${themeColors.border.primary}`,
                                    color: themeColors.text.primary,
                                },
                                '& .MuiTablePagination-root': {
                                    color: themeColors.text.primary,
                                },
                                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                    color: themeColors.text.secondary,
                                },
                                '& .MuiIconButton-root': {
                                    color: themeColors.text.primary,
                                },
                                '& .MuiButtonBase-root.Mui-disabled': {
                                    color: themeColors.text.secondary,
                                },
                                '& .MuiDataGrid-virtualScroller': {
                                    backgroundColor: themeColors.background.primary,
                                },
                                '& .MuiDataGrid-virtualScrollerContent': {
                                    backgroundColor: themeColors.background.primary,
                                },
                                '& .MuiDataGrid-virtualScrollerRenderZone': {
                                    backgroundColor: themeColors.background.primary,
                                },
                            }}
                        />
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" width="100%" py={4}>
                            <Typography textAlign="center" color={themeColors.text.secondary}>
                                {t('publishedExams.messages.noExamsFound')}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Modal */}
            {modal.addModal && (
                <NewPublish 
                    open={modal.addModal} 
                    close={closeAdd} 
                    label={title} 
                    hide={false} 
                    id={false} 
                    state={exam} 
                />
            )}
            {modal.editModal && selectedPublish && (
                <EditPublish     
                    data={selectedPublish}
                    open={modal.editModal} 
                    close={closeEditModal} 
                />
            )}
            {modal.deleteModal && selectedPublish && (
                <DeleteDialog
                    open={modal.deleteModal}
                    onClose={closeDeleteModal}
                    heading={t('publishedExams.delete.heading')}
                    paragraph={t('publishedExams.delete.paragraph')}
                    fun={deletePublishedExam}
                    _id={selectedPublish._id}
                    queryKeytoRefetch={['publishedExams', params?.id]}
                />
            )}
        </Box>
    )
}