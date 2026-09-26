// src/components/AssignmentCard.js

import React, { memo } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    CardActions, 
    Box, 
    Chip, 
    IconButton,
    Avatar,
    Divider
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useTheme } from '../../contexts/ThemeContext';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const AssignmentCard = ({ assignment, onView, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const formatDate = (date) => {
        return dayjs(date).format('DD MMM YYYY');
    };

    const formatTime = (date) => {
        return dayjs(date).format('hh:mm A');
    };

    return (
        <Card 
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 2,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`,
                '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-1px)'
                }
            }}
        >
            {/* Header with Icon */}
            <Box
                sx={{
                    backgroundColor: `${themeColors.primary}22`,
                    color: themeColors.primary,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderBottom: `1px solid ${themeColors.border.primary}`
                }}
            >
                <AssignmentIcon sx={{ fontSize: 20, color: themeColors.primary }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.primary }}>
                    {t('assignments.card.title')}
                </Typography>
            </Box>

            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Assignment Name */}
                <Typography 
                    variant="subtitle1" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{
                        color: themeColors.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2,
                        minHeight: '2.4em',
                        fontSize: '0.95rem'
                    }}
                >
                    {assignment.assignmentName}
                </Typography>

                <Divider sx={{ borderColor: themeColors.border.primary }} />

                {/* Details */}
                <Box sx={{ space: 1 }}>
                    {/* Created Date */}
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <ScheduleIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            {t('assignments.card.createdAt', { date: formatDate(assignment.createdAt), time: formatTime(assignment.createdAt) })}
                        </Typography>
                    </Box>

                    {/* Created By */}
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PersonIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            {assignment.createdBy?.name || t('assignments.list.table.unknown')}
                        </Typography>
                    </Box>

                    {/* Status Chip */}
                    <Box mt={1}>
                        <Chip
                            label={t('assignments.list.status.active')}
                            size="small"
                            sx={{ 
                                backgroundColor: themeColors.success,
                                color: '#fff',
                                fontWeight: 'medium',
                                height: 20,
                                fontSize: '0.7rem'
                            }}
                        />
                    </Box>
                </Box>
            </CardContent>

            {/* Actions */}
            <CardActions sx={{ p: 1.5, pt: 0, justifyContent: 'space-between', borderTop: `1px solid ${themeColors.border.primary}` }}>
                <Box display="flex" gap={0.5}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                        onClick={() => onView(assignment)}
                        sx={{
                            color: themeColors.primary,
                            borderColor: themeColors.primary,
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            '&:hover': {
                                backgroundColor: themeColors.primary,
                                color: '#fff'
                            }
                        }}
                    >
                        {t('assignments.card.actions.view')}
                    </Button>
                    {onEdit && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                            onClick={() => onEdit(assignment)}
                            sx={{
                                color: themeColors.accent,
                                borderColor: themeColors.accent,
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1,
                                '&:hover': {
                                    backgroundColor: themeColors.accent,
                                    color: '#fff'
                                }
                            }}
                        >
                            {t('assignments.card.actions.edit')}
                        </Button>
                    )}
                </Box>
                
                {onDelete && (
                    <IconButton
                        size="small"
                        onClick={() => onDelete(assignment)}
                        sx={{
                            width: 28,
                            height: 28,
                            '&:hover': {
                                backgroundColor: themeColors.error,
                                color: '#fff'
                            }
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 16, color: themeColors.error }} />
                    </IconButton>
                )}
            </CardActions>
        </Card>
    );
};

export default memo(AssignmentCard);
