// src/components/ExamCard.js

import React from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    CardActions,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Avatar,
    Divider,
    Stack,
    Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
    Assessment as AssessmentIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ExamCard = ({ exam, onView, onEdit, onDelete, onReport }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return themeColors.success;
            case 'inactive':
                return themeColors.error;
            default:
                return themeColors.text.secondary;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return t('examCard.status.active');
            case 'inactive':
                return t('examCard.status.inactive');
            default:
                return status;
        }
    };

    return (
        <Card 
            elevation={0}
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                border: `1px solid ${themeColors.border.primary}`,
                borderRadius: '16px',
                backgroundColor: themeColors.background.primary,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 32px ${themeColors.primary}15`,
                    borderColor: themeColors.primary,
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                pb: 2,
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                borderRadius: '16px 16px 0 0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <SchoolIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.8)' }} />
                </Box>
                
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            fontWeight: 'bold',
                            color: 'white',
                            mb: 1,
                            fontSize: '1.1rem'
                        }}
                    >
                        {exam.examName}
                    </Typography>
                    
                    <Chip 
                        label={getStatusText(exam.status)} 
                        size="small"
                        sx={{ 
                            backgroundColor: getStatusColor(exam.status),
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            height: '24px'
                        }}
                    />
                </Box>
            </Box>

            {/* Content */}
            <CardContent sx={{ 
                flexGrow: 1, 
                p: 3,
                pt: 2,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Stack spacing={2}>
                    <Box display="flex" alignItems="center">
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32, 
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.primary,
                                mr: 2
                            }}
                        >
                            <AssignmentIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem' }}>
                                {t('examCard.fieldLabel.term')}
                            </Typography>
                            <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                {exam.term || t('examCard.noTerm')}
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center">
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32, 
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.primary,
                                mr: 2
                            }}
                        >
                            <ScheduleIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem' }}>
                                {t('examCard.fieldLabel.created')}
                            </Typography>
                            <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                {dayjs(exam.createdAt).format('DD MMM YYYY')}
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center">
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32, 
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.primary,
                                mr: 2
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem' }}>
                                {t('examCard.fieldLabel.createdBy')}
                            </Typography>
                            <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                {exam.createdBy?.name || t('examCard.unknown')}
                            </Typography>
                        </Box>
                    </Box>

                    {exam.publishedCount !== undefined && (
                        <Box display="flex" alignItems="center">
                            <Avatar 
                                sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    backgroundColor: themeColors.background.secondary,
                                    color: themeColors.primary,
                                    mr: 2
                                }}
                            >
                                <AssessmentIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem' }}>
                                    {t('examCard.fieldLabel.published')}
                                </Typography>
                                <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                    {t('examCard.publishedCount', { count: exam.publishedCount || 0 })}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Stack>
            </CardContent>

            {/* Actions */}
            <CardActions sx={{
                p: 3,
                pt: 0,
                justifyContent: 'space-between',
                borderTop: `1px solid ${themeColors.border.primary}`,
                backgroundColor: themeColors.background.secondary,
                borderRadius: '0 0 16px 16px'
            }}>
                <Box display="flex" gap={1}>
                    <Tooltip title={t('examCard.tooltip.viewPublishedExams')}>
                        <IconButton 
                            component={Link} 
                            to={`/online-exam/${exam.slug}/published`} 
                            state={exam}
                            size="small"
                            sx={{
                                backgroundColor: themeColors.background.primary,
                                color: themeColors.primary,
                                '&:hover': {
                                    backgroundColor: themeColors.primary,
                                    color: 'white'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('examCard.tooltip.editExam')}>
                        <IconButton 
                            onClick={() => onEdit(exam)}
                            size="small"
                            sx={{
                                backgroundColor: themeColors.background.primary,
                                color: themeColors.primary,
                                '&:hover': {
                                    backgroundColor: themeColors.primary,
                                    color: 'white'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('examCard.tooltip.viewReport')}>
                        <IconButton 
                            onClick={() => onReport(exam)}
                            size="small"
                            sx={{
                                backgroundColor: themeColors.background.primary,
                                color: themeColors.info,
                                '&:hover': {
                                    backgroundColor: themeColors.info,
                                    color: 'white'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <AssessmentIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('examCard.tooltip.deleteExam')}>
                        <IconButton 
                            onClick={() => onDelete(exam)}
                            size="small"
                            sx={{
                                backgroundColor: themeColors.background.primary,
                                color: themeColors.error,
                                '&:hover': {
                                    backgroundColor: themeColors.error,
                                    color: 'white'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardActions>
        </Card>
    );
};

export default ExamCard;
