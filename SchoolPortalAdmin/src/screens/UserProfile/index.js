import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Grid,
	Stack,
	Chip,
	CircularProgress,
	Alert,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tabs,
	Tab
} from '@mui/material';
import {
	Person,
	School,
	Work,
	Assessment,
	History,
	Edit,
	Save,
	Cancel
} from '@mui/icons-material';
import { useGetMyProfileQuery, useUpdateMyProfileMutation, useGetUserStatsQuery } from '../../Redux/features/Users/userDetailsSlice';
import { useEnableTwoFactorMutation, useVerifyTwoFactorSetupMutation, useDisableTwoFactorMutation } from '../../Redux/features/auth/userSlice';
import UserDetails from '../../components/Common/UserDetails';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useSnackbar } from '../../hooks/SnackBar';
import CustomButton from '../../components/Common/CustomButton';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

const UserProfile = () => {
	const { t } = useTranslation();
	const { id } = useParams();
	const showSnackbar = useSnackbar();
	const [activeTabKey, setActiveTabKey] = useState('profile');
	const [hasAppliedInitialTab, setHasAppliedInitialTab] = useState(false);
	const [editDialog, setEditDialog] = useState(false);
	const [editData, setEditData] = useState({});
	const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
	const [twoFactorProvisioning, setTwoFactorProvisioning] = useState(null);
	const [twoFactorError, setTwoFactorError] = useState('');
	const [enableTwoFactor, { isLoading: isEnablingTwoFactor }] = useEnableTwoFactorMutation();
	const [verifyTwoFactorSetup, { isLoading: isVerifyingTwoFactor }] = useVerifyTwoFactorSetupMutation();
	const [disableTwoFactor, { isLoading: isDisablingTwoFactor }] = useDisableTwoFactorMutation();
	const location = useLocation();
	const initialFocusTab = location.state?.focusTab;

	const twoFactorVerificationSchema = useMemo(() => yup.object().shape({
		token: yup
			.string()
			.required(t('userProfile.twoFactor.validation.tokenRequired'))
			.matches(/^\d{6}$/, t('userProfile.twoFactor.validation.tokenFormat')),
	}), [t]);

	const {
		handleSubmit: handleTwoFactorFormSubmit,
		control: twoFactorControl,
		reset: resetTwoFactorForm,
		formState: { errors: twoFactorErrors },
	} = useForm({
		resolver: yupResolver(twoFactorVerificationSchema),
		defaultValues: { token: '' },
	});

	// Get user details
	const {
		data: userData,
		isLoading,
		isError,
		refetch
	} = useGetMyProfileQuery();

// Update profile mutation
	const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();

	const profileUserId = userData?.data?.user?._id;
	const {
		data: statsResponse,
		isFetching: isStatsFetching,
		isLoading: isStatsLoading,
		isError: isStatsError,
		error: statsError,
		refetch: refetchStats,
	} = useGetUserStatsQuery(profileUserId, { skip: !profileUserId });

	const handleTabChange = (event, newValue) => {
		setActiveTabKey(newValue);
	};

	const handleEdit = () => {
		if (userData?.data?.user) {
			const user = userData.data.user;
			const student = userData.data.student;
			const teacher = userData.data.teacher;
			
			setEditData({
				name: user?.name || '',
				email: user?.email || '',
				phone: user?.phone || '',
				...(student && {
					studentName: student.studentName || '',
					Father_name: student.Father_name || '',
					Mother_name: student.Mother_name || '',
					contactNo: student.contactNo || '',
					Email: student.Email || ''
				}),
				...(teacher && {
					employeeName: teacher.employeeName || '',
					contactNo: teacher.contactNo || '',
					email: teacher.email || '',
					designation: teacher.designation || '',
					qualification: teacher.qualification || ''
				})
			});
			setEditDialog(true);
		}
	};

	const handleSave = async () => {
		try {
			await updateProfile(editData).unwrap();
			showSnackbar(t('userProfile.messages.updateSuccess'), { variant: 'success' });
			setEditDialog(false);
			refetch();
		} catch (error) {
			showSnackbar(t('userProfile.messages.updateError'), { variant: 'error' });
		}
	};

	const handleUpdate = async (data) => {
		try {
			await updateProfile(data).unwrap();
			showSnackbar(t('userProfile.messages.updateSuccess'), { variant: 'success' });
			refetch();
			if (refetchStats) {
				refetchStats();
			}
		} catch (error) {
			showSnackbar(t('userProfile.messages.updateError'), { variant: 'error' });
		}
	};

	const handleEnableTwoFactor = useCallback(async () => {
		try {
			const response = await enableTwoFactor().unwrap();
			const data = response?.data || response;
			setTwoFactorProvisioning({
				qrCode: data?.qrCode,
				secret: data?.secret,
				serviceName: data?.serviceName,
				accountName: data?.accountName,
			});
			setTwoFactorError('');
			resetTwoFactorForm({ token: '' });
			setTwoFactorDialogOpen(true);
		} catch (error) {
			const message = error?.data?.message || t('userProfile.twoFactor.messages.enableError');
			showSnackbar(message, 'error');
		}
	}, [enableTwoFactor, resetTwoFactorForm, showSnackbar, t]);

	const handleDisableTwoFactor = useCallback(async () => {
		try {
			await disableTwoFactor().unwrap();
			showSnackbar(t('userProfile.twoFactor.messages.disableSuccess'), 'success');
			refetch();
		} catch (error) {
			const message = error?.data?.message || t('userProfile.twoFactor.messages.disableError');
			showSnackbar(message, 'error');
		}
	}, [disableTwoFactor, refetch, showSnackbar, t]);

	const handleTwoFactorDialogClose = useCallback(() => {
		if (isVerifyingTwoFactor) {
			return;
		}
		setTwoFactorDialogOpen(false);
		setTwoFactorProvisioning(null);
		setTwoFactorError('');
		resetTwoFactorForm({ token: '' });
	}, [isVerifyingTwoFactor, resetTwoFactorForm]);

	const handleConfirmTwoFactorSetup = useCallback(async ({ token }) => {
		try {
			await verifyTwoFactorSetup({ token }).unwrap();
			showSnackbar(t('userProfile.twoFactor.messages.enableSuccess'), 'success');
			setTwoFactorDialogOpen(false);
			setTwoFactorProvisioning(null);
			setTwoFactorError('');
			resetTwoFactorForm({ token: '' });
			refetch();
		} catch (error) {
			const message = error?.data?.message || t('userProfile.twoFactor.messages.invalidToken');
			setTwoFactorError(message);
		}
	}, [verifyTwoFactorSetup, resetTwoFactorForm, refetch, showSnackbar, t]);

	const user = userData?.data?.user;
	const student = userData?.data?.student;
	const teacher = userData?.data?.teacher;
	const currentAcademic = userData?.data?.currentAcademic;
	const isStaffAccount = user?.role === 'admin' || user?.role === 'user';
	const stats = statsResponse?.data;
	const verificationStatus = stats?.verificationStatus || {};
	const studentStats = stats?.studentInfo;
	const teacherStats = stats?.teacherInfo;
	const statsLoading = isStatsLoading || isStatsFetching || !profileUserId;
	const statsErrorMessage = statsError?.data?.message || statsError?.error || 'Unable to load statistics.';

	const formatDateValue = useCallback((value) => {
		if (!value) return t('userProfile.fallback.na');
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? t('userProfile.fallback.na') : date.toLocaleDateString();
	}, [t]);

	const tabs = useMemo(() => {
		const items = [{ key: 'profile', label: t('userProfile.tabs.profileDetails') }];
		if (currentAcademic) {
			items.push({ key: 'academic', label: t('userProfile.tabs.currentAcademic') });
		}
		items.push({ key: 'stats', label: t('userProfile.tabs.statistics') });
		if (isStaffAccount) {
			items.push({ key: 'security', label: t('userProfile.tabs.security') });
		}
		return items;
	}, [currentAcademic, isStaffAccount, t]);

	const tabKeys = useMemo(() => tabs.map((tab) => tab.key), [tabs]);

	useEffect(() => {
		if (!tabKeys.includes(activeTabKey)) {
			setActiveTabKey(tabKeys[0] ?? 'profile');
		}
	}, [tabKeys, activeTabKey]);

	useEffect(() => {
		if (!initialFocusTab || hasAppliedInitialTab) return;
		if (tabKeys.includes(initialFocusTab)) {
			if (initialFocusTab !== activeTabKey) {
				setActiveTabKey(initialFocusTab);
			}
			setHasAppliedInitialTab(true);
		}
	}, [initialFocusTab, tabKeys, activeTabKey, hasAppliedInitialTab]);

	if (isLoading) {
		return (
			<CustomOutletBox>
				<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
					<CircularProgress />
				</Box>
			</CustomOutletBox>
		);
	}

	if (isError) {
		return (
			<CustomOutletBox>
				<Alert severity="error">
					Failed to load user details. Please try again.
				</Alert>
			</CustomOutletBox>
		);
	}

	if (!userData || !user) {
		return (
			<CustomOutletBox>
				<Alert severity="warning">
					No user data available
				</Alert>
			</CustomOutletBox>
		);
	}

	const activeTab = activeTabKey;

	return (
		<CustomOutletBox>
			<Box p={3}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
					<Typography variant="h4" gutterBottom>
						{t('userProfile.title')}
					</Typography>
					<Button
						variant="contained"
						startIcon={<Edit />}
						onClick={handleEdit}
					>
						{t('userProfile.actions.edit')}
					</Button>
				</Box>

				<Tabs value={activeTabKey} onChange={handleTabChange} sx={{ mb: 3 }}>
					{tabs.map((tab) => (
						<Tab key={tab.key} label={tab.label} value={tab.key} />
					))}
				</Tabs>

				{activeTab === 'profile' && (
					<UserDetails
						userData={userData.data}
						onUpdate={handleUpdate}
						isLoading={isLoading}
						isEditable={true}
					/>
				)}

				{activeTab === 'academic' && currentAcademic && (
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<History sx={{ mr: 1, verticalAlign: 'middle' }} />
								{t('userProfile.academic.title')}
							</Typography>

							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<Card variant="outlined">
										<CardContent>
											<Typography variant="h6" gutterBottom>
												{currentAcademic.academicYear?.academicYear || t('userProfile.fallback.na')}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{t('userProfile.academic.grade')}: {currentAcademic.grade?.gradeName || t('userProfile.fallback.na')}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{t('userProfile.academic.section')}: {currentAcademic.section?.sectionName || t('userProfile.fallback.na')}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{t('userProfile.academic.startDate')}: {currentAcademic.startDate ? new Date(currentAcademic.startDate).toLocaleDateString() : t('userProfile.fallback.na')}
											</Typography>
											<Chip
												label={currentAcademic.status || t('userProfile.fallback.unknown')}
												color={
													currentAcademic.status === 'active' ? 'success' :
														currentAcademic.status === 'completed' ? 'info' :
															currentAcademic.status === 'promoted' ? 'warning' : 'error'
												}
												size="small"
											/>
										</CardContent>
									</Card>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				)}

				{activeTab === 'stats' && (
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
								{t('userProfile.stats.title')}
							</Typography>

							{statsLoading ? (
								<Box display="flex" justifyContent="center" py={4}>
									<CircularProgress size={32} />
								</Box>
							) : isStatsError ? (
								<Alert severity="error" sx={{ borderRadius: 2 }}>
									{statsErrorMessage}
								</Alert>
							) : !stats ? (
								<Alert severity="info" sx={{ borderRadius: 2 }}>
									{t('userProfile.stats.unavailable')}
								</Alert>
							) : (
								<Grid container spacing={3}>
									<Grid item xs={12} md={6}>
										<Typography variant="subtitle2" color="text.secondary" gutterBottom>
											{t('userProfile.stats.accountInfo')}
										</Typography>
										<Box mb={2}>
											<Typography variant="body2" color="text.secondary">{t('userProfile.stats.userType')}</Typography>
											<Typography variant="body1">{stats.userType || user?.role || t('userProfile.fallback.na')}</Typography>
										</Box>
										<Box mb={2}>
											<Typography variant="body2" color="text.secondary">{t('userProfile.stats.accountStatus')}</Typography>
											<Chip
												label={stats.accountStatus || (user?.active ? t('userProfile.stats.active') : t('userProfile.stats.inactive'))}
												color={(stats.accountStatus || (user?.active ? t('userProfile.stats.active') : t('userProfile.stats.inactive'))) === t('userProfile.stats.active') ? 'success' : 'error'}
												size="small"
											/>
										</Box>
										<Box mb={2}>
											<Typography variant="body2" color="text.secondary">{t('userProfile.stats.emailVerified')}</Typography>
											<Chip
												label={verificationStatus.email ? t('userProfile.stats.yes') : t('userProfile.stats.no')}
												color={verificationStatus.email ? 'success' : 'error'}
												size="small"
											/>
										</Box>
										<Box mb={2}>
											<Typography variant="body2" color="text.secondary">{t('userProfile.stats.phoneVerified')}</Typography>
											<Chip
												label={verificationStatus.phone ? t('userProfile.stats.yes') : t('userProfile.stats.no')}
												color={verificationStatus.phone ? 'success' : 'error'}
												size="small"
											/>
										</Box>
										<Box mb={2}>
											<Typography variant="body2" color="text.secondary">{t('userProfile.stats.accountCreated')}</Typography>
											<Typography variant="body1">{formatDateValue(stats.accountCreated || user?.createdAt)}</Typography>
										</Box>
										<Box mb={2}>
											<Typography variant="body2" color="text.secondary">{t('userProfile.stats.twoFactor')}</Typography>
											<Chip
												label={user?.twoFactorEnabled ? t('userProfile.stats.enabled') : t('userProfile.stats.disabled')}
												color={user?.twoFactorEnabled ? 'success' : 'default'}
												variant={user?.twoFactorEnabled ? 'filled' : 'outlined'}
												size="small"
											/>
										</Box>
									</Grid>

									{studentStats && (
										<Grid item xs={12} md={6}>
											<Typography variant="subtitle2" color="text.secondary" gutterBottom>
												{t('userProfile.stats.studentInfo')}
											</Typography>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.studentId')}</Typography>
												<Typography variant="body1">{studentStats.studentID || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.currentGrade')}</Typography>
												<Typography variant="body1">{studentStats.currentGrade || student?.grade?.gradeName || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.currentSection')}</Typography>
												<Typography variant="body1">{studentStats.currentSection || student?.section?.sectionName || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.academicYear')}</Typography>
												<Typography variant="body1">{studentStats.academicYear || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.admissionDate')}</Typography>
												<Typography variant="body1">{formatDateValue(studentStats.admissionDate || student?.Admission_date)}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.academicHistory')}</Typography>
												<Typography variant="body1">
													{t('userProfile.stats.academicHistoryFormat', {
														records: studentStats.academicHistoryCount ?? 0,
														active: studentStats.activeAcademicYears ?? 0,
														completed: studentStats.completedAcademicYears ?? 0
													})}
												</Typography>
											</Box>
										</Grid>
									)}

									{teacherStats && (
										<Grid item xs={12} md={6}>
											<Typography variant="subtitle2" color="text.secondary" gutterBottom>
												{t('userProfile.stats.teacherInfo')}
											</Typography>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.employeeId')}</Typography>
												<Typography variant="body1">{teacherStats.employeeId || teacher?.employeeId || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.designation')}</Typography>
												<Typography variant="body1">{teacherStats.designation || teacher?.designation || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.qualification')}</Typography>
												<Typography variant="body1">{teacherStats.qualification || teacher?.qualification || t('userProfile.fallback.na')}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.experience')}</Typography>
												<Typography variant="body1">{t('userProfile.stats.experienceFormat', { years: teacherStats.experienceInYears ?? teacher?.experienceInYears ?? 0 })}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.dateOfJoining')}</Typography>
												<Typography variant="body1">{formatDateValue(teacherStats.dateOfJoining || teacher?.dateOfJoining)}</Typography>
											</Box>
											<Box mb={2}>
												<Typography variant="body2" color="text.secondary">{t('userProfile.stats.status')}</Typography>
												<Chip
													label={teacherStats.status || teacher?.status || t('userProfile.fallback.unknown')}
													color={(teacherStats.status || teacher?.status) === 'active' ? 'success' : 'error'}
													size="small"
												/>
											</Box>
										</Grid>
									)}
								</Grid>
							)}
						</CardContent>
					</Card>
				)}

				{activeTab === 'security' && (
					isStaffAccount ? (
						<Card>
							<CardContent>
								<Stack spacing={3}>
									<Box>
										<Typography variant="h6" gutterBottom>
											{t('userProfile.twoFactor.title')}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{t('userProfile.twoFactor.description')}
										</Typography>
									</Box>

									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
										<Chip
											label={user.twoFactorEnabled ? t('userProfile.stats.enabled') : t('userProfile.stats.disabled')}
											color={user.twoFactorEnabled ? 'success' : 'default'}
											variant={user.twoFactorEnabled ? 'filled' : 'outlined'}
										/>
										<Typography variant="body2" color="text.secondary">
											{user.twoFactorEnabled
												? t('userProfile.twoFactor.enabledMessage')
												: t('userProfile.twoFactor.disabledMessage')}
										</Typography>
									</Stack>

									{!user.twoFactorEnabled && (
										<Alert severity="info" sx={{ borderRadius: 2 }}>
											{t('userProfile.twoFactor.setupInfo')}
										</Alert>
									)}

									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
										{user.twoFactorEnabled ? (
											<CustomButton
												label={t('userProfile.twoFactor.actions.disable')}
												onClick={handleDisableTwoFactor}
												loading={isDisablingTwoFactor}
												disable={isDisablingTwoFactor}
												type="button"
												width="100%"
											/>
										) : (
											<CustomButton
												label={t('userProfile.twoFactor.actions.setup')}
												onClick={handleEnableTwoFactor}
												loading={isEnablingTwoFactor}
												disable={isEnablingTwoFactor}
												type="button"
												width="100%"
											/>
										)}
									</Stack>
								</Stack>
							</CardContent>
						</Card>
					) : (
						<Alert severity="info" sx={{ borderRadius: 2 }}>
							{t('userProfile.twoFactor.studentNotRequired')}
						</Alert>
					)
				)}
			</Box>

			{/* Edit Dialog */}
			<Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
				<DialogTitle>{t('userProfile.editDialog.title')}</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label={t('userProfile.editDialog.name')}
								value={editData.name || ''}
								onChange={(e) => setEditData({ ...editData, name: e.target.value })}
								margin="normal"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label={t('userProfile.editDialog.email')}
								value={editData.email || ''}
								onChange={(e) => setEditData({ ...editData, email: e.target.value })}
								margin="normal"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label={t('userProfile.editDialog.phone')}
								value={editData.phone || ''}
								onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
								margin="normal"
							/>
						</Grid>

						{student && (
							<>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('userProfile.editDialog.studentName')}
										value={editData.studentName || ''}
										onChange={(e) => setEditData({ ...editData, studentName: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('userProfile.editDialog.fatherName')}
										value={editData.Father_name || ''}
										onChange={(e) => setEditData({ ...editData, Father_name: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('userProfile.editDialog.motherName')}
										value={editData.Mother_name || ''}
										onChange={(e) => setEditData({ ...editData, Mother_name: e.target.value })}
										margin="normal"
									/>
								</Grid>
							</>
						)}

						{teacher && (
							<>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('userProfile.editDialog.employeeName')}
										value={editData.employeeName || ''}
										onChange={(e) => setEditData({ ...editData, employeeName: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('userProfile.editDialog.designation')}
										value={editData.designation || ''}
										onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('userProfile.editDialog.qualification')}
										value={editData.qualification || ''}
										onChange={(e) => setEditData({ ...editData, qualification: e.target.value })}
										margin="normal"
									/>
								</Grid>
							</>
						)}
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditDialog(false)} disabled={isUpdating}>
						{t('userProfile.editDialog.cancel')}
					</Button>
					<Button onClick={handleSave} variant="contained" disabled={isUpdating}>
						{isUpdating ? <CircularProgress size={20} /> : t('userProfile.editDialog.save')}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={twoFactorDialogOpen}
				onClose={handleTwoFactorDialogClose}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>{t('userProfile.twoFactor.dialog.title')}</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<Typography variant="body2" color="text.secondary">
							{t('userProfile.twoFactor.dialog.description')}
						</Typography>

						{twoFactorProvisioning?.qrCode && (
							<Box display="flex" justifyContent="center">
								<Box
									component="img"
									src={twoFactorProvisioning.qrCode}
									alt={t('userProfile.twoFactor.dialog.qrCodeAlt')}
									sx={{ width: 220, height: 220 }}
								/>
							</Box>
						)}

						{twoFactorProvisioning?.secret && (
							<Box textAlign="center">
								<Typography variant="caption" color="text.secondary">
									{t('userProfile.twoFactor.dialog.manualEntry')}
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 600, letterSpacing: 2 }}>
									{twoFactorProvisioning.secret}
								</Typography>
								{twoFactorProvisioning?.accountName && twoFactorProvisioning?.serviceName && (
									<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
										{t('userProfile.twoFactor.dialog.accountInfo', {
											accountName: twoFactorProvisioning.accountName,
											serviceName: twoFactorProvisioning.serviceName
										})}
									</Typography>
								)}
							</Box>
						)}

						{twoFactorError && (
							<Alert severity="error" sx={{ borderRadius: 2 }}>
								{twoFactorError}
							</Alert>
						)}

						<Box component="form" onSubmit={handleTwoFactorFormSubmit(handleConfirmTwoFactorSetup)}>
							<Stack spacing={2.5}>
								<CustomLoginInput
									type="text"
									control={twoFactorControl}
									error={twoFactorErrors.token}
									fieldName="token"
									placeholder={t('userProfile.twoFactor.dialog.placeholder')}
								/>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
									<CustomButton
										type="submit"
										label={t('userProfile.twoFactor.dialog.verify')}
										width="100%"
										loading={isVerifyingTwoFactor}
										disable={isVerifyingTwoFactor}
									/>
									<CustomButton
										type="button"
										variant="outlined"
										label={t('userProfile.editDialog.cancel')}
										width="100%"
										disable={isVerifyingTwoFactor}
										onClick={handleTwoFactorDialogClose}
									/>
								</Stack>
							</Stack>
						</Box>
					</Stack>
				</DialogContent>
			</Dialog>
		</CustomOutletBox>
	);
};

export default UserProfile; 