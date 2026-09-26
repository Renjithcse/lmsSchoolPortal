import React, { useCallback, useMemo, useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Grid,
    Box,
    Typography,
    Card,
    Container,
    Alert,
    Stack,
    Chip,
    Avatar,
    Link,
    useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import { useTeacherSignUpMutation } from '../../Redux/features/auth/userSlice';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';
import { useTranslation } from 'react-i18next';

const TeacherPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const showSnackbar = useSnackbar();
    const [registerError, setRegisterError] = useState('');
    const { t } = useTranslation();

    const [triggerTeacherRegister, { isLoading }] = useTeacherSignUpMutation();

    const schema = useMemo(() => yup.object().shape({
        password: yup
            .string()
            .required(t('teacherPassword.validation.passwordRequired'))
            .min(8, t('teacherPassword.validation.passwordMinLength'))
            .matches(/[A-Z]/, t('teacherPassword.validation.passwordUppercase'))
            .matches(/[a-z]/, t('teacherPassword.validation.passwordLowercase'))
            .matches(/[0-9]/, t('teacherPassword.validation.passwordNumber'))
            .matches(/[!@#$%^&*(),.?":{}|<>]/, t('teacherPassword.validation.passwordSpecial')),
        confirmPassword: yup
            .string()
            .required(t('teacherPassword.validation.confirmPasswordRequired'))
            .oneOf([yup.ref('password'), null], t('teacherPassword.validation.passwordsMustMatch')),
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

    const onSubmit = useCallback(
        async (formData) => {
            setRegisterError('');
            const teacherId = location.state?.teacherId || location.state;
            const profileData = location.state?.profileData || {};
            const payload = { ...formData, _id: teacherId, ...profileData };
            const response = await triggerTeacherRegister(payload);

            if (response.error) {
                const errorMessage = response.error?.data?.message || t('teacherPassword.messages.registrationFailed');
                setRegisterError(errorMessage);
                showSnackbar(errorMessage, 'error');
                return;
            }

            showSnackbar(t('teacherPassword.messages.registrationSuccess'), 'success');
            navigate('/login');
        },
        [triggerTeacherRegister, location.state, showSnackbar, navigate, t]
    );

    const guidelines = useMemo(
        () => t('teacherPassword.hero.guidelines', { returnObjects: true }) || [],
        [t]
    );

    const guidelineList = useMemo(
        () => (
            <Stack spacing={1.5}>
                {guidelines.map((rule) => (
                    <Stack key={rule} direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: authTokens.hero.avatarBackground,
                                color: '#fff',
                            }}
                        >
                            <CheckCircleRoundedIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: authTokens.text.heroSubtitle }}>
                            {rule}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        ),
        [guidelines, authTokens.hero.avatarBackground, authTokens.text.heroSubtitle]
    );

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
                                            width: 64,
                                            height: 64,
                                            bgcolor: authTokens.hero.avatarBackground,
                                            color: '#fff',
                                        }}
                                    >
                                        <LockIcon fontSize="large" />
                                    </Avatar>
                                    <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
                                        {t('teacherPassword.hero.title')}
                                    </Typography>
                                    <Typography sx={{ color: authTokens.text.heroSubtitle, maxWidth: 400, textAlign: 'center' }}>
                                        {t('teacherPassword.hero.subtitle')}
                                    </Typography>
                                </Stack>
                                <Stack spacing={2}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {t('teacherPassword.hero.guidelinesTitle')}
                                    </Typography>
                                    {guidelineList}
                                </Stack>
                            </Stack>
                            <Typography variant="caption" sx={{ color: authTokens.text.heroMuted, mt: 4 }}>
                                {t('teacherPassword.hero.securityNotice')}
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
                                <Avatar
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        bgcolor: alpha(themeColors.primary, isDarkMode ? 0.25 : 0.13),
                                        border: `1px solid ${alpha(themeColors.primary, isDarkMode ? 0.35 : 0.31)}`,
                                    }}
                                >
                                    <CheckCircleRoundedIcon sx={{ color: themeColors.primary }} />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                    {t('teacherPassword.form.title')}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: authTokens.text.formBody, maxWidth: 360, textAlign: 'center' }}
                                >
                                    {t('teacherPassword.form.description')}
                                </Typography>
                            </Stack>

                            {registerError && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {registerError}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                <Stack spacing={2.5}>
                                    <CustomLoginInput
                                        type="password"
                                        control={control}
                                        error={errors.password}
                                        fieldName="password"
                                        placeholder={t('teacherPassword.form.passwordPlaceholder')}
                                    />
                                    <CustomLoginInput
                                        type="password"
                                        control={control}
                                        error={errors.confirmPassword}
                                        fieldName="confirmPassword"
                                        placeholder={t('teacherPassword.form.confirmPasswordPlaceholder')}
                                    />

                                    <CustomButton
                                        onClick={handleSubmit(onSubmit)}
                                        width="100%"
                                        label={t('teacherPassword.form.submitButton')}
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

                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, textAlign: 'center' }}>
                                        {t('teacherPassword.form.alreadyRegistered')}{' '}
                                        <Link
                                            component="button"
                                            sx={{ color: themeColors.primary, fontWeight: 600 }}
                                            onClick={() => navigate('/login')}
                                        >
                                            {t('teacherPassword.form.signIn')}
                                        </Link>
                                    </Typography>
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

export default TeacherPassword;

