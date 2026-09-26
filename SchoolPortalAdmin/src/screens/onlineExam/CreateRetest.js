import { 
    Box, 
    Card, 
    CardContent, 
    Grid, 
    MenuItem, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Typography,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    Checkbox,
    FormControlLabel,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Stack
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import CustomInput from '../../components/Common/CustomInput'
import CustomButton from '../../components/Common/CustomButton';
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAttendedUnattendedStudents, getNotPublishedSections, getAllQuestionBanks, publishExam, publishRetest } from '../../api/onlineExam';
import CustomSelect from '../../components/Common/CustomSelect';
import CustomMultiSelect from '../../components/Common/CustomMultiSelect';
import CustomDatePicker from '../../components/Common/CustomDatefilter';
import dayjs from 'dayjs';
import { useSnackbar } from '../../hooks/SnackBar';
import PublishedExamDetails from './PublishedExamDetails';
import {
    School as SchoolIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation, Trans } from 'react-i18next';

const CreateRetest = () => {
    const { themeColors } = useTheme();
    const { t } = useTranslation();
    const [maxQuestions, setMaxQuestions] = useState(0)
    const [datas, setDatas] = useState(null)
    const [expanded, setExpanded] = useState('panel1');

    const exam = useOutletContext();
    const queryClient = useQueryClient();
    const showSnackbar = useSnackbar();

    const location = useLocation()
    const navigate = useNavigate()

    // Validation schema - memoized with t dependency
    const schema = React.useMemo(() => yup.object().shape({
        questionBank: yup.string().required(t('createRetest.validation.questionBankRequired')),
        numberOfQuestions: yup.number().required(t('createRetest.validation.numberOfQuestionsRequired')),
        duration: yup.string().required(t('createRetest.validation.durationRequired')),
        startDate: yup.string().required(t('createRetest.validation.startDateRequired')),
        endDate: yup.string().required(t('createRetest.validation.endDateRequired')),
    }), [t]);

    // Get question banks for the exam's subject
    const { data } = useQuery({ 
        queryKey: ['questionBanks', location?.state?.publishedExam?.exam?.subjectId], 
        queryFn: () => getAllQuestionBanks({ 
            subjectId: location?.state?.publishedExam?.exam?.subjectId 
        }),
        enabled: !!location?.state?.publishedExam?.exam?.subjectId
    });

    const { data: students, isLoading } = useQuery({ 
        queryKey: ['attendedUnAttendedStudents', location?.state?.publishedExam?._id], 
        queryFn: () => getAttendedUnattendedStudents(location?.state?.publishedExam?._id) 
    });

    useEffect(() => {
        if(students){
            setDatas(students)
        }
    }, [students])

    const { mutate, isPending } = useMutation({
        mutationFn: publishRetest,
        onSuccess: async (data) => {
            showSnackbar(t('createRetest.messages.publishSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ['publishedExams', exam?._id] })
            navigate(-2)
        },
        onError: (error, variables, context) => {
            showSnackbar(error?.message, 'error');
        },
    });

    const {
        handleSubmit,
        control,
        setValue,
        setError,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
    });

    const questionBank = watch("questionBank")
    const startDate = watch("startDate")

    useEffect(() => {
        if (questionBank) {
            let selected = data?.questionBanks?.find(ques => ques?._id === questionBank);
            if (selected?.questionCount) {
                setMaxQuestions(selected?.questionCount)
            } else {
                setMaxQuestions(0)
            }
        }
    }, [questionBank])

    const onSubmit = (data) => {
        if (data?.numberOfQuestions > maxQuestions) {
            setError("numberOfQuestions", { type: 'custom', message: t('createRetest.validation.numberOfQuestionsMax') })
            return false
        }

        let selectedStudents = datas?.unattendedStudents?.filter(student => student.checked);
        let selectedAttendedStudents = datas?.attendedStudents?.filter(student => student.checked);

        if(selectedStudents.length === 0 && selectedAttendedStudents.length === 0) {
            showSnackbar(t('createRetest.messages.atLeastOneStudent'), 'error');
            return false
        }

        let selected = [];
        if(selectedStudents) selected = selected.concat(selectedStudents);
        if(selectedAttendedStudents) selected = selected.concat(selectedAttendedStudents);

        let params = {
            ...data,
            publishId: location?.state?.publishedExam?._id,
            selectedStudents: selected
        }

        mutate(params);
    };

    const checkAllUnAttended = (checked) => {
        datas?.unattendedStudents?.map(student => student.checked = checked);
        setDatas({...datas })
    }

    const checkAllAttended = (checked) => {
        datas?.attendedStudents?.map(student => student.checked = checked);
        setDatas({...datas })
    }

    const checkUnAttended = (e, index) => {
        datas.unattendedStudents[index].checked = e.target.checked
        setDatas({...datas })
    }

    const checkAttended = (e, index) => {
        datas.attendedStudents[index].checked = e.target.checked
        setDatas({...datas })
    }

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const getSelectedCount = (students) => {
        return students?.filter(student => student.checked)?.length || 0;
    };

    const totalUnattended = datas?.unattendedStudents?.length || 0;
    const totalAttended = datas?.attendedStudents?.length || 0;
    const selectedUnattended = getSelectedCount(datas?.unattendedStudents);
    const selectedAttended = getSelectedCount(datas?.attendedStudents);

    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <SchoolIcon sx={{ fontSize: 32, color: themeColors.primary, mr: 2 }} />
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ color: themeColors.text.primary }}>
                        {t('createRetest.title')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
                        {t('createRetest.subtitle')}
                    </Typography>
                </Box>
            </Box>

            {/* Exam Details Card */}
            <Card sx={{ 
                mb: 3, 
                borderRadius: 2, 
                boxShadow: 2,
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`
            }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ mr: 1 }} />
                        {t('createRetest.examDetails.title')}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon color="action" />
                                <Box ml={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('createRetest.examDetails.totalStudents')}
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {totalUnattended + totalAttended}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center">
                                <CancelIcon color="error" />
                                <Box ml={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('createRetest.examDetails.unattended')}
                                    </Typography>
                                    <Typography variant="h6" color="error.main">
                                        {totalUnattended}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center">
                                <CheckCircleIcon color="success" />
                                <Box ml={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('createRetest.examDetails.attended')}
                                    </Typography>
                                    <Typography variant="h6" color="success.main">
                                        {totalAttended}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center">
                                <ScheduleIcon color="action" />
                                <Box ml={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('createRetest.examDetails.duration')}
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {location?.state?.publishedExam?.duration || 0} {t('createRetest.examDetails.minutes')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Retest Configuration Form */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <RefreshIcon sx={{ mr: 1 }} />
                        {t('createRetest.configuration.title')}
                    </Typography>
                    
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CustomSelect
                                    control={control}
                                    error={errors.questionBank}
                                    fieldName="questionBank"
                                    fieldLabel={t('createRetest.configuration.questionBank')}
                                    size="16px"
                                >
                                    <MenuItem value="" disabled>
                                        <em>{t('createRetest.configuration.selectQuestionBank')}</em>
                                    </MenuItem>
                                    {data?.questionBanks?.map((res) => (
                                        <MenuItem key={res._id} value={res?._id}>
                                            {res.questionBankName}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    placeholder={t('createRetest.configuration.numberOfQuestionsPlaceholder')}
                                    control={control}
                                    type={"number"}
                                    error={errors.numberOfQuestions}
                                    fieldName="numberOfQuestions"
                                    fieldLabel={`${t('createRetest.configuration.numberOfQuestions')} ${maxQuestions ? `(${t('createRetest.configuration.max')} ${maxQuestions})` : ''}`}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    placeholder={t('createRetest.configuration.durationPlaceholder')}
                                    control={control}
                                    error={errors.duration}
                                    fieldName="duration"
                                    type={"number"}
                                    fieldLabel={t('createRetest.configuration.duration')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    placeholder={t('createRetest.configuration.startDatePlaceholder')}
                                    control={control}
                                    error={errors.startDate}
                                    fieldName="startDate"
                                    fieldLabel={t('createRetest.configuration.startDate')}
                                    minDate={dayjs()}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    placeholder={t('createRetest.configuration.endDatePlaceholder')}
                                    control={control}
                                    error={errors.endDate}
                                    fieldName="endDate"
                                    fieldLabel={t('createRetest.configuration.endDate')}
                                    minDate={startDate ? startDate : dayjs()}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

            {/* Student Selection */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1 }} />
                        {t('createRetest.studentSelection.title')}
                    </Typography>

                    {/* Unattended Students */}
                    <Accordion 
                        expanded={expanded === 'panel1'} 
                        onChange={handleAccordionChange('panel1')}
                        sx={{ mb: 2 }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                <Box display="flex" alignItems="center">
                                    <CancelIcon color="error" sx={{ mr: 1 }} />
                                    <Typography variant="h6">{t('createRetest.studentSelection.unattendedStudents')}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Chip 
                                        label={`${selectedUnattended}/${totalUnattended}`} 
                                        color="error" 
                                        size="small" 
                                    />
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {totalUnattended > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={datas?.unattendedStudents?.every(obj => obj.checked)}
                                                        indeterminate={selectedUnattended > 0 && selectedUnattended < totalUnattended}
                                                        onChange={(e) => checkAllUnAttended(e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell><strong>{t('createRetest.studentSelection.studentId')}</strong></TableCell>
                                                <TableCell><strong>{t('createRetest.studentSelection.studentName')}</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {datas?.unattendedStudents?.map((row, index) => (
                                                <TableRow key={row._id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={row?.checked}
                                                            onChange={(e) => checkUnAttended(e, index)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{row?.studentId?.studentID}</TableCell>
                                                    <TableCell>{row.studentId?.studentName}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info" icon={<InfoIcon />}>
                                    {t('createRetest.studentSelection.allAttended')}
                                </Alert>
                            )}
                        </AccordionDetails>
                    </Accordion>

                    {/* Attended Students */}
                    <Accordion 
                        expanded={expanded === 'panel2'} 
                        onChange={handleAccordionChange('panel2')}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                <Box display="flex" alignItems="center">
                                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                    <Typography variant="h6">{t('createRetest.studentSelection.attendedStudents')}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Chip 
                                        label={`${selectedAttended}/${totalAttended}`} 
                                        color="success" 
                                        size="small" 
                                    />
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {totalAttended > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={datas?.attendedStudents?.every(obj => obj.checked)}
                                                        indeterminate={selectedAttended > 0 && selectedAttended < totalAttended}
                                                        onChange={(e) => checkAllAttended(e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell><strong>{t('createRetest.studentSelection.studentId')}</strong></TableCell>
                                                <TableCell><strong>{t('createRetest.studentSelection.studentName')}</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {datas?.attendedStudents?.map((row, index) => (
                                                <TableRow key={row._id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={row?.checked}
                                                            onChange={(e) => checkAttended(e, index)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{row?.studentId?.studentID}</TableCell>
                                                    <TableCell>{row.studentId?.studentName}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info" icon={<InfoIcon />}>
                                    {t('createRetest.studentSelection.noneAttended')}
                                </Alert>
                            )}
                        </AccordionDetails>
                    </Accordion>

                    {/* Summary */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('createRetest.summary.title')}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Box display="flex" alignItems="center">
                                    <CancelIcon color="error" sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        <Trans
                                            i18nKey="createRetest.summary.unattended"
                                            values={{ count: selectedUnattended }}
                                            components={{ strong: <strong /> }}
                                        />
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box display="flex" alignItems="center">
                                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        <Trans
                                            i18nKey="createRetest.summary.attended"
                                            values={{ count: selectedAttended }}
                                            components={{ strong: <strong /> }}
                                        />
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <Trans
                                i18nKey="createRetest.summary.total"
                                values={{ count: selectedUnattended + selectedAttended }}
                                components={{ strong: <strong /> }}
                            />
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="center" mt={3} gap={2}>
                <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    disabled={isPending}
                >
                    {t('createRetest.actions.cancel')}
                </Button>
                <Button
                    variant="contained"
                    startIcon={isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSubmit(onSubmit)}
                    disabled={isPending || maxQuestions === 0 || (selectedUnattended + selectedAttended === 0)}
                >
                    {isPending ? t('createRetest.actions.creating') : t('createRetest.actions.create')}
                </Button>
            </Box>

            {maxQuestions === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <WarningIcon />
                    {t('createRetest.alerts.noQuestions')}
                </Alert>
            )}

            {(selectedUnattended + selectedAttended === 0) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <WarningIcon />
                    {t('createRetest.alerts.selectStudent')}
                </Alert>
            )}
        </Box>
    );
};

export default CreateRetest;