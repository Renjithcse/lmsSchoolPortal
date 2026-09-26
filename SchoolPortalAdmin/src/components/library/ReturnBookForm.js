import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, RadioGroup, FormControlLabel, Radio, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomTextArea from '../Common/CustomTextArea';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useReturnBookMutation } from '../../Redux/features/Library/bookIssueSlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';

const ReturnBookForm = ({ open, close, onSuccess, selectedBookIssue }) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();
    const showSnackbar = useSnackbar();
    const [returnMethod, setReturnMethod] = useState('isbn');
    const [multipleBooks, setMultipleBooks] = useState([]);
    const [selectedBookIssueId, setSelectedBookIssueId] = useState(null);

    const schema = object().shape({
        isbn: string().optional(),
        studentId: string().optional(),
        returnNotes: string().optional(),
    });

    const {
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            isbn: '',
            studentId: '',
            returnNotes: '',
        }
    });

    const [returnBook, { isLoading: isReturning }] = useReturnBookMutation();

    useEffect(() => {
        if (!open) {
            reset();
            setReturnMethod('isbn');
            setMultipleBooks([]);
            setSelectedBookIssueId(null);
        } else if (selectedBookIssue) {
            // If a book is pre-selected, set the book issue ID
            setSelectedBookIssueId(selectedBookIssue._id);
        }
    }, [open, reset, selectedBookIssue]);

    const onSubmit = async (data) => {
        try {
            const returnData = {
                returnNotes: data.returnNotes || ''
            };

            if (selectedBookIssueId) {
                returnData.bookIssueId = selectedBookIssueId;
            } else if (returnMethod === 'isbn' && data.isbn) {
                returnData.isbn = data.isbn;
            } else if (returnMethod === 'studentId' && data.studentId) {
                returnData.studentId = data.studentId;
            } else {
                showSnackbar(t('returnBookForm.messages.provideIsbnOrStudentId'), 'error');
                return;
            }

            const result = await returnBook(returnData).unwrap();
            
            // Check if the response indicates multiple books
            if (result.activeIssues) {
                setMultipleBooks(result.activeIssues);
                return;
            }

            showSnackbar(t('returnBookForm.messages.returnSuccess'), 'success');
            onSuccess?.();
        } catch (error) {
            // Check if error indicates multiple books
            if (error?.data?.activeIssues) {
                setMultipleBooks(error.data.activeIssues);
            } else {
                showSnackbar(error?.data?.message || t('returnBookForm.messages.returnFailed'), 'error');
            }
        }
    };

    const handleReturnMethodChange = (event) => {
        setReturnMethod(event.target.value);
        // Clear the other field when switching methods
        if (event.target.value === 'isbn') {
            setValue('studentId', '');
        } else {
            setValue('isbn', '');
        }
    };

    const formatIssuedTo = (issuedTo, issuedToModel) => {
        if (!issuedTo) return `${issuedToModel} - ${t('returnBookForm.unknown')}`;
        
        if (typeof issuedTo === 'string') {
            return `${issuedToModel} - ${t('returnBookForm.id')}: ${issuedTo}`;
        }
        
        if (typeof issuedTo === 'object') {
            if (issuedTo.name) {
                const id = issuedTo.studentID || issuedTo.employeeId || issuedTo._id;
                return `${issuedToModel} - ${issuedTo.name} (${id})`;
            } else {
                const id = issuedTo.studentID || issuedTo.employeeId || issuedTo._id;
                return `${issuedToModel} - ${t('returnBookForm.id')}: ${id}`;
            }
        }
        
        return `${issuedToModel} - ${t('returnBookForm.unknown')}`;
    };

    return (
        <CustomModal close={close} open={open} label={t('returnBookForm.title')} width={'md'} block={true}>
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
                            <AssignmentReturnIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('returnBookForm.title')}
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2}>
                            {selectedBookIssue ? (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('returnBookForm.returnSelectedBook')}
                                    </Typography>
                                    <Card sx={{ 
                                        backgroundColor: themeColors.background.secondary, 
                                        border: `1px solid ${themeColors.border.primary}`,
                                        p: 2
                                    }}>
                                        <Typography variant="body1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                            {selectedBookIssue.book?.bookCatalog?.title || t('returnBookForm.unknownBook')} 
                                            ({t('returnBookForm.isbn')}: {selectedBookIssue.book?.bookCatalog?.isbn || t('returnBookForm.unknown')})
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                                            {t('returnBookForm.copy')}: {selectedBookIssue.book?.copyNumber || t('returnBookForm.unknown')} | 
                                            {t('returnBookForm.issuedTo')}: {formatIssuedTo(selectedBookIssue.issuedTo, selectedBookIssue.issuedToModel)} | 
                                            {t('returnBookForm.dueDate')}: {moment(selectedBookIssue.dueDate).format('DD-MM-YYYY')}
                                        </Typography>
                                        <Chip
                                            label={selectedBookIssue.status}
                                            size="small"
                                            sx={{
                                                backgroundColor: 
                                                    selectedBookIssue.status === 'issued' ? '#4CAF50' :
                                                    selectedBookIssue.status === 'overdue' ? '#F44336' : '#757575',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    </Card>
                                </Grid>
                            ) : (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                        {t('returnBookForm.returnMethod')}
                                    </Typography>
                                    <RadioGroup
                                        value={returnMethod}
                                        onChange={handleReturnMethodChange}
                                        sx={{
                                            '& .MuiFormControlLabel-root': {
                                                color: themeColors.text.primary,
                                            },
                                            '& .MuiRadio-root': {
                                                color: themeColors.border.primary,
                                                '&.Mui-checked': {
                                                    color: themeColors.primary,
                                                },
                                            },
                                        }}
                                    >
                                        <FormControlLabel value="isbn" control={<Radio />} label={t('returnBookForm.returnByIsbn')} />
                                        <FormControlLabel value="studentId" control={<Radio />} label={t('returnBookForm.returnByStudentId')} />
                                    </RadioGroup>
                                </Grid>
                            )}

                            {!selectedBookIssue && returnMethod === 'isbn' && (
                                <Grid item xs={12}>
                                    <CustomInput
                                        name="isbn"
                                        control={control}
                                        label={t('returnBookForm.fieldLabel.isbn')}
                                        placeholder={t('returnBookForm.placeholder.isbn')}
                                        error={errors.isbn}
                                        themeColors={themeColors}
                                    />
                                </Grid>
                            )}

                            {!selectedBookIssue && returnMethod === 'studentId' && (
                                <Grid item xs={12}>
                                    <CustomInput
                                        name="studentId"
                                        control={control}
                                        label={t('returnBookForm.fieldLabel.studentId')}
                                        placeholder={t('returnBookForm.placeholder.studentId')}
                                        error={errors.studentId}
                                        themeColors={themeColors}
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <CustomTextArea
                                    fieldName="returnNotes"
                                    control={control}
                                    fieldLabel={t('returnBookForm.fieldLabel.returnNotes')}
                                    placeholder={t('returnBookForm.placeholder.returnNotes')}
                                    error={errors.returnNotes}
                                    rows={3}
                                />
                            </Grid>

                            {multipleBooks.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('returnBookForm.selectBookToReturn')}
                                    </Typography>
                                    <List sx={{ 
                                        border: `1px solid ${themeColors.border.primary}`, 
                                        borderRadius: 1, 
                                        maxHeight: 300, 
                                        overflow: 'auto' 
                                    }}>
                                        {multipleBooks.map((book, index) => (
                                            <React.Fragment key={book._id}>
                                                <ListItem 
                                                    button 
                                                    onClick={() => setSelectedBookIssueId(book._id)}
                                                    sx={{
                                                        backgroundColor: selectedBookIssueId === book._id ? `${themeColors.primary}22` : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor: selectedBookIssueId === book._id ? `${themeColors.primary}22` : `${themeColors.background.secondary}`,
                                                        },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box>
                                                                <Typography variant="body1" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                                    {book.bookTitle} ({t('returnBookForm.isbn')}: {book.bookISBN})
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                                    {t('returnBookForm.copy')}: {book.copyNumber} | {t('returnBookForm.issueDate')}: {moment(book.issueDate).format('DD-MM-YYYY')} | {t('returnBookForm.dueDate')}: {moment(book.dueDate).format('DD-MM-YYYY')}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box mt={1}>
                                                                <Chip
                                                                    label={book.status}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: 
                                                                            book.status === 'issued' ? '#4CAF50' :
                                                                            book.status === 'overdue' ? '#F44336' : '#757575',
                                                                        color: 'white',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.7rem'
                                                                    }}
                                                                />
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < multipleBooks.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                                    <CustomButton
                                        variant="outlined"
                                        onClick={close}
                                        disable={isReturning}
                                        themeColors={themeColors}
                                        label={t('returnBookForm.actions.cancel')}
                                    />
                                    <CustomButton
                                        type="submit"
                                        disable={isReturning || (multipleBooks.length > 0 && !selectedBookIssueId)}
                                        loading={isReturning}
                                        themeColors={themeColors}
                                        label={isReturning ? t('returnBookForm.actions.returning') : t('returnBookForm.actions.returnBook')}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            <UiBlocker open={isReturning} />
        </CustomModal>
    );
};

export default ReturnBookForm;
