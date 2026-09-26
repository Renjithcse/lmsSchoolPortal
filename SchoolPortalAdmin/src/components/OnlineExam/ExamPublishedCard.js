import React, { memo, useCallback } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Divider, 
    IconButton, 
    CardActions,
    Chip,
    Stack,
    Tooltip,
    Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { DateRangeIcon } from '@mui/x-date-pickers';
import { Navigate, useNavigate } from 'react-router-dom';
import { RemoveRedEye } from '@mui/icons-material';
import DeleteDialog from '../Common/DeleteDialog';
import { useMutation } from '@tanstack/react-query';
import { deletePublishedExam } from '../../api/onlineExam';
import {
    Schedule as ScheduleIcon,
    Assignment as AssignmentIcon,
    Group as GroupIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ExamPublishedCard = ({ data, exam, onEdit, onDelete }) => {

    const { t } = useTranslation();
    const navigate = useNavigate()
    const [openDelete, setOpenDelete] = React.useState(false);

    console.log({ data })




    const viewExam = useCallback(() => {
        navigate(data?._id)
    }, [data?._id])

    const closeDelete = useCallback(() => {
        setOpenDelete(false)
    }, [])

    const handleDelete = useCallback(() => {
        setOpenDelete(true)
    }, [])


    return (
        <>
            <Card sx={{ 
                borderRadius: 2, 
                boxShadow: 2, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                }
            }}>
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    {/* Header Row */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                                    <Avatar 
                                sx={{ 
                                    bgcolor: data?.gender === "male" ? 'primary.main' : 'secondary.main',
                                    mr: 1.5,
                                    width: 36,
                                    height: 36
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                                    {data?.section?.sectionName}
                                </Typography>
                                <Chip 
                                    label={data?.gender === "male" ? t('publishedExams.examPublishedCard.gender.boys') : t('publishedExams.examPublishedCard.gender.girls')} 
                                    size="small" 
                                    color={data?.gender === "male" ? "primary" : "secondary"}
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                            </Box>
                        </Box>
                        <Chip 
                            label={data?.status || t('publishedExams.examPublishedCard.status.active')} 
                            color={data?.status === 'active' ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                        />
                    </Box>

                    {/* Two Column Layout */}
                    <Box display="flex" gap={2}>
                        {/* Left Column */}
                        <Box flex={1}>
                            {/* Question Bank */}
                            <Box mb={1.5}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                    {t('publishedExams.examPublishedCard.questionBank')}
                                </Typography>
                                <Typography variant="body2" fontWeight="medium" noWrap>
                                    {data?.questionBank?.questionBankName}
                                </Typography>
                            </Box>

                            {/* Participants */}
                            <Box display="flex" alignItems="center" mb={1}>
                                <GroupIcon color="info" sx={{ mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                    {t('publishedExams.examPublishedCard.participants')}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="info.main">
                                    {data?.attendedUsers || 0}/{data?.totalUsersSelected || 0}
                                </Typography>
                            </Box>

                            {/* Questions */}
                            <Box display="flex" alignItems="center">
                                <AssignmentIcon color="success" sx={{ mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                    {t('publishedExams.examPublishedCard.questions')}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                    {data?.numberOfQuestions || 0}/{data?.totalQuestionsInBank || 0}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Right Column */}
                        <Box flex={1}>
                            {/* Duration */}
                            <Box display="flex" alignItems="center" mb={1}>
                                <ScheduleIcon color="warning" sx={{ mr: 0.5, fontSize: 16 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                    {t('publishedExams.examPublishedCard.duration')}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="warning.main">
                                    {data?.duration || 0}m
                                </Typography>
                            </Box>

                            {/* Empty space for alignment */}
                            <Box height={32} />
                        </Box>
                    </Box>

                    {/* Date Range - Moved to bottom */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5}>
                        <Box display="flex" alignItems="center">
                            <CalendarIcon color="action" sx={{ mr: 0.5, fontSize: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                                {dayjs(data?.startDate).format("DD MMM")} - {dayjs(data?.endDate).format("DD MMM")}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {dayjs(data?.endDate).format("YYYY")}
                        </Typography>
                    </Box>
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ 
                    p: 1.5, 
                    pt: 0, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Tooltip title={t('publishedExams.examPublishedCard.tooltip.viewDetails')}>
                        <IconButton 
                            onClick={viewExam} 
                            color="primary"
                            size="small"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                    color: 'white'
                                }
                            }}
                        >
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('publishedExams.examPublishedCard.tooltip.editPublishedExam')}>
                        <IconButton 
                            onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                if(onEdit) {
                                    onEdit(data)
                                }
                            }} 
                            color="primary"
                            size="small"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                    color: 'white'
                                }
                            }}
                        >
                            <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('publishedExams.examPublishedCard.tooltip.deletePublishedExam')}>
                        <IconButton 
                            onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                onDelete ? onDelete(data) : handleDelete(); 
                            }} 
                            color="error"
                            size="small"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'white'
                                }
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </CardActions>
            </Card>

            <DeleteDialog
                open={openDelete}
                onClose={closeDelete}
                heading={t('publishedExams.examPublishedCard.deleteDialog.heading')}
                paragraph={t('publishedExams.examPublishedCard.deleteDialog.paragraph')}
                fun={deletePublishedExam}
                _id={data?._id}
                queryKeytoRefetch={['publishedExams', exam?.slug]}
            />
        </>
    );
};

export default memo(ExamPublishedCard);
