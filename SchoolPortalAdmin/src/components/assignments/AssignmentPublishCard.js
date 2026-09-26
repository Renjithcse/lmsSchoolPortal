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
    Avatar,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssignmentIcon from '@mui/icons-material/Assignment';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useDeletePublishedAssignmentMutation } from '../../Redux/features/assignmentSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../hooks/SnackBar';
import UiBlocker from '../Common/UiBlocker';
import { useTranslation } from 'react-i18next';

const AssignmentPublishCard = ({ data, exam }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();

    console.log({data, exam})
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const [openDelete, setOpenDelete] = React.useState(false);
    const [deletePublishedAssignment, { isLoading: isDeleting }] = useDeletePublishedAssignmentMutation();

    console.log({data})

    const viewPublishedAssignment = useCallback(() => {
        navigate(data?._id)
    }, [data?._id, navigate])

    const closeDelete = useCallback(() => {
        setOpenDelete(false)
    }, [])

    const handleDelete = useCallback(() => {
        setOpenDelete(true)
    }, [])

    const handleConfirmDelete = useCallback(async () => {
        closeDelete();
        try {

            await deletePublishedAssignment({
                assignmentId: data?.assignment,
                publishId: data?._id
            }).unwrap();
            
            closeDelete();
            // Optionally refresh the data or navigate
            window.location.reload();
        } catch (error) {
            console.log({error})
            showSnackbar(error?.message ?? error?.data?.message ?? t('assignments.view.messages.error'), 'error');
            console.error('Failed to delete published assignment:', error);
            // You can add error handling here (e.g., show a snackbar)
        }
    }, [deletePublishedAssignment, data, closeDelete, showSnackbar, t]);

    const formatDate = (date) => {
        return dayjs(date).format('DD MMM YYYY');
    };

    const getGenderColor = (gender) => {
        return gender === "male" ? "primary" : "secondary";
    };

    const getGenderIcon = (gender) => {
        return gender === "male" ? "👨" : "👩";
    };

    return (
        <>
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
                {/* Header */}
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
                        {t('assignments.publishCard.title')}
                    </Typography>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    {/* Section Info */}
                    <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }}>
                            {getGenderIcon(data?.gender)}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                {data?.section?.sectionName}
                            </Typography>
                            <Chip
                                label={data?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls')}
                                color={data?.gender === 'male' ? 'primary' : 'secondary'}
                                size="small"
                                sx={{
                                    fontWeight: 'medium',
                                    height: 20,
                                    fontSize: '0.7rem'
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: themeColors.border.primary }} />

                    {/* Assignment Details */}
                    <Box sx={{ space: 1 }}>
                        {/* Question Bank */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <SchoolIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                {data?.questionBank?.questionBankName || t('assignments.card.title')}
                            </Typography>
                        </Box>

                        {/* Participants */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <PeopleIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }} display="block">
                                    {t('assignments.publishCard.participants', { attended: data?.attendedUsers || 0, total: data?.totalUsersSelected || 0 })}
                                </Typography>
                                <Typography variant="caption" sx={{ color: themeColors.text.secondary }} display="block">
                                    {t('assignments.view.completed', { percent: data?.attendedUsers ? Math.round((data.attendedUsers / data.totalUsersSelected) * 100) : 0 })}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Date Range */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <ScheduleIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                {t('assignments.publishCard.dateRange', { 
                                    startDate: formatDate(data?.startDate), 
                                    endDate: formatDate(data?.endDate),
                                    days: dayjs(data?.endDate).diff(dayjs(data?.startDate), 'days')
                                })}
                            </Typography>
                        </Box>

                        {/* Status */}
                        <Box mt={1}>
                            <Chip
                                label={data?.attendedUsers > 0 ? t('assignments.view.status.active') : t('assignments.view.status.pending')}
                                color={data?.attendedUsers > 0 ? "success" : "warning"}
                                size="small"
                                sx={{
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
                            onClick={viewPublishedAssignment}
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
                            {t('assignments.view.actions.view')}
                        </Button>
                    </Box>

                    <Box display="flex" gap={0.5}>
                        <IconButton
                            size="small"
                            onClick={handleDelete}
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
                    </Box>
                </CardActions>
            </Card>

            <Dialog
                open={openDelete}
                onClose={closeDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ borderBottom: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.primary }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <DeleteIcon sx={{ color: themeColors.error }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('assignments.publishCard.deleteDialog.title')}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: themeColors.background.primary }}>
                    <DialogContentText id="delete-dialog-description" sx={{ color: themeColors.text.secondary }}>
                        <Typography variant="body1" mb={2} sx={{ color: themeColors.text.secondary }}>
                            {t('assignments.publishCard.deleteDialog.confirmMessage')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('assignments.publishCard.deleteDialog.assignmentLabel')}:</strong> {data?.assignment?.assignmentName || t('assignments.view.notAvailable')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('assignments.publishCard.deleteDialog.sectionLabel')}:</strong> {data?.section?.sectionName || t('assignments.view.notAvailable')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <strong>{t('assignments.publishCard.deleteDialog.genderLabel')}:</strong> {data?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>
                            {t('assignments.publishCard.deleteDialog.warningMessage')}
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ backgroundColor: themeColors.background.primary, borderTop: `1px solid ${themeColors.border.primary}` }}>
                    <Button 
                        onClick={closeDelete}
                        color="inherit"
                        disabled={isDeleting}
                    >
                        {t('assignments.publishCard.deleteDialog.cancel')}
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete}
                        variant="contained"
                        disabled={isDeleting}
                        sx={{
                            backgroundColor: themeColors.error,
                            '&:hover': { backgroundColor: themeColors.error }
                        }}
                    >
                        {isDeleting ? t('assignments.publishCard.deleteDialog.deleting') : t('assignments.publishCard.deleteDialog.deleteButton')}
                    </Button>
                </DialogActions>
            </Dialog>
            <UiBlocker open={isDeleting} />
        </>
    );
};

export default memo(AssignmentPublishCard);
