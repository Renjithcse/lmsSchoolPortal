import React, { useState } from 'react';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { Box, Typography, Card, CardContent, Grid, Tabs, Tab, Divider } from '@mui/material';
import LibrarySettings from './LibrarySettings';
import GeneralSettings from './GeneralSettings';
import SchoolTimingSettings from './SchoolTimingSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';

const SettingsScreen = () => {
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: t('settings.tabs.general'), component: <GeneralSettings /> },
    { label: t('settings.tabs.library'), component: <LibrarySettings /> },
    { label: t('settings.tabs.schoolTimings'), component: <SchoolTimingSettings /> }
  ];

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <SettingsIcon sx={{ fontSize: 32, color: themeColors.primary }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
            {t('settings.title')}
          </Typography>
        </Box>

        <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: `1px solid ${themeColors.border.primary}`,
                '& .MuiTab-root': {
                  color: themeColors.text.secondary,
                  fontWeight: 'bold',
                  '&.Mui-selected': {
                    color: themeColors.primary,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: themeColors.primary,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabs[activeTab].component}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </CustomOutletBox>
  );
};

export default SettingsScreen;
