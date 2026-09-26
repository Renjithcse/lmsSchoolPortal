import React, { useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Grid,
    Box,
    Typography,
    Card,
    Container,
    Alert,
    Stack,
    Avatar,
    Link,
    useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const schema = React.useMemo(() => yup.object().shape({
        email: yup.string().email(t('forgotPassword.validation.emailInvalid')).required(t('forgotPassword.validation.emailRequired')),
    }), [t]);

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {},
    });

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const { themeColors } = useThemeContext();
    const authTokens = getAuthLayoutTokens(theme, themeColors);
    const { isDarkMode } = authTokens;
    const heroShadow = isDarkMode
        ? `0 35px 80px -45px ${alpha('#000000', 0.85)}`
        : `0 35px 80px -40px ${alpha(themeColors.primary, 0.5)}`;

    const onSubmit = async (formData) => {
        setError('');
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setSuccess(true);
            showSnackbar(t('forgotPassword.messages.linkSent'), 'success');
        } catch (err) {
            setError(t('forgotPassword.messages.sendError'));
            showSnackbar(t('forgotPassword.messages.sendErrorShort'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                py: { xs: 4, md: 6 },
                px: { xs: 2, sm: 3 },
                background: authTokens.pageBackground,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: authTokens.pageOverlay,
                }}
            />

            <Container
                maxWidth="lg"
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    minHeight: { xs: 'auto', md: '70vh' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
                    {isDesktop && (
                        <Grid item md={6} sx={{ display: 'flex' }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 5,
                                    px: 4,
                                    py: 5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    color: '#fff',
                                    background: authTokens.hero.background,
                                    boxShadow: heroShadow,
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: authTokens.hero.overlayOpacity,
                                        background: `
                                            radial-gradient(circle at 30% 20%, #fff 0%, transparent 45%),
                                            radial-gradient(circle at 70% 80%, #fff 0%, transparent 45%),
                                            url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.4' opacity='0.25'%3E%3Cpath d='M0 60h120M60 0v120M20 0v120M100 0v120M0 20h120M0 100h120'/%3E%3C/g%3E%3C/svg%3E")
                                        `,
                                    }}
                                />
                                <Stack spacing={4} sx={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
                                    <Stack spacing={2} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 72,
                                                height: 72,
                                                bgcolor: authTokens.hero.avatarBackground,
                                                color: '#fff',
                                            }}
                                        >
                                            <EmailIcon fontSize="large" />
                                        </Avatar>
                                        <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
                                            {t('forgotPassword.hero.title')}
                                        </Typography>
                                        <Typography sx={{ color: authTokens.text.heroSubtitle, maxWidth: 400, textAlign: 'center' }}>
                                            {t('forgotPassword.hero.subtitle')}
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={1.5}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {t('forgotPassword.hero.whatHappensNext')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                            {t('forgotPassword.hero.step1')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                            {t('forgotPassword.hero.step2')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                            {t('forgotPassword.hero.step3')}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Typography variant="caption" sx={{ color: authTokens.text.heroMuted, mt: 4 }}>
                                    {t('forgotPassword.hero.help')}
                                </Typography>
                            </Card>
                        </Grid>
                    )}

                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Card
                            elevation={isDesktop ? 12 : 8}
                            sx={{
                                borderRadius: 4,
                                p: { xs: 3, sm: 4 },
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                backdropFilter: 'blur(12px)',
                                backgroundColor: authTokens.form.background,
                                border: `1px solid ${authTokens.form.borderColor}`,
                                boxShadow: authTokens.form.boxShadow,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: authTokens.form.overlayBackground,
                                    opacity: authTokens.form.overlayOpacity,
                                }}
                            />
                            <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                                <Stack spacing={1} alignItems="center">
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                        {t('forgotPassword.form.title')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: authTokens.text.formBody, maxWidth: 360, textAlign: 'center' }}
                                    >
                                        {t('forgotPassword.form.description')}
                                    </Typography>
                                </Stack>

                                {error && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                                {success && (
                                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                                        {t('forgotPassword.messages.success')}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={2.5}>
                                        <CustomLoginInput
                                            type="email"
                                            control={control}
                                            error={errors.email}
                                            fieldName="email"
                                            placeholder={t('forgotPassword.form.emailPlaceholder')}
                                        />

                                        <CustomButton
                                            onClick={handleSubmit(onSubmit)}
                                            width="100%"
                                            label={t('forgotPassword.form.submitButton')}
                                            loading={isLoading}
                                            backgroundColor={themeColors.primary}
                                            sx={{
                                                borderRadius: 3,
                                                py: 1.5,
                                                fontSize: '1.05rem',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                            }}
                                        />

                                        <Stack direction="row" justifyContent="center" spacing={1} alignItems="center">
                                            <ArrowBackIcon sx={{ fontSize: 18, color: themeColors.text.secondary }} />
                                            <Link
                                                component="button"
                                                variant="body2"
                                                onClick={handleBackToLogin}
                                                sx={{
                                                    color: themeColors.primary,
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                    '&:hover': { textDecoration: 'underline', color: themeColors.accent },
                                                }}
                                            >
                                                {t('forgotPassword.form.backToLogin')}
                                            </Link>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            {isLoading && <CustomBackDrop loading={isLoading} />}
        </Box>
    );
};

export default ForgotPassword;

