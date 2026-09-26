import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Chip,
	CircularProgress,
	Alert,
	IconButton,
	Divider,
	Paper,
	Grid,
	Avatar,
	Breadcrumbs,
	Link
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Assignment as AssignmentIcon,
	CheckCircle as CheckCircleIcon,
	Schedule as ScheduleIcon,
	Warning as WarningIcon,
	Edit as EditIcon,
	Download as DownloadIcon,
	School,
	Timer,
	CalendarToday,
	Person,
	Grade,
	Book
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useGetStudentAssignmentDetailsQuery } from '../../../Redux/features/studentAssignmentSlice';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { BASE_PATH } from '../../../config';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';

const ViewAssignment = () => {
	const { assignmentId } = useParams();
	const navigate = useNavigate();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { data, isLoading, error } = useGetStudentAssignmentDetailsQuery(assignmentId);

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
		navigate(-1);
	};

	const handleSubmitAssignment = () => {
		navigate(`/students/online-assignment/submit/${assignmentId}`);
	};

	const handleDownloadFile = (filePath) => {
		if (filePath) {
			const link = document.createElement('a');
			link.href = `${BASE_PATH}/${filePath}`;
			link.download = filePath.split('/').pop();
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	const getStatusColor = (assignmentDetails, studentAttempt) => {
		const currentDate = new Date();
		const endDate = new Date(assignmentDetails.publishedEndDate);

		if (studentAttempt?.attendedStatus) {
			return themeColors.success;
		} else if (endDate < currentDate) {
			return themeColors.error;
		} else {
			return themeColors.warning;
		}
	};

	const getStatusText = (assignmentDetails, studentAttempt) => {
		const currentDate = new Date();
		const endDate = new Date(assignmentDetails.publishedEndDate);

		if (studentAttempt?.attendedStatus) {
			return t('viewAssignment.status.completed');
		} else if (endDate < currentDate) {
			return t('viewAssignment.status.expired');
		} else {
			return t('viewAssignment.status.pending');
		}
	};

	const getStatusIcon = (assignmentDetails, studentAttempt) => {
		const currentDate = new Date();
		const endDate = new Date(assignmentDetails.publishedEndDate);

		if (studentAttempt?.attendedStatus) {
			return <CheckCircleIcon />;
		} else if (endDate < currentDate) {
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
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						<CircularProgress 
							size={60}
							sx={{ 
								color: themeColors.primary,
								mb: 2
							}} 
						/>
					</motion.div>
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<Typography 
							variant="h6" 
							sx={{ 
								color: themeColors.text.secondary,
								textAlign: 'center'
							}}
						>
							{t('viewAssignment.messages.loading')}
						</Typography>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	if (error) {
		return (
			<CustomOutletBox>
				<Box p={3}>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<Alert 
							severity="error"
							sx={{
								background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
								border: `1px solid ${themeColors.error}20`,
								borderRadius: 2
							}}
						>
							{t('viewAssignment.messages.loadFailed')}
						</Alert>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	const { assignmentDetails, studentAttempt } = data?.data || {};

	if (!assignmentDetails) {
		return (
			<CustomOutletBox>
				<Box p={3}>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<Alert 
							severity="error"
							sx={{
								background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
								border: `1px solid ${themeColors.error}20`,
								borderRadius: 2
							}}
						>
							{t('viewAssignment.messages.assignmentNotFound')}
						</Alert>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	const currentDate = new Date();
	const endDate = new Date(assignmentDetails.publishedEndDate);
	const canSubmit = !studentAttempt?.attendedStatus && endDate > currentDate;

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
				
				<div>
					{/* Breadcrumbs */}
					<motion.div>
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
								{t('viewAssignment.actions.backToDashboard')}
							</Link>
							<Typography 
								color="text.primary"
								sx={{ color: themeColors.text.primary }}
							>
								{t('viewAssignment.title')}
							</Typography>
						</Breadcrumbs>
					</motion.div>

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
							<Box flex={1}>
								<Typography 
									variant="h4" 
									sx={{ 
										fontWeight: 700,
										color: themeColors.text.primary,
										mb: 0.5
									}}
								>
									{assignmentDetails.name}
								</Typography>
								<Typography 
									variant="body1"
									sx={{ color: themeColors.text.secondary }}
								>
									{t('viewAssignment.subtitle')}
								</Typography>
							</Box>
							<Chip
								icon={getStatusIcon(assignmentDetails, studentAttempt)}
								label={getStatusText(assignmentDetails, studentAttempt)}
								sx={{
									bgcolor: `${getStatusColor(assignmentDetails, studentAttempt)}20`,
									color: getStatusColor(assignmentDetails, studentAttempt),
									fontWeight: 600,
									fontSize: '1rem',
									py: 1
								}}
							/>
						</Box>
					</div>

					<div>
						<Grid container spacing={3}>
							<Grid item xs={12} md={8}>
								<motion.div>
								<Card 
									sx={{ 
										background: themeColors.background.primary,
										border: `1px solid ${themeColors.border.primary}`,
										boxShadow: `0 4px 20px ${themeColors.primary}10`
									}}
								>
									<CardContent sx={{ p: 4 }}>
										<Box mb={4}>
											<Typography 
												variant="h6" 
												sx={{ 
													mb: 3,
													fontWeight: 600,
													color: themeColors.text.primary
												}}
											>
												{t('viewAssignment.sections.assignmentInformation')}
											</Typography>
											<Grid container spacing={3}>
												<Grid item xs={12} sm={6}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
															border: `1px solid ${themeColors.primary}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<Book sx={{ 
																color: themeColors.primary, 
																mr: 1,
																fontSize: 20
															}} />
															<Typography 
																variant="body2"
																sx={{ 
																	color: themeColors.text.secondary,
																	fontWeight: 600
																}}
															>
																{t('viewAssignment.labels.subject')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{assignmentDetails.subject}
														</Typography>
													</Paper>
												</Grid>
												<Grid item xs={12} sm={6}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.accent}10, ${themeColors.accent}05)`,
															border: `1px solid ${themeColors.accent}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<Grade sx={{ 
																color: themeColors.accent, 
																mr: 1,
																fontSize: 20
															}} />
															<Typography 
																variant="body2"
																sx={{ 
																	color: themeColors.text.secondary,
																	fontWeight: 600
																}}
															>
																{t('viewAssignment.labels.grade')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{assignmentDetails.grade}
														</Typography>
													</Paper>
												</Grid>
												<Grid item xs={12} sm={6}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
															border: `1px solid ${themeColors.success}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<CalendarToday sx={{ 
																color: themeColors.success, 
																mr: 1,
																fontSize: 20
															}} />
															<Typography 
																variant="body2"
																sx={{ 
																	color: themeColors.text.secondary,
																	fontWeight: 600
																}}
															>
																{t('viewAssignment.labels.startDate')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{new Date(assignmentDetails.publishedStartDate).toLocaleDateString()}
														</Typography>
													</Paper>
												</Grid>
												<Grid item xs={12} sm={6}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
															border: `1px solid ${themeColors.warning}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<Timer sx={{ 
																color: themeColors.warning, 
																mr: 1,
																fontSize: 20
															}} />
															<Typography 
																variant="body2"
																sx={{ 
																	color: themeColors.text.secondary,
																	fontWeight: 600
																}}
															>
																{t('viewAssignment.labels.dueDate')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{new Date(assignmentDetails.publishedEndDate).toLocaleDateString()}
														</Typography>
													</Paper>
												</Grid>
												<Grid item xs={12} sm={6}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.info || '#2196f3'}10, ${themeColors.info || '#2196f3'}05)`,
															border: `1px solid ${themeColors.info || '#2196f3'}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<Person sx={{ 
																color: themeColors.info || '#2196f3', 
																mr: 1,
																fontSize: 20
															}} />
															<Typography 
																variant="body2"
																sx={{ 
																	color: themeColors.text.secondary,
																	fontWeight: 600
																}}
															>
																{t('viewAssignment.labels.createdBy')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{assignmentDetails.createdBy}
														</Typography>
													</Paper>
												</Grid>
												<Grid item xs={12} sm={6}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
															border: `1px solid ${themeColors.primary}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<AssignmentIcon sx={{ 
																color: themeColors.primary, 
																mr: 1,
																fontSize: 20
															}} />
															<Typography 
																variant="body2"
																sx={{ 
																	color: themeColors.text.secondary,
																	fontWeight: 600
																}}
															>
																{t('viewAssignment.labels.status')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{assignmentDetails.status}
														</Typography>
													</Paper>
												</Grid>
											</Grid>
										</Box>

										<Divider sx={{ my: 4, borderColor: themeColors.border.primary }} />

										<Box mb={4}>
											<Typography 
												variant="h6" 
												sx={{ 
													mb: 3,
													fontWeight: 600,
													color: themeColors.text.primary
												}}
											>
												{t('viewAssignment.sections.question')}
											</Typography>
											<Paper 
												sx={{ 
													p: 3, 
													background: `linear-gradient(135deg, ${themeColors.background.secondary}, ${themeColors.background.primary})`,
													border: `1px solid ${themeColors.border.primary}`,
													borderRadius: 2
												}}
											>
												<Typography 
													variant="body1" 
													sx={{ 
														whiteSpace: 'pre-wrap',
														color: themeColors.text.primary,
														lineHeight: 1.6
													}}
												>
													{assignmentDetails.question}
												</Typography>
											</Paper>
										</Box>

										{assignmentDetails.questionFile && (
											<Box mb={4}>
												<Typography 
													variant="h6" 
													sx={{ 
														mb: 3,
														fontWeight: 600,
														color: themeColors.text.primary
													}}
												>
													{t('viewAssignment.sections.questionFile')}
												</Typography>
												<Button
													variant="outlined"
													startIcon={<DownloadIcon />}
													onClick={() => handleDownloadFile(assignmentDetails.questionFile)}
													sx={{
														borderColor: themeColors.primary,
														color: themeColors.primary,
														fontWeight: 600,
														py: 1.5,
														px: 3,
														borderRadius: 2,
														textTransform: 'none',
														fontSize: '1rem',
														'&:hover': {
															borderColor: themeColors.accent,
															color: themeColors.accent,
															background: `${themeColors.accent}05`
														}
													}}
												>
													{t('viewAssignment.actions.downloadQuestionFile')}
												</Button>
											</Box>
										)}

										{studentAttempt && (
											<>
												<Divider sx={{ my: 4, borderColor: themeColors.border.primary }} />
												<Box mb={4}>
													<Typography 
														variant="h6" 
														sx={{ 
															mb: 3,
															fontWeight: 600,
															color: themeColors.text.primary
														}}
													>
														{t('viewAssignment.sections.yourSubmission')}
													</Typography>
													<Grid container spacing={3}>
														<Grid item xs={12} sm={6}>
															<Paper 
																sx={{ 
																	p: 2,
																	background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
																	border: `1px solid ${themeColors.success}20`
																}}
															>
																<Box display="flex" alignItems="center" mb={1}>
																	<CheckCircleIcon sx={{ 
																		color: themeColors.success, 
																		mr: 1,
																		fontSize: 20
																	}} />
																	<Typography 
																		variant="body2"
																		sx={{ 
																			color: themeColors.text.secondary,
																			fontWeight: 600
																		}}
																	>
																		{t('viewAssignment.labels.submittedDate')}:
																	</Typography>
																</Box>
																<Typography 
																	variant="body1"
																	sx={{ 
																		color: themeColors.text.primary,
																		fontWeight: 500
																	}}
																>
																	{studentAttempt.attendedDate ? new Date(studentAttempt.attendedDate).toLocaleDateString() : t('viewAssignment.labels.notSubmitted')}
																</Typography>
															</Paper>
														</Grid>
														{studentAttempt.teacherRemarks && (
															<Grid item xs={12}>
																<Typography 
																	variant="body2" 
																	sx={{ 
																		color: themeColors.text.secondary,
																		fontWeight: 600,
																		mb: 2
																	}}
																>
																	{t('viewAssignment.labels.teacherRemarks')}:
																</Typography>
																<Paper 
																	sx={{ 
																		p: 3, 
																		background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
																		border: `1px solid ${themeColors.warning}20`,
																		borderRadius: 2
																	}}
																>
																	<Typography 
																		variant="body2"
																		sx={{ 
																			color: themeColors.text.primary,
																			lineHeight: 1.6
																		}}
																	>
																		{studentAttempt.teacherRemarks}
																	</Typography>
																</Paper>
															</Grid>
														)}
													</Grid>
												</Box>
											</>
										)}

										<Box display="flex" gap={2} mt={4}>
											{canSubmit && (
												<Button
													variant="contained"
													startIcon={<EditIcon />}
													onClick={handleSubmitAssignment}
													sx={{
														background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
														color: '#fff',
														fontWeight: 600,
														py: 1.5,
														px: 3,
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
													{t('viewAssignment.actions.submitAssignment')}
												</Button>
											)}
											<Button
												variant="outlined"
												onClick={handleBack}
												sx={{
													borderColor: themeColors.border.primary,
													color: themeColors.text.primary,
													fontWeight: 600,
													py: 1.5,
													px: 3,
													borderRadius: 2,
													textTransform: 'none',
													fontSize: '1rem',
													'&:hover': {
														borderColor: themeColors.primary,
														color: themeColors.primary,
														background: `${themeColors.primary}05`
													}
												}}
											>
												{t('viewAssignment.actions.backToDashboard')}
											</Button>
										</Box>
									</CardContent>
								</Card>
							</motion.div>
						</Grid>

						<Grid item xs={12} md={4}>
							<motion.div variants={itemVariants}>
								<Card 
									sx={{ 
										background: themeColors.background.primary,
										border: `1px solid ${themeColors.border.primary}`,
										boxShadow: `0 4px 20px ${themeColors.primary}10`
									}}
								>
									<CardContent sx={{ p: 3 }}>
										<Typography 
											variant="h6" 
											sx={{ 
												mb: 3,
												fontWeight: 600,
												color: themeColors.text.primary
											}}
										>
											{t('viewAssignment.sections.submissionStatus')}
										</Typography>

										<Box mb={3}>
											<Paper 
												sx={{ 
													p: 2,
													background: `linear-gradient(135deg, ${getStatusColor(assignmentDetails, studentAttempt)}10, ${getStatusColor(assignmentDetails, studentAttempt)}05)`,
													border: `1px solid ${getStatusColor(assignmentDetails, studentAttempt)}20`
												}}
											>
												<Box display="flex" alignItems="center" mb={1}>
													{getStatusIcon(assignmentDetails, studentAttempt)}
													<Typography 
														variant="body2"
														sx={{ 
															color: themeColors.text.secondary,
															fontWeight: 600,
															ml: 1
														}}
													>
														{t('viewAssignment.labels.status')}:
													</Typography>
												</Box>
												<Typography 
													variant="body1"
													sx={{ 
														color: getStatusColor(assignmentDetails, studentAttempt),
														fontWeight: 600
													}}
												>
													{getStatusText(assignmentDetails, studentAttempt)}
												</Typography>
											</Paper>
										</Box>

										{studentAttempt?.attendedStatus && (
											<Box mb={3}>
												<Paper 
													sx={{ 
														p: 2,
														background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
														border: `1px solid ${themeColors.success}20`
													}}
												>
													<Box display="flex" alignItems="center" mb={1}>
														<CheckCircleIcon sx={{ 
															color: themeColors.success, 
															mr: 1,
															fontSize: 20
														}} />
														<Typography 
															variant="body2"
															sx={{ 
																color: themeColors.text.secondary,
																fontWeight: 600
															}}
														>
															{t('viewAssignment.labels.submitted')}:
														</Typography>
													</Box>
													<Typography 
														variant="body1"
														sx={{ 
															color: themeColors.text.primary,
															fontWeight: 500
														}}
													>
														{new Date(studentAttempt.attendedDate).toLocaleDateString()}
													</Typography>
												</Paper>
											</Box>
										)}

										<Box mb={3}>
											<Paper 
												sx={{ 
													p: 2,
													background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
													border: `1px solid ${themeColors.warning}20`
												}}
											>
												<Box display="flex" alignItems="center" mb={1}>
													<Timer sx={{ 
														color: themeColors.warning, 
														mr: 1,
														fontSize: 20
													}} />
													<Typography 
														variant="body2"
														sx={{ 
															color: themeColors.text.secondary,
															fontWeight: 600
														}}
													>
														{t('viewAssignment.labels.dueDate')}:
													</Typography>
												</Box>
												<Typography 
													variant="body1"
													sx={{ 
														color: themeColors.text.primary,
														fontWeight: 500
													}}
												>
													{new Date(assignmentDetails.publishedEndDate).toLocaleDateString()}
												</Typography>
											</Paper>
										</Box>

										{!studentAttempt?.attendedStatus && endDate > currentDate && (
											<Alert 
												severity="warning"
												sx={{
													background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
													border: `1px solid ${themeColors.warning}20`,
													borderRadius: 2
												}}
											>
												{t('viewAssignment.messages.stillOpen')}
											</Alert>
										)}

										{!studentAttempt?.attendedStatus && endDate < currentDate && (
											<Alert 
												severity="error"
												sx={{
													background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
													border: `1px solid ${themeColors.error}20`,
													borderRadius: 2
												}}
											>
												{t('viewAssignment.messages.deadlinePassed')}
											</Alert>
										)}

										{studentAttempt?.attendedStatus && (
											<Alert 
												severity="success"
												sx={{
													background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
													border: `1px solid ${themeColors.success}20`,
													borderRadius: 2
												}}
											>
												{t('viewAssignment.messages.submittedSuccessfully')}
											</Alert>
										)}
									</CardContent>
								</Card>
							</motion.div>
						</Grid>
					</Grid>
					</div>
				</div>
			</Box>
		</CustomOutletBox>
	);
};

export default ViewAssignment; 