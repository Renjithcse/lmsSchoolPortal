import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Avatar,
    Paper,
    Divider,
    Container,
    IconButton,
    Fade
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../hooks/SnackBar';
import { ICONS } from '../../assets/icons';
import { useGetStudentInformationQuery } from '../../Redux/features/Student/studentInformationApiSlice';
import { skipToken } from '@reduxjs/toolkit/query/react';
import moment from 'moment';
import CustomBackButton from '../../components/Common/CustomBackbutton';
import { useTranslation } from 'react-i18next';

const ViewStudentInformation = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const primaryColor = themeColors.primary;
    const secondaryColor = themeColors.secondary || themeColors.primary;
    const successColor = themeColors.success || themeColors.primary;
    const warningColor = themeColors.warning || themeColors.primary;
    const errorColor = themeColors.error || themeColors.primary;
    const infoColor = themeColors.info || themeColors.primary;
    const inverseColor = themeColors.text.inverse;
    const navigate = useNavigate();
    const { id } = useParams();
    const showSnackbar = useSnackbar();

    const {
        data: informationResponse,
        isLoading,
        error
    } = useGetStudentInformationQuery(id ?? skipToken);

    const currentInformation = informationResponse?.data?.information || informationResponse?.data;

    useEffect(() => {
        if (error) {
            const message = error?.data?.message || error?.message || t('viewStudentInformation.messages.defaultError');
            showSnackbar(message, 'error');
        }
    }, [error, showSnackbar, t]);

    const formatStatusLabel = () => {
        if (currentInformation?.scheduledPublishDate && currentInformation.status === 'Draft') {
            return `${t('studentInformation.status.scheduled')} ${moment(currentInformation.scheduledPublishDate).format('MMM DD, YYYY')}`;
        }
        const key = currentInformation?.status ? currentInformation.status.toLowerCase() : 'draft';
        return t(`studentInformation.status.${key}`) || currentInformation?.status;
    };

    const getCategoryIcon = (categoryName) => {
        switch (categoryName) {
            case t('viewStudentInformation.categories.informationDesk'):
            case 'Information Desk':
                return <ICONS.Info.component />;
            case t('viewStudentInformation.categories.helpDesk'):
            case 'Help Desk':
                return <ICONS.Help.component />;
            case t('viewStudentInformation.categories.generalInformation'):
            case 'General Information':
                return <ICONS.Announcement.component />;
            default:
                return <ICONS.Info.component />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case t('viewStudentInformation.priority.high'):
            case 'High':
                return errorColor;
            case t('viewStudentInformation.priority.medium'):
            case 'Medium':
                return warningColor;
            case t('viewStudentInformation.priority.low'):
            case 'Low':
                return successColor;
            default:
                return themeColors.text.secondary;
        }
    };

    const handleDownloadAttachment = (attachment) => {
        // Open attachment in new tab or download
        window.open(attachment.filePath, '_blank');
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress size={60} sx={{ color: themeColors.primary }} />
                </Box>
            </Container>
        );
    }

    if (!currentInformation) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <CustomBackButton />
                    <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                        {t('viewStudentInformation.title')}
                    </Typography>
                </Box>
                <Paper
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: themeColors.background.secondary,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: 3
                    }}
                >
                    <ICONS.Info.component sx={{ fontSize: 64, color: themeColors.text.disabled, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
                        {t('viewStudentInformation.messages.notFound')}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<ICONS.ArrowBack.component />}
                        onClick={() => navigate('/students/information')}
                        sx={{
                            mt: 2,
                            backgroundColor: themeColors.primary,
                            '&:hover': {
                                backgroundColor: themeColors.primary,
                                opacity: 0.9
                            }
                        }}
                    >
                        {t('viewStudentInformation.actions.backToInformationCenter')}
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Fade in={true} timeout={600}>
                <Box>
                    {/* Header */}
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <CustomBackButton />
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('viewStudentInformation.title')}
                        </Typography>
                    </Box>

                    {/* Main Content Card */}
                    <Card
                        sx={{
                            border: `1px solid ${themeColors.border.primary}`,
                            borderRadius: 3,
                            overflow: 'hidden',
                            backgroundColor: themeColors.background.primary
                        }}
                    >
                        {/* Hero Section */}
                        <Box
                            sx={{
                                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                                color: inverseColor,
                                p: 4
                            }}
                        >
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={8}>
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Avatar
                                            sx={{
                                                backgroundColor: inverseColor,
                                                color: primaryColor,
                                                width: 56,
                                                height: 56
                                            }}
                                        >
                                            {getCategoryIcon(currentInformation.category)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit', mb: 0.5 }}>
                                                {currentInformation.title}
                                            </Typography>
                                            <Typography variant="body1" sx={{ opacity: 0.9, color: 'inherit' }}>
                                                {currentInformation.category}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                                        <Chip
                                            label={currentInformation.priority || t('viewStudentInformation.priority.normal')}
                                            sx={{
                                                backgroundColor: inverseColor,
                                                color: getPriorityColor(currentInformation.priority),
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.9 }}>
                                            {t('viewStudentInformation.labels.published', { date: moment(currentInformation.publishedAt || currentInformation.createdAt).format('MMM DD, YYYY') })}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        <CardContent sx={{ p: 4 }}>
                            {/* Description */}
                            <Box mb={4}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('viewStudentInformation.sections.description')}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: themeColors.text.secondary,
                                        lineHeight: 1.8,
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    {currentInformation.description}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 3, borderColor: themeColors.border.primary }} />

                            {/* Content */}
                            {currentInformation.content && (
                                <Box mb={4}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('viewStudentInformation.sections.content')}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: themeColors.text.secondary,
                                            lineHeight: 1.8,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: currentInformation.content }}
                                    />
                                </Box>
                            )}

                            {/* Attachments */}
                            {currentInformation.attachments && currentInformation.attachments.length > 0 && (
                                <Box mb={4}>
                                    <Divider sx={{ my: 3, borderColor: themeColors.border.primary }} />
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('viewStudentInformation.sections.attachments', { count: currentInformation.attachments.length })}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {currentInformation.attachments.map((attachment, index) => (
                                            <Grid item xs={12} sm={6} md={4} key={index}>
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        border: `1px solid ${themeColors.border.primary}`,
                                                        borderRadius: 2,
                                                        backgroundColor: themeColors.background.secondary,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: primaryColor,
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `0 8px 16px ${alpha(primaryColor, 0.2)}`,
                                                        },
                                                    }}
                                                    onClick={() => handleDownloadAttachment(attachment)}
                                                >
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Avatar
                                                            sx={{
                                                                backgroundColor: alpha(primaryColor, 0.15),
                                                                color: primaryColor,
                                                                width: 40,
                                                                height: 40,
                                                            }}
                                                        >
                                                            <ICONS.AttachFile.component />
                                                        </Avatar>
                                                        <Box flex={1} overflow="hidden">
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="medium"
                                                                sx={{
                                                                    color: themeColors.text.primary,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {attachment.originalName || attachment.fileName}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(2)} KB` : t('viewStudentInformation.labels.sizeUnknown')}
                                                            </Typography>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: primaryColor,
                                                                '&:hover': {
                                                                    backgroundColor: alpha(primaryColor, 0.12),
                                                                },
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadAttachment(attachment);
                                                            }}
                                                        >
                                                            <ICONS.Download.component fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            {/* Additional Information */}
                            <Box>
                                <Divider sx={{ my: 3, borderColor: themeColors.border.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('viewStudentInformation.sections.informationDetails')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Box mb={2}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('viewStudentInformation.labels.category')}
                                            </Typography>
                                            <Chip
                                                label={currentInformation.category}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${alpha(primaryColor, 0.2)}`,
                                                    color: primaryColor,
                                                    fontWeight: 'medium'
                                                }}
                                            />
                                        </Box>
                                        <Box mb={2}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('viewStudentInformation.labels.priority')}
                                            </Typography>
                                            <Chip
                                                label={currentInformation.priority || t('viewStudentInformation.priority.normal')}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${alpha(getPriorityColor(currentInformation.priority), 0.2)}`,
                                                    color: getPriorityColor(currentInformation.priority),
                                                    fontWeight: 'medium'
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box mb={2}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('viewStudentInformation.labels.publishedOn')}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                                {moment(currentInformation.publishedAt || currentInformation.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                                            </Typography>
                                        </Box>
                                        {currentInformation.expiryDate && (
                                            <Box mb={2}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                    {t('viewStudentInformation.labels.expiryDate')}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                                    {moment(currentInformation.expiryDate).format('MMMM DD, YYYY [at] h:mm A')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box mb={2}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('studentInformation.informationDetails.status')}
                                            </Typography>
                                            <Chip
                                                label={formatStatusLabel()}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${alpha(primaryColor, 0.15)}`,
                                                    color: primaryColor,
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Action Buttons */}
                            <Box mt={4} display="flex" gap={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    startIcon={<ICONS.ArrowBack.component />}
                                    onClick={() => navigate('/students/information')}
                                    sx={{
                                        borderColor: themeColors.border.primary,
                                        color: themeColors.text.primary,
                                        '&:hover': {
                                            borderColor: themeColors.primary,
                                            backgroundColor: `${themeColors.primary}10`
                                        }
                                    }}
                                >
                                    {t('viewStudentInformation.actions.backToInformationCenter')}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Fade>
        </Container>
    );
};

export default ViewStudentInformation;

