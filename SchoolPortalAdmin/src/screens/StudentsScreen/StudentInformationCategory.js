import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Container
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../hooks/SnackBar';
import { ICONS } from '../../assets/icons';
import { useTranslation } from 'react-i18next';
import { useLazyGetStudentInformationByCategoryQuery } from '../../Redux/features/Student/studentInformationApiSlice';
import moment from 'moment';

const CATEGORY_SLUG_TO_NAME = {
    'information-desk': 'Information Desk',
    'help-desk': 'Help Desk',
    'general-information': 'General Information'
};

const StudentInformationCategory = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const primaryColor = themeColors.primary;
    const navigate = useNavigate();
    const { category: categorySlug } = useParams();
    const showSnackbar = useSnackbar();

    const categoryName = categorySlug ? CATEGORY_SLUG_TO_NAME[categorySlug] : null;

    const [
        getInformationByCategory,
        { data: categoryInformationResponse, isFetching: categoryInformationLoading, error: categoryInformationError }
    ] = useLazyGetStudentInformationByCategoryQuery();

    const information = categoryInformationResponse?.data?.information || [];

    React.useEffect(() => {
        if (categoryName) {
            getInformationByCategory({ category: categoryName });
        }
    }, [categoryName, getInformationByCategory]);

    React.useEffect(() => {
        if (categoryInformationError) {
            const message =
                categoryInformationError?.data?.message ||
                categoryInformationError?.message ||
                t('studentInformation.messages.defaultError');
            showSnackbar(message, 'error');
        }
    }, [categoryInformationError, showSnackbar, t]);

    const handleViewInformation = (id) => {
        navigate(`/students/information/view/${id}`);
    };

    const handleBackToCategories = () => {
        navigate('/students/information');
    };

    const formatStatusLabel = (info) => {
        if (info.scheduledPublishDate && info.status === 'Draft') {
            return `${t('studentInformation.status.scheduled')} ${moment(info.scheduledPublishDate).format('MMM DD, YYYY')}`;
        }
        const key = info.status ? info.status.toLowerCase() : 'draft';
        return t(`studentInformation.status.${key}`) || info.status;
    };

    if (!categorySlug || !categoryName) {
        return (
            <Container maxWidth="xl" sx={{ py: 2 }}>
                <Typography color="text.secondary">{t('studentInformation.messages.invalidCategory')}</Typography>
                <Button startIcon={<ICONS.ArrowBack.component />} onClick={handleBackToCategories} sx={{ mt: 2 }}>
                    {t('studentInformation.actions.backToCategories')}
                </Button>
            </Container>
        );
    }

    return (
        <Container
            maxWidth="xl"
            sx={{
                py: 2,
                backgroundColor: themeColors.background.primary,
                minHeight: '100vh',
                color: themeColors.text.primary
            }}
        >
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                        {t('studentInformation.sections.categoryInformation', {
                            category: categoryName,
                            count: information.length
                        })}
                    </Typography>
                    <Button
                        startIcon={<ICONS.ArrowBack.component />}
                        onClick={handleBackToCategories}
                    >
                        {t('studentInformation.actions.backToCategories')}
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {categoryInformationLoading ? (
                        [1, 2, 3, 4].map((item) => (
                            <Grid item xs={12} md={6} key={item}>
                                <Card sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="center" py={3}>
                                            <CircularProgress size={32} />
                                        </Box>
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
                                        borderRadius: 3,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            boxShadow: `0 12px 24px ${alpha(primaryColor, 0.15)}`,
                                            transform: 'translateY(-4px)',
                                            borderColor: primaryColor
                                        }
                                    }}
                                    onClick={() => handleViewInformation(info._id)}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            sx={{ mb: 1, color: themeColors.text.primary }}
                                        >
                                            {info.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ mb: 1, color: themeColors.text.secondary }}
                                        >
                                            {info.description?.length > 120
                                                ? `${info.description.substring(0, 120)}...`
                                                : info.description}
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                            <Chip
                                                label={formatStatusLabel(info)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${alpha(primaryColor, 0.15)}`,
                                                    color: primaryColor,
                                                    fontWeight: 'medium'
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{ color: themeColors.text.secondary }}
                                            >
                                                {moment(info.publishedAt || info.createdAt).format('MMM DD, YYYY')}
                                            </Typography>
                                        </Box>
                                        {info.attachments && info.attachments.length > 0 && (
                                            <Chip
                                                label={t('studentInformation.labels.files', {
                                                    count: info.attachments.length
                                                })}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${alpha(themeColors.success || primaryColor, 0.2)}`,
                                                    color: themeColors.success || primaryColor
                                                }}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Box>
        </Container>
    );
};

export default StudentInformationCategory;
