import {
    Box,
    Grid,
    Skeleton,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    Alert,
    IconButton,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    useMediaQuery,
    useTheme,
    Container,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from "@mui/material";
import QuestionBankCard from "../../components/OnlineExam/QuestionBankCard";
import { getAllQuestionBanks } from "../../api/onlineExam";
import { useQuery } from "@tanstack/react-query";
import CustomAddButton from "../../components/Common/CustomAddButton";
import { useCallback, useState, useEffect, useMemo } from "react";
import NewQuestionBank from "../../components/OnlineExam/NewQuestionBank";
import useModal from "../../hooks/modalHook";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useLazyGetMySubjectPermissionsQuery, useLazyGetMyGradePermissionsQuery } from "../../Redux/features/Admin/TeachersSlice";
import {
    Add as AddIcon,
    Quiz as QuizIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    ViewModule as CardViewIcon,
    ViewList as TableViewIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';
import DataTable from "../../components/Common/CustomTable";
import { useNavigate } from "react-router-dom";
import { Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';

export default function QuestionBanks() {
    const theme = useTheme();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const { modal, openModal, closeModal } = useModal();
    const [title, setTitle] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [editingBank, setEditingBank] = useState(null);
    const ability = useAbility();
    const navigate = useNavigate();

    // Get subjects for dropdown
    const [triggerSubjects, { data: subjects, isFetching: subjectLoading }] = useLazyGetMySubjectPermissionsQuery();
    const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();

    // Get question banks with filter
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['allQuestionBanks', filterSubject],
        queryFn: () => getAllQuestionBanks({ subjectId: filterSubject }),
        enabled: true
    });

    // Load subjects and grades on component mount
    useEffect(() => {
        triggerSubjects({});
        triggerGrades({});
    }, [triggerSubjects, triggerGrades]);

    const openAdd = useCallback(() => {
        setTitle(t('questionBanks.titles.newQuestionBank'));
        setEditingBank(null);
        openModal('addModal');
    }, [openModal, t]);

    const closeAdd = useCallback(() => {
        closeModal('addModal');
        setEditingBank(null);
        refetch();
    }, [closeModal, refetch]);

    const handleViewBank = (id) => {
        navigate(`/online-exam/question-bank/${id}`);
    };

    const handleEditBank = (bank) => {
        setEditingBank(bank);
        setTitle(t('questionBanks.titles.editQuestionBank'));
        openModal('addModal');
    };

    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    const handleFilterChange = (event) => {
        setFilterSubject(event.target.value);
    };

    const handleSubjectSelect = (event) => {
        setSelectedSubject(event.target.value);
    };

    // Calculate statistics
    const totalQuestionBanks = data?.questionBanks?.length || 0;
    const totalQuestions = data?.questionBanks?.reduce((sum, item) => sum + (item.questionCount || 0), 0) || 0;
    const totalCreatedBy = data?.questionBanks?.filter((item, index, self) =>
        self.findIndex(t => t.createdBy?._id === item.createdBy?._id) === index
    ).length || 0;

    const tableRows = useMemo(
        () =>
            data?.questionBanks?.map((questionBank) => ({
                ...questionBank,
                subjectName: questionBank.subject?.subjectName,
                createdByName: questionBank.createdBy?.name,
                gradeNames: Array.isArray(questionBank.grades) ? questionBank.grades.map((grade) => grade.gradeName || grade.name || grade).join(', ') : '',
            })) || [],
        [data?.questionBanks]
    );

    const tableColumns = useMemo(
        () => [
            {
                field: 'questionBankName',
                headerName: t('questionBanks.table.name'),
                flex: 1,
                minWidth: 220,
            },
            {
                field: 'subjectName',
                headerName: t('questionBanks.table.subject'),
                width: 180,
            },
            {
                field: 'gradeNames',
                headerName: t('questionBanks.table.grades'),
                width: 180,
            },
            {
                field: 'questionCount',
                headerName: t('questionBanks.table.questions'),
                width: 140,
                type: 'number',
            },
            {
                field: 'createdByName',
                headerName: t('questionBanks.table.createdBy'),
                width: 200,
            },
            {
                field: 'createdAt',
                headerName: t('questionBanks.table.createdAt'),
                width: 160,
                valueGetter: (params) =>
                    params.row.createdAt ? new Date(params.row.createdAt).toLocaleDateString() : '-',
            },
            {
                field: 'actions',
                headerName: t('questionBanks.table.actions'),
                width: 150,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            size="small"
                            onClick={() => handleViewBank(params.row._id)}
                            disabled={!ability.can("Read", "QuestionBank")}
                            sx={{ color: themeColors.primary }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => handleEditBank(params.row)}
                            disabled={!ability.can("Edit", "QuestionBank")}
                            sx={{ color: themeColors.secondary }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                )
            },
        ],
        [t]
    );

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={4}
                sx={{
                    backgroundColor: themeColors.background.primary,
                    p: 3,
                    borderRadius: '12px',
                    border: `1px solid ${themeColors.border.primary}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <Box display="flex" alignItems="center" flex={1}>
                    <QuizIcon sx={{ fontSize: 32, color: themeColors.primary, mr: 2 }} />
                    <Box flex={1}>
                        <Typography variant="h4" sx={{ color: themeColors.text.primary, fontWeight: 600, mb: 1 }}>
                            {t('questionBanks.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
                            {t('questionBanks.subtitle')}
                        </Typography>
                    </Box>
                </Box>

                {ability.can("Create", "QuestionBank") && <Tooltip title={t('questionBanks.actions.addNew')}>
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

            {/* Statistics Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{
                        borderRadius: 2,
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <QuizIcon sx={{ color: themeColors.primary }} />
                                <Box ml={1}>
                                    <Typography variant="body2" color={themeColors.text.secondary}>
                                        {t('questionBanks.statistics.totalQuestionBanks')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.primary }}>
                                        {totalQuestionBanks}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
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
                                        {t('questionBanks.statistics.totalQuestions')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.success }}>
                                        {totalQuestions}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{
                        borderRadius: 2,
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <PersonIcon sx={{ color: themeColors.info }} />
                                <Box ml={1}>
                                    <Typography variant="body2" color={themeColors.text.secondary}>
                                        {t('questionBanks.statistics.contributors')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.info }}>
                                        {totalCreatedBy}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <FilterIcon sx={{ color: themeColors.primary }} />
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                        {t('questionBanks.filters.filterBySubject')}
                    </Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: themeColors.text.secondary }}>{t('questionBanks.filters.selectSubject')}</InputLabel>
                        <Select
                            value={filterSubject}
                            onChange={handleFilterChange}
                            label={t('questionBanks.filters.selectSubject')}
                            sx={{
                                color: themeColors.text.primary,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: themeColors.border.primary,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: themeColors.primary,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: themeColors.primary,
                                }
                            }}
                        >
                            <MenuItem value="">
                                <em>{t('questionBanks.filters.allSubjects')}</em>
                            </MenuItem>
                            {subjects?.data?.map((subject) => (
                                <MenuItem key={subject._id} value={subject._id}>
                                    {subject.subjectName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

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
                    <ToggleButton value="card" aria-label={t('questionBanks.views.card')}>
                        <CardViewIcon sx={{ fontSize: 18 }} />
                    </ToggleButton>
                    <ToggleButton value="list" aria-label={t('questionBanks.views.list')}>
                        <TableViewIcon sx={{ fontSize: 18 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Content */}
            {isLoading ? (
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
            ) : data?.questionBanks?.length > 0 ? (
                viewMode === 'card' ? (
                    <Grid container spacing={3}>
                        {data?.questionBanks?.map((questionBank) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={questionBank._id}>
                                <QuestionBankCard
                                    data={questionBank}
                                    editable={true}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.primary }}>
                        <CardContent>
                            <DataTable
                                rows={tableRows}
                                columns={tableColumns}
                                id="_id"
                                loading={isLoading}
                            />
                        </CardContent>
                    </Card>
                )
            ) : (
                <Card sx={{
                    borderRadius: 2,
                    boxShadow: 2,
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`
                }}>
                    <CardContent>
                        <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                            <QuizIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
                            <Typography variant="h6" color={themeColors.text.secondary} gutterBottom>
                                {t('questionBanks.messages.noQuestionBanksFound')}
                            </Typography>
                            <Typography variant="body2" color={themeColors.text.secondary} textAlign="center" mb={3}>
                                {filterSubject ? t('questionBanks.messages.noBanksForSubject') : t('questionBanks.messages.startCreating')}
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
                                {t('questionBanks.actions.createQuestionBank')}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Modal */}
            {modal.addModal && (
                <NewQuestionBank
                    open={modal.addModal}
                    close={closeAdd}
                    label={title}
                    hide={false}
                    id={false}
                    data={editingBank}
                    subjects={subjects?.data}
                    gradeOptions={grades?.data}
                    selectedSubject={selectedSubject}
                    onSubjectSelect={handleSubjectSelect}
                />
            )}
        </Container>
    );
}