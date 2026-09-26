// src/components/QuestionCard.js

import React, { useState } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    FormControl, 
    RadioGroup, 
    FormControlLabel, 
    Radio, 
    Button, 
    Box, 
    Grid, 
    CardHeader, 
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    Divider
} from '@mui/material';
import { 
    DeleteOutline,
    Edit as EditIcon,
    Quiz as QuizIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { BASE_PATH } from '../../config';
import ImageViewer from '../Inputs/ImageViewer';
import DeleteDialog from '../Common/DeleteDialog';
import { deleteQuestions } from '../../api/onlineExam';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';


const QuestionCard = ({ question, view, onEdit }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const [open, setOpen] = useState(false);
    const location = useLocation();

    const [selectedOption, setSelectedOption] = useState('');

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };

    const handleSubmit = () => {
        // onSubmit(selectedOption);
    };

    const deleteQuestion = async () => {
        setOpen(true)
    }

    const handleEditClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (onEdit) {
            onEdit(question);
        }
    };

    return (
        <Box position="relative" marginY={2}>
            {/* Question Type Badge */}
            <Chip
                label={question?.questionType === "objective" ? t('onlineExam.questionCard.questionTypes.objective') : question?.questionType === "fill-in-the-blanks" ? t('onlineExam.questionCard.questionTypes.fillInTheBlanks') : t('onlineExam.questionCard.questionTypes.trueOrFalse')}
                sx={{
                    position: 'absolute',
                    top: -15,
                    left: 20,
                    zIndex: 10,
                    backgroundColor: themeColors.primary,
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                        px: 2
                    }
                }}
            />
            
            <Card 
                variant="outlined" 
                sx={{ 
                    width: '100%',
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': {
                        boxShadow: 3,
                        borderColor: themeColors.primary,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                    }
                }}
            >
                <CardHeader
                    avatar={
                        <Avatar sx={{ 
                            bgcolor: themeColors.primary,
                            color: 'white',
                            width: 48,
                            height: 48
                        }}>
                            <QuizIcon />
                        </Avatar>
                    }
                    title={
                        <Box display="flex" flexDirection="column">
                            <Typography 
                                variant="h6" 
                                component="div"
                                sx={{ 
                                    color: themeColors.text.primary,
                                    fontWeight: 600,
                                    mb: 1
                                }}
                            >
                                {question?.questionText}
                            </Typography>
                            {question?.questionImage && (
                                <Box sx={{ mt: 2 }}>
                                    <ImageViewer url={`${question?.questionImage}`} />
                                </Box>
                            )}
                        </Box>
                    }
                    action={
                        !view && (
                            <Box display="flex" gap={1}>
                                {/* <Tooltip title="Edit Question">
                                    <IconButton
                                        size="small"
                                        onClick={handleEditClick}
                                        sx={{
                                            backgroundColor: themeColors.background.secondary,
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
                                </Tooltip> */}
                                <Tooltip title={t('onlineExam.questionCard.tooltip.deleteQuestion')}>
                                    <IconButton
                                        size="small"
                                        onClick={deleteQuestion}
                                        sx={{
                                            backgroundColor: themeColors.background.secondary,
                                            color: themeColors.error,
                                            '&:hover': {
                                                backgroundColor: themeColors.error,
                                                color: 'white'
                                            },
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        <DeleteOutline sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )
                    }
                />
                <Divider sx={{ borderColor: themeColors.border.primary }} />
                
                <CardContent sx={{ pt: 2 }}>
                    <Typography 
                        variant="subtitle2" 
                        sx={{ 
                            color: themeColors.text.secondary,
                            mb: 2,
                            fontWeight: 600
                        }}
                    >
                        {t('onlineExam.questionCard.options')}:
                    </Typography>
                    
                    <FormControl component="fieldset" margin="normal" fullWidth>
                        <RadioGroup
                            aria-label="question-options"
                            name="question-options"
                            value={selectedOption}
                            onChange={handleChange}
                        >
                            {question?.questionType === "objective" && (
                                <Grid container spacing={2}>
                                    {question?.options.map((option, index) => {
                                        const optionLetter = String.fromCharCode(65 + index);
                                        const isCorrect = optionLetter === question?.correctAnswer;
                                        
                                        return (
                                            <Grid item xs={12} md={6} key={index}>
                                                {option?.type === "text" && (
                                                    <Box sx={{
                                                        p: 2,
                                                        border: `1px solid ${isCorrect ? themeColors.success : themeColors.border.primary}`,
                                                        borderRadius: 1,
                                                        backgroundColor: isCorrect ? `${themeColors.success}10` : themeColors.background.secondary,
                                                        position: 'relative'
                                                    }}>
                                                        {/* Option Label */}
                                                        <Box sx={{ mb: 1 }}>
                                                            <Chip 
                                                                label={t('onlineExam.questionCard.optionLabel', { letter: optionLetter })}
                                                                sx={{
                                                                    backgroundColor: isCorrect ? themeColors.success : themeColors.primary,
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.8rem'
                                                                }}
                                                            />
                                                        </Box>
                                                        <FormControlLabel
                                                            value={option?.value}
                                                            control={
                                                                <Radio 
                                                                    checked={isCorrect}
                                                                    sx={{
                                                                        color: isCorrect ? themeColors.success : themeColors.text.secondary,
                                                                        '&.Mui-checked': {
                                                                            color: themeColors.success
                                                                        }
                                                                    }}
                                                                />
                                                            }
                                                            label={
                                                                <Typography 
                                                                    sx={{ 
                                                                        color: isCorrect ? themeColors.success : themeColors.text.primary,
                                                                        fontWeight: isCorrect ? 600 : 400,
                                                                        wordBreak: 'break-word'
                                                                    }}
                                                                >
                                                                    {option?.value}
                                                                </Typography>
                                                            }
                                                        />
                                                        {isCorrect && (
                                                            <CheckCircleIcon 
                                                                sx={{ 
                                                                    position: 'absolute',
                                                                    top: 8,
                                                                    right: 8,
                                                                    color: themeColors.success,
                                                                    fontSize: 20
                                                                }} 
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                                {option?.type === "image" && (
                                                    <Box sx={{
                                                        p: 2,
                                                        border: `1px solid ${isCorrect ? themeColors.success : themeColors.border.primary}`,
                                                        borderRadius: 1,
                                                        backgroundColor: isCorrect ? `${themeColors.success}10` : themeColors.background.secondary,
                                                        position: 'relative'
                                                    }}>
                                                        {/* Option Label */}
                                                        <Box sx={{ mb: 1 }}>
                                                            <Chip 
                                                                label={t('onlineExam.questionCard.optionLabel', { letter: optionLetter })}
                                                                sx={{
                                                                    backgroundColor: isCorrect ? themeColors.success : themeColors.primary,
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.8rem'
                                                                }}
                                                            />
                                                        </Box>
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            <FormControlLabel
                                                                value={option.value}
                                                                control={
                                                                    <Radio 
                                                                        checked={isCorrect}
                                                                        sx={{
                                                                            color: isCorrect ? themeColors.success : themeColors.text.secondary,
                                                                            '&.Mui-checked': {
                                                                                color: themeColors.success
                                                                            }
                                                                        }}
                                                                    />
                                                                }
                                                                label=""
                                                            />
                                                            <ImageViewer url={`${option?.value}`} />
                                                        </Box>
                                                        {isCorrect && (
                                                            <CheckCircleIcon 
                                                                sx={{ 
                                                                    position: 'absolute',
                                                                    top: 8,
                                                                    right: 8,
                                                                    color: themeColors.success,
                                                                    fontSize: 20
                                                                }} 
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                            {question?.questionType !== "objective" && (
                                <Box sx={{
                                    p: 2,
                                    border: `1px solid ${themeColors.success}`,
                                    borderRadius: 1,
                                    backgroundColor: `${themeColors.success}10`,
                                    position: 'relative'
                                }}>
                                    <FormControlLabel
                                        value={question?.correctAnswer}
                                        control={
                                            <Radio 
                                                checked={true}
                                                sx={{
                                                    color: themeColors.success,
                                                    '&.Mui-checked': {
                                                        color: themeColors.success
                                                    }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography 
                                                sx={{ 
                                                    color: themeColors.success,
                                                    fontWeight: 600,
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {question?.correctAnswer}
                                            </Typography>
                                        }
                                    />
                                    <CheckCircleIcon 
                                        sx={{ 
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: themeColors.success,
                                            fontSize: 20
                                        }} 
                                    />
                                </Box>
                            )}
                        </RadioGroup>
                    </FormControl>
                </CardContent>
            </Card>
            <DeleteDialog 
                open={open} 
                onClose={() => setOpen(false)} 
                heading={t('onlineExam.questionCard.deleteDialog.heading')} 
                paragraph={t('onlineExam.questionCard.deleteDialog.paragraph')} 
                fun={deleteQuestions} 
                _id={question?._id} 
                queryKeytoRefetch={['questionBank', location?.state?._id]}
            />
        </Box>
    );
};

export default QuestionCard;
