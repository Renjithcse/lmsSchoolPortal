import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Badge,
    Paper,
    Fade,
    Zoom,
    Container
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../hooks/SnackBar';
import { ICONS } from '../../assets/icons';
import { useTranslation } from 'react-i18next';
import {
    useGetStudentInformationCategoriesQuery,
    useGetRecentStudentInformationQuery,
    useGetUnreadInformationCountQuery,
    useLazyGetAllStudentInformationQuery
} from '../../Redux/features/Student/studentInformationApiSlice';
import moment from 'moment';

const StudentInformation = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const primaryColor = themeColors.primary;
    const secondaryColor = themeColors.secondary || themeColors.primary;
    const successColor = themeColors.success || themeColors.primary;
    const inverseColor = themeColors.text.inverse;
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();

    const {
        data: categoriesResponse,
        isLoading: categoriesLoading,
        error: categoriesError
    } = useGetStudentInformationCategoriesQuery();

    const {
        data: recentResponse,
        error: recentError
    } = useGetRecentStudentInformationQuery(5);

    const {
        data: unreadResponse,
        error: unreadError
    } = useGetUnreadInformationCountQuery();

    const [
        getAllInformation,
        { data: allInformationResponse, isFetching: allInformationLoading, error: allInformationError }
    ] = useLazyGetAllStudentInformationQuery();

    const [view, setView] = useState('categories');

    const categories = categoriesResponse?.data?.categories || [];
    const recentInformation = recentResponse?.data?.information || [];
    const unreadCount = unreadResponse?.data?.unreadCount || 0;
    const totalInformationCount =
        unreadResponse?.data?.totalCount ??
        categories.reduce((total, category) => total + (category.count || 0), 0);

    const allInformation = allInformationResponse?.data?.information || [];
    const information = view === 'list' ? allInformation : [];
    const informationLoading = view === 'list' ? allInformationLoading : false;

    const categoryNameToSlug = useMemo(() => ({
        'Information Desk': 'information-desk',
        'Help Desk': 'help-desk',
        'General Information': 'general-information'
    }), []);

    const handleViewAllInformation = useCallback(() => {
        getAllInformation({});
        setView('list');
    }, [getAllInformation]);

    const handleViewCategory = useCallback((categoryName) => {
        const slug = categoryNameToSlug[categoryName];
        if (slug) {
            navigate(`/students/information/${slug}`);
        }
    }, [navigate, categoryNameToSlug]);

    useEffect(() => {
        const error = categoriesError || allInformationError || recentError || unreadError;
        if (error) {
            const message = error?.data?.message || error?.message || t('studentInformation.messages.defaultError');
            showSnackbar(message, 'error');
        }
    }, [categoriesError, allInformationError, recentError, unreadError, showSnackbar, t]);

    const handleViewInformation = (id) => {
        navigate(`/students/information/view/${id}`);
    };

    const getCategoryIcon = (categoryName) => {
        switch (categoryName) {
            case 'Information Desk':
                return <ICONS.Info.component />;
            case 'Help Desk':
                return <ICONS.Help.component />;
            case 'General Information':
                return <ICONS.Announcement.component />;
            default:
                return <ICONS.Info.component />;
        }
    };

    const renderCategoriesView = () => (
        <Fade in={true} timeout={800}>
            <Box>
                {/* Hero Section */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        color: inverseColor,
                        borderRadius: 3,
                        p: 3,
                        mb: 4,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                            {t('studentInformation.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                            {t('studentInformation.subtitle')}
                        </Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={6} sm={4}>
                                <Box textAlign="center">
                                    <Typography variant="h3" fontWeight="bold" sx={{ color: inverseColor }}>
                                        {totalInformationCount}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, color: inverseColor }}>
                                        {t('studentInformation.stats.totalInformation')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <Box textAlign="center">
                                    <Typography variant="h3" fontWeight="bold" sx={{ color: inverseColor }}>
                                        {unreadCount}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, color: inverseColor }}>
                                        {t('studentInformation.stats.unread')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box display="flex" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        onClick={handleViewAllInformation}
                                        sx={{ 
                                            backgroundColor: inverseColor,
                                            color: primaryColor,
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                backgroundColor: inverseColor,
                                                opacity: 0.9
                                            }
                                        }}
                                    >
                                        {t('studentInformation.actions.viewAll')}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* Categories Grid */}
                <Grid container spacing={3}>
                    {categoriesLoading ? (
                        [1, 2, 3].map((item) => (
                            <Grid item xs={12} md={4} key={item}>
                                <Card sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        categories.map((category, index) => (
                            <Grid item xs={12} md={4} key={category.category}>
                                <Zoom in={true} timeout={600 + index * 100}>
                                        <Card 
                                        sx={{ 
                                            border: `1px solid ${themeColors.border.primary}`,
                                            cursor: 'pointer',
                                            borderRadius: 3,
                                            transition: 'all 0.3s ease',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            background: `linear-gradient(135deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: `0 12px 24px ${alpha(primaryColor, 0.15)}`,
                                                borderColor: primaryColor
                                            }
                                        }}
                                        onClick={() => handleViewCategory(category.category)}
                                    >
                                        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                                <Avatar 
                                                    sx={{ 
                                            backgroundColor: primaryColor,
                                            color: inverseColor,
                                            width: 56,
                                            height: 56
                                                    }}
                                                >
                                                    {getCategoryIcon(category.category)}
                                                </Avatar>
                                                <Badge 
                                                    badgeContent={category.count} 
                                                    sx={{
                                                        '& .MuiBadge-badge': {
                                                            backgroundColor: primaryColor,
                                                            color: inverseColor,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold'
                                                        },
                                                    }}
                                                >
                                                <Avatar sx={{ 
                                                    backgroundColor: successColor,
                                                    color: inverseColor
                                                }}>
                                                    <ICONS.Note.component />
                                                </Avatar>
                                                </Badge>
                                            </Box>
                                            
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: themeColors.text.primary }}>
                                                {category.category}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 2, color: themeColors.text.secondary, flex: 1 }}>
                                                {category.description}
                                            </Typography>
                                            
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                                                <Typography variant="body1" fontWeight="medium" sx={{ color: primaryColor }}>
                                                    {t('studentInformation.labels.items', { count: category.count })}
                                                </Typography>
                                                <ICONS.ArrowForward.component 
                                                    sx={{ color: primaryColor }} 
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Zoom>
                            </Grid>
                        ))
                    )}
                </Grid>

                {/* Recent Information */}
                {recentInformation.length > 0 && (
                    <Box mt={4}>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                            {t('studentInformation.sections.recentInformation')}
                        </Typography>
                        <Grid container spacing={2}>
                            {recentInformation.map((info) => (
                                <Grid item xs={12} sm={6} md={4} key={info._id}>
                                    <Card 
                                        sx={{ 
                                            border: `1px solid ${themeColors.border.primary}`,
                                            background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            '&:hover': { 
                                                boxShadow: `0 12px 24px ${alpha(primaryColor, 0.15)}`,
                                                transform: 'translateY(-4px)',
                                                borderColor: primaryColor,
                                            }
                                        }}
                                        onClick={() => handleViewInformation(info._id)}
                                    >
                                        <CardContent>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: themeColors.text.primary }}>
                                                {info.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                {moment(info.publishedAt || info.createdAt).fromNow()}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Box>
        </Fade>
    );

    const formatStatusLabel = (info) => {
        if (info.scheduledPublishDate && info.status === 'Draft') {
            return `${t('studentInformation.status.scheduled')} ${moment(info.scheduledPublishDate).format('MMM DD, YYYY')}`;
        }
        const key = info.status ? info.status.toLowerCase() : 'draft';
        return t(`studentInformation.status.${key}`) || info.status;
    };

    const renderInformationList = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                    {t('studentInformation.sections.allInformation', { count: information.length })}
                </Typography>
                <Button
                    startIcon={<ICONS.ArrowBack.component />}
                    onClick={() => setView('categories')}
                >
                    {t('studentInformation.actions.backToCategories')}
                </Button>
            </Box>

            <Grid container spacing={3}>
                {informationLoading ? (
                    [1, 2, 3, 4, 5, 6].map((item) => (
                        <Grid item xs={12} md={6} key={item}>
                            <Card>
                                <CardContent>
                                    <CircularProgress />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    information.map((info) => (
                        <Grid item xs={12} md={6} key={info._id}>
                            <Card 
                                sx={{ 
                                    border: `1px solid ${themeColors.border.primary}`,
                                    background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': { 
                                        boxShadow: `0 12px 24px ${alpha(primaryColor, 0.15)}`,
                                        transform: 'translateY(-4px)',
                                        borderColor: primaryColor,
                                    }
                                }}
                                onClick={() => handleViewInformation(info._id)}
                            >
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                            {info.title}
                                        </Typography>
                                        <Chip 
                                            label={info.category} 
                                            size="small"
                                            sx={{ 
                                                backgroundColor: `${primaryColor}20`,
                                                color: primaryColor,
                                                fontWeight: 'medium'
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 1, color: themeColors.text.secondary }}>
                                        {info.description.length > 100 
                                            ? `${info.description.substring(0, 100)}...` 
                                            : info.description}
                                    </Typography>
                                    <Chip
                                        label={formatStatusLabel(info)}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${alpha(primaryColor, 0.15)}`,
                                            color: primaryColor,
                                            fontWeight: 'medium',
                                            mr: 1
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                        {moment(info.publishedAt || info.createdAt).format('MMM DD, YYYY')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );

    return (
        <Container
            maxWidth="xl"
            sx={{
                py: 2,
                backgroundColor: themeColors.background.primary,
                minHeight: '100vh',
                color: themeColors.text.primary,
            }}
        >
            {view === 'categories' && renderCategoriesView()}
            {view === 'list' && renderInformationList()}
        </Container>
    );
};

export default StudentInformation;
