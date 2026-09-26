import React, { useEffect, useState, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, MenuItem } from '@mui/material';
import CustomModal from '../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string } from "yup";
import CustomInput from '../Common/CustomInput';
import CustomSelect from '../Common/CustomSelect';
import CustomTextArea from '../Common/CustomTextArea';
import CustomButton from '../Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useIssueBookMutation } from '../../Redux/features/Library/bookIssueSlice';
import { useListBooksQuery } from '../../Redux/features/Library/bookSlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useTranslation } from 'react-i18next';

const IssueBookForm = ({ open, close, onSuccess }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();

  const schema = useMemo(() => object().shape({
    bookId: string().required(t('issueBookForm.validation.bookRequired')),
    issuedTo: string().required(t('issueBookForm.validation.userIdRequired')),
    issuedToModel: string().required(t('issueBookForm.validation.userTypeRequired')),
    issueNotes: string(),
  }), [t]);

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
      bookId: '',
      issuedTo: '',
      issuedToModel: '',
      issueNotes: '',
    }
  });

  const watchedUserType = watch('issuedToModel');

  // Fetch available books
  const { data: booksData, refetch: refetchBooks } = useListBooksQuery({ status: 'available' });

  const [issueBook, { isLoading: isIssuing }] = useIssueBookMutation();

  useEffect(() => {
    if (!open) {
      reset();
    } else {
      // Refetch books when modal opens to get fresh data
      refetchBooks();
    }
  }, [open, reset, refetchBooks]);

  const onSubmit = async (data) => {
    try {
      await issueBook(data).unwrap();
      showSnackbar(t('issueBookForm.messages.issueSuccess'), 'success');
      onSuccess?.();
    } catch (error) {
      showSnackbar(error?.data?.message || t('issueBookForm.messages.issueFailed'), 'error');
    }
  };

  const availableBooks = booksData?.books || [];

  return (
    <CustomModal close={close} open={open} label={t('issueBookForm.title')} width={'md'} block={true}>
      <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
              <AssignmentIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('issueBookForm.title')}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CustomSelect
                  fieldName="bookId"
                  control={control}
                  fieldLabel={t('issueBookForm.fieldLabel.selectBook')}
                  error={errors.bookId}
                  themeColors={themeColors}
                >
                  <MenuItem value="">{t('issueBookForm.selectBook')}</MenuItem>
                  {availableBooks.map((book) => (
                    <MenuItem key={book._id} value={book._id}>
                      {book.bookCatalog?.title || t('issueBookForm.unknownTitle')} - {book.bookCatalog?.author || t('issueBookForm.unknownAuthor')} ({t('issueBookForm.copy')}: {book.copyNumber})
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomSelect
                  fieldName="issuedToModel"
                  control={control}
                  fieldLabel={t('issueBookForm.fieldLabel.userType')}
                  error={errors.issuedToModel}
                  themeColors={themeColors}
                >
                  <MenuItem value="">{t('issueBookForm.selectUserType')}</MenuItem>
                  <MenuItem value="Student">{t('issueBookForm.userType.student')}</MenuItem>
                  <MenuItem value="Teacher">{t('issueBookForm.userType.teacher')}</MenuItem>
                </CustomSelect>
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomInput
                  name="issuedTo"
                  control={control}
                  label={t('issueBookForm.fieldLabel.userId', { userType: watchedUserType || t('issueBookForm.user') })}
                  placeholder={t('issueBookForm.placeholder.userId', { userType: watchedUserType || t('issueBookForm.user').toLowerCase() })}
                  error={errors.issuedTo}
                  themeColors={themeColors}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextArea
                  fieldName="issueNotes"
                  control={control}
                  fieldLabel={t('issueBookForm.fieldLabel.notes')}
                  placeholder={t('issueBookForm.placeholder.notes')}
                  error={errors.issueNotes}
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                  <CustomButton
                    variant="outlined"
                    onClick={close}
                    disable={isIssuing}
                    themeColors={themeColors}
                    label={t('issueBookForm.actions.cancel')}
                  />
                  <CustomButton
                    type="submit"
                    disable={isIssuing}
                    loading={isIssuing}
                    themeColors={themeColors}
                    label={isIssuing ? t('issueBookForm.actions.issuing') : t('issueBookForm.actions.issueBook')}
                  />
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <UiBlocker open={isIssuing} />
    </CustomModal>
  );
};

export default IssueBookForm;
