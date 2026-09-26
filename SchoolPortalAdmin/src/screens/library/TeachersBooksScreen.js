import React, { useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, Grid, Button, ToggleButton, ToggleButtonGroup, Avatar } from '@mui/material';
import DataTable from '../../components/Common/CustomTable';
import { useGetTeachersIssuedBooksQuery, useRenewBookMutation, usePayFineMutation } from '../../Redux/features/Library/bookIssueSlice';
import moment from 'moment/moment';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import BookIcon from '@mui/icons-material/Book';
import { useTranslation } from 'react-i18next';

const TeachersBooksScreen = () => {
  const showSnackbar = useSnackbar();
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();

  // View mode state (table or card)
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });

  // Fetch current teacher's books
  const { data, isError, isLoading, refetch, error } = useGetTeachersIssuedBooksQuery({
    ...pagination
  });

  const [renewBook] = useRenewBookMutation();
  const [payFine] = usePayFineMutation();

  // Transform book issues data to add id field for DataTable
  const transformedBookIssues = data?.bookIssues ? data.bookIssues.map(issue => ({
    ...issue,
    id: issue._id
  })) : [];

  const handleRenew = React.useCallback(async (bookIssueId) => {
    try {
      await renewBook(bookIssueId).unwrap();
      showSnackbar(t('teachersBooksScreen.messages.renewSuccess'), 'success');
      refetch();
    } catch (error) {
      showSnackbar(error?.data?.message || t('teachersBooksScreen.messages.renewFailed'), 'error');
    }
  }, [renewBook, showSnackbar, t, refetch]);

  const handlePayFine = React.useCallback(async (bookIssueId) => {
    try {
      await payFine(bookIssueId).unwrap();
      showSnackbar(t('teachersBooksScreen.messages.payFineSuccess'), 'success');
      refetch();
    } catch (error) {
      showSnackbar(error?.data?.message || t('teachersBooksScreen.messages.payFineFailed'), 'error');
    }
  }, [payFine, showSnackbar, t, refetch]);

  const columns = React.useMemo(() => [
    {
      field: 'SN',
      headerName: t('teachersBooksScreen.table.sn'),
      width: 80,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
    },
    {
      field: 'coverImage',
      headerName: t('teachersBooksScreen.table.cover'),
      width: 80,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: ({ row }) => (
        <Avatar
          variant="square"
          src={row.book?.coverImage || row.book?.bookCatalog?.coverImage}
          sx={{ 
            width: 50, 
            height: 50,
            border: `1px solid ${themeColors.border.primary}`,
            backgroundColor: themeColors.background.secondary
          }}
        >
          <BookIcon />
        </Avatar>
      )
    },
    {
      field: 'book',
      headerName: t('teachersBooksScreen.table.bookDetails'),
      width: 300,
      headerAlign: 'center',
      align: 'left',
      valueGetter: (params) => {
        const book = params.row.book;
        if (book && book.bookCatalog) {
          return `${book.bookCatalog.title} (${book.bookCatalog.isbn}) - ${t('teachersBooksScreen.table.copy')} ${book.copyNumber}`;
        }
        return t('teachersBooksScreen.table.na');
      }
    },
    {
      field: 'category',
      headerName: t('teachersBooksScreen.table.category'),
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => {
        const book = params.row.book;
        return book?.bookCatalog?.category?.name || t('teachersBooksScreen.table.na');
      }
    },
    {
      field: 'location',
      headerName: t('teachersBooksScreen.table.location'),
      width: 150,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => {
        const book = params.row.book;
        return book?.location || t('teachersBooksScreen.table.na');
      }
    },
    {
      field: 'issueDate',
      headerName: t('teachersBooksScreen.table.issueDate'),
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => moment(params?.row?.issueDate).format("DD-MM-YYYY")
    },
    {
      field: 'dueDate',
      headerName: t('teachersBooksScreen.table.dueDate'),
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => moment(params?.row?.dueDate).format("DD-MM-YYYY"),
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2">
            {moment(row.dueDate).format("DD-MM-YYYY")}
          </Typography>
          {row.isOverdue && (
            <Chip
              label={t('teachersBooksScreen.table.overdue')}
              size="small"
              sx={{
                backgroundColor: '#F44336',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                mt: 0.5
              }}
            />
          )}
        </Box>
      )
    },
    {
      field: 'status',
      headerName: t('teachersBooksScreen.table.status'),
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row }) => (
        <Chip
          label={t(`teachersBooksScreen.status.${row.status}`) || row.status}
          size="small"
          sx={{
            backgroundColor: 
              row.status === 'issued' ? '#4CAF50' :
              row.status === 'returned' ? '#2196F3' :
              row.status === 'overdue' ? '#F44336' :
              row.status === 'lost' ? '#9C27B0' : '#757575',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem'
          }}
        />
      )
    },
    {
      field: 'renewalCount',
      headerName: t('teachersBooksScreen.table.renewals'),
      width: 100,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'fineAmount',
      headerName: t('teachersBooksScreen.table.fine'),
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => {
        return params.row.fineAmount > 0 ? `$${params.row.fineAmount}` : '-';
      },
      renderCell: ({ row }) => (
        <Box>
          {row.fineAmount > 0 && (
            <Chip
              label={`$${row.fineAmount}`}
              size="small"
              color={row.finePaid ? "success" : "error"}
              variant={row.finePaid ? "filled" : "outlined"}
              sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
            />
          )}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: t('teachersBooksScreen.table.actions'),
      width: 150,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          {row.status === 'issued' && (
            <Tooltip title={t('teachersBooksScreen.actions.renew')}>
              <IconButton
                size="small"
                onClick={() => handleRenew(row._id)}
                sx={{
                  color: themeColors.primary,
                  '&:hover': {
                    backgroundColor: `${themeColors.primary}22`,
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          {row.fineAmount > 0 && !row.finePaid && (
            <Tooltip title={t('teachersBooksScreen.actions.payFine')}>
              <IconButton
                size="small"
                onClick={() => handlePayFine(row._id)}
                sx={{
                  color: '#FF9800',
                  '&:hover': {
                    backgroundColor: '#FF980022',
                  },
                }}
              >
                <PaymentIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    }
  ], [t, themeColors, handleRenew, handlePayFine]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  if (isError) {
    return (
      <CustomOutletBox>
        <ErrorInfo error={error} />
      </CustomOutletBox>
    );
  }

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <AssignmentIcon sx={{ fontSize: 32, color: themeColors.primary }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('teachersBooksScreen.title')}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="card" aria-label="card view">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>



        {/* Content based on view mode */}
        {viewMode === 'table' ? (
          /* Table View */
          <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, overflow: 'hidden' }}>
            <CardContent sx={{ padding: '16px', overflow: 'hidden' }}>
              {!isLoading && !isError && transformedBookIssues.length === 0 && (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  textAlign="center"
                >
                  <Typography
                    variant="h6"
                    sx={{ color: themeColors.text.secondary, mb: 1 }}
                  >
                    {t('teachersBooksScreen.messages.noBooksFound')}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: themeColors.text.secondary }}
                  >
                    {t('teachersBooksScreen.messages.noBooksIssued')}
                  </Typography>
                </Box>
              )}
              
              <DataTable
                rows={transformedBookIssues}
                columns={columns}
                loading={isLoading}
                themeColors={themeColors}
                id="id"
                pagination={{
                  currentPage: pagination.page,
                  totalPages: data?.pagination?.totalPages || 1,
                  totalItems: data?.pagination?.totalIssues || 0,
                  onPageChange: handlePageChange
                }}
              />
            </CardContent>
          </Card>
        ) : (
          /* Card View */
          <Box>
            {!isLoading && !isError && transformedBookIssues.length === 0 && (
              <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={4}
                    textAlign="center"
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: themeColors.text.secondary, mb: 1 }}
                    >
                      {t('teachersBooksScreen.messages.noBooksFound')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: themeColors.text.secondary }}
                    >
                      {t('teachersBooksScreen.messages.noBooksIssued')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {!isLoading && !isError && transformedBookIssues.length > 0 && (
              <Grid container spacing={3}>
                {transformedBookIssues.map((bookIssue) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={bookIssue._id}>
                    <Card 
                      sx={{ 
                        backgroundColor: themeColors.background.primary, 
                        border: `1px solid ${themeColors.border.primary}`,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Book Title */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: themeColors.text.primary, 
                            fontWeight: 'bold',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {bookIssue.book?.bookCatalog?.title || t('teachersBooksScreen.card.unknownBook')}
                        </Typography>

                        {/* Book Details */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.isbn')}:</strong> {bookIssue.book?.bookCatalog?.isbn || t('teachersBooksScreen.table.na')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.author')}:</strong> {bookIssue.book?.bookCatalog?.author || t('teachersBooksScreen.table.na')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.copy')}:</strong> {bookIssue.book?.copyNumber || t('teachersBooksScreen.table.na')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.category')}:</strong> {bookIssue.book?.bookCatalog?.category?.name || t('teachersBooksScreen.table.na')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.location')}:</strong> {bookIssue.book?.location || t('teachersBooksScreen.table.na')}
                          </Typography>
                        </Box>

                        {/* Issue Dates */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.issued')}:</strong> {moment(bookIssue.issueDate).format("DD-MM-YYYY")}
                          </Typography>
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                            <strong>{t('teachersBooksScreen.card.due')}:</strong> {moment(bookIssue.dueDate).format("DD-MM-YYYY")}
                          </Typography>
                        </Box>

                        {/* Status and Fine */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={t(`teachersBooksScreen.status.${bookIssue.status}`) || bookIssue.status}
                              size="small"
                              sx={{
                                backgroundColor: 
                                  bookIssue.status === 'issued' ? '#4CAF50' :
                                  bookIssue.status === 'returned' ? '#2196F3' :
                                  bookIssue.status === 'overdue' ? '#F44336' :
                                  bookIssue.status === 'lost' ? '#9C27B0' : '#757575',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            />
                            {bookIssue.isOverdue && (
                              <Chip
                                label={t('teachersBooksScreen.table.overdue')}
                                size="small"
                                sx={{
                                  backgroundColor: '#F44336',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Box>
                          
                          {bookIssue.fineAmount > 0 && (
                            <Chip
                              label={t('teachersBooksScreen.card.fine', { amount: bookIssue.fineAmount })}
                              size="small"
                              color={bookIssue.finePaid ? "success" : "error"}
                              variant={bookIssue.finePaid ? "filled" : "outlined"}
                              sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>

                        {/* Actions */}
                        <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                          {bookIssue.status === 'issued' && (
                            <Tooltip title={t('teachersBooksScreen.actions.renew')}>
                              <IconButton
                                size="small"
                                onClick={() => handleRenew(bookIssue._id)}
                                sx={{
                                  color: themeColors.primary,
                                  '&:hover': {
                                    backgroundColor: `${themeColors.primary}22`,
                                  },
                                }}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {bookIssue.fineAmount > 0 && !bookIssue.finePaid && (
                            <Tooltip title={t('teachersBooksScreen.actions.payFine')}>
                              <IconButton
                                size="small"
                                onClick={() => handlePayFine(bookIssue._id)}
                                sx={{
                                  color: '#FF9800',
                                  '&:hover': {
                                    backgroundColor: '#FF980022',
                                  },
                                }}
                              >
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        <CustomBackDrop open={isLoading} />
      </Box>
    </CustomOutletBox>
  );
};

export default TeachersBooksScreen;
