import React, { useCallback, useMemo, useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
    useMediaQuery,
    Grid,
    Box,
    Typography,
    Card,
    CardContent,
    Link,
    IconButton,
    InputAdornment,
    Alert,
    Container,
    Stack,
    Divider,
    Chip,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useDispatch } from 'react-redux';
import { setAbility, setRole, setAuthenticated, setUser } from '../../Redux/features/auth/authSlice';
import { useLoginUserMutation, useValidateTwoFactorMutation } from '../../Redux/features/auth/userSlice';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import { StudentPermissions } from '../../constant/Permissions';
import SchoolIcon from '@mui/icons-material/School';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { defineAbilitiesFor } from '../../abilities';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/Common/LanguageSwitcher';

const LoginScreen = () => {
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const dispatch = useDispatch();
    const [triggerLogin, { isLoading }] = useLoginUserMutation();
    const [validateTwoFactor, { isLoading: isValidatingTwoFactor }] = useValidateTwoFactorMutation();
    const theme = useTheme();
    const { themeColors } = useThemeContext();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const authTokens = getAuthLayoutTokens(theme, themeColors);
    const { isDarkMode } = authTokens;
    const { t } = useTranslation();
    const heroShadow = isDarkMode
        ? `0 35px 80px -45px ${alpha('#000000', 0.85)}`
        : `0 35px 80px -40px ${alpha(themeColors.primary, 0.5)}`;
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [pendingTwoFactor, setPendingTwoFactor] = useState(null);
    const [twoFactorError, setTwoFactorError] = useState('');
    const [twoFactorReminder, setTwoFactorReminder] = useState(null);

    const featureHighlights = useMemo(() => {
        const items = t('login.features', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    const metrics = t('login.metrics', { returnObjects: true }) || {};

    const schema = useMemo(() => yup.object().shape({
        email: yup.string().required(t('login.validation.emailRequired')),
        password: yup.string().required(t('login.validation.passwordRequired')).min(6, t('login.validation.passwordTooShort')),
    }), [t]);

    const twoFactorSchema = useMemo(() => yup.object().shape({
        token: yup
            .string()
            .required(t('login.validation.tokenRequired'))
            .matches(/^\d{6}$/, t('login.validation.tokenFormat')),
    }), [t]);

    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {},
    });

    const {
        handleSubmit: handleTwoFactorSubmit,
        control: twoFactorControl,
        reset: resetTwoFactorForm,
        formState: { errors: twoFactorErrors },
    } = useForm({
        resolver: yupResolver(twoFactorSchema),
        defaultValues: { token: '' },
    });

    const navigateToForgotPassword = useCallback(
        () => navigate('/forgot-password'),
        [navigate]
    );

    const completeLogin = useCallback((response) => {
        if (response?.accessToken) {
            localStorage.setItem('token', response.accessToken);
        }
        const userData = response?.user;
        dispatch(setUser(userData));
        if (!userData) {
            showSnackbar(t('login.messages.processError'), 'error');
            return;
        }

        const roleName = userData.role?.roleName;
        let destination = '/';

        if (roleName === 'admin') {
            dispatch(setRole('admin'));
            
            dispatch(setAbility(defineAbilitiesFor([{ action: 'manage', subject: 'all' }])));
        } else if (userData?.teacher?.role?.permissions) {
            dispatch(setRole('user'));
            dispatch(setAbility(defineAbilitiesFor(userData.teacher.role.permissions)));
            destination = '/teacher/my-dashboard';
        } else {
            dispatch(setRole('student'));
            const permissions = StudentPermissions.map((student) => ({
                action: 'manage',
                subject: student,
            }));
            dispatch(setAbility(defineAbilitiesFor(permissions)));
            destination = '/students';
        }

        dispatch(setAuthenticated(true));

        const isStaff = roleName === 'admin' || roleName === 'user';

        showSnackbar(t('login.messages.success'), 'success');

        if (isStaff && !userData.twoFactorEnabled) {
            setTwoFactorReminder({
                destination,
                email: userData?.email || userData?.teacher?.email || '',
            });
            return;
        }

        navigate(destination);
    }, [dispatch, navigate, showSnackbar, t]);

    const handleLogin = useCallback(async (data) => {
        setLoginError('');
        setTwoFactorError('');
        try {
        const response = await triggerLogin(data).unwrap();

        if (response?.status === 'PENDING_2FA' && response?.userId) {
            setPendingTwoFactor({ userId: response.userId, email: data.email });
            resetTwoFactorForm({ token: '' });
            showSnackbar(t('login.messages.enterTwoFactorCode'), 'info');
                return;
            }

            setPendingTwoFactor(null);
            completeLogin(response);
        } catch (error) {
            const errorMessage = error?.data?.message || t('login.messages.loginFailed');
            setLoginError(errorMessage);
            showSnackbar(errorMessage, 'error');
        }
    }, [triggerLogin, completeLogin, showSnackbar, resetTwoFactorForm, t]);

    const handleTwoFactorVerification = useCallback(async ({ token }) => {
        if (!pendingTwoFactor) {
            return;
        }

        setTwoFactorError('');
        try {
            const response = await validateTwoFactor({
                userId: pendingTwoFactor.userId,
                token,
            }).unwrap();
            setPendingTwoFactor(null);
            resetTwoFactorForm({ token: '' });
            completeLogin(response);
        } catch (error) {
            const errorMessage = error?.data?.message || t('login.messages.invalidToken');
            setTwoFactorError(errorMessage);
            showSnackbar(errorMessage, 'error');
        }
    }, [pendingTwoFactor, validateTwoFactor, completeLogin, showSnackbar, resetTwoFactorForm, t]);

    const handleTwoFactorReminderEnable = useCallback(() => {
        if (!twoFactorReminder) return;
        setTwoFactorReminder(null);
        navigate('/profile', { state: { focusTab: 'security' } });
    }, [twoFactorReminder, navigate]);

    const handleTwoFactorReminderSkip = useCallback(() => {
        if (!twoFactorReminder) return;
        const destination = twoFactorReminder.destination || '/';
        setTwoFactorReminder(null);
        navigate(destination);
    }, [twoFactorReminder, navigate]);

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
            <Box
                sx={{
                minHeight: 'auto',
                position: 'relative',
                overflow: 'hidden',
                py: { xs: 1, md: 2 },
                px: { xs: 2, sm: 3, md: 4 },
                background: authTokens.pageBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                maxWidth={false}
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 1.5, md: 2 },
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Grid
                    container
                    spacing={{ xs: 1.5, md: 2.5 }}
                    alignItems="stretch"
                    justifyContent="center"
                    sx={{
                        maxWidth: { xs: '100%', md: '1360px', xl: '1480px' },
                        mx: 'auto',
                    }}
                >
                    {isDesktop && (
                        <Grid item md={5} lg={5} sx={{ display: 'flex' }}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    minHeight: { md: '380px', lg: '380px' },
                                    borderRadius: 5,
                                    px: { md: 3.5, lg: 4 },
                                    py: { md: 3, lg: 3.5 },
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
                                <Stack spacing={2.5} sx={{ position: 'relative' }}>
                                    <Chip
                                        label={t('login.heroChip')}
                                        sx={{
                                            alignSelf: 'flex-start',
                                            fontWeight: 600,
                                            backgroundColor: authTokens.hero.chipBackground,
                                            color: authTokens.hero.chipColor,
                                             px: 1.5,
                                             py: 0.5,
                                             borderRadius: 2,
                                        }}
                                    />
                                    <Stack spacing={1.5}>
                                        <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                            {t('login.heroTitle')}
                                        </Typography>
                                        <Typography sx={{ color: authTokens.text.heroSubtitle, maxWidth: 420 }}>
                                            {t('login.heroSubtitle')}
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={1.5}>
                                        {featureHighlights.map((item) => (
                                            <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
                                                <Avatar
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        bgcolor: authTokens.hero.avatarBackground,
                                                         color: '#fff',
                                                    }}
                                                >
                                                    <CheckCircleRoundedIcon fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                        {item.title}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                                         {item.subtitle}
                                                     </Typography>
                                                </Box>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{
                                        mt: 3,
                                        pt: 2,
                                        borderTop: '1px solid rgba(255,255,255,0.15)',
                                    }}
                                >
                                    <Stack spacing={0.5}>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            50+
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                            {metrics.institutions}
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={0.5}>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            120K
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                            {metrics.students}
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={0.5}>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            4.9/5
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: authTokens.text.heroMuted }}>
                                            {metrics.satisfaction}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Card>
                        </Grid>
                    )}
                    <Grid item xs={12} md={7} lg={7} sx={{ display: 'flex' }}>
                        <Card
                            elevation={isDesktop ? 12 : 8}
                            sx={{
                                borderRadius: 4,
                                p: { xs: 2, sm: 2.5, md: 3 },
                                height: '100%',
                                minHeight: { xs: 'auto', md: '380px' },
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
                            <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{ alignSelf: 'flex-end' }}>
                                    <LanguageSwitcher size="small" />
                                </Box>
                                {pendingTwoFactor ? (
                                    <Stack spacing={1} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: alpha(themeColors.primary, isDarkMode ? 0.25 : 0.13),
                                                border: `1px solid ${alpha(themeColors.primary, isDarkMode ? 0.35 : 0.31)}`,
                                             }}
                                        >
                                            <LockOutlinedIcon sx={{ color: themeColors.primary, fontSize: 32 }} />
                                        </Avatar>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                            {t('login.form.twoFactorTitle')}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: authTokens.text.formBody, textAlign: 'center' }}
                                        >
                                            {t('login.form.twoFactorSubtitle')}
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Stack spacing={1} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: alpha(themeColors.primary, isDarkMode ? 0.25 : 0.13),
                                                border: `1px solid ${alpha(themeColors.primary, isDarkMode ? 0.35 : 0.31)}`,
                                             }}
                                        >
                                            <SchoolIcon sx={{ color: themeColors.primary, fontSize: 32 }} />
                                        </Avatar>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                            {t('login.form.title')}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: authTokens.text.formBody, maxWidth: 360, textAlign: 'center' }}
                                        >
                                            {t('login.form.subtitle')}
                                        </Typography>
                                    </Stack>
                                )}

                                {loginError && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {loginError}
                                    </Alert>
                                )}

                                {twoFactorError && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {twoFactorError}
                                    </Alert>
                                )}

                                {pendingTwoFactor ? (
                                    <Box component="form" onSubmit={handleTwoFactorSubmit(handleTwoFactorVerification)} autoComplete="off">
                                        {/* Hidden fake fields to prevent autofill */}
                                        <input type="text" name="username" autoComplete="username" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} readOnly />
                                        <input type="password" name="password" autoComplete="current-password" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} readOnly />
                                        <Stack spacing={{ xs: 1.5, sm: 1.8, md: 2 }}>
                                            <CustomLoginInput
                                                type="text"
                                                control={twoFactorControl}
                                                error={twoFactorErrors.token}
                                                fieldName="token"
                                                placeholder={t('login.form.tokenPlaceholder')}
                                                startAdornmentIcon={<KeyIcon sx={{ color: themeColors.text.secondary }} />}
                                                autoComplete="off"
                                                inputProps={{ 
                                                    inputMode: 'numeric', 
                                                    maxLength: 6,
                                                    autoCorrect: 'off',
                                                    autoCapitalize: 'off',
                                                    spellCheck: false,
                                                    'data-1p-ignore': 'true',
                                                    'data-lpignore': 'true',
                                                    'data-form-type': 'other',
                                                }}
                                            />
                                            <CustomButton
                                                onClick={handleTwoFactorSubmit(handleTwoFactorVerification)}
                                                width="100%"
                                                label={t('login.form.ctaVerify')}
                                                backgroundColor={themeColors.primary}
                                                loading={isValidatingTwoFactor}
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
                                ) : (
                                <Box component="form" onSubmit={handleSubmit(handleLogin)}>
                                    <Stack spacing={{ xs: 1.5, sm: 1.8, md: 2 }}>
                                        <CustomLoginInput
                                            type="email"
                                            control={control}
                                            error={errors.email}
                                            fieldName="email"
                                            placeholder={t('login.form.emailPlaceholder')}
                                            startAdornmentIcon={<EmailIcon sx={{ color: themeColors.text.secondary }} />}
                                        />

                                        <CustomLoginInput
                                            type={showPassword ? 'text' : 'password'}
                                            control={control}
                                            error={errors.password}
                                            fieldName="password"
                                            placeholder={t('login.form.passwordPlaceholder')}
                                            startAdornmentIcon={<KeyIcon sx={{ color: themeColors.text.secondary }} />}
                                            endAdornmentIcon={
                                                <InputAdornment position="end">
                                                    <IconButton onClick={togglePasswordVisibility} edge="end">
                                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            }
                                        />

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CheckCircleRoundedIcon sx={{ color: themeColors.success, fontSize: 20 }} />
                                                <Typography variant="body2" sx={{ color: authTokens.text.formMuted }}>
                                                    {t('login.form.twoFactorEnabled')}
                                                </Typography>
                                            </Stack>
                                            <Link
                                                component="button"
                                                variant="body2"
                                                onClick={navigateToForgotPassword}
                                                sx={{
                                                    color: themeColors.primary,
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                    '&:hover': { textDecoration: 'underline', color: themeColors.accent },
                                                }}
                                            >
                                                {t('login.form.forgotPassword')}
                                            </Link>
                                        </Stack>

                                        <CustomButton
                                            onClick={handleSubmit(handleLogin)}
                                            width="100%"
                                            label={pendingTwoFactor ? t('login.form.ctaVerify') : t('login.form.ctaSignIn')}
                                            backgroundColor={themeColors.primary}
                                            loading={isLoading}
                                            sx={{
                                                borderRadius: 3,
                                                py: 1.5,
                                                fontSize: '1.05rem',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                            }}
                                        />

                                        {!pendingTwoFactor && (
                                            <Stack spacing={1.5}>
                                                <Divider>
                                                    <Chip label={t('login.form.orContinue')} sx={{ fontWeight: 600, color: authTokens.text.formMuted }} />
                                                </Divider>

                                                <SignUpLinks themeColors={themeColors} onNavigate={navigate} authTokens={authTokens} t={t} />
                                            </Stack>
                                        )}
                                    </Stack>
                                </Box>
                                )}
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            {(isLoading || isValidatingTwoFactor) && (
                <CustomBackDrop loading={isLoading || isValidatingTwoFactor} />
            )}
            <Dialog
                open={Boolean(twoFactorReminder)}
                onClose={handleTwoFactorReminderSkip}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{t('login.twoFactorReminder.title')}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            {t('login.twoFactorReminder.description', { email: twoFactorReminder?.email || t('login.twoFactorReminder.yourAccount') })}
                        </Typography>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {t('login.twoFactorReminder.info')}
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleTwoFactorReminderSkip}>
                        {t('login.twoFactorReminder.remindLater')}
                    </Button>
                    <Button onClick={handleTwoFactorReminderEnable} variant="contained">
                        {t('login.twoFactorReminder.setupNow')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const SignUpLinks = ({ onNavigate, themeColors, authTokens, t }) => {
    const { isDarkMode } = authTokens;
    const subtitleColor = authTokens.text.formBody;
    const mutedColor = authTokens.text.formMuted;
    const primaryTone = themeColors.primary;
    const accentTone = themeColors.accent;

    const signUpCopy = t('login.signup', { returnObjects: true }) || {};
    const educatorCopy = signUpCopy.educator || {};
    const learnerCopy = signUpCopy.learner || {};

    const getCardStyles = (tone) => ({
        flex: 1,
        borderRadius: 3,
        background: isDarkMode
            ? `linear-gradient(145deg, ${alpha(tone, 0.28)} 0%, ${alpha(tone, 0.18)} 100%)`
            : `linear-gradient(145deg, ${alpha(tone, 0.12)} 0%, ${alpha(tone, 0.05)} 100%)`,
        borderColor: alpha(tone, isDarkMode ? 0.35 : 0.22),
        boxShadow: `0 18px 40px -28px ${alpha(tone, isDarkMode ? 0.65 : 0.35)}`,
        cursor: 'pointer',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        backdropFilter: 'blur(14px)',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 22px 50px -24px ${alpha(tone, isDarkMode ? 0.75 : 0.45)}`,
        },
    });

    const chipStyles = (tone) => ({
        alignSelf: 'flex-start',
        backgroundColor: alpha('#ffffff', isDarkMode ? 0.16 : 0.9),
        color: tone,
        fontWeight: 600,
    });

    return (
        <Stack spacing={1.5} alignItems="stretch">
            <Stack spacing={0.5} alignItems="center">
                <Typography variant="body1" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                    {signUpCopy.heading}
                </Typography>
                <Typography variant="body2" sx={{ color: subtitleColor, textAlign: 'center', px: 3 }}>
                    {signUpCopy.subheading}
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Card
                    variant="outlined"
                    sx={getCardStyles(primaryTone)}
                    onClick={() => onNavigate('/signup-teacher')}
                >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip label={educatorCopy.label} size="small" sx={chipStyles(primaryTone)} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                            {educatorCopy.title}
                        </Typography>
                    </CardContent>
                </Card>

                <Card
                    variant="outlined"
                    sx={getCardStyles(accentTone)}
                    onClick={() => onNavigate('/signup-student')}
                >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip label={learnerCopy.label} size="small" sx={chipStyles(accentTone)} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                            {learnerCopy.title}
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </Stack>
    );
};

export default LoginScreen;

