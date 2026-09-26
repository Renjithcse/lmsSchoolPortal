
import React, { memo, useCallback, useState, useMemo } from 'react';
import {
    Typography,
    Box,
    Stack,
    Tooltip,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Grid,
    ToggleButtonGroup,
    ToggleButton,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Divider,
    Avatar
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { viewPublishedExam } from '../../api/onlineExam';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../../components/Common/CustomTable';
import { ICONS } from '../../assets/icons';
import { COLORS } from '../../assets/colors';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import QuestionCard from '../../components/OnlineExam/QuestionCard';
import useModal from '../../hooks/modalHook';
import EditPublish from '../../components/OnlineExam/EditPublish';
import { usePublishAssignmentDetailsByIdQuery, useUpdateTeacherRemarksMutation } from '../../Redux/features/assignmentSlice';
import PublishedAssignmentDetails from '../../components/assignments/PublishedAssignmentDetails';
import CustomBackButton from '../../components/Common/CustomBackbutton';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { BASE_PATH } from '../../config';
import { useSnackbar } from '../../hooks/SnackBar';
import UiBlocker from '../../components/Common/UiBlocker';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';
const ViewPublished = () => {
    const { themeColors } = useThemeContext();
    const { id } = useParams();
    const { modal, openModal, closeModal } = useModal();
    const queryClient = useQueryClient();
    const showSnackbar = useSnackbar()
    const navigate = useNavigate()
    const params = useParams();
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState('table');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [updateTeacherRemarks, { isLoading: isUpdatingRemarks }] = useUpdateTeacherRemarksMutation();
    const [selectedStudentForView, setSelectedStudentForView] = useState(null);
    const ability = useAbility();

    const closeAdd = useCallback(async () => {
        closeModal('addModal');
        await queryClient.invalidateQueries({ queryKey: ['singlePublished', id] })
    }, [closeModal]);

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const handleOpenRemarksDialog = (student) => {
        setSelectedStudent(student);
        setRemarks(student?.teacherRemarks || '');
        // console.log("in handleOpenRemarksDialog", student)
        openModal('remarksModal');
    };

    const handleCloseRemarksDialog = () => {
        setSelectedStudent(null);
        setRemarks('');
        closeModal('remarksModal');
    };

    const handleSubmitRemarks = async () => {
        if (!selectedStudent || !remarks.trim()) return;

        try {
            handleCloseRemarksDialog();
            const res = await updateTeacherRemarks({
                attemptId: selectedStudent._id,
                data: { teacherRemarks: remarks.trim() }
            }).unwrap();


            if (res?.success) {
                showSnackbar(res?.message, 'success');
            } else {
                showSnackbar(res?.message ?? res?.data?.error?.message ?? t('assignments.viewPublished.messages.error'), 'error');
            }

            // Refresh the data
            await queryClient.invalidateQueries({ queryKey: ['publishAssignmentDetailsById', params.id] });


        } catch (error) {
            handleCloseRemarksDialog();
            showSnackbar(error?.message ?? error?.data?.message ?? t('assignments.viewPublished.messages.error'), 'error');
        }
    };

    const handleViewStudentDetails = (student) => {
        console.log({ student })
        setSelectedStudentForView(student);
        openModal('viewStudentModal');
    };

    const handleCloseViewStudentDialog = () => {
        setSelectedStudentForView(null);
        closeModal('viewStudentModal');
    };

    const handleDownloadAttachment = (fileUrl) => {
        // console.log({ fileUrl })
        // return false;
        if (fileUrl) {
            const link = document.createElement('a');
            // Check if fileUrl is already a full URL (S3) or needs BASE_PATH
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_PATH}${fileUrl}`;
            link.href = fullUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const getFileIcon = (fileUrl) => {
        if (!fileUrl) return '';
        const extension = fileUrl.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                return '📄';
            case 'jpg':
            case 'jpeg':
            case 'png':
                return '🖼️';
            default:
                return '📎';
        }
    };

    const columns = useMemo(() => [
        {
            field: 'SN',
            headerName: t('assignments.viewPublished.table.sn'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        {
            field: "studentID",
            headerName: t('assignments.viewPublished.table.studentId'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.studentId.studentID
        },
        {
            field: "studentName",
            headerName: t('assignments.viewPublished.table.studentName'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.studentId.studentName
        },
        {
            field: 'teacherRemarks',
            headerName: t('assignments.viewPublished.table.teacherRemarks'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.teacherRemarks || t('assignments.viewPublished.noRemarks'),
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {params.value}
                </Typography>
            )
        },
        {
            field: "status",
            headerName: t('assignments.viewPublished.table.status'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.attendedStatus ? t('assignments.viewPublished.status.attended') : t('assignments.viewPublished.status.pending'),
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === t('assignments.viewPublished.status.attended') ? "success" : "warning"}
                    size="small"
                />
            )
        },
        {
            field: 'Action',
            headerName: t('assignments.viewPublished.table.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={'center'} gap={1} direction={'row'}>
                    <Box onClick={() => handleViewStudentDetails(row)}>
                        <Tooltip title={t('assignments.viewPublished.actions.viewDetails')}>
                            <VisibilityIcon sx={{
                                fontSize: 18,
                                color: themeColors.accent,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7 }
                            }} />
                        </Tooltip>
                    </Box>
                    <Box onClick={() => handleOpenRemarksDialog(row)}>
                        <Tooltip title={t('assignments.viewPublished.actions.editRemarks')}>
                            <EditIcon sx={{
                                fontSize: 18,
                                color: themeColors.primary,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.7 }
                            }} />
                        </Tooltip>
                    </Box>
                </Stack>
            ),
        }
    ], [t, themeColors]);

    const { data, isLoading } = usePublishAssignmentDetailsByIdQuery(params.id)

    console.log({ data })

    if (isLoading) {
        return (
            <CustomOutletBox>
                <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                    <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Box
                                sx={{
                                    backgroundColor: themeColors.background.secondary,
                                    borderRadius: '50%',
                                    width: 80,
                                    height: 80,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    mb: 2
                                }}
                            >
                                <AssignmentIcon sx={{ fontSize: 40, color: themeColors.text.secondary }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
                                {t('assignments.viewPublished.messages.loading')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </CustomOutletBox>
        )
    }

    const ParticipantCard = ({ participant, index }) => (
        <Card sx={{
            boxShadow: 2,
            borderRadius: 2,
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${themeColors.border.primary}`,
            backgroundColor: themeColors.background.primary,
            '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
            }
        }}>
            <CardContent sx={{ p: 2, flex: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                        sx={{
                            backgroundColor: `${themeColors.primary}22`,
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: themeColors.primary,
                            fontWeight: 'bold'
                        }}
                    >
                        {participant?.studentId?.studentName?.charAt(0)?.toUpperCase() || 'S'}
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {participant?.studentId?.studentName || t('assignments.viewPublished.unknownStudent')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            {t('assignments.viewPublished.studentId')}: {participant?.studentId?.studentID || t('assignments.view.notAvailable')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                        <IconButton
                            size="small"
                            onClick={() => handleViewStudentDetails(participant)}
                            sx={{
                                color: themeColors.accent,
                                '&:hover': {
                                    backgroundColor: themeColors.accent,
                                    color: '#fff'
                                }
                            }}
                        >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => handleOpenRemarksDialog(participant)}
                            sx={{
                                color: themeColors.primary,
                                '&:hover': {
                                    backgroundColor: themeColors.primary,
                                    color: '#fff'
                                }
                            }}
                        >
                            <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Stack>
                </Box>

                <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('assignments.viewPublished.status.label')}:
                        </Typography>
                        <Chip
                            label={participant?.attendedStatus ? t('assignments.viewPublished.status.attended') : t('assignments.viewPublished.status.pending')}
                            color={participant?.attendedStatus ? "success" : "warning"}
                            size="small"
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }} mb={1}>
                            {t('assignments.viewPublished.remarks.label')}:
                        </Typography>
                        <Typography variant="body2" sx={{
                            backgroundColor: themeColors.background.secondary,
                            color: themeColors.text.primary,
                            p: 1,
                            borderRadius: 1,
                            fontSize: '0.875rem',
                            minHeight: '2.5rem',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {participant?.teacherRemarks || t('assignments.viewPublished.noRemarks')}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                {/* Breadcrumbs */}
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    sx={{ mb: 3, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}
                >
                    <Link
                        underline="hover"
                        onClick={() => navigate('/assignments')}
                        sx={{ cursor: 'pointer', color: themeColors.text.secondary }}
                    >
                        {t('assignments.breadcrumbs.assignments')}
                    </Link>
                    <Link
                        underline="hover"
                        onClick={() => navigate(`/assignments/view/${data?.data?.publishedAssignment?.assignment?._id}`)}
                        sx={{ cursor: 'pointer', color: themeColors.text.secondary }}
                    >
                        {data?.data?.publishedAssignment?.assignment?.assignmentName || t('assignments.viewPublished.assignment')}
                    </Link>
                    <Typography sx={{ color: themeColors.text.primary }}>
                        {t('assignments.breadcrumbs.publishedDetails')}
                    </Typography>
                </Breadcrumbs>

                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={3} sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}>
                    <CustomBackButton />
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box
                            sx={{
                                backgroundColor: `${themeColors.primary}22`,
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: themeColors.primary
                            }}
                        >
                            <AssignmentIcon />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                {data?.data?.publishedAssignment?.assignment?.assignmentName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('assignments.breadcrumbs.publishedDetails')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Assignment Details */}
                <PublishedAssignmentDetails data={data} />

                {/* Participants Section */}
                <Card sx={{ mt: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box
                                    sx={{
                                        backgroundColor: `${themeColors.primary}22`,
                                        borderRadius: '50%',
                                        width: 32,
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: themeColors.primary
                                    }}
                                >
                                    <PeopleIcon />
                                </Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('assignments.viewPublished.participants.title', { count: data?.data?.students?.length || 0 })}
                                </Typography>
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
                                            color: '#fff',
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
                                <ToggleButton value="table" aria-label="table view">
                                    <ViewListIcon />
                                </ToggleButton>
                                <ToggleButton value="grid" aria-label="grid view">
                                    <ViewModuleIcon />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {data?.data?.students && data?.data?.students?.length > 0 ? (
                            viewMode === 'table' ? (
                                <DataTable 
                                    columns={columns} 
                                    rows={data?.data?.students} 
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
                            ) : (
                                <Grid container spacing={3}>
                                    {data?.data?.students?.map((participant, index) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={participant._id || index}>
                                            <ParticipantCard participant={participant} index={index} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )
                        ) : (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        backgroundColor: themeColors.background.secondary,
                                        borderRadius: '50%',
                                        width: 80,
                                        height: 80,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        mb: 2
                                    }}
                                >
                                    <PeopleIcon sx={{ fontSize: 40, color: themeColors.text.secondary }} />
                                </Box>
                                <Typography variant="h6" sx={{ color: themeColors.text.secondary }} gutterBottom>
                                    {t('assignments.viewPublished.participants.noParticipants')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    {t('assignments.viewPublished.participants.noParticipantsDescription')}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {modal.addModal && (
                    <EditPublish
                        open={modal.addModal}
                        close={closeAdd}
                        label={t('assignments.viewPublished.updatePublishedDate')}
                        hide={false}
                        id={false}
                        data={data?.publishedExam}
                    />
                )}

                {/* Teacher Remarks Dialog */}
                <Dialog
                    open={modal.remarksModal}
                    onClose={handleCloseRemarksDialog}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                            borderRadius: 2
                        }
                    }}
                >
                    <DialogTitle sx={{ borderBottom: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.primary }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 32, height: 32, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                {t('assignments.viewPublished.remarks.editTitle')}
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ backgroundColor: themeColors.background.primary, pt: 2 }}>
                        <Box mb={2}>
                            <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }} mb={0.5}>
                                {t('assignments.viewPublished.remarks.student')}: {selectedStudent?.studentId?.studentName || t('assignments.viewPublished.unknown')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('assignments.viewPublished.studentId')}: {selectedStudent?.studentId?.studentID || t('assignments.view.notAvailable')}
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label={t('assignments.viewPublished.remarks.label')}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder={t('assignments.viewPublished.remarks.placeholder')}
                            variant="outlined"
                            sx={{
                                mt: 1.5,
                                '& .MuiInputLabel-root': { color: themeColors.text.secondary },
                                '& .MuiOutlinedInput-root': {
                                    color: themeColors.text.primary,
                                    '& fieldset': { borderColor: themeColors.border.primary },
                                    '&:hover fieldset': { borderColor: themeColors.primary },
                                    '&.Mui-focused fieldset': { borderColor: themeColors.primary }
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ backgroundColor: themeColors.background.secondary, borderTop: `1px solid ${themeColors.border.primary}` }}>
                        <Button
                            onClick={handleCloseRemarksDialog}
                            variant="outlined"
                            sx={{
                                borderColor: themeColors.border.primary,
                                color: themeColors.text.secondary,
                                '&:hover': { borderColor: themeColors.primary, color: themeColors.primary }
                            }}
                        >
                            {t('assignments.viewPublished.remarks.cancel')}
                        </Button>
                        <Button
                            onClick={handleSubmitRemarks}
                            variant="contained"
                            disabled={isUpdatingRemarks || !remarks.trim()}
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: themeColors.text.inverse,
                                '&:hover': { backgroundColor: themeColors.accent, color: themeColors.text.inverse },
                                '&.Mui-disabled': { backgroundColor: themeColors.background.secondary, color: themeColors.text.disabled }
                            }}
                        >
                            {isUpdatingRemarks ? t('assignments.viewPublished.remarks.saving') : t('assignments.viewPublished.remarks.save')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Student Details Dialog */}
                <Dialog
                    open={modal.viewStudentModal}
                    onClose={handleCloseViewStudentDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ borderBottom: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.primary }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <VisibilityIcon sx={{ color: themeColors.accent }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                {t('assignments.viewPublished.studentDetails.title')}
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ backgroundColor: themeColors.background.primary }}>
                        {selectedStudentForView && (
                            <Box>
                                {/* Student Information */}
                                <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }} mb={2}>
                                            {t('assignments.viewPublished.studentDetails.studentInformation')}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('assignments.viewPublished.studentDetails.studentName')}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                    {selectedStudentForView?.studentId?.studentName || t('assignments.view.notAvailable')}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('assignments.viewPublished.studentDetails.studentId')}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                    {selectedStudentForView?.studentId?.studentID || t('assignments.view.notAvailable')}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('assignments.viewPublished.table.status')}
                                                </Typography>
                                                <Chip
                                                    label={selectedStudentForView?.attendedStatus ? t('assignments.viewPublished.status.attended') : t('assignments.viewPublished.status.pending')}
                                                    color={selectedStudentForView?.attendedStatus ? "success" : "warning"}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('assignments.viewPublished.studentDetails.mark')}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" sx={{ color: themeColors.text.primary }}  >
                                                    {selectedStudentForView?.securedMark || t('assignments.view.notAvailable')}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Student Answer */}
                                {selectedStudentForView?.studentAnswer && (
                                    <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }} mb={2}>
                                                {t('assignments.viewPublished.studentDetails.studentAnswer')}
                                            </Typography>
                                            <Typography variant="body1" sx={{
                                                backgroundColor: themeColors.background.secondary,
                                                p: 2,
                                                borderRadius: 1,
                                                whiteSpace: 'pre-wrap',
                                                color: themeColors.text.primary
                                            }}>
                                                {selectedStudentForView.studentAnswer}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Student Attachment */}
                                {selectedStudentForView?.studentAttachment && (
                                    <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }} mb={2}>
                                                {t('assignments.viewPublished.studentDetails.studentAttachment')}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                <Box
                                                    sx={{
                                                        backgroundColor: themeColors.background.secondary,
                                                        borderRadius: '50%',
                                                        width: 40,
                                                        height: 40,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.5rem'
                                                    }}
                                                >
                                                    {getFileIcon(selectedStudentForView.studentAttachment)}
                                                </Box>
                                                <Box flex={1}>
                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                        {selectedStudentForView.studentAttachment.split('/').pop()}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                        {t('assignments.viewPublished.studentDetails.submittedFile')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                startIcon={<DownloadIcon />}
                                                type='button'
                                                onClick={() => handleDownloadAttachment(selectedStudentForView.studentAttachment)}
                                                sx={{
                                                    color: themeColors.accent,
                                                    borderColor: themeColors.accent,
                                                    '&:hover': { backgroundColor: themeColors.accent, color: '#fff' }
                                                }}
                                            >
                                                {t('assignments.viewPublished.studentDetails.downloadAttachment')}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Teacher Remarks */}
                                {selectedStudentForView?.teacherRemarks && (
                                    <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }} mb={2}>
                                                {t('assignments.viewPublished.studentDetails.teacherRemarks')}
                                            </Typography>
                                            <Typography variant="body1" sx={{
                                                backgroundColor: themeColors.background.secondary,
                                                p: 2,
                                                borderRadius: 1
                                            }}>
                                                {selectedStudentForView.teacherRemarks}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* No Content Message */}
                                {!selectedStudentForView?.studentAnswer && !selectedStudentForView?.studentAttachment && !selectedStudentForView?.teacherRemarks && (
                                    <Card sx={{ boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                            <Typography variant="h6" sx={{ color: themeColors.text.secondary }} gutterBottom>
                                                {t('assignments.viewPublished.studentDetails.noAdditionalDetails')}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('assignments.viewPublished.studentDetails.noAdditionalDetailsDescription')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ backgroundColor: themeColors.background.secondary, borderTop: `1px solid ${themeColors.border.primary}` }}>
                        <Button
                            onClick={handleCloseViewStudentDialog}
                            variant="contained"
                            sx={{ backgroundColor: themeColors.accent, '&:hover': { backgroundColor: themeColors.primary } }}
                        >
                            {t('assignments.viewPublished.studentDetails.close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
            <UiBlocker open={isUpdatingRemarks} />
        </CustomOutletBox>
    )
}

export default ViewPublished