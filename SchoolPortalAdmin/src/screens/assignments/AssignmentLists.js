import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    LinearProgress,
    MenuItem,
    Paper,
    Skeleton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    ViewModule as CardViewIcon,
    ViewList as TableViewIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import AssignmentCard from '../../components/assignments/AssignmentCard';
import CustomSelect from '../../components/Common/CustomSelect';
import CustomButton from '../../components/Common/CustomButton';
import DataTable from '../../components/Common/CustomTable';
import DeleteDialog from '../../components/Common/DeleteDialog';
import NewAssignment from '../../components/assignments/NewAssignment';
import useModal from '../../hooks/modalHook';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';
import {
    useLazyGetMyGradePermissionsQuery,
    useLazyGetMySubjectPermissionsQuery,
} from '../../Redux/features/Admin/TeachersSlice';
import {
    useDeleteAssignmentMutation,
    useListAssignmentsQuery,
} from '../../Redux/features/assignmentSlice';
import { useDispatch, useSelector } from 'react-redux';
import { setAssignmentFilters, clearAssignmentFilters } from '../../Redux/features/assignmentFiltersSlice';

const AssignmentLists = () => {
    const theme = useTheme();
    const { themeColors } = useThemeContext();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const ability = useAbility();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { modal, openModal, closeModal } = useModal();

    const filterSchema = useMemo(() => yup.object().shape({
        grade_id: yup.object().required(t('assignments.list.validation.gradeRequired')),
        subject_id: yup.string().nullable(),
    }), [t]);

    const [viewMode, setViewMode] = useState(isMobile ? 'card' : 'table');
    const [modalTitle, setModalTitle] = useState(t('assignments.list.modal.new'));
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const dispatch = useDispatch();
    const storedFilters = useSelector((state) => state.assignmentFilters.filters);
    const filtersHydratedRef = useRef(false);

    const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
    const [triggerSubjects, { data: subjects, isFetching: subjectLoading }] = useLazyGetMySubjectPermissionsQuery();
    const [deleteAssignment] = useDeleteAssignmentMutation();

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
    } = useForm({
        resolver: yupResolver(filterSchema),
        defaultValues: {
            grade_id: null,
            subject_id: '',
        },
    });

    const watchGrade = watch('grade_id');

    const formattedFilters = useMemo(() => {
        if (!storedFilters?.gradeId) return null;
        return {
            grade: storedFilters.gradeId,
            subjectId: storedFilters.subjectId || undefined,
        };
    }, [storedFilters]);

    const {
        data,
        isLoading,
        isFetching,
        error,
    } = useListAssignmentsQuery(formattedFilters ?? {}, { skip: !formattedFilters });

    const assignments = useMemo(
        () => data?.data || [],
        [data]
    );

    useEffect(() => {
        setViewMode(isMobile ? 'card' : 'table');
    }, [isMobile]);

    useEffect(() => {
        triggerGrades({});
    }, [triggerGrades]);

    useEffect(() => {
        if (watchGrade?._id) {
            triggerSubjects({ grade: watchGrade._id });
        }
    }, [triggerSubjects, watchGrade]);

    useEffect(() => {
        if (!storedFilters?.gradeId || filtersHydratedRef.current) return;
        const matchedGrade = grades?.data?.find((grade) => grade._id === storedFilters.gradeId);
        if (!matchedGrade) return;
        setValue('grade_id', matchedGrade);
        setValue('subject_id', storedFilters?.subjectId || '');
        filtersHydratedRef.current = true;
    }, [grades?.data, setValue, storedFilters?.gradeId, storedFilters?.subjectId]);

    useEffect(() => {
        filtersHydratedRef.current = false;
    }, [storedFilters?.gradeId, storedFilters?.subjectId]);

    const onSubmitFilters = (values) => {
        const payload = {
            gradeId: values.grade_id._id,
            subjectId: values.subject_id || undefined,
        };
        dispatch(setAssignmentFilters(payload));
    };

    const handleResetFilters = () => {
        dispatch(clearAssignmentFilters());
        setSelectedAssignment(null);
        setPendingDeleteId(null);
        reset({
            grade_id: null,
            subject_id: '',
        });
    };

    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    const openAdd = useCallback(() => {
        if (!storedFilters?.gradeId) return;
        setSelectedAssignment(null);
        setModalTitle(t('assignments.list.modal.new'));
        openModal('addModal');
    }, [openModal, storedFilters?.gradeId, t]);

    const closeAdd = useCallback(() => {
        setSelectedAssignment(null);
        closeModal('addModal');
    }, [closeModal]);

    const openEditForm = useCallback((assignment) => {
        setSelectedAssignment(assignment);
        setModalTitle(t('assignments.list.modal.edit'));
        openModal('addModal');
    }, [openModal, t]);

    const handleDeleteAssignment = useCallback((assignment) => {
        setPendingDeleteId(assignment?._id || null);
        openModal('deleteModal');
    }, [openModal]);

    const handleCloseDelete = useCallback(() => {
        setPendingDeleteId(null);
        closeModal('deleteModal');
    }, [closeModal]);

    const handleViewAssignment = useCallback((assignment) => {
        if (!assignment?._id) return;
        navigate(`/assignments/view/${assignment._id}`);
    }, [navigate]);

    const canCreateAssignment = Boolean(
        storedFilters?.gradeId
    );

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return t('assignments.list.status.active');
            case 'inactive':
                return t('assignments.list.status.inactive');
            default:
                return t('assignments.list.status.active');
        }
    };

    const columns = useMemo(() => ([
        {
            field: 'index',
            headerName: t('assignments.list.table.index'),
            width: 70,
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
        },
        {
            field: 'assignmentName',
            headerName: t('assignments.list.table.assignmentName'),
            flex: 1.6,
            minWidth: 200,
        },
        {
            field: 'term',
            headerName: t('assignments.list.table.term'),
            width: 140,
        },
        {
            field: 'createdAt',
            headerName: t('assignments.list.table.createdOn'),
            width: 160,
            valueGetter: (params) => dayjs(params.row.createdAt).format('DD MMM YYYY'),
        },
        {
            field: 'createdBy',
            headerName: t('assignments.list.table.createdBy'),
            width: 160,
            valueGetter: (params) => params.row.createdBy?.name || t('assignments.list.table.unknown'),
        },
        {
            field: 'status',
            headerName: t('assignments.list.table.status'),
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.value || 'active')}
                    size="small"
                    color={params.value === 'inactive' ? 'warning' : 'success'}
                    sx={{ fontWeight: 600 }}
                />
            ),
        },
        {
            field: 'actions',
            headerName: t('assignments.list.table.actions'),
            width: 200,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    {ability.can('Read', 'Assignments') && (
                        <IconButton
                            size="small"
                            onClick={() => handleViewAssignment(params.row)}
                            sx={{
                                color: themeColors.primary,
                                '&:hover': { backgroundColor: `${themeColors.primary}15` },
                            }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    )}
                    {/* {ability.can('Edit', 'Assignments') && (
                        <IconButton
                            size="small"
                            onClick={() => openEditForm(params.row)}
                            sx={{
                                color: themeColors.accent,
                                '&:hover': { backgroundColor: `${themeColors.accent}15` },
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )} */}
                    {ability.can('Delete', 'Assignments') && !(params.row?.publishCount > 0) && (
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteAssignment(params.row)}
                            sx={{
                                color: themeColors.error,
                                '&:hover': { backgroundColor: `${themeColors.error}15` },
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            ),
        },
    ]), [ability, handleDeleteAssignment, handleViewAssignment, openEditForm, themeColors, t]);

    const renderSkeleton = (
        <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            border: `1px solid ${themeColors.border.primary}`,
                            backgroundColor: themeColors.background.primary,
                        }}
                    >
                        <CardContent>
                            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="80%" height={18} />
                            <Skeleton variant="rectangular" height={80} sx={{ mt: 2, borderRadius: 1 }} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    // p: 3,
                    // mb: 3,
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: 3,
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('assignments.list.filters.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('assignments.list.filters.subtitle')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            size="small"
                            aria-label="view mode"
                            sx={{
                                '& .MuiToggleButtonGroup-grouped': {
                                    borderColor: themeColors.border.primary,
                                },
                                '& .MuiToggleButton-root': {
                                    color: themeColors.text.primary,
                                    '&.Mui-selected': {
                                        backgroundColor: `${themeColors.primary}22`,
                                        color: themeColors.primary,
                                        '&:hover': {
                                            backgroundColor: `${themeColors.primary}33`,
                                        },
                                    },
                                    '&:hover': {
                                        backgroundColor: `${themeColors.text.primary}14`,
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="table" aria-label="table view">
                                <TableViewIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="card" aria-label="card view">
                                <CardViewIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {ability.can('Create', 'Assignments') && (
                            <CustomButton
                                label={t('assignments.list.actions.create')}
                                onClick={openAdd}
                                disable={!canCreateAssignment}
                            />
                        )}
                    </Stack>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <CustomSelect
                            control={control}
                            fieldName="grade_id"
                            fieldLabel={t('assignments.list.filters.grade')}
                            disabled={gradeLoading}
                        >
                            {grades?.data?.map((grade) => (
                                <MenuItem key={grade._id} value={grade}>
                                    {grade.gradeName}
                                </MenuItem>
                            ))}
                        </CustomSelect>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <CustomSelect
                            control={control}
                            fieldName="subject_id"
                            fieldLabel={t('assignments.list.filters.subject')}
                            disabled={subjectLoading}
                        >
                            {subjects?.data?.map((subject) => (
                                <MenuItem key={subject._id} value={subject._id}>
                                    {subject.subjectName}
                                </MenuItem>
                            ))}
                        </CustomSelect>
                    </Grid>
                </Grid>
                <Box display="flex" justifyContent="flex-end" gap={1.5} mt={3}>
                    <CustomButton
                        variant="outlined"
                        label={t('assignments.list.filters.reset')}
                        onClick={handleResetFilters}
                    />
                    <CustomButton
                        label={t('assignments.list.filters.apply')}
                        onClick={handleSubmit(onSubmitFilters)}
                    />
                </Box>
            </Paper>

            {formattedFilters && (isLoading || isFetching) && (
                <Box sx={{ mb: 3 }}>
                    <LinearProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {t('assignments.list.messages.loadError')}
                </Alert>
            )}

            {!formattedFilters && (
                <Alert severity="info">
                    {t('assignments.list.messages.selectFilters')}
                </Alert>
            )}

            {formattedFilters && !isLoading && !isFetching && !error && assignments.length === 0 && (
                <Alert severity="warning">
                    {t('assignments.list.messages.noAssignments')}
                </Alert>
            )}

            {formattedFilters && (isLoading || isFetching)
                ? renderSkeleton
                : formattedFilters && !error && assignments.length > 0 && (
                    viewMode === 'card' ? (
                        <Grid container spacing={3}>
                    {assignments.map((assignment) => {
                        const canDeleteCard = ability.can('Delete', 'Assignments') && !(assignment?.publishCount > 0);
                        return (
                            <Grid item xs={12} md={6} lg={4} key={assignment._id}>
                                <AssignmentCard
                                    assignment={assignment}
                                    onView={handleViewAssignment}
                                    onEdit={ability.can('Edit', 'Assignments') ? openEditForm : undefined}
                                    onDelete={canDeleteCard ? handleDeleteAssignment : undefined}
                                />
                            </Grid>
                        );
                    })}
                        </Grid>
                    ) : (
                        <Card
                            sx={{
                                borderRadius: 3,
                                border: `1px solid ${themeColors.border.primary}`,
                                backgroundColor: themeColors.background.primary,
                            }}
                        >
                            <CardContent sx={{ p: 0 }}>
                                <DataTable
                                    rows={assignments}
                                    columns={columns}
                                    id="_id"
                                    sx={{
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: themeColors.background.secondary,
                                            color: themeColors.text.primary,
                                            fontWeight: 600,
                                        },
                                        '& .MuiDataGrid-row': {
                                            backgroundColor: themeColors.background.primary,
                                            '&:hover': {
                                                backgroundColor: themeColors.background.secondary,
                                            },
                                        },
                                        '& .MuiDataGrid-cell': {
                                            borderBottom: `1px solid ${themeColors.border.primary}`,
                                            color: themeColors.text.primary,
                                        },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )
                )}

            {modal.addModal && (
                <NewAssignment
                    open={modal.addModal}
                    close={closeAdd}
                    label={modalTitle}
                    hide={false}
                    id={false}
                    state={formattedFilters}
                    data={selectedAssignment}
                />
            )}
            <DeleteDialog
                open={modal.deleteModal}
                onClose={handleCloseDelete}
                heading={t('assignments.list.delete.title')}
                paragraph={t('assignments.list.delete.paragraph')}
                fun={deleteAssignment}
                _id={pendingDeleteId}
                mode="redux"
            />
        </>
    );
};

export default AssignmentLists;

