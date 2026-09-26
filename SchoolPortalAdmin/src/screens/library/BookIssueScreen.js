import React, { useCallback, useEffect, useState, useMemo } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useNavigate } from 'react-router-dom';
import useModal from '../../hooks/modalHook';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Button, Tabs, Tab, Avatar } from '@mui/material';
import { ICONS } from '../../assets/icons';
import DataTable from '../../components/Common/CustomTable';
import { useListBookIssuesQuery, useRenewBookMutation, usePayFineMutation, useGetOverdueBooksQuery } from '../../Redux/features/Library/bookIssueSlice';
import moment from 'moment/moment';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import PaymentIcon from '@mui/icons-material/Payment';
import BookIcon from '@mui/icons-material/Book';
import IssueBookForm from '../../components/library/IssueBookForm';
import ReturnBookForm from '../../components/library/ReturnBookForm';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const BookIssueScreen = () => {
	const showSnackbar = useSnackbar();
	const { themeColors } = useThemeContext();
	const ability = useAbility();
	const { t } = useTranslation();
	const { modal, openModal, closeModal } = useModal();
	const [activeTab, setActiveTab] = useState(0);
	const [selectedBookIssue, setSelectedBookIssue] = useState(null);

	// Filters state
	const [filters, setFilters] = useState({
		status: '',
		issuedTo: '',
		issuedToModel: '',
		overdue: ''
	});

	// Debounced filters for API calls
	const [debouncedFilters, setDebouncedFilters] = useState({
		status: '',
		issuedTo: '',
		issuedToModel: '',
		overdue: ''
	});

	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10
	});

	// Loading state for filtering
	const [isFiltering, setIsFiltering] = useState(false);

	// Debounce filters to prevent API calls on every keystroke
	useEffect(() => {
		setIsFiltering(true);
		const timer = setTimeout(() => {
			setDebouncedFilters(filters);
			setIsFiltering(false);
		}, 500); // Wait 500ms after user stops typing

		return () => clearTimeout(timer);
	}, [filters]);

	// Fetch book issues with debounced filters
	const { data, isError, isLoading, isFetched, refetch, error } = useListBookIssuesQuery({
		...debouncedFilters,
		...pagination
	});

	// Fetch overdue books
	const { data: overdueData, refetch: refetchOverdue } = useGetOverdueBooksQuery();

	const [renewBook] = useRenewBookMutation();
	const [payFine] = usePayFineMutation();

	// Transform book issues data to add id field for DataTable
	const transformedBookIssues = data?.bookIssues ? data.bookIssues.map(issue => ({
		...issue,
		id: issue._id
	})) : [];

	const handleRenew = useCallback(async (issueId) => {
		try {
			await renewBook(issueId).unwrap();
			showSnackbar(t('bookIssueScreen.messages.renewSuccess'), 'success');
			refetch();
		} catch (error) {
			showSnackbar(error?.data?.message || t('bookIssueScreen.messages.renewFailed'), 'error');
		}
	}, [renewBook, showSnackbar, t, refetch]);

	const handlePayFine = useCallback(async (issueId) => {
		try {
			await payFine(issueId).unwrap();
			showSnackbar(t('bookIssueScreen.messages.payFineSuccess'), 'success');
			refetch();
		} catch (error) {
			showSnackbar(error?.data?.message || t('bookIssueScreen.messages.payFineFailed'), 'error');
		}
	}, [payFine, showSnackbar, t, refetch]);

	const columns = React.useMemo(() => [
		{
			field: 'SN',
			headerName: t('bookIssueScreen.table.sn'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
		},
		{
			field: 'coverImage',
			headerName: t('bookIssueScreen.table.cover'),
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
			headerName: t('bookIssueScreen.table.bookDetails'),
			width: 300,
			headerAlign: 'center',
			align: 'left',
			valueGetter: (params) => {
				const book = params.row.book;
				if (book && book.bookCatalog) {
					return `${book.bookCatalog.title} (${book.bookCatalog.isbn}) - ${t('bookIssueScreen.table.copy')} ${book.copyNumber}`;
				}
				return t('bookIssueScreen.table.na');
			}
		},
		{
			field: 'category',
			headerName: t('bookIssueScreen.table.category'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => {
				const book = params.row.book;
				return book?.bookCatalog?.category?.name || t('bookIssueScreen.table.na');
			}
		},
		{
			field: 'location',
			headerName: t('bookIssueScreen.table.location'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => {
				const book = params.row.book;
				return book?.location || t('bookIssueScreen.table.na');
			}
		},
		{
			field: 'issuedTo',
			headerName: t('bookIssueScreen.table.issuedTo'),
			width: 200,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => {
				const issuedTo = params.row.issuedTo;
				const issuedToModel = params.row.issuedToModel;

				// If issuedTo is null or undefined
				if (!issuedTo) {
					return `${issuedToModel} - ${t('bookIssueScreen.table.notFound')}`;
				}

				// If issuedTo is an object, get the correct name field
				if (typeof issuedTo === 'object') {
					const name = issuedTo.studentName || issuedTo.employeeName || issuedTo.name;
					const id = issuedTo.studentID || issuedTo.employeeId || issuedTo._id;

					if (name) {
						return `${issuedToModel} - ${name} (${id})`;
					} else {
						return `${issuedToModel} - ${t('bookIssueScreen.table.id')}: ${id}`;
					}
				}

				// If issuedTo is a string (ID)
				if (typeof issuedTo === 'string') {
					return `${issuedToModel} - ${t('bookIssueScreen.table.id')}: ${issuedTo}`;
				}

				// Fallback
				return `${issuedToModel} - ${t('bookIssueScreen.table.unknown')}`;
			}
		},
		{
			field: 'issuedBy',
			headerName: t('bookIssueScreen.table.issuedBy'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => {
				const issuedBy = params.row.issuedBy;
				return issuedBy ? issuedBy.name : t('bookIssueScreen.table.na');
			}
		},
		{
			field: 'issueDate',
			headerName: t('bookIssueScreen.table.issueDate'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.issueDate).format("DD-MM-YYYY")
		},
		{
			field: 'dueDate',
			headerName: t('bookIssueScreen.table.dueDate'),
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
							label={t('bookIssueScreen.table.overdue')}
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
			headerName: t('bookIssueScreen.table.status'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => (
				<Chip
					label={t(`bookIssueScreen.status.${row.status}`) || row.status}
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
			headerName: t('bookIssueScreen.table.renewals'),
			width: 100,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'fineAmount',
			headerName: t('bookIssueScreen.table.fine'),
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
			headerName: t('bookIssueScreen.table.actions'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Stack direction="row" spacing={1}>
					{(row.status === 'issued' && ability.can("Edit", "LibraryBookIssue")) && (
						<Tooltip title={t('bookIssueScreen.actions.renew')}>
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
					{(row.status === 'issued' && ability.can("Edit", "LibraryBookIssue")) && (
						<Tooltip title={t('bookIssueScreen.actions.return')}>
							<IconButton
								size="small"
								onClick={() => {
									setSelectedBookIssue(row);
									openModal('returnModal');
								}}
								sx={{
									color: '#4CAF50',
									'&:hover': {
										backgroundColor: '#4CAF5022',
									},
								}}
							>
								<CheckIcon />
							</IconButton>
						</Tooltip>
					)}
					{(row.fineAmount > 0 && !row.finePaid && ability.can("Edit", "LibraryBookIssue")) && (
						<Tooltip title={t('bookIssueScreen.actions.payFine')}>
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
			),
		},
	], [t, themeColors, ability, openModal, handleRenew, handlePayFine]);

	const handleFilterChange = (field, value) => {
		setFilters(prev => ({
			...prev,
			[field]: value,
			// Clear issuedTo when user type changes
			...(field === 'issuedToModel' && { issuedTo: '' })
		}));
		setPagination(prev => ({ ...prev, page: 1 }));
	};

	const handlePageChange = (newPage) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	};

	const handleTabChange = (event, newValue) => {
		setActiveTab(newValue);
		if (newValue === 1) {
			// Overdue tab
			setFilters(prev => ({ ...prev, overdue: 'true' }));
		} else {
			// All issues tab
			setFilters(prev => ({ ...prev, overdue: '' }));
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
							{t('bookIssueScreen.title')}
						</Typography>
					</Box>
					{ability.can("Create", "LibraryBookIssue") && <Stack direction="row" spacing={2}>
						<Button
							variant="contained"
							onClick={() => openModal('issueModal')}
							sx={{
								backgroundColor: themeColors.primary,
								'&:hover': {
									backgroundColor: themeColors.primary,
									opacity: 0.9,
								},
							}}
						>
							{t('bookIssueScreen.actions.issueBook')}
						</Button>
						<Button
							variant="outlined"
							onClick={() => openModal('returnModal')}
							sx={{
								borderColor: '#4CAF50',
								color: '#4CAF50',
								'&:hover': {
									borderColor: '#4CAF50',
									backgroundColor: '#4CAF5022',
								},
							}}
						>
							{t('bookIssueScreen.actions.returnBook')}
						</Button>
					</Stack>}
				</Box>

				{/* Tabs */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
					<CardContent sx={{ p: 0 }}>
						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							sx={{
								borderBottom: `1px solid ${themeColors.border.primary}`,
								'& .MuiTab-root': {
									color: themeColors.text.secondary,
									'&.Mui-selected': {
										color: themeColors.primary,
									},
								},
								'& .MuiTabs-indicator': {
									backgroundColor: themeColors.primary,
								},
							}}
						>
							<Tab label={t('bookIssueScreen.tabs.allIssues')} />
							<Tab label={t('bookIssueScreen.tabs.overdueBooks')} />
						</Tabs>
					</CardContent>
				</Card>

				{/* Filters */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
					<CardContent>
						<Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
							<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
								{t('bookIssueScreen.filters.title')}
							</Typography>
							{isFiltering && (
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
							<Grid item xs={12} md={3}>
								<FormControl fullWidth>
									<InputLabel sx={{ color: themeColors.text.secondary }}>{t('bookIssueScreen.filters.status')}</InputLabel>
									<Select
										value={filters.status}
										onChange={(e) => handleFilterChange('status', e.target.value)}
										label={t('bookIssueScreen.filters.status')}
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
										<MenuItem value="">{t('bookIssueScreen.filters.all')}</MenuItem>
										<MenuItem value="issued">{t('bookIssueScreen.status.issued')}</MenuItem>
										<MenuItem value="returned">{t('bookIssueScreen.status.returned')}</MenuItem>
										<MenuItem value="overdue">{t('bookIssueScreen.status.overdue')}</MenuItem>
										<MenuItem value="lost">{t('bookIssueScreen.status.lost')}</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={3}>
								<FormControl fullWidth>
									<InputLabel sx={{ color: themeColors.text.secondary }}>{t('bookIssueScreen.filters.userType')}</InputLabel>
									<Select
										value={filters.issuedToModel}
										onChange={(e) => handleFilterChange('issuedToModel', e.target.value)}
										label={t('bookIssueScreen.filters.userType')}
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
										<MenuItem value="">{t('bookIssueScreen.filters.all')}</MenuItem>
										<MenuItem value="Student">{t('bookIssueScreen.filters.student')}</MenuItem>
										<MenuItem value="Teacher">{t('bookIssueScreen.filters.teacher')}</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField
									fullWidth
									placeholder={filters.issuedToModel === 'Student' ? t('bookIssueScreen.filters.searchByStudentId') :
										filters.issuedToModel === 'Teacher' ? t('bookIssueScreen.filters.searchByEmployeeId') :
											t('bookIssueScreen.filters.searchByUserId')}
									value={filters.issuedTo}
									onChange={(e) => handleFilterChange('issuedTo', e.target.value)}
									disabled={!filters.issuedToModel}
									helperText={filters.issuedToModel ?
										(isFiltering ?
											t('bookIssueScreen.filters.searching', { 
												idType: filters.issuedToModel === 'Student' ? t('bookIssueScreen.filters.studentId') : t('bookIssueScreen.filters.employeeId'),
												searchTerm: filters.issuedTo
											}) :
											t('bookIssueScreen.filters.enterId', { 
												idType: filters.issuedToModel === 'Student' ? t('bookIssueScreen.filters.studentId') : t('bookIssueScreen.filters.employeeId')
											})
										) :
										t('bookIssueScreen.filters.selectUserTypeFirst')}
									InputProps={{
										endAdornment: filters.issuedTo && filters.issuedToModel && (isLoading || isFiltering) ? (
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
							<Grid item xs={12} md={3}>
								<Button
									variant="outlined"
									onClick={() => {
										setFilters({
											status: '',
											issuedTo: '',
											issuedToModel: '',
											overdue: ''
										});
										setPagination(prev => ({ ...prev, page: 1 }));
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
									{t('bookIssueScreen.filters.clear')}
								</Button>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Issues Table */}
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
								{isFiltering ? (
									<>
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
												mb: 2,
											}}
										/>
										<Typography
											variant="h6"
											sx={{ color: themeColors.text.secondary, mb: 1 }}
										>
											{t('bookIssueScreen.messages.filtering')}
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('bookIssueScreen.messages.pleaseWait')}
										</Typography>
									</>
								) : (
									<>
										<Typography
											variant="h6"
											sx={{ color: themeColors.text.secondary, mb: 1 }}
										>
											{filters.issuedTo && filters.issuedToModel
												? t('bookIssueScreen.messages.noUserFound', { userType: filters.issuedToModel })
												: t('bookIssueScreen.messages.noBookIssuesFound')}
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{filters.issuedTo && filters.issuedToModel
												? t('bookIssueScreen.messages.noUserMatching', { userType: filters.issuedToModel.toLowerCase(), searchTerm: filters.issuedTo })
												: t('bookIssueScreen.messages.tryAdjustingFilters')}
										</Typography>
									</>
								)}
							</Box>
						)}

						{/* Search Results Info */}
						{!isLoading && !isError && data?.searchInfo && (
							<Box
								sx={{
									backgroundColor: `${themeColors.primary}11`,
									border: `1px solid ${themeColors.primary}33`,
									borderRadius: 1,
									p: 2,
									mb: 2,
								}}
							>
								<Typography
									variant="body2"
									sx={{ color: themeColors.primary, fontWeight: 'medium', mb: 1 }}
								>
									{t('bookIssueScreen.messages.searchResults', { searchTerm: data.searchInfo.searchTerm })}
								</Typography>

								{data.searchInfo.matchingUsers === 0 ? (
									<Typography
										variant="body2"
										sx={{ color: themeColors.text.secondary }}
									>
										{data.searchInfo.message || t('bookIssueScreen.messages.noUserWithId', { 
											userType: data.searchInfo.userType.toLowerCase(),
											idType: data.searchInfo.userType === 'Student' ? t('bookIssueScreen.filters.studentId') : t('bookIssueScreen.filters.employeeId'),
											searchTerm: data.searchInfo.searchTerm
										})}
									</Typography>
								) : (
									<>
										<Typography
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('bookIssueScreen.messages.foundUsers', { 
												count: data.searchInfo.matchingUsers,
												userType: data.searchInfo.userType.toLowerCase(),
												idType: data.searchInfo.userType === 'Student' ? t('bookIssueScreen.filters.studentId') : t('bookIssueScreen.filters.employeeId'),
												searchTerm: data.searchInfo.searchTerm
											})}
										</Typography>
										<Box sx={{ mt: 1 }}>
											{data.searchInfo.userDetails.map((user, index) => (
												<Chip
													key={user.id}
													label={t('bookIssueScreen.messages.userChip', { 
														name: user.name,
														identifier: user.identifier,
														count: user.issueCount
													})}
													size="small"
													sx={{
														mr: 1,
														mb: 1,
														backgroundColor: themeColors.primary,
														color: 'white',
														'&:hover': {
															backgroundColor: themeColors.primary,
															opacity: 0.8,
														},
													}}
												/>
											))}
										</Box>
										{transformedBookIssues.length === 0 && (
											<Typography
												variant="body2"
												sx={{ color: themeColors.text.secondary, mt: 1, fontStyle: 'italic' }}
											>
												{t('bookIssueScreen.messages.noneHaveIssues', { userType: data.searchInfo.userType.toLowerCase() })}
											</Typography>
										)}
									</>
								)}
							</Box>
						)}
						<DataTable
							rows={transformedBookIssues}
							columns={columns}
							loading={isLoading || isFiltering}
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

				{/* Issue Book Modal */}
				<IssueBookForm
					open={modal.issueModal}
					close={() => closeModal('issueModal')}
					onSuccess={() => {
						closeModal('issueModal');
						refetch();
					}}
				/>

				{/* Return Book Modal */}
				<ReturnBookForm
					open={modal.returnModal}
					close={() => {
						closeModal('returnModal');
						setSelectedBookIssue(null);
					}}
					onSuccess={() => {
						closeModal('returnModal');
						setSelectedBookIssue(null);
						refetch();
					}}
					selectedBookIssue={selectedBookIssue}
				/>

				<CustomBackDrop open={isLoading || isFiltering} />
			</Box>
		</CustomOutletBox>
	);
};

export default BookIssueScreen;
