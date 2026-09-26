import React, { useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Grid,
	Chip,
	Avatar,
	Divider,
	Tabs,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	CircularProgress,
	Alert
} from '@mui/material';
import {
	Person,
	School,
	Work,
	LocationOn,
	Phone,
	Email,
	CalendarToday,
	Edit,
	History,
	Badge,
	DirectionsBus,
	HealthAndSafety,
	Home,
	Business
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const UserDetails = ({ userData, onUpdate, isLoading, isEditable = false }) => {
	const { t } = useTranslation();
	const [selectedTab, setSelectedTab] = useState(0);
	const [editDialog, setEditDialog] = useState(false);
	const [editData, setEditData] = useState({});

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" p={3}>
				<CircularProgress />
			</Box>
		);
	}

	if (!userData) {
		return (
			<Alert severity="error">
				{t('userDetails.noUserData')}
			</Alert>
		);
	}

	const { user, student, teacher, currentAcademic } = userData;

	const handleTabChange = (event, newValue) => {
		setSelectedTab(newValue);
	};

	const handleEdit = () => {
		setEditData({
			name: user?.name || '',
			email: user?.email || '',
			phone: user?.phone || '',
			...(student && {
				studentName: student?.studentName || '',
				Father_name: student?.Father_name || '',
				Mother_name: student?.Mother_name || '',
				contactNo: student?.contactNo || '',
				Email: student?.Email || '',
				Communication_no: student?.Communication_no || '',
				Place_of_birth: student?.Place_of_birth || '',
				Hobbies: student?.Hobbies || '',
				Health_Issue: student?.Health_Issue || ''
			}),
			...(teacher && {
				employeeName: teacher?.employeeName || '',
				contactNo: teacher?.contactNo || '',
				email: teacher?.email || '',
				designation: teacher?.designation || '',
				qualification: teacher?.qualification || ''
			})
		});
		setEditDialog(true);
	};

	const handleSave = async () => {
		try {
			await onUpdate(editData);
			setEditDialog(false);
		} catch (error) {
			console.error('Failed to update profile:', error);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return t('userDetails.notAvailable');
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB');
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'active': return 'success';
			case 'inactive': return 'error';
			case 'completed': return 'info';
			case 'promoted': return 'warning';
			default: return 'default';
		}
	};

	const renderBasicInfo = () => (
		<Card>
			<CardContent>
				<Box display="flex" alignItems="center" mb={2}>
					<Avatar
						src={user?.photo || undefined}
						sx={{ width: 80, height: 80, mr: 2 }}
					>
						<Person />
					</Avatar>
					<Box>
						<Typography variant="h5" gutterBottom>
							{user?.name || 'N/A'}
						</Typography>
						<Chip
							label={(user?.role || t('userDetails.unknown')).toUpperCase()}
							color="primary"
							size="small"
						/>
						<Chip
							label={user?.active ? t('userDetails.active') : t('userDetails.inactive')}
							color={user?.active ? 'success' : 'error'}
							size="small"
							sx={{ ml: 1 }}
						/>
					</Box>
					{isEditable && (
						<IconButton
							onClick={handleEdit}
							sx={{ ml: 'auto' }}
						>
							<Edit />
						</IconButton>
					)}
				</Box>

				<Grid container spacing={2}>
					<Grid item xs={12} md={6}>
						<Box display="flex" alignItems="center" mb={1}>
							<Email sx={{ mr: 1, color: 'text.secondary' }} />
							<Typography variant="body2">
								{user?.email || 'N/A'}
							</Typography>
							{user?.emailVerified && (
								<Chip label={t('userDetails.verified')} size="small" color="success" sx={{ ml: 1 }} />
							)}
						</Box>
						<Box display="flex" alignItems="center" mb={1}>
							<Phone sx={{ mr: 1, color: 'text.secondary' }} />
							<Typography variant="body2">
								{user?.phone || t('userDetails.notAvailable')}
							</Typography>
							{user?.phoneVerified && (
								<Chip label={t('userDetails.verified')} size="small" color="success" sx={{ ml: 1 }} />
							)}
						</Box>
					</Grid>
					<Grid item xs={12} md={6}>
						<Box display="flex" alignItems="center" mb={1}>
							<CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
							<Typography variant="body2">
								{t('userDetails.memberSince', { date: user?.createdAt ? formatDate(user.createdAt) : t('userDetails.notAvailable') })}
							</Typography>
						</Box>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	);

	const renderStudentInfo = () => {
		if (!student) {
			return (
				<Card>
					<CardContent>
						<Typography variant="body2" color="text.secondary">
							{t('userDetails.noStudentInfo')}
						</Typography>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<School sx={{ mr: 1, verticalAlign: 'middle' }} />
						{t('userDetails.studentInformation')}
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								{t('userDetails.personalInformation')}
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.studentId')}</Typography>
								<Typography variant="body1">{student?.studentID || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.studentName')}</Typography>
								<Typography variant="body1">{student?.studentName || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.dateOfBirth')}</Typography>
								<Typography variant="body1">{student?.Dob ? formatDate(student.Dob) : t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.gender')}</Typography>
								<Typography variant="body1">{student?.gender || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.placeOfBirth')}</Typography>
								<Typography variant="body1">{student?.Place_of_birth || t('userDetails.notAvailable')}</Typography>
							</Box>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								{t('userDetails.academicInformation')}
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.grade')}</Typography>
								<Typography variant="body1">{student?.grade?.gradeName || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.section')}</Typography>
								<Typography variant="body1">{student?.section?.sectionName || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.academicYear')}</Typography>
								<Typography variant="body1">{student?.academicYear?.academicYear || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.admissionDate')}</Typography>
								<Typography variant="body1">{student?.Admission_date ? formatDate(student.Admission_date) : t('userDetails.notAvailable')}</Typography>
							</Box>
						</Grid>
					</Grid>

					<Divider sx={{ my: 2 }} />

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								{t('userDetails.parentInformation')}
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.fathersName')}</Typography>
								<Typography variant="body1">{student?.Father_name || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.mothersName')}</Typography>
								<Typography variant="body1">{student?.Mother_name || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.contactNumber')}</Typography>
								<Typography variant="body1">{student?.contactNo || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.communicationNumber')}</Typography>
								<Typography variant="body1">{student?.Communication_no || t('userDetails.notAvailable')}</Typography>
							</Box>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								{t('userDetails.additionalInformation')}
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.religion')}</Typography>
								<Typography variant="body1">{student?.Religion?.religionName || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.nationality')}</Typography>
								<Typography variant="body1">{student?.Nationality?.nationality || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.previousSchool')}</Typography>
								<Typography variant="body1">{student?.Previous_School || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.hobbies')}</Typography>
								<Typography variant="body1">{student?.Hobbies || t('userDetails.notAvailable')}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">{t('userDetails.healthIssues')}</Typography>
								<Typography variant="body1">{student?.Health_Issue || t('userDetails.notAvailable')}</Typography>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		);
	};

	const renderTeacherInfo = () => {
		if (!teacher) {
			return (
				<Card>
					<CardContent>
						<Typography variant="body2" color="text.secondary">
							No teacher information available
						</Typography>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<Work sx={{ mr: 1, verticalAlign: 'middle' }} />
						Teacher Information
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Professional Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Employee ID</Typography>
								<Typography variant="body1">{teacher?.employeeId || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Designation</Typography>
								<Typography variant="body1">{teacher?.designation || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Qualification</Typography>
								<Typography variant="body1">{teacher?.qualification || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Experience</Typography>
								<Typography variant="body1">{teacher?.experienceInYears || 0} years</Typography>
							</Box>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Personal Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Date of Birth</Typography>
								<Typography variant="body1">{teacher?.dob ? formatDate(teacher.dob) : 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Gender</Typography>
								<Typography variant="body1">{teacher?.gender || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Date of Joining</Typography>
								<Typography variant="body1">{teacher?.dateOfJoining ? formatDate(teacher.dateOfJoining) : 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Status</Typography>
								<Chip
									label={teacher?.status || 'Unknown'}
									color={getStatusColor(teacher?.status)}
									size="small"
								/>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		);
	};

	const renderCurrentAcademic = () => {
		if (!currentAcademic) {
			return (
				<Card>
					<CardContent>
						<Typography variant="body2" color="text.secondary">
							No current academic information available
						</Typography>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<History sx={{ mr: 1, verticalAlign: 'middle' }} />
						Current Academic Information
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Academic Details
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Academic Year</Typography>
								<Typography variant="body1">{currentAcademic?.academicYear?.academicYear || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Grade</Typography>
								<Typography variant="body1">{currentAcademic?.grade?.gradeName || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Section</Typography>
								<Typography variant="body1">{currentAcademic?.section?.sectionName || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Start Date</Typography>
								<Typography variant="body1">{currentAcademic?.startDate ? formatDate(currentAcademic.startDate) : 'N/A'}</Typography>
							</Box>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Status Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Status</Typography>
								<Chip
									label={currentAcademic?.status || 'Unknown'}
									color={getStatusColor(currentAcademic?.status)}
									size="small"
								/>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Created Date</Typography>
								<Typography variant="body1">{currentAcademic?.createdAt ? formatDate(currentAcademic.createdAt) : 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Last Updated</Typography>
								<Typography variant="body1">{currentAcademic?.updatedAt ? formatDate(currentAcademic.updatedAt) : 'N/A'}</Typography>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		);
	};

	const renderAddressInfo = () => {
		const addressData = student || teacher;
		if (!addressData) return null;

		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
						Address Information
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Communication Address
							</Typography>
							<Typography variant="body1" paragraph>
								{addressData.Communication_Address || addressData.communicationAddress || 'N/A'}
							</Typography>
						</Grid>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Permanent Address
							</Typography>
							<Typography variant="body1" paragraph>
								{addressData.Permanent_Address || addressData.permanentAddress || 'N/A'}
							</Typography>
						</Grid>
					</Grid>

					<Grid container spacing={3}>
						<Grid item xs={12} md={4}>
							<Typography variant="body2" color="text.secondary">City</Typography>
							<Typography variant="body1">
								{addressData.City?.name || 'N/A'}
							</Typography>
						</Grid>
						<Grid item xs={12} md={4}>
							<Typography variant="body2" color="text.secondary">Province</Typography>
							<Typography variant="body1">
								{addressData.Province?.name || 'N/A'}
							</Typography>
						</Grid>
						<Grid item xs={12} md={4}>
							<Typography variant="body2" color="text.secondary">Zip Code</Typography>
							<Typography variant="body1">
								{addressData.Zip || addressData.zip || 'N/A'}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		);
	};

	const renderTransportInfo = () => {
		if (!student) return null;

		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<DirectionsBus sx={{ mr: 1, verticalAlign: 'middle' }} />
						Transport Information
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Pickup Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Transport Type</Typography>
								<Typography variant="body1">{student.Transport_Pickup || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Bus Number</Typography>
								<Typography variant="body1">{student.Pickup_BusNo || 'N/A'}</Typography>
							</Box>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Drop Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Transport Type</Typography>
								<Typography variant="body1">{student.Transport_Drop || 'N/A'}</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Bus Number</Typography>
								<Typography variant="body1">{student.Drop_BusNo || 'N/A'}</Typography>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		);
	};

	const renderDocumentsInfo = () => {
		const documentsData = student || teacher;
		if (!documentsData) return null;

		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<Badge sx={{ mr: 1, verticalAlign: 'middle' }} />
						Documents & Legal Information
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Passport Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Passport Number</Typography>
								<Typography variant="body1">
									{documentsData.Passport_No || documentsData.passportNo || 'N/A'}
								</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Expiry Date</Typography>
								<Typography variant="body1">
									{formatDate(documentsData.Passport_Expiry || documentsData.passportExpiry)}
								</Typography>
							</Box>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Iqama Information
							</Typography>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Iqama Number</Typography>
								<Typography variant="body1">
									{documentsData.Iqama_No || documentsData.iqamaNo || 'N/A'}
								</Typography>
							</Box>
							<Box mb={2}>
								<Typography variant="body2" color="text.secondary">Expiry Date</Typography>
								<Typography variant="body1">
									{formatDate(documentsData.Iqama_Expiry || documentsData.iqamaExpiry)}
								</Typography>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		);
	};

	return (
		<Box>
			{renderBasicInfo()}

			<Box mt={3}>
				<Tabs value={selectedTab} onChange={handleTabChange}>
					{/* <Tab label="Basic Info" /> */}
					{student && <Tab label="Student Info" />}
					{teacher && <Tab label="Teacher Info" />}
					{currentAcademic && <Tab label="Current Academic" />}
					<Tab label="Address" />
					{student && <Tab label="Transport" />}
					<Tab label="Documents" />
				</Tabs>
			</Box>

			<Box mt={3}>

				{selectedTab === 0 && student && renderStudentInfo()}

				{selectedTab === 2 && teacher && renderTeacherInfo()}

				{selectedTab === 1 && currentAcademic && renderCurrentAcademic()}

				{selectedTab === 2 && renderAddressInfo()}
				{selectedTab === 1 && teacher && renderAddressInfo()}

				{selectedTab === 3 && student && renderTransportInfo()}
				{selectedTab === 3 && teacher && renderDocumentsInfo()}

				{selectedTab === 4 && renderDocumentsInfo()}
			</Box>

			{/* Edit Dialog */}
			<Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
				<DialogTitle>Edit Profile</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Name"
								value={editData.name || ''}
								onChange={(e) => setEditData({ ...editData, name: e.target.value })}
								margin="normal"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Email"
								value={editData.email || ''}
								onChange={(e) => setEditData({ ...editData, email: e.target.value })}
								margin="normal"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Phone"
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
										label="Student Name"
										value={editData.studentName || ''}
										onChange={(e) => setEditData({ ...editData, studentName: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Father's Name"
										value={editData.Father_name || ''}
										onChange={(e) => setEditData({ ...editData, Father_name: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Mother's Name"
										value={editData.Mother_name || ''}
										onChange={(e) => setEditData({ ...editData, Mother_name: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Communication Number"
										value={editData.Communication_no || ''}
										onChange={(e) => setEditData({ ...editData, Communication_no: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Place of Birth"
										value={editData.Place_of_birth || ''}
										onChange={(e) => setEditData({ ...editData, Place_of_birth: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Hobbies"
										value={editData.Hobbies || ''}
										onChange={(e) => setEditData({ ...editData, Hobbies: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Health Issues"
										value={editData.Health_Issue || ''}
										onChange={(e) => setEditData({ ...editData, Health_Issue: e.target.value })}
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
										label="Employee Name"
										value={editData.employeeName || ''}
										onChange={(e) => setEditData({ ...editData, employeeName: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Designation"
										value={editData.designation || ''}
										onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
										margin="normal"
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label="Qualification"
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
					<Button onClick={() => setEditDialog(false)}>Cancel</Button>
					<Button onClick={handleSave} variant="contained">Save</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default UserDetails; 