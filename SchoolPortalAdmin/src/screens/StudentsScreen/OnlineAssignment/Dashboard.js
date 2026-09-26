import React from 'react';
import { useNavigate } from 'react-router-dom';
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
	Avatar,
	Paper,
	Divider,
	LinearProgress
} from '@mui/material';
import {
	Assignment as AssignmentIcon,
	CheckCircle as CheckCircleIcon,
	Schedule as ScheduleIcon,
	Warning as WarningIcon,
	School,
	TrendingUp,
	EmojiEvents,
	BarChart as BarChartIcon,
	ShowChart as ShowChartIcon,
	PieChart as PieChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useGetStudentAssignmentsSummaryQuery } from '../../../Redux/features/studentAssignmentSlice';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	PointElement,
	LineElement,
	Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	PointElement,
	LineElement,
	Filler
);

const Dashboard = () => {
	const navigate = useNavigate();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { data, isLoading, error } = useGetStudentAssignmentsSummaryQuery();

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.1
			}
		}
	};

	const itemVariants = {
		hidden: { y: 10, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: {
				duration: 0.3,
				ease: "easeOut"
			}
		}
	};

	const handleViewAssignments = (subjectId) => {
		navigate(`/students/online-assignment/subject/${subjectId}`);
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
							{t('onlineAssignmentDashboard.messages.loading')}
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
							{t('onlineAssignmentDashboard.messages.loadFailed')}
						</Alert>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	const subjects = data?.subjects || [];

	// Prepare chart data for assignment analytics
	const assignmentStatusData = {
		labels: subjects.map(subject => subject.subjectName),
		datasets: [
			{
				label: t('onlineAssignmentDashboard.chartLabels.newAssignments'),
				data: subjects.map(subject => subject.newAssignments),
				backgroundColor: 'rgba(33, 150, 243, 0.8)',
				borderColor: 'rgba(33, 150, 243, 1)',
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			},
			{
				label: t('onlineAssignmentDashboard.chartLabels.pendingAssignments'),
				data: subjects.map(subject => subject.pendingAssignments),
				backgroundColor: 'rgba(255, 193, 7, 0.8)',
				borderColor: 'rgba(255, 193, 7, 1)',
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			},
			{
				label: t('onlineAssignmentDashboard.chartLabels.completedAssignments'),
				data: subjects.map(subject => subject.completedAssignments),
				backgroundColor: 'rgba(76, 175, 80, 0.8)',
				borderColor: 'rgba(76, 175, 80, 1)',
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			},
			{
				label: t('onlineAssignmentDashboard.chartLabels.expiredAssignments'),
				data: subjects.map(subject => subject.expiredAssignments),
				backgroundColor: 'rgba(244, 67, 54, 0.8)',
				borderColor: 'rgba(244, 67, 54, 1)',
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			}
		]
	};

	const totalAssignmentsData = {
		labels: subjects.map(subject => subject.subjectName),
		datasets: [
			{
				label: t('onlineAssignmentDashboard.chartLabels.totalAssignments'),
				data: subjects.map(subject => 
					subject.newAssignments + 
					subject.pendingAssignments + 
					subject.completedAssignments + 
					subject.expiredAssignments
				),
				backgroundColor: 'rgba(156, 39, 176, 0.8)',
				borderColor: 'rgba(156, 39, 176, 1)',
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			}
		]
	};

	const completionRateData = {
		labels: subjects.map(subject => subject.subjectName),
		datasets: [
			{
				label: t('onlineAssignmentDashboard.chartLabels.completionRatePercent'),
				data: subjects.map(subject => {
					const total = subject.newAssignments + subject.pendingAssignments + subject.completedAssignments + subject.expiredAssignments;
					return total > 0 ? Math.round((subject.completedAssignments / total) * 100) : 0;
				}),
				borderColor: 'rgba(33, 150, 243, 1)',
				backgroundColor: 'rgba(33, 150, 243, 0.1)',
				borderWidth: 3,
				fill: true,
				tension: 0.4,
				pointBackgroundColor: subjects.map(subject => {
					const total = subject.newAssignments + subject.pendingAssignments + subject.completedAssignments + subject.expiredAssignments;
					const rate = total > 0 ? (subject.completedAssignments / total) * 100 : 0;
					if (rate >= 80) return 'rgba(76, 175, 80, 1)';
					if (rate >= 60) return 'rgba(255, 193, 7, 1)';
					if (rate >= 40) return 'rgba(255, 152, 0, 1)';
					return 'rgba(244, 67, 54, 1)';
				}),
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
				pointRadius: 6,
				pointHoverRadius: 8,
			}
		]
	};

	const overallStatsData = {
		labels: [
			t('onlineAssignmentDashboard.status.new'),
			t('onlineAssignmentDashboard.status.pending'),
			t('onlineAssignmentDashboard.status.completed'),
			t('onlineAssignmentDashboard.status.expired')
		],
		datasets: [
			{
				data: [
					subjects.reduce((sum, subject) => sum + subject.newAssignments, 0),
					subjects.reduce((sum, subject) => sum + subject.pendingAssignments, 0),
					subjects.reduce((sum, subject) => sum + subject.completedAssignments, 0),
					subjects.reduce((sum, subject) => sum + subject.expiredAssignments, 0),
				],
				backgroundColor: [
					'rgba(33, 150, 243, 0.8)',
					'rgba(255, 193, 7, 0.8)',
					'rgba(76, 175, 80, 0.8)',
					'rgba(244, 67, 54, 0.8)',
				],
				borderColor: [
					'rgba(33, 150, 243, 1)',
					'rgba(255, 193, 7, 1)',
					'rgba(76, 175, 80, 1)',
					'rgba(244, 67, 54, 1)',
				],
				borderWidth: 2,
			}
		]
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top',
				labels: {
					color: themeColors.text.primary,
					font: {
						size: 12,
						weight: '600'
					}
				}
			},
			tooltip: {
				backgroundColor: themeColors.background.primary,
				titleColor: themeColors.text.primary,
				bodyColor: themeColors.text.secondary,
				borderColor: themeColors.border.primary,
				borderWidth: 1,
				cornerRadius: 8,
				displayColors: true,
				padding: 12,
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					color: themeColors.text.secondary,
					font: {
						size: 12
					}
				},
				grid: {
					color: themeColors.border.primary,
					drawBorder: false,
				},
				border: {
					color: themeColors.border.primary,
				}
			},
			x: {
				ticks: {
					color: themeColors.text.secondary,
					font: {
						size: 11
					},
					maxRotation: 45,
					minRotation: 0
				},
				grid: {
					color: themeColors.border.primary,
					drawBorder: false,
				},
				border: {
					color: themeColors.border.primary,
				}
			}
		}
	};

	const doughnutOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'bottom',
				labels: {
					color: themeColors.text.primary,
					font: {
						size: 11,
						weight: '500'
					},
					padding: 15,
					usePointStyle: true,
					pointStyle: 'circle'
				}
			},
			tooltip: {
				backgroundColor: themeColors.background.primary,
				titleColor: themeColors.text.primary,
				bodyColor: themeColors.text.secondary,
				borderColor: themeColors.border.primary,
				borderWidth: 1,
				cornerRadius: 8,
				padding: 12,
			}
		}
	};

	const completionRateOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top',
				labels: {
					color: themeColors.text.primary,
					font: {
						size: 12,
						weight: '600'
					}
				}
			},
			tooltip: {
				backgroundColor: themeColors.background.primary,
				titleColor: themeColors.text.primary,
				bodyColor: themeColors.text.secondary,
				borderColor: themeColors.border.primary,
				borderWidth: 1,
				cornerRadius: 8,
				displayColors: true,
				padding: 12,
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				max: 100,
				ticks: {
					color: themeColors.text.secondary,
					font: {
						size: 12
					}
				},
				grid: {
					color: themeColors.border.primary,
					drawBorder: false,
				},
				border: {
					color: themeColors.border.primary,
				}
			},
			x: {
				ticks: {
					color: themeColors.text.secondary,
					font: {
						size: 11
					},
					maxRotation: 45,
					minRotation: 0
				},
				grid: {
					color: themeColors.border.primary,
					drawBorder: false,
				},
				border: {
					color: themeColors.border.primary,
				}
			}
		}
	};

	return (
		// <CustomOutletBox>
			<Box>
				<motion.div
					variants={containerVariants}
					initial="visible"
					animate="visible"
					style={{ opacity: 1 }}
				>
					{/* Header */}
					<motion.div 
						variants={itemVariants}
						initial="visible"
						animate="visible"
						style={{ opacity: 1, transform: 'translateY(0)' }}
					>
						<Box 
							display="flex" 
							alignItems="center" 
							mb={4}
							sx={{
								background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
								// p: 3,
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
									{t('onlineAssignmentDashboard.title')}
								</Typography>
								<Typography 
									variant="body1"
									sx={{ color: themeColors.text.secondary }}
								>
									{t('onlineAssignmentDashboard.subtitle')}
								</Typography>
							</Box>
						</Box>
					</motion.div>

					{/* Assignment Analytics Charts */}
					{subjects.length > 0 && (
						<motion.div
							variants={itemVariants}
							initial="visible"
							animate="visible"
							style={{ opacity: 1, transform: 'translateY(0)' }}
						>
							<Box mb={4}>
								<Typography
									variant="h5"
									sx={{
										fontWeight: 700,
										color: themeColors.text.primary,
										mb: 3,
										display: 'flex',
										alignItems: 'center',
										gap: 1
									}}
								>
									<BarChartIcon sx={{ color: themeColors.primary }} />
									{t('onlineAssignmentDashboard.sections.assignmentAnalytics')}
								</Typography>
								
								<Grid container spacing={3}>
									{/* Bar Chart - Assignment Status by Subject */}
									<Grid item xs={12} lg={8}>
										<Card
											sx={{
												background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
												border: `1px solid ${themeColors.border.primary}`,
												boxShadow: `0 4px 20px ${themeColors.primary}10`,
												height: '100%'
											}}
										>
											<CardContent sx={{ p: 3 }}>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
														color: themeColors.text.primary,
														mb: 2,
														display: 'flex',
														alignItems: 'center',
														gap: 1
													}}
												>
													<ShowChartIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
													{t('onlineAssignmentDashboard.charts.assignmentStatusBySubject')}
												</Typography>
												<Box sx={{ height: 400, position: 'relative' }}>
													<Bar data={assignmentStatusData} options={chartOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>

									{/* Doughnut Chart - Overall Assignment Distribution */}
									<Grid item xs={12} lg={4}>
										<Card
											sx={{
												background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
												border: `1px solid ${themeColors.border.primary}`,
												boxShadow: `0 4px 20px ${themeColors.primary}10`,
												height: '100%'
											}}
										>
											<CardContent sx={{ p: 3 }}>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
														color: themeColors.text.primary,
														mb: 2,
														display: 'flex',
														alignItems: 'center',
														gap: 1
													}}
												>
													<PieChartIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
													{t('onlineAssignmentDashboard.charts.overallAssignmentDistribution')}
												</Typography>
												<Box sx={{ height: 400, position: 'relative' }}>
													<Doughnut data={overallStatsData} options={doughnutOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>

									{/* Line Chart - Completion Rate Trend */}
									<Grid item xs={12} lg={6}>
										<Card
											sx={{
												background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
												border: `1px solid ${themeColors.border.primary}`,
												boxShadow: `0 4px 20px ${themeColors.primary}10`,
												height: '100%'
											}}
										>
											<CardContent sx={{ p: 3 }}>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
														color: themeColors.text.primary,
														mb: 2,
														display: 'flex',
														alignItems: 'center',
														gap: 1
													}}
												>
													<ShowChartIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
													{t('onlineAssignmentDashboard.charts.completionRateBySubject')}
												</Typography>
												<Box sx={{ height: 350, position: 'relative' }}>
													<Line data={completionRateData} options={completionRateOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>

									{/* Bar Chart - Total Assignments per Subject */}
									<Grid item xs={12} lg={6}>
										<Card
											sx={{
												background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
												border: `1px solid ${themeColors.border.primary}`,
												boxShadow: `0 4px 20px ${themeColors.primary}10`,
												height: '100%'
											}}
										>
											<CardContent sx={{ p: 3 }}>
												<Typography
													variant="h6"
													sx={{
														fontWeight: 600,
														color: themeColors.text.primary,
														mb: 2,
														display: 'flex',
														alignItems: 'center',
														gap: 1
													}}
												>
													<AssignmentIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
													{t('onlineAssignmentDashboard.charts.totalAssignmentsPerSubject')}
												</Typography>
												<Box sx={{ height: 350, position: 'relative' }}>
													<Bar data={totalAssignmentsData} options={chartOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>
								</Grid>
							</Box>
						</motion.div>
					)}

					{subjects.length === 0 ? (
						<motion.div 
							variants={itemVariants}
							initial="visible"
							animate="visible"
							style={{ opacity: 1, transform: 'translateY(0)' }}
						>
							<Card 
								sx={{ 
									background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
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
										{t('onlineAssignmentDashboard.messages.noAssignmentsAvailable')}
									</Typography>
									<Typography 
										variant="body2"
										sx={{ color: themeColors.text.secondary }}
									>
										{t('onlineAssignmentDashboard.messages.checkBackLater')}
									</Typography>
								</CardContent>
							</Card>
						</motion.div>
					) : (
						<Grid container spacing={3}>
							{subjects.map((subject, index) => (
								<Grid item xs={12} md={6} lg={4} key={subject.subjectId}>
									<motion.div 
										variants={itemVariants}
										initial="visible"
										animate="visible"
										style={{ opacity: 1, transform: 'translateY(0)' }}
									>
										<Card 
											sx={{ 
												height: '100%', 
												display: 'flex', 
												flexDirection: 'column',
												background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
												border: `1px solid ${themeColors.border.primary}`,
												boxShadow: `0 4px 20px ${themeColors.primary}10`,
												transition: 'all 0.3s ease',
												'&:hover': {
													transform: 'translateY(-4px)',
													boxShadow: `0 8px 30px ${themeColors.primary}20`
												}
											}}
										>
											<CardContent sx={{ flexGrow: 1, p: 3 }}>
												<Box display="flex" alignItems="center" mb={3}>
													<Avatar 
														sx={{ 
															mr: 2,
															bgcolor: `${themeColors.primary}20`,
															color: themeColors.primary,
															width: 48,
															height: 48
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
																mb: 0.5
															}}
														>
															{subject.subjectName}
														</Typography>
														<Chip
															label={subject.status}
															size="small"
															sx={{
																bgcolor: subject.status === 'active' ? `${themeColors.success}20` : `${themeColors.warning}20`,
																color: subject.status === 'active' ? themeColors.success : themeColors.warning,
																fontWeight: 600
															}}
														/>
													</Box>
												</Box>

												<Divider sx={{ mb: 3, borderColor: themeColors.border.primary }} />

												<Box mb={3}>
													<Grid container spacing={2}>
														<Grid item xs={6}>
															<Paper 
																sx={{ 
																	p: 2, 
																	textAlign: 'center',
																	background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
																	border: `1px solid ${themeColors.primary}20`
																}}
															>
																<AssignmentIcon sx={{ 
																	color: themeColors.primary, 
																	fontSize: 24,
																	mb: 1
																}} />
																<Typography 
																	variant="h6" 
																	sx={{ 
																		fontWeight: 700,
																		color: themeColors.primary
																	}}
																>
																	{subject.newAssignments}
																</Typography>
																<Typography 
																	variant="body2"
																	sx={{ color: themeColors.text.secondary }}
																>
																	{t('onlineAssignmentDashboard.status.new')}
																</Typography>
															</Paper>
														</Grid>
														<Grid item xs={6}>
															<Paper 
																sx={{ 
																	p: 2, 
																	textAlign: 'center',
																	background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
																	border: `1px solid ${themeColors.warning}20`
																}}
															>
																<ScheduleIcon sx={{ 
																	color: themeColors.warning, 
																	fontSize: 24,
																	mb: 1
																}} />
																<Typography 
																	variant="h6" 
																	sx={{ 
																		fontWeight: 700,
																		color: themeColors.warning
																	}}
																>
																	{subject.pendingAssignments}
																</Typography>
																<Typography 
																	variant="body2"
																	sx={{ color: themeColors.text.secondary }}
																>
																	{t('onlineAssignmentDashboard.status.pending')}
																</Typography>
															</Paper>
														</Grid>
														<Grid item xs={6}>
															<Paper 
																sx={{ 
																	p: 2, 
																	textAlign: 'center',
																	background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
																	border: `1px solid ${themeColors.success}20`
																}}
															>
																<CheckCircleIcon sx={{ 
																	color: themeColors.success, 
																	fontSize: 24,
																	mb: 1
																}} />
																<Typography 
																	variant="h6" 
																	sx={{ 
																		fontWeight: 700,
																		color: themeColors.success
																	}}
																>
																	{subject.completedAssignments}
																</Typography>
																<Typography 
																	variant="body2"
																	sx={{ color: themeColors.text.secondary }}
																>
																	{t('onlineAssignmentDashboard.status.completed')}
																</Typography>
															</Paper>
														</Grid>
														<Grid item xs={6}>
															<Paper 
																sx={{ 
																	p: 2, 
																	textAlign: 'center',
																	background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
																	border: `1px solid ${themeColors.error}20`
																}}
															>
																<WarningIcon sx={{ 
																	color: themeColors.error, 
																	fontSize: 24,
																	mb: 1
																}} />
																<Typography 
																	variant="h6" 
																	sx={{ 
																		fontWeight: 700,
																		color: themeColors.error
																	}}
																>
																	{subject.expiredAssignments}
																</Typography>
																<Typography 
																	variant="body2"
																	sx={{ color: themeColors.text.secondary }}
																>
																	{t('onlineAssignmentDashboard.status.expired')}
																</Typography>
															</Paper>
														</Grid>
													</Grid>
												</Box>

												<Button
													variant="contained"
													fullWidth
													onClick={() => handleViewAssignments(subject.subjectId)}
													sx={{
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
													{t('onlineAssignmentDashboard.actions.viewAssignments')}
												</Button>
											</CardContent>
										</Card>
									</motion.div>
								</Grid>
							))}
						</Grid>
					)}
				</motion.div>
			</Box>
		// </CustomOutletBox>
	);
};

export default Dashboard; 