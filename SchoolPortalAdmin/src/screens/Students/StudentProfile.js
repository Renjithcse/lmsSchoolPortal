import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetSingleStudentDetailsQuery } from '../../Redux/features/Users/StudentSlice';
import UiBlocker from '../../components/Common/UiBlocker';
import CustomBackButton from '../../components/Common/CustomBackbutton';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Grid, 
    Avatar, 
    Chip, 
    Divider,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    School as SchoolIcon,
    DirectionsBus as BusIcon,
    ContactPhone as ContactIcon,
    CalendarToday as CalendarIcon,
    Flag as FlagIcon,
    AutoAwesome as ReligionIcon,
    HealthAndSafety as HealthIcon,
    SportsEsports as HobbyIcon,
    Badge as BadgeIcon,
    Event as EventIcon
} from '@mui/icons-material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

const StudentProfile = () => {
    const params = useParams();
    const { themeColors } = useThemeContext()
    const { t } = useTranslation()
    const { data: student, isLoading: singleStudentLoading, isError } = useGetSingleStudentDetailsQuery(params?.id);

    // Date formatting helper
    const formatDate = (dateString) => {
        if (!dateString) return t('studentProfile.fallback.na');
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };

    if (singleStudentLoading) {
        return <UiBlocker open={singleStudentLoading} />;
    }

    if (isError) {
        return <UiBlocker open={singleStudentLoading} />;
    }

    if (!student) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error">
                    {t('studentProfile.messages.studentNotFound')}
                </Typography>
            </Box>
        );
    }

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <CustomBackButton />
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                    {t('studentProfile.title')}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Header Card */}
                <Grid item xs={12}>
                    <Card sx={{ 
                        backgroundColor: themeColors.background.primary,
                        color: themeColors.text.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <CardContent sx={{ p: 4 }}>
                            <Grid container alignItems="center" spacing={3}>
                                <Grid item>
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            bgcolor: themeColors.background.secondary,
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            color: themeColors.text.primary,
                                            border: `1px solid ${themeColors.border.primary}`
                                        }}
                                    >
                                        {getInitials(student.studentName)}
                                    </Avatar>
                                </Grid>
                                <Grid item xs>
                                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: themeColors.text.primary }}>
                                        {student.studentName}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentProfile.studentID')}: {student.studentID}
                                    </Typography>
                                    <Box display="flex" gap={1} mt={1}>
                                        <Chip label={student.gender || 'N/A'} size="small"
                                            sx={{ 
                                                backgroundColor: themeColors.background.secondary,
                                                color: themeColors.text.primary,
                                                border: `1px solid ${themeColors.border.primary}`
                                            }}
                                        />
                                        {student.grade?.gradeName && (
                                            <Chip label={student.grade.gradeName} size="small"
                                                sx={{ 
                                                    backgroundColor: themeColors.background.secondary,
                                                    color: themeColors.text.primary,
                                                    border: `1px solid ${themeColors.border.primary}`
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Personal Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <PersonIcon sx={{ color: themeColors.text.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentProfile.sections.personalInformation')}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<CalendarIcon />}
                                        label={t('studentProfile.fields.dateOfBirth')} 
                                        value={formatDate(student.Dob)} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<LocationIcon />}
                                        label={t('studentProfile.fields.placeOfBirth')} 
                                        value={student.Place_of_birth || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<ReligionIcon />}
                                        label={t('studentProfile.fields.religion')} 
                                        value={student.Religion?.religionName || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<FlagIcon />}
                                        label={t('studentProfile.fields.nationality')} 
                                        value={student.Nationality?.nationality || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <ContactIcon sx={{ color: themeColors.text.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentProfile.sections.contactInformation')}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<EmailIcon />}
                                        label={t('studentProfile.fields.email')} 
                                        value={student.Email || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<PhoneIcon />}
                                        label={t('studentProfile.fields.contactNumber')} 
                                        value={student.contactNo || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<PersonIcon />}
                                        label={t('studentProfile.fields.fatherName')} 
                                        value={student.Father_name || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<PersonIcon />}
                                        label={t('studentProfile.fields.motherName')} 
                                        value={student.Mother_name || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Academic Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <SchoolIcon sx={{ color: themeColors.text.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentProfile.sections.academicInformation')}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<SchoolIcon />}
                                        label={t('studentProfile.fields.grade')} 
                                        value={student.grade?.gradeName || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<CalendarIcon />}
                                        label={t('studentProfile.fields.academicYear')} 
                                        value={student.academicYear?.academicYear || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<EventIcon />}
                                        label={t('studentProfile.fields.admissionDate')} 
                                        value={formatDate(student.Admission_date)} 
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Address Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <LocationIcon sx={{ color: themeColors.text.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentProfile.sections.addressInformation')}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<LocationIcon />}
                                        label={t('studentProfile.fields.city')} 
                                        value={student.City?.name || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<LocationIcon />}
                                        label={t('studentProfile.fields.province')} 
                                        value={student.Province?.name || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<LocationIcon />}
                                        label={t('studentProfile.fields.zipCode')} 
                                        value={student.Zip || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<LocationIcon />}
                                        label={t('studentProfile.fields.communicationAddress')} 
                                        value={student.Communication_Address || t('studentProfile.fallback.na')} 
                                        multiline
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<LocationIcon />}
                                        label={t('studentProfile.fields.permanentAddress')} 
                                        value={student.Permanent_Address || t('studentProfile.fallback.na')} 
                                        multiline
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Transport Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <BusIcon sx={{ color: themeColors.text.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentProfile.sections.transportInformation')}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<BusIcon />}
                                        label={t('studentProfile.fields.transportPickup')} 
                                        value={student.Transport_Pickup || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<BusIcon />}
                                        label={t('studentProfile.fields.pickupBusNo')} 
                                        value={student.Pickup_BusNo || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<BusIcon />}
                                        label={t('studentProfile.fields.transportDrop')} 
                                        value={student.Transport_Drop || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<BusIcon />}
                                        label={t('studentProfile.fields.dropBusNo')} 
                                        value={student.Drop_BusNo || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Additional Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <BadgeIcon sx={{ color: themeColors.text.primary }} />
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                    {t('studentProfile.sections.additionalInformation')}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<BadgeIcon />}
                                        label={t('studentProfile.fields.passportNo')} 
                                        value={student.Passport_No || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<EventIcon />}
                                        label={t('studentProfile.fields.passportExpiry')} 
                                        value={formatDate(student.Passport_Expiry)} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<BadgeIcon />}
                                        label={t('studentProfile.fields.iqamaNo')} 
                                        value={student.Iqama_No || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<EventIcon />}
                                        label={t('studentProfile.fields.iqamaExpiry')} 
                                        value={formatDate(student.Iqama_Expiry)} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<HealthIcon />}
                                        label={t('studentProfile.fields.healthIssues')} 
                                        value={student.Health_Issue || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <DetailItem 
                                        icon={<HobbyIcon />}
                                        label={t('studentProfile.fields.hobbies')} 
                                        value={student.Hobbies || t('studentProfile.fallback.na')} 
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// Reusable Detail Item Component
const DetailItem = ({ icon, label, value, multiline = false }) => {
    const { themeColors } = useThemeContext()
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: multiline ? 'flex-start' : 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                '&:hover': {
                    backgroundColor: themeColors.background.tertiary
                }
            }}
        >
            <Box sx={{ color: themeColors.text.secondary, mt: multiline ? 0.5 : 0 }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }} gutterBottom>
                    {label}
                </Typography>
                <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ 
                        color: themeColors.text.primary,
                        wordBreak: 'break-word',
                        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
                        overflow: multiline ? 'visible' : 'hidden',
                        textOverflow: multiline ? 'clip' : 'ellipsis'
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Box>
    )
}

export default StudentProfile;