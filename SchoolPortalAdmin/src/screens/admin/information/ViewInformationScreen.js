import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    Breadcrumbs,
    Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import { useGetInformationQuery } from '../../../Redux/features/Admin/informationApiSlice';
import { skipToken } from '@reduxjs/toolkit/query/react';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const ViewInformationScreen = () => {
    const { themeColors } = useThemeContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();

    const {
        data: informationResponse,
        isLoading,
        error
    } = useGetInformationQuery(id ?? skipToken);

    const currentInformation = informationResponse?.data?.information || informationResponse?.data;

    useEffect(() => {
        if (error) {
            const message = error?.data?.message || error?.message || t('information.messages.errorOccurred');
            showSnackbar(message, 'error');
        }
    }, [error, showSnackbar, t]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'published':
                return 'success';
            case 'draft':
                return 'default';
            case 'archived':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const handleDownloadAttachment = (attachment) => {
        if (attachment.filePath) {
            window.open(attachment.filePath, '_blank');
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!currentInformation) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{t('information.messages.notFound')}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            p: 3,
            backgroundColor: themeColors.background.primary,
            minHeight: '100vh'
        }}>
            {/* Breadcrumbs */}
            <Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
                <Link
                    underline="hover"
                    sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    {t('timetable.breadcrumbs.admin')}
                </Link>
                <Link
                    underline="hover"
                    sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
                    onClick={() => navigate('/information')}
                >
                    {t('information.title')}
                </Link>
                <Typography sx={{ color: themeColors.text.primary }}>
                    {t('information.form.viewTitle') || 'View Information'}
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                    {currentInformation.title}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error?.data?.message || error?.message || t('information.messages.errorOccurred')}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item xs={12} md={8}>
                    {/* Basic Information */}
                    <Card sx={{ 
                        border: `1px solid ${themeColors.border.primary}`, 
                        mb: 3,
                        backgroundColor: themeColors.background.secondary
                    }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                {t('information.form.basicInfo')}
                            </Typography>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.title')}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                        {currentInformation.title}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.description')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, whiteSpace: 'pre-wrap' }}>
                                        {currentInformation.description}
                                    </Typography>
                                </Grid>

                                {currentInformation.content && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                            {t('information.form.content') || 'Content'}
                                        </Typography>
                                        <Box
                                            sx={{
                                                color: themeColors.text.primary,
                                                '& p': { margin: '8px 0' },
                                                '& ul, & ol': { paddingLeft: '24px' }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: currentInformation.content }}
                                        />
                                    </Grid>
                                )}
                                
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.category')}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                        {currentInformation.category}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.priority')}
                                    </Typography>
                                    <Chip
                                        label={currentInformation.priority || 'Medium'}
                                        color={getPriorityColor(currentInformation.priority)}
                                        size="small"
                                    />
                                </Grid>

                                {currentInformation.tags && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                            {t('information.form.tags')}
                                        </Typography>
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            {(Array.isArray(currentInformation.tags) 
                                                ? currentInformation.tags 
                                                : typeof currentInformation.tags === 'string' 
                                                    ? currentInformation.tags.split(',').filter(tag => tag.trim())
                                                    : []
                                            ).map((tag, index) => (
                                                <Chip
                                                    key={index}
                                                    label={typeof tag === 'string' ? tag.trim() : tag}
                                                    size="small"
                                                    sx={{ backgroundColor: themeColors.background.tertiary }}
                                                />
                                            ))}
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    {currentInformation.attachments && currentInformation.attachments.length > 0 && (
                        <Card sx={{ 
                            border: `1px solid ${themeColors.border.primary}`, 
                            mb: 3,
                            backgroundColor: themeColors.background.secondary
                        }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                    {t('information.form.attachments')}
                                </Typography>
                                <List>
                                    {currentInformation.attachments.map((attachment, index) => (
                                        <ListItem 
                                            key={index}
                                            sx={{ 
                                                border: `1px solid ${themeColors.border.primary}`, 
                                                mb: 1, 
                                                borderRadius: 1,
                                                backgroundColor: themeColors.background.primary,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: themeColors.background.tertiary
                                                }
                                            }}
                                            onClick={() => handleDownloadAttachment(attachment)}
                                        >
                                            <ICONS.Attachment.component sx={{ mr: 2, color: themeColors.primary }} />
                                            <ListItemText
                                                primary={attachment.originalName || attachment.fileName}
                                                secondary={attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                                                primaryTypographyProps={{ color: themeColors.text.primary }}
                                                secondaryTypographyProps={{ color: themeColors.text.secondary }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Status and Metadata */}
                    <Card sx={{ 
                        border: `1px solid ${themeColors.border.primary}`, 
                        mb: 3,
                        backgroundColor: themeColors.background.secondary
                    }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                {t('information.form.metadata') || 'Metadata'}
                            </Typography>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.status')}
                                    </Typography>
                                    <Chip
                                        label={currentInformation.status || 'Draft'}
                                        color={getStatusColor(currentInformation.status)}
                                        size="small"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.publishTo')}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                        {currentInformation.publishTo || 'All Students'}
                                    </Typography>
                                </Grid>

                                {currentInformation.scheduledPublishDate && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                            {t('information.form.scheduledPublishDate')}
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                            {moment(currentInformation.scheduledPublishDate).format('MMM DD, YYYY HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}

                                {currentInformation.expiryDate && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                            {t('information.form.expiryDate')}
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                            {moment(currentInformation.expiryDate).format('MMM DD, YYYY HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('information.form.createdAt') || 'Created At'}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                        {currentInformation.createdAt ? moment(currentInformation.createdAt).format('MMM DD, YYYY HH:mm') : t('information.notAvailable')}
                                    </Typography>
                                </Grid>

                                {currentInformation.updatedAt && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                            {t('information.form.updatedAt') || 'Updated At'}
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                            {moment(currentInformation.updatedAt).format('MMM DD, YYYY HH:mm')}
                                        </Typography>
                                    </Grid>
                                )}

                                {currentInformation.createdBy && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                            {t('information.form.createdBy') || 'Created By'}
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                            {currentInformation.createdBy.name || currentInformation.createdBy.email || t('information.notAvailable')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Student Targeting */}
                    {currentInformation.studentTargeting && (
                        <Card sx={{ 
                            border: `1px solid ${themeColors.border.primary}`, 
                            mb: 3,
                            backgroundColor: themeColors.background.secondary
                        }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                    {t('information.form.studentTargeting')}
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    {currentInformation.studentTargeting.academicYear && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('information.form.academicYear')}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                                {typeof currentInformation.studentTargeting.academicYear === 'object' 
                                                    ? currentInformation.studentTargeting.academicYear.academicYear 
                                                    : currentInformation.studentTargeting.academicYear}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {currentInformation.studentTargeting.targetType && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('information.form.targetType')}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                                {currentInformation.studentTargeting.targetType}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {currentInformation.studentTargeting.gender && currentInformation.studentTargeting.gender !== 'Both' && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('information.form.gender')}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                                                {currentInformation.studentTargeting.gender}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {currentInformation.studentTargeting.grades && currentInformation.studentTargeting.grades.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('information.form.grades')}
                                            </Typography>
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {currentInformation.studentTargeting.grades.map((grade, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={typeof grade === 'object' ? grade.gradeName : grade}
                                                        size="small"
                                                        sx={{ backgroundColor: themeColors.background.tertiary }}
                                                    />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {currentInformation.studentTargeting.sections && currentInformation.studentTargeting.sections.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                                {t('information.form.sections')}
                                            </Typography>
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {currentInformation.studentTargeting.sections.map((section, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={typeof section === 'object' ? section.sectionName : section}
                                                        size="small"
                                                        sx={{ backgroundColor: themeColors.background.tertiary }}
                                                    />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ViewInformationScreen;
