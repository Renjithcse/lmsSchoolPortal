import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Divider,
    Badge,
    Paper,
    Fade,
    Zoom,
    Slide,
    Skeleton,
    Container
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../hooks/SnackBar';
import { ICONS } from '../../assets/icons';
import { useTranslation } from 'react-i18next';
import StudentSubjectNoteModal from '../../components/student/StudentSubjectNoteModal';
import moment from 'moment';
import { handleFileDownload } from '../../api/subjectNotes';
import {
    useGetStudentSubjectsWithNotesQuery,
    useLazyGetStudentSubjectNotesQuery,
    useLazyGetStudentSubjectNotesBySubjectQuery,
    useLazyGetStudentSubjectNoteQuery,
    useDownloadSubjectNoteDocumentMutation
} from '../../Redux/features/Student/studentSubjectNotesApiSlice';

const StudentSubjectNotes = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const primaryColor = themeColors.primary;
    const secondaryColor = themeColors.secondary || themeColors.primary;
    const successColor = themeColors.success || themeColors.primary;
    const inverseColor = themeColors.text.inverse;
    const showSnackbar = useSnackbar();

    const {
        data: subjectsResponse,
        isFetching: subjectsLoading,
        error: subjectsError
    } = useGetStudentSubjectsWithNotesQuery();

    const [loadAllNotes, { data: allNotesResponse, isFetching: allNotesLoading, error: allNotesError }] =
        useLazyGetStudentSubjectNotesQuery();

    const [
        loadSubjectNotes,
        { data: subjectNotesResponse, isFetching: subjectNotesLoading, error: subjectNotesError }
    ] = useLazyGetStudentSubjectNotesBySubjectQuery();

    const [
        loadNote,
        { data: noteResponse, error: noteError }
    ] = useLazyGetStudentSubjectNoteQuery();

    const [downloadDocument] = useDownloadSubjectNoteDocumentMutation();

    // Component state
    const [view, setView] = useState('subjects'); // 'subjects' | 'all' | 'subject'
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [expandedAccordion, setExpandedAccordion] = useState(false);
    const [modalNote, setModalNote] = useState(null);

    const subjects = subjectsResponse?.data?.subjects || [];
    const notesBySubject = allNotesResponse?.data?.notesBySubject || [];
    const totalNotes = allNotesResponse?.data?.totalNotes || 0;
    const totalSubjects = allNotesResponse?.data?.totalSubjects || subjects.length;
    const currentSubjectNotes = subjectNotesResponse?.data?.notes || [];
    const fallbackSubjectEntry = subjects.find(
        (subject) => subject.subject?._id?.toString() === selectedSubjectId
    );
    const currentSubject =
        subjectNotesResponse?.data?.subject || fallbackSubjectEntry?.subject || null;
    const student =
        subjectsResponse?.data?.student || allNotesResponse?.data?.student || null;
    const combinedError = subjectsError || allNotesError || subjectNotesError || noteError;
    const isLoading =
        subjectsLoading ||
        (view === 'all' && allNotesLoading) ||
        (view === 'subject' && subjectNotesLoading);

    useEffect(() => {
        if (noteResponse?.data) {
            setModalNote(noteResponse.data);
            setNoteModalOpen(true);
        }
    }, [noteResponse]);

    useEffect(() => {
        if (combinedError) {
            const message =
                combinedError?.data?.message ||
                combinedError?.message ||
                t('studentSubjectNotes.messages.defaultError');
            showSnackbar(message, 'error');
        }
    }, [combinedError, showSnackbar, t]);

    const handleViewAllNotes = () => {
        setView('all');
        setSelectedSubjectId(null);
        setExpandedAccordion(false);
        loadAllNotes();
    };

    const handleViewSubjectNotes = (subjectId) => {
        setSelectedSubjectId(subjectId);
        setView('subject');
        loadSubjectNotes(subjectId);
    };

    const handleBackToSubjects = () => {
        setView('subjects');
        setSelectedSubjectId(null);
        setExpandedAccordion(false);
    };

    const handleBackToAll = () => {
        setView('all');
        setExpandedAccordion(false);
    };

    const handleViewNote = (noteId) => {
        loadNote(noteId);
    };

    const handleCloseNoteModal = () => {
        setNoteModalOpen(false);
        setModalNote(null);
    };

    const handleDownloadDocument = async (noteId, documentId, filename, doc) => {
        if (doc && (doc.isLink || doc.linkUrl)) {
            const linkUrl = doc.linkUrl || doc.filePath;
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        const downloadingMessage = t('studentSubjectNotes.messages.downloading', { filename });

        if (doc && doc.downloadUrl) {
            const link = document.createElement('a');
            link.href = doc.downloadUrl;
            link.download = doc.originalName || filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSnackbar(downloadingMessage, 'info');
            return;
        }

        showSnackbar(downloadingMessage, 'info');
        try {
            const blob = await downloadDocument({ id: noteId, documentId }).unwrap();
            handleFileDownload({ data: blob }, filename);
            showSnackbar(t('studentSubjectNotes.messages.operationSuccess'), 'success');
        } catch (err) {
            const message =
                err?.data?.message || err?.message || t('studentSubjectNotes.messages.defaultError');
            showSnackbar(message, 'error');
        }
    };

    const getFileIcon = (mimeType, isLink) => {
        // For links, show a link icon
        if (isLink) return <ICONS.Link.component color="primary" />;
        
        if (mimeType && mimeType.includes('pdf')) return <ICONS.PictureAsPdf.component color="error" />;
        if (mimeType && mimeType.includes('word')) {
            return (
                <ICONS.Description.component
                    sx={{ color: primaryColor }}
                />
            );
        }
        if (mimeType && (mimeType.includes('powerpoint') || mimeType.includes('presentation'))) return <ICONS.Slideshow.component color="warning" />;
        if (mimeType && mimeType.includes('image')) return <ICONS.Image.component color="success" />;
        return <ICONS.AttachFile.component />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return t('studentSubjectNotes.fileSize.zeroBytes');
        const k = 1024;
        const sizes = [
            t('studentSubjectNotes.fileSize.bytes'),
            t('studentSubjectNotes.fileSize.kb'),
            t('studentSubjectNotes.fileSize.mb'),
            t('studentSubjectNotes.fileSize.gb')
        ];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderSubjectsView = () => (
        <Fade in={true} timeout={800}>
            <Box>
                {/* Hero Section with Gradient Background */}
                <Paper
                    elevation={0}
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(primaryColor, 0.15)} 0%, ${alpha(secondaryColor, 0.15)} 100%)`,
                        borderRadius: 3,
                        p: 2,
                        border: `1px solid ${themeColors.border.primary}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentSubjectNotes.title')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    {t('studentSubjectNotes.subtitle')}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={3}>
                                <Box textAlign="center">
                                <Typography variant="h4" fontWeight="bold" sx={{ color: primaryColor }}>
                                        {subjects.length}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentSubjectNotes.stats.subjects')}
                                    </Typography>
                                </Box>
                                <Box textAlign="center">
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: successColor }}>
                                        {subjects.reduce((total, subject) => total + subject.notesCount, 0)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentSubjectNotes.stats.totalNotes')}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<ICONS.ViewList.component />}
                                    onClick={handleViewAllNotes}
                                    sx={{
                                        backgroundColor: primaryColor,
                                        borderRadius: 2,
                                        px: 3,
                                        fontWeight: 'bold',
                                        boxShadow: 2,
                                        '&:hover': {
                                            boxShadow: 4,
                                            transform: 'translateY(-1px)'
                                        },
                                        color: inverseColor,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {t('studentSubjectNotes.actions.viewAll')}
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    {/* Decorative Elements */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: alpha(primaryColor, 0.08),
                            zIndex: 0
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -30,
                            left: -30,
                            width: 150,
                            height: 150,
                            borderRadius: '50%',
                            background: alpha(secondaryColor, 0.08),
                            zIndex: 0
                        }}
                    />
                </Paper>

                {/* Subjects Grid with Enhanced Design */}
                <Grid container spacing={3}>
                    {subjects.map((subject, index) => (
                        <Grid item xs={12} sm={6} md={4} key={subject.gradeSubjectId} sx={{ display: 'flex' }}>
                            <Zoom in={true} timeout={600 + index * 100}>
                                <Card
                                    sx={{
                                        border: `1px solid ${themeColors.border.primary}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                                        height: '100%',
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            transform: 'translateY(-8px) scale(1.02)',
                                            boxShadow: `0 20px 40px ${alpha(primaryColor, 0.2)}`,
                                            borderColor: primaryColor,
                                            '& .subject-icon': {
                                                transform: 'rotate(10deg) scale(1.1)',
                                            },
                                            '& .arrow-icon': {
                                                transform: 'translateX(8px)',
                                            }
                                        }
                                    }}
                                    onClick={() => handleViewSubjectNotes(subject.subject._id)}
                                >
                                    {/* Gradient Overlay */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: 4,
                                            background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                                        }}
                                    />

                                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                            <Avatar
                                            className="subject-icon"
                                            sx={{
                                                backgroundColor: primaryColor,
                                                width: 56,
                                                height: 56,
                                                transition: 'all 0.3s ease',
                                                boxShadow: 3
                                            }}
                                            >
                                                <ICONS.Subject.component sx={{ fontSize: 28 }} />
                                            </Avatar>
                                            <Badge
                                                badgeContent={subject.notesCount}
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        minWidth: 24,
                                                        height: 24,
                                                        backgroundColor: primaryColor,
                                                        color: inverseColor,
                                                    },
                                                }}
                                            >
                                                <Avatar sx={{ backgroundColor: successColor, width: 40, height: 40 }}>
                                                    <ICONS.Note.component sx={{ fontSize: 20 }} />
                                                </Avatar>
                                            </Badge>
                                        </Box>

                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                            {subject.subject.subjectName}
                                        </Typography>

                                        {subject.teacher && (
                                            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                                                <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                                                    {subject.teacher.employeeName.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {subject.teacher.employeeName}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium" sx={{ color: primaryColor }}>
                                                    {t('studentSubjectNotes.labels.notes', { count: subject.notesCount })}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                    {t('studentSubjectNotes.labels.studyMaterialsAvailable')}
                                                </Typography>
                                            </Box>
                                            <ICONS.ArrowForward.component
                                                className="arrow-icon"
                                                sx={{
                                                    color: primaryColor,
                                                    fontSize: 24,
                                                    transition: 'all 0.3s ease'
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Zoom>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Fade>
    );

    const renderAllNotesView = () => (
        <>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<ICONS.ArrowBack.component />}
                    onClick={handleBackToSubjects}
                    sx={{ mr: 2 }}
                >
                    {t('studentSubjectNotes.actions.backToSubjects')}
                </Button>
                <Typography variant="h5" fontWeight="bold">
                    {t('studentSubjectNotes.sections.allNotes', { totalNotes, totalSubjects })}
                </Typography>
            </Box>

            {notesBySubject.map((subjectGroup) => (
                <Accordion
                    key={subjectGroup.subject._id}
                    expanded={expandedAccordion === subjectGroup.subject._id}
                    onChange={() => setExpandedAccordion(
                        expandedAccordion === subjectGroup.subject._id ? false : subjectGroup.subject._id
                    )}
                    sx={{ mb: 2, border: `1px solid ${themeColors.border.primary}` }}
                >
                    <AccordionSummary expandIcon={<ICONS.ExpandMore.component />}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mr={2}>
                            <Typography variant="h6" fontWeight="bold">
                                {subjectGroup.subject.subjectName}
                            </Typography>
                            <Chip
                                label={t('studentSubjectNotes.labels.notesCount', { count: subjectGroup.notes.length })}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                    fontWeight: 600,
                                }}
                            />
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {subjectGroup.notes.map((note) => (
                                <Grid item xs={12} md={6} key={note._id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { boxShadow: 2 }
                                        }}
                                        onClick={() => handleViewNote(note._id)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                                                {note.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 2, color: themeColors.text.secondary }}>
                                                {note.description.substring(0, 100)}...
                                            </Typography>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                    {moment(note.publishedAt || note.createdAt).format('MMM DD, YYYY')}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                    {t('studentSubjectNotes.labels.files', { count: note.documents?.length || 0 })}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            ))}
        </>
    );

    const renderSubjectNotesView = () => (
        <Slide direction="left" in={true} timeout={600}>
            <Box>
                {/* Header with Breadcrumb */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            color: inverseColor
          }}
        >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                            <Button
                                startIcon={<ICONS.ArrowBack.component />}
                                onClick={handleBackToSubjects}
                                sx={{
                                    mr: 2,
                                    color: inverseColor,
                                    '&:hover': {
                                        backgroundColor: `${inverseColor}10`
                                    }
                                }}
                            >
                                {t('studentSubjectNotes.actions.backToSubjects')}
                            </Button>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: inverseColor }}>
                                    {currentSubject?.subjectName}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, color: inverseColor }}>
                                    {t('studentSubjectNotes.labels.materialsAvailable', { count: currentSubjectNotes.length })}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Enhanced Notes Grid */}
                <Grid container spacing={3}>
                    {currentSubjectNotes.map((note, index) => (
                        <Grid item xs={12} md={6} key={note._id} sx={{ display: 'flex' }}>
                            <Zoom in={true} timeout={400 + index * 100}>
                                <Card
                                    sx={{
                                        border: `1px solid ${themeColors.border.primary}`,
                                        cursor: 'pointer',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        height: '100%',
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 12px 24px ${alpha(primaryColor, 0.15)}`,
                                            borderColor: primaryColor,
                                            '& .download-section': {
                                                backgroundColor: alpha(primaryColor, 0.08)
                                            }
                                        }
                                    }}
                                    onClick={() => handleViewNote(note._id)}
                                >
                                    {/* Status Indicator */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            background: successColor,
                                            color: inverseColor,
                                            px: 2,
                                            py: 0.5,
                                            borderBottomLeftRadius: 2,
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {t('studentSubjectNotes.labels.filesCount', { count: note.documents?.length || 0 })}
                                    </Box>

                                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, pr: 8, color: themeColors.text.primary }}>
                                            {note.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6, color: themeColors.text.secondary }}>
                                            {note.description.length > 120 ? `${note.description.substring(0, 120)}...` : note.description}
                                        </Typography>

                                        {note.tags && note.tags.length > 0 && (
                                            <Box sx={{ mb: 3 }}>
                                                {note.tags.slice(0, 3).map((tag, tagIndex) => (
                                                    <Chip
                                                        key={tagIndex}
                                                        label={tag}
                                                        size="small"
                                                        sx={{
                                                            mr: 0.5,
                                                            mb: 0.5,
                                                            backgroundColor: alpha(primaryColor, 0.15),
                                                            color: primaryColor,
                                                            fontWeight: 'medium'
                                                        }}
                                                    />
                                                ))}
                                                {note.tags.length > 3 && (
                                                    <Chip
                                                        label={t('studentSubjectNotes.labels.moreTags', { count: note.tags.length - 3 })}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                    />
                                                )}
                                            </Box>
                                        )}

                                        {/* Enhanced Documents Section */}
                                        {note.documents && note.documents.length > 0 && (
                                            <Paper
                                                className="download-section"
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    mb: 2,
                                                    backgroundColor: alpha(themeColors.background.secondary, 0.5),
                                                    borderRadius: 2,
                                                    border: `1px solid ${themeColors.border.primary}`,
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                        {t('studentSubjectNotes.labels.documents', { count: note.documents.length })}
                                                    </Typography>
                                                    {note.documents.length > 1 && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<ICONS.Download.component />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                note.documents.forEach(doc => {
                                                                    handleDownloadDocument(note._id, doc._id, doc.originalName, doc);
                                                                });
                                                            }}
                                                            sx={{
                                                                backgroundColor: primaryColor,
                                                                borderRadius: 2,
                                                                px: 2,
                                                                color: inverseColor,
                                                                '&:hover': {
                                                                    backgroundColor: primaryColor,
                                                                    opacity: 0.9,
                                                                },
                                                            }}
                                                        >
                                                            {t('studentSubjectNotes.actions.downloadAll')}
                                                        </Button>
                                                    )}
                                                </Box>

                                                <Grid container spacing={1}>
                                                    {note.documents.map((doc, docIndex) => (
                                                        <Grid item xs={12} sm={6} key={doc._id}>
                                                            <Paper
                                                                elevation={0}
                                                                sx={{
                                                                    p: 1.5,
                                                                    border: `1px solid ${themeColors.border.primary}`,
                                                                    borderRadius: 2,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        backgroundColor: primaryColor,
                                                                        color: inverseColor,
                                                                        transform: 'scale(1.02)',
                                                                        '& .MuiTypography-root': {
                                                                            color: inverseColor,
                                                                        },
                                                                    }
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownloadDocument(note._id, doc._id, doc.originalName, doc);
                                                                }}
                                                            >
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    {getFileIcon(doc.mimeType, doc.isLink)}
                                                                    <Box flex={1}>
                                                                        <Typography variant="body2" fontWeight="medium" noWrap>
                                                                            {doc.originalName}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                            {doc.isLink ? (
                                                                                t('studentSubjectNotes.labels.externalLink')
                                                                            ) : (
                                                                                formatFileSize(doc.fileSize)
                                                                            )}
                                                                        </Typography>
                                                                    </Box>
                                                                    {doc.isLink ? (
                                                                        <ICONS.Link.component fontSize="small" />
                                                                    ) : (
                                                                        <ICONS.Download.component fontSize="small" />
                                                                    )}
                                                                </Box>
                                                            </Paper>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Paper>
                                        )}

                                        <Box sx={{ mt: 'auto' }}>
                                            <Divider sx={{ mb: 2 }} />
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <ICONS.Visibility.component fontSize="small" color="action" />
                                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                        {t('studentSubjectNotes.labels.views', { count: note.viewCount || 0 })}
                                                    </Typography>
                                                </Box>
                                                {note.createdBy && (
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                                                            {note.createdBy?.name?.charAt(0).toUpperCase() || 'U'}
                                                        </Avatar>
                                                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                            {t('studentSubjectNotes.labels.createdBy')}: {note.createdBy?.name || t('studentSubjectNotes.labels.unknown')}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                    {t('studentSubjectNotes.labels.publishedDate')}: {moment(note.publishedAt || note.createdAt).format('MMM DD, YYYY')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Zoom>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Slide>
    );

    return (
        <Container
            maxWidth="xl"
            sx={{
                py: 1,
                backgroundColor: themeColors.background.primary,
                minHeight: '100vh',
                color: themeColors.text.primary,
            }}
        >
            {/* Enhanced Header with Student Info */}
             <Paper
                 elevation={0}
                 sx={{
                     background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                     color: inverseColor,
                     borderRadius: 3,
                     p: 2,
                     mb: 2,
                     position: 'relative',
                     overflow: 'hidden'
                 }}
             >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5, color: 'inherit' }}>
                        {t('studentSubjectNotes.breadcrumbs.subjectNotes')}
                    </Typography>
                    {student && (
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, color: inverseColor }}>
                            {student.grade} - {student.section} • {student.academicYear}
                        </Typography>
                    )}

                    {/* Breadcrumb Navigation */}
                    <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                            label={t('studentSubjectNotes.breadcrumbs.dashboard')}
                            size="small"
                            sx={{
                                backgroundColor: `${inverseColor}20`,
                                color: inverseColor,
                                '&:hover': { backgroundColor: `${inverseColor}30` }
                            }}
                            onClick={() => window.location.href = '/students'}
                        />
                        <Typography sx={{ color: inverseColor, opacity: 0.7 }}>›</Typography>
                        <Chip
                            label={t('studentSubjectNotes.breadcrumbs.subjectNotes')}
                            size="small"
                            sx={{ backgroundColor: `${inverseColor}30`, color: inverseColor }}
                        />
                        {view !== 'subjects' && (
                            <>
                                <Typography sx={{ color: inverseColor, opacity: 0.7 }}>›</Typography>
                                <Chip
                                    label={view === 'all' ? t('studentSubjectNotes.breadcrumbs.allNotes') : currentSubject?.subjectName || t('studentSubjectNotes.breadcrumbs.subject')}
                                    size="small"
                                    sx={{ backgroundColor: `${inverseColor}30`, color: inverseColor }}
                                />
                            </>
                        )}
                    </Box>
                </Box>

                {/* Decorative Background Elements */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        zIndex: 0
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -80,
                        left: -80,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        zIndex: 0
                    }}
                />
            </Paper>

            {/* Error Alert with Enhanced Styling */}
            {combinedError && (
                <Fade in={true}>
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            borderRadius: 2
                        }}
                    >
                        {combinedError?.data?.message || combinedError?.message || t('studentSubjectNotes.messages.defaultError')}
                    </Alert>
                </Fade>
            )}

            {/* Enhanced Loading with Skeletons */}
            {isLoading && (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item}>
                            <Card sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Skeleton variant="circular" width={48} height={48} />
                                        <Skeleton variant="circular" width={32} height={32} />
                                    </Box>
                                    <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                                    <Skeleton variant="text" height={16} width="60%" sx={{ mb: 1 }} />
                                    <Skeleton variant="text" height={16} width="40%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Content based on view with animations */}
            {!isLoading && (
                <Box>
                    {view === 'subjects' && renderSubjectsView()}
                    {view === 'all' && renderAllNotesView()}
                    {view === 'subject' && renderSubjectNotesView()}
                </Box>
            )}

            {/* Enhanced Note Detail Modal */}
            <StudentSubjectNoteModal
                open={noteModalOpen}
                onClose={handleCloseNoteModal}
                note={modalNote}
                onDownload={handleDownloadDocument}
            />
        </Container>
    );
};

export default StudentSubjectNotes;
