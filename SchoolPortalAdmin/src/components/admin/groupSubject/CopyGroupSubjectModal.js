import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Checkbox, Button, Stack } from '@mui/material';
import CustomModal from '../../Common/CustomModal';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useCheckCopyStatusQuery, useCopyGroupSubjectMutation } from '../../../Redux/features/Admin/GroupSubjects';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useAbility } from '../../../AbilityContext';

const CopyGroupSubjectModal = ({ open, close, groupSubjectId }) => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    const ability = useAbility();
    const [selectedSections, setSelectedSections] = useState([]);
    
    const { data, isLoading, error, refetch } = useCheckCopyStatusQuery(groupSubjectId, {
        skip: !open || !groupSubjectId
    });

    const [copyGroupSubject, { isLoading: isCopying }] = useCopyGroupSubjectMutation();

    const copyStatusData = data?.data;

    // Group status by gender
    const groupedByGender = copyStatusData?.statusByGenderSection?.reduce((acc, item) => {
        if (!acc[item.gender]) {
            acc[item.gender] = [];
        }
        acc[item.gender].push(item);
        return acc;
    }, {}) || {};

    // Handle checkbox change
    const handleCheckboxChange = (gender, sectionId, checked) => {
        if (checked) {
            setSelectedSections([...selectedSections, { gender, sectionId }]);
        } else {
            setSelectedSections(selectedSections.filter(s => !(s.gender === gender && s.sectionId === sectionId)));
        }
    };

    // Check if section is selected
    const isSectionSelected = (gender, sectionId) => {
        return selectedSections.some(s => s.gender === gender && s.sectionId === sectionId);
    };

    // Handle register
    const handleRegister = async () => {
        if (selectedSections.length === 0) {
            showSnackbar(t('groupSubject.copy.selectSections'), 'warning');
            return;
        }

        try {
            const result = await copyGroupSubject({
                id: groupSubjectId,
                sections: selectedSections
            }).unwrap();

            if (result.data.errors && result.data.errors.length > 0) {
                showSnackbar(
                    t('groupSubject.copy.partialSuccess', { 
                        created: result.data.created, 
                        errors: result.data.errors.length 
                    }), 
                    'warning'
                );
            } else {
                showSnackbar(
                    t('groupSubject.copy.registerSuccess', { count: result.data.created }), 
                    'success'
                );
            }

            setSelectedSections([]);
            refetch();
        } catch (error) {
            showSnackbar(error?.data?.message || t('groupSubject.copy.registerError'), 'error');
        }
    };

    // Reset selections when modal closes
    React.useEffect(() => {
        if (!open) {
            setSelectedSections([]);
        }
    }, [open]);

    return (
        <CustomModal close={close} open={open} label={t('groupSubject.copy.title')} width={'lg'} block={true}>
            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {t('groupSubject.copy.errorLoading')}
                </Alert>
            ) : copyStatusData ? (
                <Box>
                    {/* Source Group Subject Info */}
                    <Box mb={3} p={2} sx={{ backgroundColor: themeColors.background.secondary, borderRadius: 2, border: `1px solid ${themeColors.border.primary}` }}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 1, fontWeight: 'bold' }}>
                            {t('groupSubject.copy.sourceInfo')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('groupSubject.copy.groupName')}:</strong> {copyStatusData.sourceGroupSubject.groupName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('groupSubject.copy.grade')}:</strong> {copyStatusData.sourceGroupSubject.grade}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('groupSubject.copy.gender')}:</strong> {copyStatusData.sourceGroupSubject.gender}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('groupSubject.copy.section')}:</strong> {copyStatusData.sourceGroupSubject.section}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>
                            <strong>{t('groupSubject.copy.subjects')}:</strong> {copyStatusData.sourceGroupSubject.subjects.map(s => s.subjectName).join(', ')}
                        </Typography>
                    </Box>

                    {/* Status by Gender and Section */}
                    {Object.keys(groupedByGender).map((gender) => (
                        <Box key={gender} mb={3}>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {t('groupSubject.copy.gender')}: {gender}
                            </Typography>
                            <TableContainer component={Paper} sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            {ability.can("Create", "GroupSubject") && (
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold', width: '50px' }}>
                                                    {t('groupSubject.copy.select')}
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                {t('groupSubject.copy.section')}
                                            </TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                {t('groupSubject.copy.status')}
                                            </TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                {t('groupSubject.copy.groupName')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {groupedByGender[gender].map((item, index) => (
                                            <TableRow 
                                                key={index}
                                                sx={{ 
                                                    backgroundColor: index % 2 === 0 ? themeColors.background.secondary : themeColors.background.primary,
                                                    '&:hover': { backgroundColor: themeColors.background.secondary }
                                                }}
                                            >
                                                {ability.can("Create", "GroupSubject") && (
                                                    <TableCell>
                                                        {!item.isRegistered && (
                                                            <Checkbox
                                                                checked={isSectionSelected(item.gender, item.section._id)}
                                                                onChange={(e) => handleCheckboxChange(item.gender, item.section._id, e.target.checked)}
                                                                sx={{ color: themeColors.primary }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                    {item.section.sectionName}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.isRegistered ? t('groupSubject.copy.registered') : t('groupSubject.copy.notRegistered')}
                                                        sx={{
                                                            backgroundColor: item.isRegistered ? themeColors.success : themeColors.error,
                                                            color: 'white',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                    {item.groupSubject ? item.groupSubject.groupName : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ))}

                    {/* Register Button */}
                    {ability.can("Create", "GroupSubject") && selectedSections.length > 0 && (
                        <Box mt={3} display="flex" justifyContent="flex-end">
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    {t('groupSubject.copy.selectedCount', { count: selectedSections.length })}
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={handleRegister}
                                    disabled={isCopying}
                                    sx={{
                                        backgroundColor: themeColors.primary,
                                        '&:hover': {
                                            backgroundColor: themeColors.primary,
                                            opacity: 0.9
                                        }
                                    }}
                                >
                                    {isCopying ? t('groupSubject.copy.registering') : t('groupSubject.copy.register')}
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Box>
            ) : null}
        </CustomModal>
    );
};

export default CopyGroupSubjectModal;

