import React, { useCallback, useEffect, useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import useModal from '../../hooks/modalHook';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { ICONS } from '../../assets/icons';
import DataTable from '../../components/Common/CustomTable';
import { useGetPendingCommentsQuery, useGetUserCommentsQuery, useApproveCommentMutation, useDeleteCommentMutation, useToggleCommentLikeMutation } from '../../Redux/features/Blog/commentSlice';
import moment from 'moment/moment';
import CustomDelete from '../../components/Common/CustomDelete';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CommentIcon from '@mui/icons-material/Comment';
import SearchIcon from '@mui/icons-material/Search';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';


const CommentScreen = () => {
  const showSnackbar = useSnackbar();
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();

  const ability = useAbility();

  const { modal, openModal, closeModal } = useModal();
  const [_id, set_id] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    isApproved: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });

  // Fetch pending comments (admin only)
  const { data: pendingData, isError: pendingError, isLoading: pendingLoading, refetch: refetchPending, error: pendingErrorData } = useGetPendingCommentsQuery();

  // Fetch user comments
  const { data: userData, isError: userError, isLoading: userLoading, refetch: refetchUser, error: userErrorData } = useGetUserCommentsQuery();

  const [approveComment] = useApproveCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [toggleCommentLike] = useToggleCommentLikeMutation();

  const columns = React.useMemo(() => [
    {
      field: 'SN',
      headerName: t('commentScreen.table.sn'),
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
    },
    {
      field: 'user',
      headerName: t('commentScreen.table.user'),
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => {
        const user = params.row.user;
        return user ? user.name : t('commentScreen.table.na');
      }
    },
    {
      field: 'post',
      headerName: t('commentScreen.table.post'),
      flex: 2,
      headerAlign: 'center',
      align: 'left',
      valueGetter: (params) => {
        const post = params.row.post;
        return post ? post.title : t('commentScreen.table.na');
      }
    },
    {
      field: 'content',
      headerName: t('commentScreen.table.comment'),
      flex: 3,
      headerAlign: 'center',
      align: 'left',
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
            {row.content && row.content.length > 100 ? `${row.content.substring(0, 100)}...` : (row.content || t('commentScreen.table.noContent'))}
          </Typography>
          {row.isEdited && (
            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
              ({t('commentScreen.table.edited')})
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'isApproved',
      headerName: t('commentScreen.table.status'),
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row }) => (
        <Chip
          label={row.isApproved ? t('commentScreen.table.approved') : t('commentScreen.table.pending')}
          size="small"
          sx={{
            backgroundColor: row.isApproved ? '#4CAF50' : '#FF9800',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem'
          }}
        />
      )
    },
    {
      field: 'likeCount',
      headerName: t('commentScreen.table.likes'),
      flex: 1,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'created',
      headerName: t('commentScreen.table.created'),
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (params) => moment(params?.row?.createdAt).format("DD-MM-YYYY")
    },
    {
      field: 'actions',
      headerName: t('commentScreen.table.actions'),
      flex: 1.5,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          {ability.can("Like", "BlogComments") && <Tooltip title={t('commentScreen.actions.like')}>
            <IconButton
              size="small"
              onClick={() => handleToggleLike(row._id)}
              sx={{
                color: row.likes?.includes(row._id) ? '#4CAF50' : themeColors.text.secondary,
                '&:hover': {
                  backgroundColor: '#4CAF5022',
                },
              }}
            >
              {row.likes?.includes(row._id) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
            </IconButton>
          </Tooltip>}

          {(!row.isApproved && ability.can("Approve", "BlogComments")) && (
            <Tooltip title={t('commentScreen.actions.approve')}>
              <IconButton
                size="small"
                onClick={() => handleApprove(row._id, true)}
                sx={{
                  color: '#4CAF50',
                  '&:hover': {
                    backgroundColor: '#4CAF5022',
                  },
                }}
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}

          {row.isApproved && ability.can("Approve", "BlogComments") && (
            <Tooltip title={t('commentScreen.actions.reject')}>
              <IconButton
                size="small"
                onClick={() => handleApprove(row._id, false)}
                sx={{
                  color: '#F44336',
                  '&:hover': {
                    backgroundColor: '#F4433622',
                  },
                }}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}

          {ability.can("Delete", "BlogComments") && <Tooltip title={t('commentScreen.actions.delete')}>
            <IconButton
              size="small"
              onClick={() => {
                set_id(row._id);
                openModal('delete');
              }}
              sx={{
                color: themeColors.error,
                '&:hover': {
                  backgroundColor: `${themeColors.error}22`,
                },
              }}
            >
              <ICONS.DeleteForeverIcon.component />
            </IconButton>
          </Tooltip>}
        </Stack>
      ),
    },
  ], [t, themeColors, ability]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteComment(_id).unwrap();
      showSnackbar(t('commentScreen.messages.deleteSuccess'), 'success');
      closeModal('delete');
      refetchPending();
      refetchUser();
    } catch (error) {
      showSnackbar(error?.data?.message || t('commentScreen.messages.deleteFailed'), 'error');
    }
  }, [_id, deleteComment, showSnackbar, closeModal, refetchPending, refetchUser, t]);

  const handleApprove = async (commentId, isApproved) => {
    try {
      await approveComment({ id: commentId, data: { isApproved } }).unwrap();
      showSnackbar(isApproved ? t('commentScreen.messages.approveSuccess') : t('commentScreen.messages.rejectSuccess'), 'success');
      refetchPending();
      refetchUser();
    } catch (error) {
      showSnackbar(error?.data?.message || t('commentScreen.messages.updateStatusFailed'), 'error');
    }
  };

  const handleToggleLike = async (commentId) => {
    try {
      await toggleCommentLike(commentId).unwrap();
      refetchPending();
      refetchUser();
    } catch (error) {
      showSnackbar(error?.data?.message || t('commentScreen.messages.toggleLikeFailed'), 'error');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const currentData = activeTab === 0 ? pendingData : userData;
  const currentLoading = activeTab === 0 ? pendingLoading : userLoading;
  const currentError = activeTab === 0 ? pendingError : userError;
  const currentErrorData = activeTab === 0 ? pendingErrorData : userErrorData;

  if (currentError) {
    return (
      <CustomOutletBox>
        <ErrorInfo error={currentErrorData} />
      </CustomOutletBox>
    );
  }

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <CommentIcon sx={{ fontSize: 32, color: themeColors.primary }} />
            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
              {t('commentScreen.title')}
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: themeColors.border.primary }}>
              <Box sx={{ display: 'flex' }}>
                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 2,
                    px: 3,
                    cursor: 'pointer',
                    borderBottom: activeTab === 0 ? 2 : 0,
                    borderColor: themeColors.primary,
                    color: activeTab === 0 ? themeColors.primary : themeColors.text.secondary,
                    '&:hover': {
                      backgroundColor: `${themeColors.primary}22`,
                    },
                  }}
                  onClick={() => handleTabChange(null, 0)}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {t('commentScreen.tabs.pending')} ({pendingData?.data?.length || 0})
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 2,
                    px: 3,
                    cursor: 'pointer',
                    borderBottom: activeTab === 1 ? 2 : 0,
                    borderColor: themeColors.primary,
                    color: activeTab === 1 ? themeColors.primary : themeColors.text.secondary,
                    '&:hover': {
                      backgroundColor: `${themeColors.primary}22`,
                    },
                  }}
                  onClick={() => handleTabChange(null, 1)}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {t('commentScreen.tabs.myComments')} ({userData?.data?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
              {t('commentScreen.filters.title')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('commentScreen.filters.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: themeColors.text.secondary, mr: 1 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: themeColors.border.primary,
                      },
                      '&:hover fieldset': {
                        borderColor: themeColors.primary,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: themeColors.primary,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: themeColors.text.primary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: themeColors.text.secondary }}>{t('commentScreen.filters.status')}</InputLabel>
                  <Select
                    value={filters.isApproved}
                    onChange={(e) => handleFilterChange('isApproved', e.target.value)}
                    label={t('commentScreen.filters.status')}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColors.border.primary,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColors.primary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColors.primary,
                      },
                      '& .MuiSelect-icon': {
                        color: themeColors.text.secondary,
                      },
                    }}
                  >
                    <MenuItem value="">{t('commentScreen.filters.all')}</MenuItem>
                    <MenuItem value="true">{t('commentScreen.filters.approved')}</MenuItem>
                    <MenuItem value="false">{t('commentScreen.filters.pending')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({
                      search: '',
                      isApproved: ''
                    });
                    setPagination({ page: 1, limit: 10 });
                  }}
                  sx={{
                    borderColor: themeColors.border.primary,
                    color: themeColors.text.primary,
                    '&:hover': {
                      borderColor: themeColors.primary,
                      backgroundColor: `${themeColors.primary}22`,
                    },
                  }}
                >
                  {t('commentScreen.filters.clear')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Comments Table */}
        <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
          <CardContent>
            <DataTable
              rows={currentData?.data || []}
              columns={columns}
              loading={currentLoading}
              themeColors={themeColors}
              id="_id"
              pagination={{
                currentPage: pagination.page,
                totalPages: 1, // Since we're not using pagination for comments yet
                totalItems: currentData?.data?.length || 0,
                onPageChange: handlePageChange
              }}
            />
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <CustomDelete
          open={modal.deleteModal}
          close={() => closeModal('delete')}
          onConfirm={handleDelete}
          title={t('commentScreen.delete.title')}
          message={t('commentScreen.delete.message')}
          themeColors={themeColors}
        />

        <CustomBackDrop open={currentLoading} />
      </Box>
    </CustomOutletBox>
  );
};

export default CommentScreen;
