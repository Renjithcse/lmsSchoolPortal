// src/components/QuestionBankCard.js

import React, { memo, useState } from 'react';
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
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField
} from '@mui/material';
import { 
    Quiz as QuizIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuestionBank } from '../../api/onlineExam';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const QuestionBankCard = ({ data, exam, editable }) => {
    const { t } = useTranslation();
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [newQuestionBankName, setNewQuestionBankName] = useState(data?.questionBankName);
    const { themeColors } = useTheme();

    const showSnackbar = useSnackbar();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: updateQuestionBank,
        onSuccess: async (data) => {
            showSnackbar(t('onlineExam.questionBankCard.messages.updateSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ['questionBanks', exam?._id] })
        },
        onError: (error, variables, context) => {
            showSnackbar(error?.message, 'error');
        },
    });

    const navigate = useNavigate()
    const pathName = useLocation().pathname

    const handleEditDialogOpen = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        setOpenEditDialog(true);
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
        setNewQuestionBankName(data?.questionBankName); // Reset to original value
    };

    const handleQuestionViewOpen = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        navigate(`${pathName}/${data?.questionBankName}`, { state: data})
    };

    const handleNameChange = (event) => {
        setNewQuestionBankName(event.target.value);
    };

    const handleSave = () => {
        if (!newQuestionBankName || newQuestionBankName.trim() === '') {
            showSnackbar(t('onlineExam.questionBankCard.messages.nameCannotBeEmpty'), 'error');
            return;
        }

        const value = {
            questionBankName: newQuestionBankName.trim(),
            exam: exam?._id
        }

        if (data) {
            value['id'] = data?._id
        }
        mutate(value)
        setOpenEditDialog(false);
    };

    return (
        <>
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
                        <QuizIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.8)' }} />
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
                            {data?.questionBankName}
                        </Typography>
                        
                        <Chip 
                            label={t('onlineExam.questionBankCard.questionsCount', { count: data?.questionCount || 0 })}
                            size="small"
                            sx={{ 
                                backgroundColor: 'rgba(255,255,255,0.2)',
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
                                <PersonIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem' }}>
                                    {t('onlineExam.questionBankCard.fieldLabel.createdBy')}
                                </Typography>
                                <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                    {data?.createdBy?.name || t('onlineExam.questionBankCard.unknown')}
                                </Typography>
                            </Box>
                        </Box>

                {data?.subject?.subjectName && (
                    <Box display="flex" alignItems="center" mt={2}>
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
                                {t('onlineExam.questionBankCard.fieldLabel.subject')}
                            </Typography>
                            <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                {data.subject.subjectName}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {data?.grades && data.grades.length > 0 && (
                    <Box display="flex" flexWrap="wrap" alignItems="center" mt={2} gap={1}>
                        <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem', width: '100%' }}>
                            {t('onlineExam.questionBankCard.fieldLabel.grades')}
                        </Typography>
                        {data.grades.map((grade) => (
                            <Chip
                                key={grade._id || grade}
                                label={grade.gradeName || grade.name || grade}
                                size="small"
                                sx={{
                                    backgroundColor: themeColors.background.secondary,
                                    color: themeColors.text.primary,
                                }}
                            />
                        ))}
                    </Box>
                )}

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
                                    {t('onlineExam.questionBankCard.fieldLabel.created')}
                                </Typography>
                                <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                    {dayjs(data?.createdAt).format('DD MMM YYYY')}
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
                                <QuestionAnswerIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="body2" color={themeColors.text.secondary} sx={{ fontSize: '0.75rem' }}>
                                    {t('onlineExam.questionBankCard.fieldLabel.questions')}
                                </Typography>
                                <Typography variant="body2" color={themeColors.text.primary} sx={{ fontWeight: '500' }}>
                                    {t('onlineExam.questionBankCard.questionsCountLower', { count: data?.questionCount || 0 })}
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </CardContent>

                {/* Actions */}
                {editable && (
                    <CardActions sx={{
                        p: 3,
                        pt: 0,
                        justifyContent: 'space-between',
                        borderTop: `1px solid ${themeColors.border.primary}`,
                        backgroundColor: themeColors.background.secondary,
                        borderRadius: '0 0 16px 16px'
                    }}>
                        <Box display="flex" gap={1}>
                            <Tooltip title={t('onlineExam.questionBankCard.tooltip.viewQuestions')}>
                                <IconButton 
                                    onClick={handleQuestionViewOpen}
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

                            <Tooltip title={t('onlineExam.questionBankCard.tooltip.editQuestionBank')}>
                                <IconButton 
                                    onClick={handleEditDialogOpen}
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
                        </Box>
                    </CardActions>
                )}
            </Card>

            {/* Edit Dialog */}
            <Dialog 
                open={openEditDialog} 
                onClose={handleEditDialogClose}
                PaperProps={{
                    sx: {
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: '12px'
                    }
                }}
            >
                <DialogTitle sx={{ color: themeColors.text.primary }}>
                    {t('onlineExam.questionBankCard.editDialog.title')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: themeColors.text.secondary, mb: 2 }}>
                        {t('onlineExam.questionBankCard.editDialog.description')}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('onlineExam.questionBankCard.editDialog.fieldLabel')}
                        type="text"
                        fullWidth
                        value={newQuestionBankName || ''}
                        onChange={handleNameChange}
                        placeholder={t('onlineExam.questionBankCard.editDialog.placeholder')}
                        error={!newQuestionBankName || newQuestionBankName.trim() === ''}
                        helperText={!newQuestionBankName || newQuestionBankName.trim() === '' ? t('onlineExam.questionBankCard.editDialog.helperText') : ''}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.text.primary,
                                '& fieldset': {
                                    borderColor: themeColors.border.primary,
                                },
                                '&:hover fieldset': {
                                    borderColor: themeColors.primary,
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: themeColors.primary,
                                },
                                '&.Mui-error fieldset': {
                                    borderColor: themeColors.error,
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: themeColors.text.secondary,
                                '&.Mui-focused': {
                                    color: themeColors.primary,
                                },
                                '&.Mui-error': {
                                    color: themeColors.error,
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: themeColors.text.primary,
                            },
                            '& .MuiFormHelperText-root': {
                                color: themeColors.error,
                            },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={handleEditDialogClose} 
                        sx={{ 
                            color: themeColors.text.secondary,
                            '&:hover': {
                                backgroundColor: themeColors.background.secondary,
                            }
                        }}
                    >
                        {t('onlineExam.questionBankCard.editDialog.actions.cancel')}
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isPending || !newQuestionBankName || newQuestionBankName.trim() === ''}
                        sx={{ 
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            '&:hover': {
                                backgroundColor: themeColors.accent,
                            },
                            '&.Mui-disabled': {
                                backgroundColor: themeColors.background.tertiary,
                                color: themeColors.text.disabled,
                            }
                        }}
                    >
                        {isPending ? t('onlineExam.questionBankCard.editDialog.actions.saving') : t('onlineExam.questionBankCard.editDialog.actions.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default memo(QuestionBankCard);
