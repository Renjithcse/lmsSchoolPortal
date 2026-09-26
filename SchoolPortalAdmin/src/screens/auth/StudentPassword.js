import React, { useMemo } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Grid,
    Box,
    Typography,
    Card,
    Container,
    Stack,
    Avatar,
    Alert,
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
import { useRegisterStudentMutation } from '../../Redux/features/Users/StudentSlice';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import LockIcon from '@mui/icons-material/Lock';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';
import { useTranslation } from 'react-i18next';

const StudentPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();
    const studentInfo = location.state || {};

    const [triggerStudentRegister, { isLoading }] = useRegisterStudentMutation();

    const schema = useMemo(() => yup.object().shape({
        userName: yup
            .string()
            .required(t('studentPassword.validation.userNameRequired'))
            .matches(/^[a-zA-Z0-9_]+$/, t('studentPassword.validation.userNamePattern'))
            .min(4, t('studentPassword.validation.userNameMinLength'))
            .max(20, t('studentPassword.validation.userNameMaxLength')),
        password: yup
            .string()
            .required(t('studentPassword.validation.passwordRequired'))
            .min(8, t('studentPassword.validation.passwordMinLength'))
            .matches(/[A-Z]/, t('studentPassword.validation.passwordUppercase'))
            .matches(/[a-z]/, t('studentPassword.validation.passwordLowercase'))
            .matches(/[0-9]/, t('studentPassword.validation.passwordNumber'))
            .matches(/[!@#$%^&*(),.?":{}|<>]/, t('studentPassword.validation.passwordSpecial')),
        confirmPassword: yup
            .string()
            .required(t('studentPassword.validation.confirmPasswordRequired'))
            .oneOf([yup.ref('password'), null], t('studentPassword.validation.passwordsMustMatch')),
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
        const payload = { ...formData, _id: studentInfo?._id };
        const response = await triggerStudentRegister(payload);
        if (response.error) {
            const errorMessage = response.error?.data?.message || t('studentPassword.messages.registrationFailed');
            showSnackbar(errorMessage, 'error');
            return;
        }

        showSnackbar(t('studentPassword.messages.registrationSuccess'), 'success');
        navigate('/login');
    };

    const studentSummary = useMemo(() => {
        if (!studentInfo?._id) {
            return null;
        }

        return (
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 2.5,
                    display: 'flex',
                    gap: 2.5,
                    alignItems: 'center',
                    border: `1px solid ${themeColors.border.primary}`,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                }}
            >
                <Avatar
                    src={studentInfo.profilePhoto || undefined}
                    alt={studentInfo.studentName}
                    sx={{
                        width: 72,
                        height: 72,
                        bgcolor: `${themeColors.primary}22`,
                        border: `2px solid ${themeColors.primary}50`,
                        fontWeight: 700,
                        fontSize: '1.5rem',
                    }}
                >
                    {studentInfo?.studentName?.[0] || 'S'}
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {studentInfo.studentID} • {studentInfo.studentName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                        {studentInfo?.grade?.gradeName} • {studentInfo?.section?.sectionName}
                    </Typography>
                </Box>
            </Card>
        );
    }, [studentInfo, theme.palette.mode, themeColors]);

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
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                bgcolor: authTokens.hero.avatarBackground,
                                                color: '#fff',
                                            }}
                                        >
                                            <LockIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {t('studentPassword.hero.title')}
                                            </Typography>
                                            <Typography sx={{ color: authTokens.text.heroSubtitle }}>
                                                {t('studentPassword.hero.subtitle')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Stack spacing={1.5}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {t('studentPassword.hero.verificationSummary')}
                                        </Typography>
                                        {studentSummary ? (
                                            studentSummary
                                        ) : (
                                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                {t('studentPassword.hero.studentDetailsNotFound')}
                                            </Alert>
                                        )}
                                    </Stack>
                                </Stack>
                                <Typography variant="caption" sx={{ color: authTokens.text.heroMuted, mt: 4 }}>
                                    {t('studentPassword.hero.securityNotice')}
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
                                        <LockIcon sx={{ color: themeColors.primary, fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                        {t('studentPassword.form.title')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: authTokens.text.formBody, maxWidth: 360, textAlign: 'center' }}
                                    >
                                        {t('studentPassword.form.description')}
                                    </Typography>
                                </Stack>

                                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={2.5}>
                                        <CustomLoginInput
                                            type="text"
                                            control={control}
                                            error={errors.userName}
                                            fieldName="userName"
                                            placeholder={t('studentPassword.form.userNamePlaceholder')}
                                        />
                                        <CustomLoginInput
                                            type="password"
                                            control={control}
                                            error={errors.password}
                                            fieldName="password"
                                            placeholder={t('studentPassword.form.passwordPlaceholder')}
                                        />
                                        <CustomLoginInput
                                            type="password"
                                            control={control}
                                            error={errors.confirmPassword}
                                            fieldName="confirmPassword"
                                            placeholder={t('studentPassword.form.confirmPasswordPlaceholder')}
                                        />

                                        <CustomButton
                                            onClick={handleSubmit(onSubmit)}
                                            width="100%"
                                            label={t('studentPassword.form.submitButton')}
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

export default StudentPassword;

