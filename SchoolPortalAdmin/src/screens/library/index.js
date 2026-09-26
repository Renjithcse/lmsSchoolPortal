import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Button } from '@mui/material';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useGetBookStatsQuery, useGetLibraryStatsQuery } from '../../Redux/features/Library/bookSlice';
import { useGetLibraryStatsQuery as useGetIssueStatsQuery } from '../../Redux/features/Library/bookIssueSlice';
import { useNavigate } from 'react-router-dom';
import BookIcon from '@mui/icons-material/Book';
import StorageIcon from '@mui/icons-material/Storage';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const LibraryDashboard = () => {
  const { themeColors } = useThemeContext();
  const navigate = useNavigate();
  const ability = useAbility();
  const { t } = useTranslation();

  const { data: bookStats, isLoading: bookStatsLoading } = useGetBookStatsQuery();
  const { data: issueStats, isLoading: issueStatsLoading } = useGetIssueStatsQuery();

  const stats = React.useMemo(() => [
    {
      title: t('libraryDashboard.stats.totalBooks'),
      value: bookStats?.data?.totalBooks || 0,
      icon: BookIcon,
      color: themeColors.primary,
      path: '/library/books'
    },
    {
      title: t('libraryDashboard.stats.availableBooks'),
      value: bookStats?.data?.availableBooks || 0,
      icon: BookIcon,
      color: '#4CAF50',
      path: '/library/books'
    },
    {
      title: t('libraryDashboard.stats.issuedBooks'),
      value: bookStats?.data?.issuedBooks || 0,
      icon: AssignmentIcon,
      color: '#FF9800',
      path: '/library/issues'
    },
    {
      title: t('libraryDashboard.stats.overdueBooks'),
      value: issueStats?.data?.overdueIssues || 0,
      icon: WarningIcon,
      color: '#F44336',
      path: '/library/issues'
    },
    {
      title: t('libraryDashboard.stats.totalFines'),
      value: `$${issueStats?.data?.totalFines || 0}`,
      icon: AttachMoneyIcon,
      color: '#9C27B0',
      path: '/library/issues'
    },
    {
      title: t('libraryDashboard.stats.utilizationRate'),
      value: `${Math.round(bookStats?.data?.utilizationRate || 0)}%`,
      icon: TrendingUpIcon,
      color: '#2196F3',
      path: '/library/books'
    }
  ], [bookStats, issueStats, themeColors.primary, t]);

  const allQuickActions = React.useMemo(() => [
    {
      title: t('libraryDashboard.quickActions.manageCategories'),
      description: t('libraryDashboard.quickActions.manageCategoriesDesc'),
      icon: CategoryIcon,
      path: '/library/categories',
      color: '#9C27B0',
      permission: { action: 'Read', subject: 'LibraryCategories' }
    },
    {
      title: t('libraryDashboard.quickActions.manageBookCatalogs'),
      description: t('libraryDashboard.quickActions.manageBookCatalogsDesc'),
      icon: BookIcon,
      path: '/library/catalogs',
      color: '#3F51B5',
      permission: { action: 'Read', subject: 'LibraryBookCatalog' }
    },
    {
      title: t('libraryDashboard.quickActions.manageRacks'),
      description: t('libraryDashboard.quickActions.manageRacksDesc'),
      icon: StorageIcon,
      path: '/library/racks',
      color: themeColors.primary,
      permission: { action: 'Read', subject: 'LibraryRacks' }
    },
    {
      title: t('libraryDashboard.quickActions.addBooks'),
      description: t('libraryDashboard.quickActions.addBooksDesc'),
      icon: BookIcon,
      path: '/library/books',
      color: '#4CAF50',
      permission: { action: 'Create', subject: 'LibraryBooks' }
    },
    {
      title: t('libraryDashboard.quickActions.issueBooks'),
      description: t('libraryDashboard.quickActions.issueBooksDesc'),
      icon: AssignmentIcon,
      path: '/library/issues',
      color: '#FF9800',
      permission: { action: 'Create', subject: 'LibraryBookIssue' }
    },
    {
      title: t('libraryDashboard.quickActions.returnBooks'),
      description: t('libraryDashboard.quickActions.returnBooksDesc'),
      icon: AssignmentIcon,
      path: '/library/issues',
      color: '#2196F3',
      permission: { action: 'Edit', subject: 'LibraryBookIssue' }
    }
  ], [themeColors.primary, t]);

  const quickActions = allQuickActions.filter(action =>
    ability.can(action.permission.action, action.permission.subject)
  );

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 3 }}>
          {t('libraryDashboard.title')}
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card 
                sx={{ 
                  backgroundColor: themeColors.background.primary, 
                  border: `1px solid ${themeColors.border.primary}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${stat.color}22`,
                    borderColor: stat.color
                  }
                }}
                onClick={() => navigate(stat.path)}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      backgroundColor: `${stat.color}22`, 
                      color: stat.color,
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <stat.icon sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
          {t('libraryDashboard.quickActions.title')}
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  backgroundColor: themeColors.background.primary, 
                  border: `1px solid ${themeColors.border.primary}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${action.color}22`,
                    borderColor: action.color
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      backgroundColor: `${action.color}22`, 
                      color: action.color,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <action.icon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity or Alerts */}
        <Box mt={4}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
            {t('libraryDashboard.recentActivity.title')}
          </Typography>
          <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
                {t('libraryDashboard.recentActivity.welcomeMessage')}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </CustomOutletBox>
  );
};

export default LibraryDashboard;
