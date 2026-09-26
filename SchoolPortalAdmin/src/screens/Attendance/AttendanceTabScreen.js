import React, { useState, useCallback, useMemo } from 'react';
import { Box, Tabs, Tab, Card, CardContent } from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import ManualAttendanceScreen from './ManualAttendanceScreen';
import TeacherAttendanceReportsScreen from './TeacherAttendanceReportsScreen';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const AttendanceTabScreen = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);

    const ability = useAbility();

    const handleTabChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
    }, []);

    const tabPanels = useMemo(() =>{ 
        if(ability.can("Create", "TeacherAttendance")){
            return [
                <ManualAttendanceScreen key="manual" />,
                <TeacherAttendanceReportsScreen key="reports" />
            ]
        }
        else{
            return [<TeacherAttendanceReportsScreen key="reports" />]
        }
    }, [ability]);

    return (
        <Box sx={{ backgroundColor: themeColors.background.secondary, minHeight: '100vh' }}>
            <Card sx={{ 
                backgroundColor: themeColors.background.primary, 
                border: `1px solid ${themeColors.border.primary}`,
                mb: 3
            }}>
                <CardContent sx={{ p: 0 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            borderBottom: `1px solid ${themeColors.border.primary}`,
                            '& .MuiTabs-indicator': { 
                                backgroundColor: themeColors.primary, 
                                height: 3 
                            },
                            '& .MuiTab-root': { 
                                minHeight: 64,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600
                            },
                        }}
                    >
                        {ability.can("Create", "TeacherAttendance") && <Tab
                            icon={<GroupIcon sx={{ mb: 0.5 }} />}
                            iconPosition="start"
                            label={t('attendance.tabs.manualAttendance')}
                            sx={{
                                color: activeTab === 0 ? themeColors.primary : themeColors.text.secondary,
                                '&.Mui-selected': { color: themeColors.primary },
                            }}
                        />}
                        <Tab
                            icon={<AssessmentIcon sx={{ mb: 0.5 }} />}
                            iconPosition="start"
                            label={t('attendance.tabs.reports')}
                            sx={{
                                color: activeTab === 1 ? themeColors.primary : themeColors.text.secondary,
                                '&.Mui-selected': { color: themeColors.primary },
                            }}
                        />
                    </Tabs>
                </CardContent>
            </Card>

            <Box>
                {tabPanels.map((panel, index) => (
                    <Box
                        key={index}
                        sx={{ display: activeTab === index ? 'block' : 'none' }}
                    >
                        {panel}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default React.memo(AttendanceTabScreen);

