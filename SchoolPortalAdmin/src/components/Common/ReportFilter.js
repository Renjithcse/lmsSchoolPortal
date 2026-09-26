import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import CommonFilter from './CommonFilter';
import { useTranslation } from 'react-i18next';

const ReportFilter = ({
    reportType,
    onFilterChange,
    initialValues = {}
}) => {
    const { t } = useTranslation();
    // State for different report types
    const [reportDate, setReportDate] = useState(initialValues.reportDate || '');
    const [reportStartDate, setReportStartDate] = useState(initialValues.reportStartDate || '');
    const [reportEndDate, setReportEndDate] = useState(initialValues.reportEndDate || '');
    const [reportAcademicYear, setReportAcademicYear] = useState(initialValues.reportAcademicYear || '');
    
    // State for grade, gender, section filters
    const [reportGrade, setReportGrade] = useState(initialValues.reportGrade || '');
    const [reportGender, setReportGender] = useState(initialValues.reportGender || '');
    const [reportSection, setReportSection] = useState(initialValues.reportSection || '');

    // Handle filter changes from CommonFilter
    const handleCommonFilterChange = (filterData) => {
        const newGrade = filterData.grade_id || '';
        const newGender = filterData.gender || '';
        const newSection = filterData.section || '';
        
        setReportGrade(newGrade);
        setReportGender(newGender);
        setReportSection(newSection);
        
        // Notify parent component
        onFilterChange({
            reportType,
            reportDate,
            reportStartDate,
            reportEndDate,
            reportAcademicYear,
            reportGrade: newGrade,
            reportGender: newGender,
            reportSection: newSection
        });
    };

    // Handle date changes
    const handleDateChange = (field, value) => {
        switch (field) {
            case 'date':
                setReportDate(value);
                break;
            case 'startDate':
                setReportStartDate(value);
                break;
            case 'endDate':
                setReportEndDate(value);
                break;
            case 'academicYear':
                setReportAcademicYear(value);
                break;
            default:
                break;
        }

        // Notify parent component
        onFilterChange({
            reportType,
            reportDate: field === 'date' ? value : reportDate,
            reportStartDate: field === 'startDate' ? value : reportStartDate,
            reportEndDate: field === 'endDate' ? value : reportEndDate,
            reportAcademicYear: field === 'academicYear' ? value : reportAcademicYear,
            reportGrade,
            reportGender,
            reportSection
        });
    };

    // Update parent when any filter changes
    useEffect(() => {
        onFilterChange({
            reportType,
            reportDate,
            reportStartDate,
            reportEndDate,
            reportAcademicYear,
            reportGrade,
            reportGender,
            reportSection
        });
    }, [reportType, reportDate, reportStartDate, reportEndDate, reportAcademicYear, reportGrade, reportGender, reportSection, onFilterChange]);

    // Render specific date filter
    const renderSpecificDateFilter = () => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 600 }}>
                {t('reportFilter.reportParameters')}
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        label={t('reportFilter.selectDate')}
                        type="date"
                        value={reportDate}
                        onChange={(e) => handleDateChange('date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                            }
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={8}>
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid #e0e6ed'
                    }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                            {t('reportFilter.filterOptionsOptional')}
                        </Typography>
                        <CommonFilter
                            hide={false}
                            showGender={true}
                            showSection={true}
                            showSubmit={false}
                            onFilterChange={handleCommonFilterChange}
                            initialValues={{
                                grade_id: reportGrade,
                                gender: reportGender,
                                section: reportSection
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

    // Render date range filter
    const renderDateRangeFilter = () => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 600 }}>
                Report Parameters
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid #90caf9'
                    }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                            {t('reportFilter.dateRange')}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('reportFilter.startDate')}
                                    type="date"
                                    value={reportStartDate}
                                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'white',
                                            '&:hover fieldset': {
                                                borderColor: 'primary.main',
                                            },
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('reportFilter.endDate')}
                                    type="date"
                                    value={reportEndDate}
                                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'white',
                                            '&:hover fieldset': {
                                                borderColor: 'primary.main',
                                            },
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid #e0e6ed'
                    }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                            {t('reportFilter.filterOptionsOptional')}
                        </Typography>
                        <CommonFilter
                            hide={false}
                            showGender={true}
                            showSection={true}
                            showSubmit={false}
                            onFilterChange={handleCommonFilterChange}
                            initialValues={{
                                grade_id: reportGrade,
                                gender: reportGender,
                                section: reportSection
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

    // Render academic year filter
    const renderAcademicYearFilter = () => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 600 }}>
                Report Parameters
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid #ffb74d'
                    }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                            {t('reportFilter.academicYear')}
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>{t('reportFilter.selectAcademicYear')}</InputLabel>
                            <Select
                                value={reportAcademicYear}
                                onChange={(e) => handleDateChange('academicYear', e.target.value)}
                                label={t('reportFilter.selectAcademicYear')}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'white',
                                        '&:hover fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                    }
                                }}
                            >
                                <MenuItem value="2024-2025">2024-2025</MenuItem>
                                <MenuItem value="2023-2024">2023-2024</MenuItem>
                                <MenuItem value="2022-2023">2022-2023</MenuItem>
                                <MenuItem value="2021-2022">2021-2022</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Box sx={{ 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid #e0e6ed'
                    }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                            {t('reportFilter.filterOptionsOptional')}
                        </Typography>
                        <CommonFilter
                            hide={false}
                            showGender={true}
                            showSection={true}
                            showSubmit={false}
                            onFilterChange={handleCommonFilterChange}
                            initialValues={{
                                grade_id: reportGrade,
                                gender: reportGender,
                                section: reportSection
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

    // Render based on report type
    const renderFilter = () => {
        switch (reportType) {
            case 'date':
                return renderSpecificDateFilter();
            case 'range':
                return renderDateRangeFilter();
            case 'academic_year':
                return renderAcademicYearFilter();
            default:
                return null;
        }
    };

    return renderFilter();
};

export default ReportFilter;

