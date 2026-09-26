import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Grid, 
    Card, 
    CardContent, 
    Typography, 
    Avatar, 
    Button, 
    Chip, 
    Tabs, 
    Tab, 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Alert,
    LinearProgress,
    Divider
} from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { 
    useGetMyIssuedBooksQuery, 
    useGetMyLibraryHistoryQuery, 
    useGetMyLibraryStatsQuery,
    useGetAvailableBooksQuery,
    useRequestRenewalMutation
} from '../../Redux/features/Library/userLibrarySlice';
import { useSnackbar } from '../../hooks/SnackBar';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';
import BookIcon from '@mui/icons-material/Book';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const StudentLibraryView = () => {
    const { themeColors } = useThemeContext();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounced search effect
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setDebouncedSearchTerm('');
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setIsSearching(false);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Show loading when filters change
    useEffect(() => {
        if (selectedCategory !== 'all' || selectedSubject !== 'all') {
            setIsSearching(true);
            const timer = setTimeout(() => {
                setIsSearching(false);
            }, 200); // Reduced delay for filters

            return () => clearTimeout(timer);
        } else {
            setIsSearching(false);
        }
    }, [selectedCategory, selectedSubject]);

    // Fetch data
    const { data: issuedBooksResponse, isLoading: issuedBooksLoading, refetch: refetchIssuedBooks } = useGetMyIssuedBooksQuery();
    const { data: libraryHistoryResponse, isLoading: historyLoading } = useGetMyLibraryHistoryQuery();
    const { data: libraryStatsResponse, isLoading: statsLoading } = useGetMyLibraryStatsQuery();
    const { data: availableBooksResponse, isLoading: availableBooksLoading } = useGetAvailableBooksQuery({
        search: debouncedSearchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined
    }, {
        // Show loading when search parameters change
        pollingInterval: 0,
    });

    // Extract data from responses
    const issuedBooks = issuedBooksResponse?.data;
    const libraryHistory = libraryHistoryResponse?.data;
    const libraryStats = libraryStatsResponse?.data;
    const availableBooks = availableBooksResponse; // This is already the correct structure

    const [requestRenewal] = useRequestRenewalMutation();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleRenewal = async (bookIssueId) => {
        try {
            await requestRenewal(bookIssueId).unwrap();
            showSnackbar(t('studentLibrary.messages.renewSuccess'), 'success');
            refetchIssuedBooks();
        } catch (error) {
            showSnackbar(error?.data?.message || t('studentLibrary.messages.renewFailed'), 'error');
        }
    };

    const getStatusColor = (status, isOverdue) => {
        if (isOverdue) return themeColors.error || '#f44336';
        switch (status) {
            case 'issued': return themeColors.primary || '#1976d2';
            case 'returned': return themeColors.success || '#4caf50';
            case 'overdue': return themeColors.error || '#f44336';
            default: return themeColors.text?.secondary || '#666666';
        }
    };

    const getStatusIcon = (status, isOverdue) => {
        if (isOverdue) return <WarningIcon />;
        switch (status) {
            case 'issued': return <CheckCircleIcon />;
            case 'returned': return <CheckCircleIcon />;
            case 'overdue': return <WarningIcon />;
            default: return <ScheduleIcon />;
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card sx={{ 
            backgroundColor: themeColors.background.primary, 
            border: `1px solid ${themeColors.border.primary}`,
            height: '100%'
        }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ 
                        width: 48, 
                        height: 48, 
                        backgroundColor: `${color}20`,
                        color: color 
                    }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const BookCard = ({ book, showActions = true }) => (
        <Card sx={{ 
            backgroundColor: themeColors.background.primary, 
            border: `1px solid ${themeColors.border.primary}`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {book.book?.coverImage && (
                <Box
                    sx={{
                        height: 200,
                        backgroundImage: `url(${book.book.coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8
                    }}
                />
            )}
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip
                        label={book.book?.bookCatalog?.category || t('studentLibrary.fallback.general')}
                        size="small"
                        sx={{
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                        }}
                    />
                    <Chip
                        icon={getStatusIcon(book.status, book.isOverdue)}
                        label={book.isOverdue ? t('studentLibrary.labels.overdue') : book.status}
                        size="small"
                        sx={{
                            backgroundColor: getStatusColor(book.status, book.isOverdue),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                        }}
                    />
                </Box>
                
                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {book.book?.bookCatalog?.title || t('studentLibrary.fallback.unknownBook')}
                </Typography>
                
                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2 }}>
                    {t('studentLibrary.labels.by', { author: book.book?.bookCatalog?.author || t('studentLibrary.fallback.unknownAuthor') })}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <PersonIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            {book.issuedBy?.name || t('studentLibrary.fallback.admin')}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            {moment(book.issueDate).format('MMM DD, YYYY')}
                        </Typography>
                    </Box>
                </Box>

                {book.isOverdue && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {t('studentLibrary.labels.overdueBy', { days: book.daysOverdue })}
                    </Alert>
                )}

                {book.daysRemaining > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {t('studentLibrary.labels.daysRemaining', { days: book.daysRemaining })}
                    </Alert>
                )}

                <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {t('studentLibrary.labels.due', { date: moment(book.dueDate).format('MMM DD, YYYY') })}
                    </Typography>
                    {showActions && book.status === 'issued' && !book.isOverdue && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => handleRenewal(book._id)}
                            sx={{
                                borderColor: themeColors.primary,
                                color: themeColors.primary,
                                '&:hover': {
                                    borderColor: themeColors.primary,
                                    backgroundColor: `${themeColors.primary}22`,
                                },
                            }}
                        >
                            {t('studentLibrary.actions.renew')}
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.secondary, minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: themeColors.primary }}>
                        <LibraryBooksIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('studentLibrary.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('studentLibrary.subtitle')}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Statistics */}
            {!statsLoading && libraryStats && (
                <Box mb={4}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                        {t('studentLibrary.sections.libraryOverview')}
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title={t('studentLibrary.stats.booksBorrowed')}
                                value={libraryStats.currentIssues}
                                icon={<BookIcon />}
                                color={themeColors.primary}
                                subtitle={t('studentLibrary.stats.remaining', { count: libraryStats.booksRemaining })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title={t('studentLibrary.stats.totalBorrowed')}
                                value={libraryStats.totalBorrowed}
                                icon={<HistoryIcon />}
                                color={themeColors.accent}
                                subtitle={t('studentLibrary.stats.allTime')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title={t('studentLibrary.stats.overdueBooks')}
                                value={libraryStats.overdueBooks}
                                icon={<WarningIcon />}
                                color={themeColors.error}
                                subtitle={t('studentLibrary.stats.needAttention')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title={t('studentLibrary.stats.pendingFines')}
                                value={`$${libraryStats.pendingFines.toFixed(2)}`}
                                icon={<AttachMoneyIcon />}
                                color={themeColors.warning}
                                subtitle={t('studentLibrary.stats.toBePaid')}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Tabs */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: `1px solid ${themeColors.border.primary}` }}>
                    <Tab 
                        label={t('studentLibrary.tabs.myBooks')} 
                        icon={<BookIcon />} 
                        iconPosition="start"
                        sx={{ color: themeColors.text.primary }}
                    />
                    <Tab 
                        label={t('studentLibrary.tabs.libraryHistory')} 
                        icon={<HistoryIcon />} 
                        iconPosition="start"
                        sx={{ color: themeColors.text.primary }}
                    />
                    <Tab 
                        label={t('studentLibrary.tabs.availableBooks')} 
                        icon={<LibraryBooksIcon />} 
                        iconPosition="start"
                        sx={{ color: themeColors.text.primary }}
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* My Books Tab */}
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                {t('studentLibrary.sections.currentlyBorrowed')}
                            </Typography>
                            {issuedBooksLoading ? (
                                <LinearProgress sx={{ mb: 2 }} />
                            ) : issuedBooks?.length > 0 ? (
                                <Grid container spacing={3}>
                                    {issuedBooks.map((book) => (
                                        <Grid item xs={12} sm={6} md={4} key={book._id}>
                                            <BookCard book={book} showActions={true} />
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box textAlign="center" py={4}>
                                    <BookIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.noBooksBorrowed')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.visitLibrary')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Library History Tab */}
                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                {t('studentLibrary.sections.borrowingHistory')}
                            </Typography>
                            {historyLoading ? (
                                <LinearProgress sx={{ mb: 2 }} />
                            ) : libraryHistory?.length > 0 ? (
                                <TableContainer component={Paper} sx={{ backgroundColor: themeColors.background.primary }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('studentLibrary.labels.book')}</TableCell>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('studentLibrary.labels.author')}</TableCell>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('studentLibrary.labels.issueDate')}</TableCell>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('studentLibrary.labels.dueDate')}</TableCell>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('studentLibrary.labels.returnDate')}</TableCell>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('studentLibrary.labels.status')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {libraryHistory.map((book) => (
                                                <TableRow key={book._id}>
                                                                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                    {book.book?.bookCatalog?.title || t('studentLibrary.fallback.unknownBook')}
                                                </TableCell>
                                                <TableCell sx={{ color: themeColors.text.secondary }}>
                                                    {book.book?.bookCatalog?.author || t('studentLibrary.fallback.unknownAuthor')}
                                                </TableCell>
                                                    <TableCell sx={{ color: themeColors.text.secondary }}>
                                                        {moment(book.issueDate).format('MMM DD, YYYY')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: themeColors.text.secondary }}>
                                                        {moment(book.dueDate).format('MMM DD, YYYY')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: themeColors.text.secondary }}>
                                                        {book.returnDate ? moment(book.returnDate).format('MMM DD, YYYY') : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={getStatusIcon(book.status, book.isOverdue)}
                                                            label={book.isOverdue ? t('studentLibrary.labels.overdue') : book.status}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: getStatusColor(book.status, book.isOverdue),
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box textAlign="center" py={4}>
                                    <HistoryIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.noBorrowingHistory')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.startBorrowing')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Available Books Tab */}
                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                {t('studentLibrary.sections.availableBooks')}
                            </Typography>
                            
                            {/* Search and Filters */}
                            <Card sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                            {t('studentLibrary.sections.searchFilters')}
                                        </Typography>
                                        {isSearching && searchTerm.trim() !== '' && (
                                            <Box
                                                sx={{
                                                    width: 16,
                                                    height: 16,
                                                    border: `2px solid ${themeColors.primary}`,
                                                    borderTop: '2px solid transparent',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                    '@keyframes spin': {
                                                        '0%': { transform: 'rotate(0deg)' },
                                                        '100%': { transform: 'rotate(360deg)' },
                                                    },
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                placeholder={t('studentLibrary.placeholders.searchBooks')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                helperText={isSearching ? t('studentLibrary.messages.searching') : t('studentLibrary.placeholders.searchHelper')}
                                                InputProps={{
                                                    startAdornment: <SearchIcon sx={{ color: themeColors.text.secondary, mr: 1 }} />,
                                                    endAdornment: isSearching ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                                                            <Box
                                                                sx={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    border: `2px solid ${themeColors.primary}`,
                                                                    borderTop: '2px solid transparent',
                                                                    borderRadius: '50%',
                                                                    animation: 'spin 1s linear infinite',
                                                                    '@keyframes spin': {
                                                                        '0%': { transform: 'rotate(0deg)' },
                                                                        '100%': { transform: 'rotate(360deg)' },
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    ) : null,
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
                                                    '& .MuiFormHelperText-root': {
                                                        color: themeColors.text.secondary,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth>
                                                <InputLabel sx={{ color: themeColors.text.secondary }}>{t('studentLibrary.labels.category')}</InputLabel>
                                                <Select
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
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
                                                        '& .MuiSelect-select': {
                                                            color: themeColors.text.primary,
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="all">{t('studentLibrary.filters.allCategories')}</MenuItem>
                                                    {availableBooks?.filters?.categories?.map((category) => (
                                                        <MenuItem key={category} value={category}>{category}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth>
                                                <InputLabel sx={{ color: themeColors.text.secondary }}>{t('studentLibrary.labels.subject')}</InputLabel>
                                                <Select
                                                    value={selectedSubject}
                                                    onChange={(e) => setSelectedSubject(e.target.value)}
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
                                                        '& .MuiSelect-select': {
                                                            color: themeColors.text.primary,
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="all">{t('studentLibrary.filters.allSubjects')}</MenuItem>
                                                    {availableBooks?.filters?.subjects?.map((subject) => (
                                                        <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {availableBooksLoading ? (
                                <Box>
                                    <LinearProgress sx={{ mb: 2 }} />
                                    <Box textAlign="center" py={4}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                border: `3px solid ${themeColors.primary}`,
                                                borderTop: '3px solid transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite',
                                                '@keyframes spin': {
                                                    '0%': { transform: 'rotate(0deg)' },
                                                    '100%': { transform: 'rotate(360deg)' },
                                                },
                                                mx: 'auto',
                                                mb: 2,
                                            }}
                                        />
                                        <Typography variant="h6" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                                            {t('studentLibrary.messages.loadingBooks')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('studentLibrary.messages.fetchingBooks')}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : isSearching && searchTerm.trim() !== '' ? (
                                <Box textAlign="center" py={4}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            border: `3px solid ${themeColors.primary}`,
                                            borderTop: '3px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' },
                                            },
                                            mx: 'auto',
                                            mb: 2,
                                        }}
                                    />
                                    <Typography variant="h6" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                                        {t('studentLibrary.messages.searching')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.waitingForResults')}
                                    </Typography>
                                </Box>
                            ) : availableBooks?.data?.length > 0 ? (
                                <Grid container spacing={3}>
                                    {availableBooks.data.map((book) => (
                                        <Grid item xs={12} sm={6} md={4} key={book._id}>
                                            <Card sx={{ 
                                                backgroundColor: themeColors.background.primary, 
                                                border: `1px solid ${themeColors.border.primary}`,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                {book.coverImage && (
                                                    <Box
                                                        sx={{
                                                            height: 200,
                                                            backgroundImage: `url(${book.coverImage})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            borderTopLeftRadius: 8,
                                                            borderTopRightRadius: 8
                                                        }}
                                                    />
                                                )}
                                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <Chip
                                                            label={book.category?.name || t('studentLibrary.fallback.general')}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: themeColors.primary,
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                        <Chip
                                                            label={t('studentLibrary.labels.available', { count: book.availableCopies })}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: themeColors.success,
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    </Box>
                                                    
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                                        {book.title}
                                                    </Typography>
                                                    
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2 }}>
                                                        {t('studentLibrary.labels.by', { author: book.author })}
                                                    </Typography>

                                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <BookIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                                                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                {t('studentLibrary.labels.isbn', { isbn: book.isbn })}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <VisibilityIcon sx={{ fontSize: 16, color: themeColors.text.secondary }} />
                                                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                {t('studentLibrary.labels.rack', { rackNumber: book.rack?.rackNumber || t('studentLibrary.fallback.nA') })}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box mt="auto">
                                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                            {t('studentLibrary.labels.subjectLabel', { subject: book.subject || t('studentLibrary.fallback.general') })}
                                                        </Typography>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box textAlign="center" py={4}>
                                    <LibraryBooksIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.noBooksAvailable')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentLibrary.messages.tryAdjustingFilters')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Card>
        </Box>
    );
};

export default StudentLibraryView;
