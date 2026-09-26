import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Button } from '@mui/material';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useGetBlogStatsQuery } from '../../Redux/features/Blog/postSlice';
import { useGetCommentStatsQuery } from '../../Redux/features/Blog/commentSlice';
import { useNavigate } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import CommentIcon from '@mui/icons-material/Comment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const BlogDashboard = () => {
  const { themeColors } = useThemeContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const ability = useAbility();

  const { data: blogStats, isLoading: blogStatsLoading } = useGetBlogStatsQuery();
  const { data: commentStats, isLoading: commentStatsLoading } = useGetCommentStatsQuery();

  const stats = React.useMemo(() => [
    {
      title: t('blogDashboard.stats.totalPosts'),
      value: blogStats?.data?.totalPosts || 0,
      icon: ArticleIcon,
      color: '#2196F3',
      path: '/blog/posts'
    },
    {
      title: t('blogDashboard.stats.publishedPosts'),
      value: blogStats?.data?.publishedPosts || 0,
      icon: CheckCircleIcon,
      color: '#4CAF50',
      path: '/blog/posts'
    },
    {
      title: t('blogDashboard.stats.totalViews'),
      value: blogStats?.data?.totalViews || 0,
      icon: VisibilityIcon,
      color: '#FF9800',
      path: '/blog/posts'
    },
    {
      title: t('blogDashboard.stats.totalComments'),
      value: commentStats?.data?.totalComments || 0,
      icon: CommentIcon,
      color: '#9C27B0',
      path: '/blog/comments'
    },
    {
      title: t('blogDashboard.stats.pendingComments'),
      value: commentStats?.data?.pendingComments || 0,
      icon: PendingActionsIcon,
      color: '#F44336',
      path: '/blog/comments'
    },
    {
      title: t('blogDashboard.stats.approvedComments'),
      value: commentStats?.data?.approvedComments || 0,
      icon: TrendingUpIcon,
      color: '#4CAF50',
      path: '/blog/comments'
    }
  ], [blogStats, commentStats, t]);

  const allQuickActions = React.useMemo(() => [
    {
      title: t('blogDashboard.quickActions.createNewPost.title'),
      description: t('blogDashboard.quickActions.createNewPost.description'),
      icon: ArticleIcon,
      color: themeColors.primary,
      path: '/blog/posts',
      action: 'create',
      permission: { action: 'Create', subject: 'BlogPosts' }
    },
    {
      title: t('blogDashboard.quickActions.managePosts.title'),
      description: t('blogDashboard.quickActions.managePosts.description'),
      icon: ArticleIcon,
      color: '#2196F3',
      path: '/blog/posts',
      permission: { action: 'Read', subject: 'BlogPosts' }
    },
    {
      title: t('blogDashboard.quickActions.moderateComments.title'),
      description: t('blogDashboard.quickActions.moderateComments.description'),
      icon: CommentIcon,
      color: '#9C27B0',
      path: '/blog/comments',
      permission: { action: 'Approve', subject: 'BlogComments' }
    },
    {
      title: t('blogDashboard.quickActions.viewStatistics.title'),
      description: t('blogDashboard.quickActions.viewStatistics.description'),
      icon: TrendingUpIcon,
      color: '#FF9800',
      path: '/blog/stats',
      permission: { action: 'Read', subject: 'Blog' }
    }
  ], [t, themeColors]);

  // Filter quick actions based on permissions
  const quickActions = allQuickActions.filter(action => 
    ability.can(action.permission.action, action.permission.subject)
  );

  const handleQuickAction = (action) => {
    if (action.action === 'create') {
      navigate(action.path, { state: { openCreate: true } });
    } else {
      navigate(action.path);
    }
  };

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <ArticleIcon sx={{ fontSize: 32, color: themeColors.primary }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('blogDashboard.title')}
            </Typography>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  backgroundColor: themeColors.background.primary, 
                  border: `1px solid ${themeColors.border.primary}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderColor: stat.color
                  }
                }}
                onClick={() => navigate(stat.path)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                        {stat.value.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      width: 48, 
                      height: 48, 
                      backgroundColor: `${stat.color}22`, 
                      color: stat.color 
                    }}>
                      <stat.icon sx={{ fontSize: 24 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 3 }}>
          {t('blogDashboard.quickActionsTitle')}
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
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderColor: action.color
                  }
                }}
                onClick={() => handleQuickAction(action)}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    <Avatar sx={{ 
                      width: 64, 
                      height: 64, 
                      backgroundColor: `${action.color}22`, 
                      color: action.color,
                      mx: 'auto',
                      mb: 2
                    }}>
                      <action.icon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                      {action.title}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: themeColors.text.secondary,
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Category Breakdown */}
        {blogStats?.data?.categoryBreakdown && (
          <Box mt={4}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 3 }}>
              {t('blogDashboard.postsByCategory')}
            </Typography>
            <Grid container spacing={2}>
              {blogStats.data.categoryBreakdown.map((category, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ 
                    backgroundColor: themeColors.background.primary, 
                    border: `1px solid ${themeColors.border.primary}` 
                  }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                        {category._id.charAt(0).toUpperCase() + category._id.slice(1)}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.primary }}>
                        {category.count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {t('blogDashboard.posts')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Status Breakdown */}
        {blogStats?.data?.statusBreakdown && (
          <Box mt={4}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 3 }}>
              {t('blogDashboard.postsByStatus')}
            </Typography>
            <Grid container spacing={2}>
              {blogStats.data.statusBreakdown.map((status, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ 
                    backgroundColor: themeColors.background.primary, 
                    border: `1px solid ${themeColors.border.primary}` 
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {status._id === 'published' && <CheckCircleIcon sx={{ color: '#4CAF50' }} />}
                        {status._id === 'draft' && <ArticleIcon sx={{ color: '#FF9800' }} />}
                        {status._id === 'submitted' && <PendingActionsIcon sx={{ color: '#2196F3' }} />}
                        {status._id === 'rejected' && <WarningIcon sx={{ color: '#F44336' }} />}
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                          {status._id.charAt(0).toUpperCase() + status._id.slice(1)}
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.primary }}>
                        {status.count}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {t('blogDashboard.posts')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </CustomOutletBox>
  );
};

export default BlogDashboard;
