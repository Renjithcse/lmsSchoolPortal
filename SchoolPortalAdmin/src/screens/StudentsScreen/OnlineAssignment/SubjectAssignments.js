import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Grid,
	Button,
	Chip,
	CircularProgress,
	Alert,
	IconButton,
	Tooltip,
	Avatar,
	Paper,
	Divider,
	Breadcrumbs,
	Link
} from '@mui/material';
import {
	Assignment as AssignmentIcon,
	CheckCircle as CheckCircleIcon,
	Schedule as ScheduleIcon,
	Warning as WarningIcon,
	Visibility as VisibilityIcon,
	Edit as EditIcon,
	ArrowBack as ArrowBackIcon,
	School,
	Timer,
	CalendarToday
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useGetStudentSubjectAssignmentsQuery } from '../../../Redux/features/studentAssignmentSlice';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';

const SubjectAssignments = () => {
	const { subjectId } = useParams();
	const navigate = useNavigate();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { data, isLoading, error } = useGetStudentSubjectAssignmentsQuery(subjectId);



	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1
			}
		}
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: {
				duration: 0.5
			}
		}
	};

	const handleBack = () => {
		navigate('/students/online-assignment/dashboard');
	};

	const handleViewAssignment = (assignmentId) => {
		navigate(`/students/online-assignment/view/${assignmentId}`);
	};

	const handleSubmitAssignment = (assignmentId) => {
		navigate(`/students/online-assignment/submit/${assignmentId}`);
	};

	const getStatusColor = (attempt) => {
		const currentDate = new Date();
		const endDate = attempt?.publishId?.endDate ? new Date(attempt.publishId.endDate) : null;

		if (attempt?.attendedStatus) {
			return themeColors.success;
		} else if (endDate && endDate < currentDate) {
			return themeColors.error;
		} else {
			return themeColors.warning;
		}
	};

	const getStatusText = (attempt) => {
		const currentDate = new Date();
		const endDate = attempt?.publishId?.endDate ? new Date(attempt.publishId.endDate) : null;

		if (attempt?.attendedStatus) {
			return t('subjectAssignments.status.completed');
		} else if (endDate && endDate < currentDate) {
			return t('subjectAssignments.status.expired');
		} else {
			return t('subjectAssignments.status.pending');
		}
	};

	const getStatusIcon = (attempt) => {
		const currentDate = new Date();
		const endDate = attempt?.publishId?.endDate ? new Date(attempt.publishId.endDate) : null;

		if (attempt?.attendedStatus) {
			return <CheckCircleIcon />;
		} else if (endDate && endDate < currentDate) {
			return <WarningIcon />;
		} else {
			return <ScheduleIcon />;
		}
	};

	if (isLoading) {
		return (
			<CustomOutletBox>
				<Box 
					display="flex" 
					flexDirection="column"
					justifyContent="center" 
					alignItems="center" 
					minHeight="400px"
					sx={{
						background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
						borderRadius: 3,
						p: 4
					}}
				>
					<CircularProgress 
						size={60}
						sx={{ 
							color: themeColors.primary,
							mb: 2
						}} 
					/>
					<Typography 
						variant="h6" 
						sx={{ 
							color: themeColors.text.secondary,
							textAlign: 'center'
						}}
					>
						{t('subjectAssignments.messages.loading')}
					</Typography>
				</Box>
			</CustomOutletBox>
		);
	}

	if (error) {
		return (
			<CustomOutletBox>	
				<Box p={3}>
					<Alert 
						severity="error"
						sx={{
							background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
							border: `1px solid ${themeColors.error}20`,
							borderRadius: 2
						}}
					>
						{t('subjectAssignments.messages.loadFailed')}
					</Alert>
				</Box>
			</CustomOutletBox>
		);
	}

	const assignments = data?.data || [];

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>

				<div>
					{/* Breadcrumbs */}
					<div>
						<Breadcrumbs 
							sx={{ 
								mb: 3,
								p: 2,
								background: themeColors.background.secondary,
								borderRadius: 2,
								border: `1px solid ${themeColors.border.primary}`
							}}
						>
							<Link
								component="button"
								variant="body1"
								onClick={handleBack}
								sx={{ 
									display: 'flex', 
									alignItems: 'center',
									color: themeColors.primary,
									textDecoration: 'none',
									'&:hover': {
										color: themeColors.accent,
										textDecoration: 'underline'
									}
								}}
							>
								<ArrowBackIcon sx={{ mr: 1 }} />
								{t('subjectAssignments.breadcrumbs.backToDashboard')}
							</Link>
							<Typography 
								sx={{ color: themeColors.text.primary }}
							>
								{t('subjectAssignments.title')}
							</Typography>
						</Breadcrumbs>
					</div>

					{/* Header */}
					<div>
						<Box 
							display="flex" 
							alignItems="center" 
							mb={4}
							sx={{
								background: themeColors.background.secondary,
								p: 3,
								borderRadius: 3,
								border: `1px solid ${themeColors.border.primary}`
							}}
						>
							<Avatar 
								sx={{ 
									mr: 2,
									bgcolor: `${themeColors.primary}20`,
									color: themeColors.primary,
									width: 56,
									height: 56
								}}
							>
								<School />
							</Avatar>
							<Box>
								<Typography 
									variant="h4" 
									sx={{ 
										fontWeight: 700,
										color: themeColors.text.primary,
										mb: 0.5
									}}
								>
									{t('subjectAssignments.title')}
								</Typography>
								<Typography 
									variant="body1"
									sx={{ color: themeColors.text.secondary }}
								>
									{t('subjectAssignments.subtitle')}
								</Typography>
							</Box>
						</Box>
					</div>

					{assignments.length === 0 ? (
						<div>
							<Card 
								sx={{ 
									background: themeColors.background.primary,
									border: `1px solid ${themeColors.border.primary}`,
									boxShadow: `0 4px 20px ${themeColors.primary}10`
								}}
							>
								<CardContent sx={{ p: 4, textAlign: 'center' }}>
									<Avatar 
										sx={{ 
											width: 80, 
											height: 80, 
											mx: 'auto',
											mb: 2,
											bgcolor: `${themeColors.primary}20`,
											color: themeColors.primary
										}}
									>
										<AssignmentIcon sx={{ fontSize: 40 }} />
									</Avatar>
									<Typography 
										variant="h6" 
										sx={{ 
											color: themeColors.text.secondary,
											mb: 1
										}}
									>
										{t('subjectAssignments.messages.noAssignmentsAvailable')}
									</Typography>
									<Typography 
										variant="body2"
										sx={{ color: themeColors.text.secondary }}
									>
										{t('subjectAssignments.messages.checkBackLater')}
									</Typography>
																</CardContent>
							</Card>
						</div>
					) : (
						<div>
							<Grid container spacing={3}>
								{assignments.map((assignment) => (
									<Grid item xs={12} md={6} lg={4} key={assignment._id}>
										<div>
										<Card 
											sx={{ 
												background: themeColors.background.primary,
												border: `1px solid ${themeColors.border.primary}`,
												boxShadow: `0 2px 8px ${themeColors.primary}10`,
												transition: 'all 0.3s ease',
												'&:hover': {
													transform: 'translateY(-2px)',
													boxShadow: `0 4px 15px ${themeColors.primary}20`
												}
											}}
										>
											<CardContent sx={{ p: 2 }}>
												<Box display="flex" alignItems="center" mb={2}>
													<Avatar 
														sx={{ 
															mr: 2,
															bgcolor: `${themeColors.primary}20`,
															color: themeColors.primary,
															width: 40,
															height: 40
														}}
													>
														<AssignmentIcon />
													</Avatar>
													<Box flex={1}>
														<Typography 
															variant="h6" 
															sx={{ 
																fontWeight: 600,
																color: themeColors.text.primary,
																mb: 0.5,
																fontSize: '1rem'
															}}
														>
															{assignment?.publishId?.assignment?.assignmentName || assignment?.assignmentName || t('subjectAssignments.fallback.assignmentNameNotAvailable')}
														</Typography>
														<Chip
															icon={getStatusIcon(assignment)}
															label={getStatusText(assignment)}
															sx={{
																bgcolor: `${getStatusColor(assignment)}20`,
																color: getStatusColor(assignment),
																fontWeight: 600,
																height: 24,
																fontSize: '0.75rem'
															}}
															size="small"
														/>
													</Box>
												</Box>

												<Box mb={2}>
													<Grid container spacing={1}>
														<Grid item xs={6}>
															<Box display="flex" alignItems="center">
																<Timer sx={{ 
																	color: themeColors.primary, 
																	mr: 1,
																	fontSize: 16
																}} />
																<Typography 
																	variant="body2"
																	sx={{ 
																		color: themeColors.text.secondary,
																		fontSize: '0.75rem'
																	}}
																>
																	{t('subjectAssignments.labels.due')}: {assignment?.publishId?.endDate ? new Date(assignment.publishId.endDate).toLocaleDateString() : t('subjectAssignments.fallback.na')}
																</Typography>
															</Box>
														</Grid>
														{assignment?.attendedDate && (
															<Grid item xs={6}>
																<Box display="flex" alignItems="center">
																	<CheckCircleIcon sx={{ 
																		color: themeColors.success, 
																		mr: 1,
																		fontSize: 16
																	}} />
																	<Typography 
																		variant="body2"
																		sx={{ 
																			color: themeColors.success,
																			fontSize: '0.75rem'
																		}}
																	>
																		{t('subjectAssignments.status.submitted')}
																	</Typography>
																</Box>
															</Grid>
														)}
													</Grid>
												</Box>

												<Box display="flex" gap={2}>
													<Tooltip title={t('subjectAssignments.actions.viewAssignmentDetails')}>
														<IconButton
															sx={{
																bgcolor: `${themeColors.primary}20`,
																color: themeColors.primary,
																'&:hover': {
																	bgcolor: `${themeColors.primary}30`
																}
															}}
															onClick={() => handleViewAssignment(assignment?.publishId?.assignment?._id || assignment?._id)}
														>
															<VisibilityIcon />
														</IconButton>
													</Tooltip>

													{!assignment?.attendedStatus && assignment?.publishId?.endDate && new Date(assignment.publishId.endDate) > new Date() && (
														<Button
															variant="contained"
															startIcon={<EditIcon />}
															onClick={() => handleSubmitAssignment(assignment?.publishId?.assignment?._id || assignment?._id)}
															sx={{ 
																flexGrow: 1,
																background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
																color: '#fff',
																fontWeight: 600,
																py: 1.5,
																borderRadius: 2,
																textTransform: 'none',
																fontSize: '1rem',
																'&:hover': {
																	background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.primary})`,
																	transform: 'translateY(-2px)',
																	boxShadow: `0 4px 15px ${themeColors.primary}30`
																}
															}}
														>
															{t('subjectAssignments.actions.submitAssignment')}
														</Button>
													)}

													{assignment?.attendedStatus && (
														<Button
															variant="outlined"
															startIcon={<CheckCircleIcon />}
															sx={{ 
																flexGrow: 1,
																borderColor: themeColors.success,
																color: themeColors.success,
																fontWeight: 600,
																py: 1.5,
																borderRadius: 2,
																textTransform: 'none',
																fontSize: '1rem',
																'&:hover': {
																	borderColor: themeColors.success,
																	background: `${themeColors.success}10`
																},
																'&.Mui-disabled': {
																	borderColor: `${themeColors.success}40`,
																	color: `${themeColors.success}60`,
																	background: `${themeColors.success}05`
																}
															}}
															disabled
														>
															{t('subjectAssignments.status.submitted')}
														</Button>
													)}
												</Box>
											</CardContent>
										</Card>
									</div>
								</Grid>
							))}
						</Grid>
						</div>
					)}
				</div>
			</Box>
		</CustomOutletBox>
	);
};

export default SubjectAssignments; 