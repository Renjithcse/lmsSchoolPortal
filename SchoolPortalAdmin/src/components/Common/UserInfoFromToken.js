import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Grid,
    Divider,
    Alert
} from '@mui/material';
import {
    Person,
    School,
    Work,
    Badge,
    Email,
    Phone,
    VerifiedUser,
    Cancel
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentUser, getToken } from '../../utils/tokenUtils';
import { useTranslation } from 'react-i18next';

const UserInfoFromToken = () => {
    const { t } = useTranslation();
    const {
        user,
        userId,
        userRole,
        userName,
        userEmail,
        userPhone,
        emailVerified,
        phoneVerified,
        userActive,
        studentId,
        teacherId,
        studentName,
        teacherName,
        roleData,
        loading,
        authenticated
    } = useAuth();

    const token = getToken();
    const tokenUser = getCurrentUser();

    if (loading) {
        return (
            <Alert severity="info">
                {t('userInfoFromToken.loading')}
            </Alert>
        );
    }

    if (!authenticated) {
        return (
            <Alert severity="warning">
                {t('userInfoFromToken.noUserInfo')}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                {t('userInfoFromToken.title')}
            </Typography>

            <Grid container spacing={3}>
                {/* Basic User Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {t('userInfoFromToken.basicUserInformation')}
                            </Typography>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.userId')}</Typography>
                                <Typography variant="body1">{userId}</Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.name')}</Typography>
                                <Typography variant="body1">{userName}</Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.email')}</Typography>
                                <Typography variant="body1" display="flex" alignItems="center">
                                    {userEmail}
                                    {emailVerified ? (
                                        <VerifiedUser color="success" sx={{ ml: 1 }} />
                                    ) : (
                                        <Cancel color="error" sx={{ ml: 1 }} />
                                    )}
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.phone')}</Typography>
                                <Typography variant="body1" display="flex" alignItems="center">
                                    {userPhone}
                                    {phoneVerified ? (
                                        <VerifiedUser color="success" sx={{ ml: 1 }} />
                                    ) : (
                                        <Cancel color="error" sx={{ ml: 1 }} />
                                    )}
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.role')}</Typography>
                                <Chip
                                    label={userRole?.toUpperCase()}
                                    color="primary"
                                    size="small"
                                />
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.status')}</Typography>
                                <Chip
                                    label={userActive ? t('userInfoFromToken.active') : t('userInfoFromToken.inactive')}
                                    color={userActive ? 'success' : 'error'}
                                    size="small"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Role-Specific Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Badge sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {t('userInfoFromToken.roleSpecificInformation')}
                            </Typography>

                            {userRole === 'student' && (
                                <Box>
                                    <Box mb={2}>
                                        <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.studentId')}</Typography>
                                        <Typography variant="body1">{studentId || t('userInfoFromToken.notAvailable')}</Typography>
                                    </Box>

                                    <Box mb={2}>
                                        <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.studentName')}</Typography>
                                        <Typography variant="body1">{studentName || t('userInfoFromToken.notAvailable')}</Typography>
                                    </Box>

                                    {roleData && (
                                        <>
                                            <Box mb={2}>
                                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.studentNumber')}</Typography>
                                                <Typography variant="body1">{roleData.studentID || t('userInfoFromToken.notAvailable')}</Typography>
                                            </Box>

                                            <Box mb={2}>
                                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.grade')}</Typography>
                                                <Typography variant="body1">{roleData.grade?.gradeName || t('userInfoFromToken.notAvailable')}</Typography>
                                            </Box>

                                            <Box mb={2}>
                                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.section')}</Typography>
                                                <Typography variant="body1">{roleData.section?.sectionName || t('userInfoFromToken.notAvailable')}</Typography>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            )}

                            {userRole === 'teacher' && (
                                <Box>
                                    <Box mb={2}>
                                        <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.teacherId')}</Typography>
                                        <Typography variant="body1">{teacherId || t('userInfoFromToken.notAvailable')}</Typography>
                                    </Box>

                                    <Box mb={2}>
                                        <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.employeeName')}</Typography>
                                        <Typography variant="body1">{teacherName || t('userInfoFromToken.notAvailable')}</Typography>
                                    </Box>

                                    {roleData && (
                                        <>
                                            <Box mb={2}>
                                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.employeeId')}</Typography>
                                                <Typography variant="body1">{roleData.employeeId || t('userInfoFromToken.notAvailable')}</Typography>
                                            </Box>

                                            <Box mb={2}>
                                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.designation')}</Typography>
                                                <Typography variant="body1">{roleData.designation || t('userInfoFromToken.notAvailable')}</Typography>
                                            </Box>

                                            <Box mb={2}>
                                                <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.qualification')}</Typography>
                                                <Typography variant="body1">{roleData.qualification || t('userInfoFromToken.notAvailable')}</Typography>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            )}

                            {userRole === 'admin' && (
                                <Box>
                                    <Typography variant="body1" color="text.secondary">
                                        {t('userInfoFromToken.adminUser')}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Token Information */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {t('userInfoFromToken.tokenInformation')}
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.tokenAvailable')}</Typography>
                                    <Chip
                                        label={token ? t('userInfoFromToken.yes') : t('userInfoFromToken.no')}
                                        color={token ? 'success' : 'error'}
                                        size="small"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">{t('userInfoFromToken.tokenUserInfo')}</Typography>
                                    <Chip
                                        label={tokenUser ? t('userInfoFromToken.available') : t('userInfoFromToken.notAvailable')}
                                        color={tokenUser ? 'success' : 'error'}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>

                            {tokenUser && (
                                <Box mt={2}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {t('userInfoFromToken.rawTokenUserData')}
                                    </Typography>
                                    <Box
                                        component="pre"
                                        sx={{
                                            backgroundColor: 'grey.100',
                                            p: 1,
                                            borderRadius: 1,
                                            fontSize: '0.75rem',
                                            overflow: 'auto'
                                        }}
                                    >
                                        {JSON.stringify(tokenUser, null, 2)}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                    {t('userInfoFromToken.usageExamples')}
                </Typography>

                <Card>
                    <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {t('userInfoFromToken.usageDescription')}
                        </Typography>

                        <Box
                            component="pre"
                            sx={{
                                backgroundColor: 'grey.100',
                                p: 2,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                overflow: 'auto'
                            }}
                        >
                            {`// Get current user ID
const userId = useCurrentUserId();

// Get current user role
const userRole = useCurrentUserRole();

// Check if user is student
const isStudent = useIsStudent();

// Get student ID (if user is a student)
const studentId = useStudentId();

// Get teacher ID (if user is a teacher)
const teacherId = useTeacherId();

// Get all role data
const roleData = useRoleData();

// Direct token utilities
const token = getToken();
const userInfo = getCurrentUser();
const isAuth = isAuthenticated();`}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default UserInfoFromToken; 