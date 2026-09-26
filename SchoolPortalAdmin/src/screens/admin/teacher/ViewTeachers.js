import React, { useState } from 'react'
import ViewProfile from '../../../components/Teachers/ViewProfile';
import { useLocation } from 'react-router-dom';
import { useGetTeacherProfileQuery } from '../../../Redux/features/Admin/TeachersSlice';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import UiBlocker from '../../../components/Common/UiBlocker';
import GradePermissions from '../../../components/Teachers/GradePermissions';
import SubjectPermission from '../../../components/Teachers/SubjectPermission';
import { Box, Typography, Card, CardContent, Tabs, Tab } from '@mui/material';
import CustomBackButton from '../../../components/Common/CustomBackbutton';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import { useTranslation } from 'react-i18next';

const ViewTeachers = () => {
    const [activeTab, setActiveTab] = useState(0);
    const { themeColors } = useThemeContext();
    const location = useLocation();
    const { t } = useTranslation();
    const { data: employee, isSuccess, isLoading } = useGetTeacherProfileQuery(location.state)

    console.log({ employee })

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const tabData = [
        {
            label: t('teacher.view.tabs.profile'),
            icon: <PersonIcon />,
            component: <ViewProfile employee={employee?.data} />
        },
        {
            label: t('teacher.view.tabs.gradePermissions'),
            icon: <SchoolIcon />,
            component: <GradePermissions />
        },
        {
            label: t('teacher.view.tabs.subjectPermissions'),
            icon: <SecurityIcon />,
            component: <SubjectPermission />
        }
    ];

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <CustomBackButton />
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('teacher.view.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('teacher.view.subtitle')}
                        </Typography>
                    </Box>
                </Box>

                {/* Main Content Card */}
                <Card sx={{ boxShadow: 3, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 0 }}>
                        {/* Tabs */}
                        <Box sx={{ borderBottom: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary, px: 2 }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    '& .MuiTabs-indicator': { backgroundColor: themeColors.primary, height: 3 },
                                    '& .MuiTab-root': { minHeight: 48 },
                                }}
                            >
                                {tabData.map((tab, index) => (
                                    <Tab
                                        key={index}
                                        icon={tab.icon}
                                        iconPosition="start"
                                        label={tab.label}
                                        sx={{
                                            color: activeTab === index ? themeColors.primary : themeColors.text.secondary,
                                            fontWeight: activeTab === index ? 700 : 400,
                                            '&.Mui-selected': { color: themeColors.primary },
                                            textTransform: 'none',
                                            mr: 1
                                        }}
                                    />
                                ))}
                            </Tabs>
                        </Box>

                        {/* Tab Content */}
                        <Box sx={{ p: 3, backgroundColor: themeColors.background.primary }}>
                            {isSuccess && (
                                <Box>
                                    {tabData[activeTab].component}
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
            
            <UiBlocker open={isLoading} />
        </CustomOutletBox>
    );
};

export default ViewTeachers