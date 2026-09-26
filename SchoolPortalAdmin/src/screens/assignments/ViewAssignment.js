import React, { useCallback, useState } from 'react'
import { useViewAssignmentDetailsByIdQuery, useDeletePublishedAssignmentMutation } from '../../Redux/features/assignmentSlice'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import CustomBackButton from '../../components/Common/CustomBackbutton';
import CustomAddButton from '../../components/Common/CustomAddButton';
import { COLORS } from '../../assets/colors';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomButton from '../../components/Common/CustomButton';
import { 
    Box, 
    Grid, 
    Skeleton, 
    Typography, 
    Card, 
    CardContent, 
    Chip, 
    Alert,
    IconButton,
    Stack,
    Divider,
    Button,
    Breadcrumbs,
    Link,
    ToggleButtonGroup,
    ToggleButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    useMediaQuery,
    useTheme,
    Avatar
} from '@mui/material';
import ExamPublishedCard from '../../components/OnlineExam/ExamPublishedCard';
import AssignmentPublishCard from '../../components/assignments/AssignmentPublishCard';
import NewPublish from '../../components/assignments/NewPublish';
import useModal from '../../hooks/modalHook';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PublishIcon from '@mui/icons-material/Publish';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { BASE_PATH } from '../../config';
import { useSnackbar } from '../../hooks/SnackBar';
import UiBlocker from '../../components/Common/UiBlocker';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';
const ViewAssignment = () => {
    const { themeColors } = useThemeContext();
    const params = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const { t } = useTranslation();
    const [title, setTitle] = useState(t('assignments.view.newPublish'));
    const [viewMode, setViewMode] = useState(isDesktop ? 'table' : 'grid');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const { modal, openModal, closeModal } = useModal();
    const { data, isLoading, isError, error } = useViewAssignmentDetailsByIdQuery(params?.id)
    const [deletePublishedAssignment, { isLoading: isDeleting }] = useDeletePublishedAssignmentMutation();
    const showSnackbar = useSnackbar();
    const ability = useAbility();
    const assignment = data?.data?.assignment;
    const supportingDocuments = assignment?.supportingDocuments || [];
    const supportingNotes = assignment?.supportingNotes;

    const openAdd = useCallback(() => {
		setTitle(t('assignments.view.newPublish'));
		openModal('addModal');
	}, [openModal, t]);

	const closeAdd = useCallback(() => {
		closeModal('addModal');
	}, [closeModal]);

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const handleDeleteAssignment = (assignmentData) => {
        setSelectedAssignment(assignmentData);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setSelectedAssignment(null);
        setOpenDeleteDialog(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedAssignment) return;
        handleCloseDeleteDialog();
        try {
            await deletePublishedAssignment({
                assignmentId: selectedAssignment?.assignment?._id,
                publishId: selectedAssignment?._id
            }).unwrap();
            
            showSnackbar(t('assignments.view.messages.deleteSuccess'), 'success');
            // window.location.reload();
        } catch (error) {
            showSnackbar(error?.message ?? error?.data?.message ?? t('assignments.view.messages.error'), 'error');
            console.error('Failed to delete published assignment:', error);
        }
    };

    const handleViewFile = (fileUrl) => {
        if (fileUrl) {
            // Check if fileUrl is already a full URL (S3) or needs BASE_PATH
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_PATH}/${fileUrl}`;
            window.open(fullUrl, '_blank');
        }
    };

    const handleDownloadFile = (fileUrl) => {
        if (fileUrl) {
            const link = document.createElement('a');
            // Check if fileUrl is already a full URL (S3) or needs BASE_PATH
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_PATH}/${fileUrl}`;
            link.href = fullUrl;
            link.download = fileUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const generatePDFReport = () => {
        if (!data?.data?.publishedAssignments?.length) {
            showSnackbar(t('assignments.view.messages.noDataForReport'), 'warning');
            return;
        }

        // Create PDF report
        const reportData = {
            assignmentName: data?.data?.assignment?.assignmentName,
            totalPublished: data?.data?.publishedAssignments?.length,
            totalParticipants: data?.data?.publishedAssignments?.reduce((sum, item) => sum + (item?.totalUsersSelected || 0), 0),
            totalAttended: data?.data?.publishedAssignments?.reduce((sum, item) => sum + (item?.attendedUsers || 0), 0),
            publishedAssignments: data?.data?.publishedAssignments
        };

        // Generate PDF using jsPDF
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text(t('assignments.view.reports.title'), 105, 20, { align: 'center' });
        
        // Add assignment details
        doc.setFontSize(12);
        doc.text(`${t('assignments.view.reports.assignment')}: ${reportData.assignmentName}`, 20, 40);
        doc.text(`${t('assignments.view.reports.totalPublished')}: ${reportData.totalPublished}`, 20, 50);
        doc.text(`${t('assignments.view.reports.totalParticipants')}: ${reportData.totalParticipants}`, 20, 60);
        doc.text(`${t('assignments.view.reports.totalAttended')}: ${reportData.totalAttended}`, 20, 70);
        doc.text(`${t('assignments.view.reports.completionRate')}: ${reportData.totalParticipants ? Math.round((reportData.totalAttended / reportData.totalParticipants) * 100) : 0}%`, 20, 80);

        // Add table headers
        doc.setFontSize(10);
        doc.text(t('assignments.view.table.section'), 20, 100);
        doc.text(t('assignments.view.table.gender'), 60, 100);
        doc.text(t('assignments.view.table.dateRange'), 90, 100);
        doc.text(t('assignments.view.table.participants'), 140, 100);
        doc.text(t('assignments.view.table.status'), 170, 100);

        // Add table data
        let yPosition = 110;
        reportData.publishedAssignments.forEach((assignment, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(assignment?.section?.sectionName || t('assignments.view.notAvailable'), 20, yPosition);
            doc.text(assignment?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls'), 60, yPosition);
            doc.text(`${new Date(assignment?.startDate).toLocaleDateString()} - ${new Date(assignment?.endDate).toLocaleDateString()}`, 90, yPosition);
            doc.text(`${assignment?.attendedUsers || 0} / ${assignment?.totalUsersSelected || 0}`, 140, yPosition);
            doc.text(assignment?.attendedUsers > 0 ? t('assignments.view.status.active') : t('assignments.view.status.pending'), 170, yPosition);
            
            yPosition += 10;
        });

        // Save the PDF
        doc.save(`assignment-report-${data?.data?.assignment?.assignmentName}-${new Date().toISOString().split('T')[0]}.pdf`);
        showSnackbar(t('assignments.view.messages.pdfReportSuccess'), 'success');
    };

    const generateExcelReport = () => {
        if (!data?.data?.publishedAssignments?.length) {
            showSnackbar(t('assignments.view.messages.noDataForReport'), 'warning');
            return;
        }

        // Create Excel report data
        const reportData = data?.data?.publishedAssignments?.map((assignment, index) => ({
            [t('assignments.view.reports.excel.sn')]: index + 1,
            [t('assignments.view.reports.excel.assignmentName')]: data?.data?.assignment?.assignmentName,
            [t('assignments.view.reports.excel.section')]: assignment?.section?.sectionName || t('assignments.view.notAvailable'),
            [t('assignments.view.reports.excel.gender')]: assignment?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls'),
            [t('assignments.view.reports.excel.startDate')]: new Date(assignment?.startDate).toLocaleDateString(),
            [t('assignments.view.reports.excel.endDate')]: new Date(assignment?.endDate).toLocaleDateString(),
            [t('assignments.view.reports.excel.duration')]: Math.ceil((new Date(assignment?.endDate) - new Date(assignment?.startDate)) / (1000 * 60 * 60 * 24)),
            [t('assignments.view.reports.excel.totalParticipants')]: assignment?.totalUsersSelected || 0,
            [t('assignments.view.reports.excel.attendedUsers')]: assignment?.attendedUsers || 0,
            [t('assignments.view.reports.excel.completionRate')]: assignment?.totalUsersSelected ? Math.round((assignment.attendedUsers / assignment.totalUsersSelected) * 100) : 0,
            [t('assignments.view.reports.excel.status')]: assignment?.attendedUsers > 0 ? t('assignments.view.status.active') : t('assignments.view.status.pending')
        }));

        // Generate CSV (Excel compatible)
        const headers = Object.keys(reportData[0]);
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `assignment-report-${data?.data?.assignment?.assignmentName}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSnackbar(t('assignments.view.messages.excelReportSuccess'), 'success');
    };

    const getFileExtension = (fileUrl) => {
        if (!fileUrl) return '';
        const extension = fileUrl.split('.').pop().toLowerCase();
        return extension;
    };

    const getFileIcon = (fileUrl) => {
        const extension = getFileExtension(fileUrl);
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

    if (isError) {
        return (
            <CustomOutletBox>
                <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.data?.message || t('assignments.view.messages.loadError')}
                    </Alert>
                </Box>
            </CustomOutletBox>
        )
    }

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
                        sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
                        onClick={() => navigate('/assignments')}
                        // sx={{ cursor: 'pointer' }}
                    >
                        {t('assignments.breadcrumbs.assignments')}
                    </Link>
                    <Typography sx={{ color: themeColors.text.primary }}>
                        {data?.data?.assignment?.assignmentName || t('assignments.breadcrumbs.details')}
                    </Typography>
                </Breadcrumbs>

                {isLoading ? (
                    <Card sx={{ boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
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
                                {t('assignments.view.messages.loading')}
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Header */}
                        <Box display="flex" alignItems="center" gap={2} mb={3}
                             sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
                        >
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
                                        {data?.data?.assignment?.assignmentName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('assignments.breadcrumbs.details')}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                                {/* Report Generation Buttons */}
                                {(data?.data?.publishedAssignments?.length > 0 && ability.can('Export', 'Assignments')) && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            startIcon={<PictureAsPdfIcon />}
                                            onClick={generatePDFReport}
                                            sx={{
                                                color: themeColors.accent,
                                                borderColor: themeColors.accent,
                                                '&:hover': {
                                                    backgroundColor: themeColors.accent,
                                                    color: '#fff'
                                                }
                                            }}
                                        >
                                            {t('assignments.view.actions.pdfReport')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<TableChartIcon />}
                                            onClick={generateExcelReport}
                                            sx={{
                                                color: themeColors.primary,
                                                borderColor: themeColors.primary,
                                                '&:hover': {
                                                    backgroundColor: themeColors.primary,
                                                    color: '#fff'
                                                }
                                            }}
                                        >
                                            {t('assignments.view.actions.excelReport')}
                                        </Button>
                                    </>
                                )}
                                
                                {ability.can('Publish', 'Assignments') && <CustomButton 
                                    onClick={openAdd} 
                                    label={t('assignments.view.actions.publishNew')} 
                                    startIcon={<PublishIcon />}
                                    sx={{ backgroundColor: themeColors.primary, color: '#fff', '&:hover': { backgroundColor: themeColors.accent } }}
                                />}
                            </Box>
                        </Box>

                        {/* Assignment Details */}
                        <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
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
                                        <DescriptionIcon />
                                    </Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {t('assignments.view.description.title')}
                                    </Typography>
                                </Box>
                                
                                <Typography variant="body1" sx={{ color: themeColors.text.secondary }} mb={3}>
                                    {data?.data?.assignment?.question || t('assignments.view.description.noDescription')}
                                </Typography>

                                {/* Question File Section */}
                                {assignment?.questionFile && (
                                    <Box mt={3}>
                                        <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />
                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Box
                                                sx={{
                                                    backgroundColor: themeColors.background.secondary,
                                                    borderRadius: '50%',
                                                    width: 32,
                                                    height: 32,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.2rem'
                                                }}
                                            >
                                                {getFileIcon(data?.data?.assignment?.questionFile)}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                    {t('assignments.view.description.questionFile')}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                    {assignment?.questionFile?.split('/').pop()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleViewFile(data?.data?.assignment?.questionFile)}
                                                sx={{
                                                    color: themeColors.primary,
                                                    borderColor: themeColors.primary,
                                                    '&:hover': {
                                                        backgroundColor: themeColors.primary,
                                                        color: '#fff'
                                                    }
                                                }}
                                            >
                                                {t('assignments.view.actions.viewFile')}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<DownloadIcon />}
                                                onClick={() => handleDownloadFile(data?.data?.assignment?.questionFile)}
                                                sx={{
                                                    color: themeColors.accent,
                                                    borderColor: themeColors.accent,
                                                    '&:hover': {
                                                        backgroundColor: themeColors.accent,
                                                        color: '#fff'
                                                    }
                                                }}
                                            >
                                                {t('assignments.view.actions.download')}
                                            </Button>
                                        </Stack>
                                    </Box>
                                )}
                                {(supportingNotes || supportingDocuments.length > 0) && (
                                    <Box mt={3}>
                                        <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                            {t('assignments.view.supportingDocuments.title')}
                                        </Typography>
                                        {supportingNotes && (
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                                                <strong>{t('assignments.view.supportingDocuments.notesLabel')}:</strong> {supportingNotes}
                                            </Typography>
                                        )}
                                        {supportingDocuments.length > 0 ? (
                                            <Box display="flex" flexDirection="column" gap={1}>
                                                {supportingDocuments.map((doc) => (
                                                    <Box
                                                        key={doc.filePath}
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{
                                                            backgroundColor: themeColors.background.secondary,
                                                            borderRadius: 2,
                                                            p: 2,
                                                            border: `1px solid ${themeColors.border.primary}`,
                                                        }}
                                                    >
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <AttachFileIcon fontSize="small" sx={{ color: themeColors.text.secondary }} />
                                                            <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                                {doc.fileName || doc.filePath?.split('/').pop()}
                                                            </Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={1}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<VisibilityIcon />}
                                                                onClick={() => handleViewFile(doc.filePath)}
                                                                sx={{
                                                                    color: themeColors.primary,
                                                                    borderColor: themeColors.primary,
                                                                    '&:hover': {
                                                                        backgroundColor: themeColors.primary,
                                                                        color: '#fff',
                                                                    },
                                                                }}
                                                            >
                                                                {t('assignments.view.actions.viewFile')}
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<DownloadIcon />}
                                                                onClick={() => handleDownloadFile(doc.filePath)}
                                                                sx={{
                                                                    color: themeColors.accent,
                                                                    borderColor: themeColors.accent,
                                                                    '&:hover': {
                                                                        backgroundColor: themeColors.accent,
                                                                        color: '#fff',
                                                                    },
                                                                }}
                                                            >
                                                                {t('assignments.view.actions.download')}
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('assignments.view.supportingDocuments.empty')}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* Published Assignments */}
                        <Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('assignments.view.published.title', { count: data?.data?.publishedAssignments?.length || 0 })}
                                </Typography>
                                
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
                            
                            {data?.data?.publishedAssignments?.length > 0 ? (
                                viewMode === 'table' ? (
                                    <Card sx={{ boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: themeColors.background.secondary }}>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.sn')}</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.section')}</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.gender')}</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.dateRange')}</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.participants')}</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.status')}</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary }}>{t('assignments.view.table.actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data?.data?.publishedAssignments?.map((assignmentData, index) => (
                                                            <tr key={index} style={{ borderBottom: `1px solid ${themeColors.border.primary}` }}>
                                                                <td style={{ padding: '12px', color: themeColors.text.primary }}>{index + 1}</td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Typography variant="body2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                                        {assignmentData?.section?.sectionName || t('assignments.view.notAvailable')}
                                                                    </Typography>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Chip
                                                                        label={assignmentData?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls')}
                                                                        color={assignmentData?.gender === "male" ? "primary" : "secondary"}
                                                                        size="small"
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                                        {new Date(assignmentData?.startDate).toLocaleDateString()} - {new Date(assignmentData?.endDate).toLocaleDateString()}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                        {t('assignments.view.duration', { days: Math.ceil((new Date(assignmentData?.endDate) - new Date(assignmentData?.startDate)) / (1000 * 60 * 60 * 24)) })}
                                                                    </Typography>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                                        {assignmentData?.attendedUsers || 0} / {assignmentData?.totalUsersSelected || 0}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                        {t('assignments.view.completed', { percent: assignmentData?.attendedUsers ? Math.round((assignmentData.attendedUsers / assignmentData.totalUsersSelected) * 100) : 0 })}
                                                                    </Typography>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Chip
                                                                        label={assignmentData?.attendedUsers > 0 ? t('assignments.view.status.active') : t('assignments.view.status.pending')}
                                                                        color={assignmentData?.attendedUsers > 0 ? "success" : "warning"}
                                                                        size="small"
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Stack direction="row" spacing={1}>
                                                                        {ability.can('Read', 'Assignments') && <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            onClick={() => navigate(`${assignmentData._id}`)}
                                                                            sx={{
                                                                                color: themeColors.primary,
                                                                                borderColor: themeColors.primary,
                                                                                '&:hover': {
                                                                                    backgroundColor: themeColors.primary,
                                                                                    color: '#fff'
                                                                                }
                                                                            }}
                                                                        >
                                                                            {t('assignments.view.actions.view')}
                                                                        </Button>}
                                                                        {ability.can('Delete', 'Assignments') && <Button
                                                                            size="small"
                                                                            type='button'
                                                                            variant="outlined"
                                                                            color="error"
                                                                            onClick={() => handleDeleteAssignment(assignmentData)}
                                                                            sx={{
                                                                                borderColor: 'error.main',
                                                                                '&:hover': {
                                                                                    backgroundColor: 'error.main',
                                                                                    color: 'white'
                                                                                }
                                                                            }}
                                                                        >
                                                                            {t('assignments.view.actions.delete')}
                                                                        </Button>}
                                                                    </Stack>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Grid container spacing={3}>
                                        {data?.data?.publishedAssignments?.map((assignmentData, index) => (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                                <AssignmentPublishCard data={assignmentData} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                )
                            ) : (
                                <Card sx={{ boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
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
                                            <PublishIcon sx={{ fontSize: 40, color: themeColors.text.secondary }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ color: themeColors.text.secondary }} gutterBottom>
                                            {t('assignments.view.published.noPublished')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('assignments.view.published.noPublishedDescription')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    </>
                )}
            </Box>

            {/* Modal */}
            {modal.addModal && (
                <NewPublish 
                    open={modal.addModal} 
                    close={closeAdd} 
                    label={title} 
                    hide={false} 
                    id={false} 
                    state={data} 
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                PaperProps={{
                    sx: {
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle id="delete-dialog-title" sx={{ borderBottom: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.primary }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: `${themeColors.error}22`, color: themeColors.error }}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('assignments.view.delete.title')}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: themeColors.background.primary }}>
                    <DialogContentText id="delete-dialog-description">
                        <Typography variant="body1" mb={2} sx={{ color: themeColors.text.primary }}>
                            {t('assignments.view.delete.confirm')}
                        </Typography>
                        {selectedAssignment && (
                            <>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    <strong>{t('assignments.view.delete.assignment')}:</strong> {selectedAssignment?.assignment?.assignmentName || t('assignments.view.notAvailable')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    <strong>{t('assignments.view.delete.section')}:</strong> {selectedAssignment?.section?.sectionName || t('assignments.view.notAvailable')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    <strong>{t('assignments.view.delete.gender')}:</strong> {selectedAssignment?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    <strong>{t('assignments.view.delete.participants')}:</strong> {selectedAssignment?.attendedUsers || 0} / {selectedAssignment?.totalUsersSelected || 0}
                                </Typography>
                            </>
                        )}
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>
                            {t('assignments.view.delete.warning')}
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ backgroundColor: themeColors.background.secondary, borderTop: `1px solid ${themeColors.border.primary}` }}>
                    <Button 
                        onClick={handleCloseDeleteDialog}
                        variant="outlined"
                        disabled={isDeleting}
                        sx={{
                            borderColor: themeColors.border.primary,
                            color: themeColors.text.secondary,
                            '&:hover': { borderColor: themeColors.primary, color: themeColors.primary }
                        }}
                    >
                        {t('assignments.view.delete.cancel')}
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete}
                        variant="contained"
                        disabled={isDeleting}
                        sx={{
                            backgroundColor: themeColors.error,
                            color: themeColors.text.inverse,
                            '&:hover': { backgroundColor: themeColors.error }
                        }}
                    >
                        {isDeleting ? t('assignments.view.delete.deleting') : t('assignments.view.delete.confirmDelete')}
                    </Button>
                </DialogActions>
            </Dialog>
            <UiBlocker open={isDeleting} />
        </CustomOutletBox>
    )
}

export default ViewAssignment