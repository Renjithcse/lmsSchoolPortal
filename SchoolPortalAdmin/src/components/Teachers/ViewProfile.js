import React from 'react'
import { Box, Typography, Card, CardContent, Grid, Chip, Avatar } from '@mui/material'
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

const ViewProfile = ({ employee }) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();

    if (!employee) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography variant="h6" color="text.secondary">
                    {t('viewProfile.noEmployeeData')}
                </Typography>
            </Box>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return t('viewProfile.notProvided');
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return t('viewProfile.invalidDate');
        }
    };

    const SectionHeader = ({ title, icon }) => (
        <Box display="flex" alignItems="center" gap={1} mb={2}>
            {icon}
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                {title}
            </Typography>
        </Box>
    );

    const InfoField = ({ label, value, required = false }) => (
        <Grid item xs={12} md={6}>
            <Box>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                    {label} {required && '*'}
                </Typography>
                <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                    {value || t('viewProfile.notProvided')}
                </Typography>
            </Box>
        </Grid>
    );

    return (
        <Box sx={{ space: 3 }}>
            {/* Profile Header */}
            <Card sx={{ mb: 3, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar
                            src={employee.profilePicture || "https://via.placeholder.com/150"}
                            alt={employee.employeeName}
                            sx={{ width: 80, height: 80 }}
                        />
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                {employee.employeeName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {employee.designation} • {employee.employeeId}
                            </Typography>
                            <Chip
                                label={employee.status === 'active' ? t('viewProfile.status.active') : t('viewProfile.status.inactive')}
                                sx={{
                                    mt: 1,
                                    backgroundColor: employee.status === 'active' ? `${themeColors.success}22` : `${themeColors.error}22`,
                                    color: employee.status === 'active' ? themeColors.success : themeColors.error,
                                    border: `1px solid ${employee.status === 'active' ? themeColors.success : themeColors.error}`
                                }}
                                size="small"
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card sx={{ mb: 3, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader title={t('viewProfile.sections.personalInformation')} />
                    <Grid container spacing={3}>
                        <InfoField label={t('viewProfile.fields.employeeName')} value={employee.employeeName} required />
                        <InfoField label={t('viewProfile.fields.employeeId')} value={employee.employeeId} required />
                        <InfoField label={t('viewProfile.fields.contactNumber')} value={employee.contactNo} required />
                        <InfoField label={t('viewProfile.fields.alternativeNumber')} value={employee.alternativeNumber} />
                        <InfoField label={t('viewProfile.fields.email')} value={employee.email} required />
                        <InfoField label={t('viewProfile.fields.dateOfBirth')} value={formatDate(employee.dob)} />
                        <InfoField label={t('viewProfile.fields.gender')} value={employee.gender} />
                        <InfoField label={t('viewProfile.fields.religion')} value={employee.Religion?.religionName} />
                        <InfoField label={t('viewProfile.fields.place')} value={employee.place} />
                    </Grid>
                </CardContent>
            </Card>

            {/* Professional Information */}
            <Card sx={{ mb: 3, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader title={t('viewProfile.sections.professionalInformation')} />
                    <Grid container spacing={3}>
                        <InfoField label={t('viewProfile.fields.designation')} value={employee.designation} />
                        <InfoField label={t('viewProfile.fields.qualification')} value={employee.qualification} />
                        <InfoField label={t('viewProfile.fields.dateOfJoining')} value={formatDate(employee.dateOfJoining)} />
                        <InfoField label={t('viewProfile.fields.experienceYears')} value={employee.experienceInYears} />
                    </Grid>
                </CardContent>
            </Card>

            {/* Location Information */}
            <Card sx={{ mb: 3, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader title={t('viewProfile.sections.locationInformation')} />
                    <Grid container spacing={3}>
                        <InfoField label={t('viewProfile.fields.nationality')} value={employee.nationality?.nationality} />
                        <InfoField label={t('viewProfile.fields.communicationAddress')} value={employee.communicationAddress} />
                        <InfoField label={t('viewProfile.fields.permanentAddress')} value={employee.permanentAddress} />
                        <InfoField label={t('viewProfile.fields.zipCode')} value={employee.zip} />
                    </Grid>
                </CardContent>
            </Card>

            {/* Document Information */}
            <Card sx={{ mb: 3, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader title={t('viewProfile.sections.documentInformation')} />
                    <Grid container spacing={3}>
                        <InfoField label={t('viewProfile.fields.passportNumber')} value={employee.passportNo} />
                        <InfoField label={t('viewProfile.fields.passportExpiry')} value={formatDate(employee.passportExpiry)} />
                        <InfoField label={t('viewProfile.fields.iqamaNumber')} value={employee.iqamaNo} />
                        <InfoField label={t('viewProfile.fields.iqamaExpiry')} value={formatDate(employee.iqamaExpiry)} />
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ViewProfile