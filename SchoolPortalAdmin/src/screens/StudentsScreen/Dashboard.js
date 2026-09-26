import React, { useState, useEffect } from 'react';
import {
	Box,
	Grid,
	Card,
	CardContent,
	Typography,
	Avatar,
	LinearProgress,
	Chip,
	IconButton,
	Paper,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Badge,
	useTheme,
	useMediaQuery,
	CircularProgress,
	Alert,
	Button
} from '@mui/material';
import {
	TrendingUp,
	TrendingDown,
	School,
	Assignment,
	Quiz,
	Grade,
	CalendarToday,
	Notifications,
	Person,
	Book,
	Timeline,
	CheckCircle,
	Warning,
	Schedule,
	EmojiEvents,
	Star,
	BarChart as BarChartIcon,
	ShowChart as ShowChartIcon,
	PieChart as PieChartIcon,
	Refresh as RefreshIcon,
	DesktopMac as DesktopMacIcon,
	Article as ArticleIcon,
	LocalLibrary
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useGetStudentDashboardQuery, useGetStudentAnalyticsQuery } from '../../Redux/features/Users/studentDashboardSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
	LineChart,
	Line,
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar
} from 'recharts';

const StudentDashboard = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const [currentTime, setCurrentTime] = useState(new Date());
	const navigate = useNavigate();

	// Fetch real data from API
	const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useGetStudentDashboardQuery();
	const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useGetStudentAnalyticsQuery();

	// Extract data from API response with proper error handling
	const student = dashboardData?.data?.student;
	const overallStats = dashboardData?.data?.overallStats;
	const performanceChartData = dashboardData?.data?.performanceChartData || [];
	const attendanceChartData = dashboardData?.data?.attendanceChartData || [];
	const subjectPerformance = dashboardData?.data?.subjectPerformance || [];
	const recentAssignments = dashboardData?.data?.recentAssignments || [];
	const upcomingEvents = dashboardData?.data?.upcomingEvents || [];

	// Prepare chart data for radar chart
	const performanceData = performanceChartData.map(subject => ({
		name: subject.subject,
		value: subject.percentage,
		fullMark: 100
	}));

	// Prepare grade progress data
	const gradeData = subjectPerformance.map(subject => ({
		subject: subject.subject,
		grade: subject.percentage,
		target: 90
	}));

	const COLORS = [
		themeColors.primary,
		themeColors.accent,
		themeColors.success,
		themeColors.warning,
		themeColors.error
	];

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const getPriorityColor = (priority) => {
		switch (priority) {
			case 'high': return themeColors.error || '#f44336';
			case 'medium': return themeColors.warning || '#ff9800';
			case 'low': return themeColors.success || '#4caf50';
			default: return themeColors.primary || '#1976d2';
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'completed': return themeColors.success || '#4caf50';
			case 'pending': return themeColors.warning || '#ff9800';
			case 'in-progress': return themeColors.primary || '#1976d2';
			default: return themeColors.text?.secondary || '#666666';
		}
	};

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

	// Loading state
	if (dashboardLoading || analyticsLoading) {
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
							{t('studentDashboard.messages.loading')}
						</Typography>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	// Error state
	if (dashboardError || analyticsError) {
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
							action={
								<Button 
									color="inherit" 
									size="small" 
									onClick={() => {
										refetchDashboard();
										refetchAnalytics();
									}}
									startIcon={<RefreshIcon />}
								>
									{t('studentDashboard.actions.retry')}
								</Button>
							}
							sx={{
								background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
								border: `1px solid ${themeColors.error}20`,
								borderRadius: 2
							}}
						>
							{t('studentDashboard.messages.loadFailed')}
						</Alert>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	return (
		<CustomOutletBox>
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				{/* Header Section */}
				<motion.div variants={itemVariants}>
					<Box sx={{ mb: 4 }}>
						<Typography variant="h4" sx={{
							fontWeight: 700,
							color: themeColors.text.primary,
							mb: 1
						}}>
							{t('studentDashboard.welcome', { name: student?.name || t('studentDashboard.fallback.student') })}
						</Typography>
						<Typography variant="body1" sx={{
							color: themeColors.text.secondary,
							display: 'flex',
							alignItems: 'center',
							gap: 1
						}}>
							<CalendarToday sx={{ fontSize: 16 }} />
							{currentTime.toLocaleDateString('en-US', {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</Typography>
						{student && (
							<Typography variant="body2" sx={{
								color: themeColors.text.secondary,
								mt: 1
							}}>
								{student.grade} • {student.section} • {student.academicYear}
							</Typography>
						)}
					</Box>
				</motion.div>

				{/* Statistics Cards */}
				<motion.div variants={itemVariants}>
					<Grid container spacing={3} sx={{ mb: 4 }}>
						<Grid item xs={12} sm={6} md={3}>
							<Card sx={{
								background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.primary}05)`,
								border: `1px solid ${themeColors.primary}20`,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: `0 8px 25px ${themeColors.primary}20`,
									transition: 'all 0.3s ease'
								}
							}}>
								<CardContent>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<Box>
											<Typography variant="h4" sx={{ fontWeight: 700, color: themeColors.primary }}>
												{overallStats?.gpa || 0}
											</Typography>
											<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
												{t('studentDashboard.stats.gpa')}
											</Typography>
										</Box>
										<Avatar sx={{
											bgcolor: `${themeColors.primary}20`,
											color: themeColors.primary
										}}>
											<Grade />
										</Avatar>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
										<TrendingUp sx={{ color: themeColors.success, fontSize: 16, mr: 0.5 }} />
										<Typography variant="caption" sx={{ color: themeColors.success }}>
											{t('studentDashboard.stats.basedOnSubjects', { count: subjectPerformance.length })}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12} sm={6} md={3}>
							<Card sx={{
								background: `linear-gradient(135deg, ${themeColors.accent}15, ${themeColors.accent}05)`,
								border: `1px solid ${themeColors.accent}20`,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: `0 8px 25px ${themeColors.accent}20`,
									transition: 'all 0.3s ease'
								}
							}}>
								<CardContent>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<Box>
											<Typography variant="h4" sx={{ fontWeight: 700, color: themeColors.accent }}>
												{overallStats?.attendance || 0}%
											</Typography>
											<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
												{t('studentDashboard.stats.attendance')}
											</Typography>
										</Box>
										<Avatar sx={{
											bgcolor: `${themeColors.accent}20`,
											color: themeColors.accent
										}}>
											<School />
										</Avatar>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
										<TrendingUp sx={{ color: themeColors.success, fontSize: 16, mr: 0.5 }} />
										<Typography variant="caption" sx={{ color: themeColors.success }}>
											{t('studentDashboard.stats.lastMonthsAverage')}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12} sm={6} md={3}>
							<Card sx={{
								background: `linear-gradient(135deg, ${themeColors.success}15, ${themeColors.success}05)`,
								border: `1px solid ${themeColors.success}20`,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: `0 8px 25px ${themeColors.success}20`,
									transition: 'all 0.3s ease'
								}
							}}>
								<CardContent>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<Box>
											<Typography variant="h4" sx={{ fontWeight: 700, color: themeColors.success }}>
												{overallStats?.totalAssignments || 0}
											</Typography>
											<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
												{t('studentDashboard.stats.assignments')}
											</Typography>
										</Box>
										<Avatar sx={{
											bgcolor: `${themeColors.success}20`,
											color: themeColors.success
										}}>
											<Assignment />
										</Avatar>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
										<CheckCircle sx={{ color: themeColors.success, fontSize: 16, mr: 0.5 }} />
										<Typography variant="caption" sx={{ color: themeColors.success }}>
											{t('studentDashboard.stats.completed', { count: overallStats?.completedAssignments || 0 })}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12} sm={6} md={3}>
							<Card sx={{
								background: `linear-gradient(135deg, ${themeColors.warning}15, ${themeColors.warning}05)`,
								border: `1px solid ${themeColors.warning}20`,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: `0 8px 25px ${themeColors.warning}20`,
									transition: 'all 0.3s ease'
								}
							}}>
								<CardContent>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<Box>
											<Typography variant="h4" sx={{ fontWeight: 700, color: themeColors.warning }}>
												{overallStats?.upcomingEvents || 0}
											</Typography>
											<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
												{t('studentDashboard.stats.upcoming')}
											</Typography>
										</Box>
										<Avatar sx={{
											bgcolor: `${themeColors.warning}20`,
											color: themeColors.warning
										}}>
											<Schedule />
										</Avatar>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
										<Warning sx={{ color: themeColors.warning, fontSize: 16, mr: 0.5 }} />
										<Typography variant="caption" sx={{ color: themeColors.warning }}>
											{t('studentDashboard.stats.pending', { count: overallStats?.pendingAssignments || 0 })}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</motion.div>

				{/* Quick Actions Section */}
				<motion.div variants={itemVariants}>
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
							<EmojiEvents sx={{ color: themeColors.primary }} />
							{t('studentDashboard.sections.quickActions')}
						</Typography>
						
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6} md={3}>
								<Card 
									sx={{
										background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.primary}05)`,
										border: `1px solid ${themeColors.primary}20`,
										cursor: 'pointer',
										'&:hover': {
											transform: 'translateY(-4px)',
											boxShadow: `0 8px 25px ${themeColors.primary}20`,
											transition: 'all 0.3s ease'
										}
									}}
									onClick={() => navigate('/students/online-exam')}
								>
									<CardContent sx={{ textAlign: 'center', py: 3 }}>
										<Avatar sx={{
											width: 56,
											height: 56,
											bgcolor: `${themeColors.primary}20`,
											color: themeColors.primary,
											mx: 'auto',
											mb: 2
										}}>
											<DesktopMacIcon sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
											{t('studentDashboard.quickActions.onlineExams.title')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{t('studentDashboard.quickActions.onlineExams.description')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							<Grid item xs={12} sm={6} md={3}>
								<Card 
									sx={{
										background: `linear-gradient(135deg, ${themeColors.success}15, ${themeColors.success}05)`,
										border: `1px solid ${themeColors.success}20`,
										cursor: 'pointer',
										'&:hover': {
											transform: 'translateY(-4px)',
											boxShadow: `0 8px 25px ${themeColors.success}20`,
											transition: 'all 0.3s ease'
										}
									}}
									onClick={() => navigate('/students/online-assignment')}
								>
									<CardContent sx={{ textAlign: 'center', py: 3 }}>
										<Avatar sx={{
											width: 56,
											height: 56,
											bgcolor: `${themeColors.success}20`,
											color: themeColors.success,
											mx: 'auto',
											mb: 2
										}}>
											<Assignment sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
											{t('studentDashboard.quickActions.assignments.title')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{t('studentDashboard.quickActions.assignments.description')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							<Grid item xs={12} sm={6} md={3}>
								<Card 
									sx={{
										background: `linear-gradient(135deg, ${themeColors.accent}15, ${themeColors.accent}05)`,
										border: `1px solid ${themeColors.accent}20`,
										cursor: 'pointer',
										'&:hover': {
											transform: 'translateY(-4px)',
											boxShadow: `0 8px 25px ${themeColors.accent}20`,
											transition: 'all 0.3s ease'
										}
									}}
									onClick={() => navigate('/students/exammark')}
								>
									<CardContent sx={{ textAlign: 'center', py: 3 }}>
										<Avatar sx={{
											width: 56,
											height: 56,
											bgcolor: `${themeColors.accent}20`,
											color: themeColors.accent,
											mx: 'auto',
											mb: 2
										}}>
											<Grade sx={{ fontSize: 28 }} />
										</Avatar>
										<Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
											{t('studentDashboard.quickActions.marksGrades.title')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{t('studentDashboard.quickActions.marksGrades.description')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>

							                            <Grid item xs={12} sm={6} md={3}>
                                <Card 
                                    sx={{
                                        background: `linear-gradient(135deg, ${themeColors.warning}15, ${themeColors.warning}05)`,
                                        border: `1px solid ${themeColors.warning}20`,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 25px ${themeColors.warning}20`,
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                    onClick={() => navigate('/students/blog')}
                                >
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <Avatar sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: `${themeColors.warning}20`,
                                            color: themeColors.warning,
                                            mx: 'auto',
                                            mb: 2
                                        }}>
                                            <ArticleIcon sx={{ fontSize: 28 }} />
                                        </Avatar>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
                                            {t('studentDashboard.quickActions.schoolBlog.title')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('studentDashboard.quickActions.schoolBlog.description')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card 
                                    sx={{
                                        background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.primary}05)`,
                                        border: `1px solid ${themeColors.primary}20`,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 25px ${themeColors.primary}20`,
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                    onClick={() => navigate('/students/timetable')}
                                >
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <Avatar sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: `${themeColors.primary}20`,
                                            color: themeColors.primary,
                                            mx: 'auto',
                                            mb: 2
                                        }}>
                                            <Schedule sx={{ fontSize: 28 }} />
                                        </Avatar>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
                                            {t('studentDashboard.quickActions.timetable.title')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('studentDashboard.quickActions.timetable.description')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card 
                                    sx={{
                                        background: `linear-gradient(135deg, ${themeColors.accent}15, ${themeColors.accent}05)`,
                                        border: `1px solid ${themeColors.accent}20`,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 25px ${themeColors.accent}20`,
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                    onClick={() => navigate('/students/library')}
                                >
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <Avatar sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: `${themeColors.accent}20`,
                                            color: themeColors.accent,
                                            mx: 'auto',
                                            mb: 2
                                        }}>
                                            <LocalLibrary sx={{ fontSize: 28 }} />
                                        </Avatar>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
                                            {t('studentDashboard.quickActions.library.title')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('studentDashboard.quickActions.library.description')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
						</Grid>
					</Box>
				</motion.div>

				{/* Analytics Charts Section */}
				<motion.div variants={itemVariants}>
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
							{t('studentDashboard.sections.performanceAnalytics')}
						</Typography>
						
						<Grid container spacing={3}>
							{/* Performance Radar Chart */}
							<Grid item xs={12} md={6}>
								<Card sx={{
									height: 400,
									background: themeColors.background.primary,
									border: `1px solid ${themeColors.border.primary}`,
									boxShadow: `0 2px 8px ${themeColors.primary}10`
								}}>
									<CardContent>
										<Typography variant="h6" sx={{
											mb: 2,
											fontWeight: 600,
											color: themeColors.text.primary
										}}>
											{t('studentDashboard.charts.subjectPerformance')}
										</Typography>
										{performanceData.length > 0 ? (
											<ResponsiveContainer width="100%" height={300}>
												<RadarChart data={performanceData}>
													<PolarGrid stroke={themeColors.border.primary} />
													<PolarAngleAxis
														dataKey="name"
														tick={{ fill: themeColors.text.primary, fontSize: 12 }}
													/>
													<PolarRadiusAxis
														angle={90}
														domain={[0, 100]}
														tick={{ fill: themeColors.text.secondary, fontSize: 10 }}
													/>
													<Radar
														name="Performance"
														dataKey="value"
														stroke={themeColors.primary}
														fill={themeColors.primary}
														fillOpacity={0.3}
													/>
													<Tooltip
														contentStyle={{
															backgroundColor: themeColors.background.primary,
															border: `1px solid ${themeColors.border.primary}`,
															borderRadius: 8,
															color: themeColors.text.primary
														}}
													/>
												</RadarChart>
											</ResponsiveContainer>
										) : (
											<Box 
												display="flex" 
												justifyContent="center" 
												alignItems="center" 
												height={300}
												sx={{ color: themeColors.text.secondary }}
											>
												<Typography>{t('studentDashboard.messages.noPerformanceData')}</Typography>
											</Box>
										)}
									</CardContent>
								</Card>
							</Grid>

							{/* Attendance Line Chart */}
							<Grid item xs={12} md={6}>
								<Card sx={{
									height: 400,
									background: themeColors.background.primary,
									border: `1px solid ${themeColors.border.primary}`,
									boxShadow: `0 2px 8px ${themeColors.primary}10`
								}}>
									<CardContent>
										<Typography variant="h6" sx={{
											mb: 2,
											fontWeight: 600,
											color: themeColors.text.primary
										}}>
											{t('studentDashboard.charts.attendanceTrend')}
										</Typography>
										{attendanceChartData.length > 0 ? (
											<ResponsiveContainer width="100%" height={300}>
												<LineChart data={attendanceChartData}>
													<CartesianGrid
														strokeDasharray="3 3"
														stroke={themeColors.border.primary}
													/>
													<XAxis
														dataKey="month"
														tick={{ fill: themeColors.text.primary, fontSize: 12 }}
														axisLine={{ stroke: themeColors.border.primary }}
													/>
													<YAxis
														tick={{ fill: themeColors.text.secondary, fontSize: 10 }}
														axisLine={{ stroke: themeColors.border.primary }}
													/>
													<Tooltip
														contentStyle={{
															backgroundColor: themeColors.background.primary,
															border: `1px solid ${themeColors.border.primary}`,
															borderRadius: 8,
															color: themeColors.text.primary
														}}
													/>
													<Legend
														wrapperStyle={{
															color: themeColors.text.primary,
															fontSize: 12
														}}
													/>
													<Line
														type="monotone"
														dataKey="present"
														stroke={themeColors.success}
														strokeWidth={3}
														dot={{ fill: themeColors.success, strokeWidth: 2, r: 4 }}
														activeDot={{ r: 6, stroke: themeColors.success, strokeWidth: 2 }}
													/>
												</LineChart>
											</ResponsiveContainer>
										) : (
											<Box 
												display="flex" 
												justifyContent="center" 
												alignItems="center" 
												height={300}
												sx={{ color: themeColors.text.secondary }}
											>
												<Typography>{t('studentDashboard.messages.noAttendanceData')}</Typography>
											</Box>
										)}
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</Box>
				</motion.div>

				{/* Grade Progress and Upcoming Events */}
				<motion.div variants={itemVariants}>
					<Grid container spacing={3}>
						{/* Grade Progress */}
						<Grid item xs={12} md={8}>
							<Card sx={{
								background: themeColors.background.primary,
								border: `1px solid ${themeColors.border.primary}`,
								boxShadow: `0 2px 8px ${themeColors.primary}10`
							}}>
								<CardContent>
									<Typography variant="h6" sx={{
										mb: 3,
										fontWeight: 600,
										color: themeColors.text.primary
									}}>
										{t('studentDashboard.sections.gradeProgress')}
									</Typography>
									{gradeData.length > 0 ? (
										gradeData.map((item, index) => (
											<Box key={index} sx={{ mb: 3 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
													<Typography variant="body2" sx={{ fontWeight: 500 }}>
														{item.subject}
													</Typography>
													<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
														{item.grade}% / {item.target}%
													</Typography>
												</Box>
												<LinearProgress
													variant="determinate"
													value={Math.min((item.grade / item.target) * 100, 100)}
													sx={{
														height: 8,
														borderRadius: 4,
														backgroundColor: `${themeColors.primary}20`,
														'& .MuiLinearProgress-bar': {
															background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.accent})`,
															borderRadius: 4
														}
													}}
												/>
											</Box>
										))
									) : (
										<Box 
											display="flex" 
											justifyContent="center" 
											alignItems="center" 
											height={200}
											sx={{ color: themeColors.text.secondary }}
										>
											<Typography>{t('studentDashboard.messages.noGradeData')}</Typography>
										</Box>
									)}
								</CardContent>
							</Card>
						</Grid>

						{/* Upcoming Events */}
						<Grid item xs={12} md={4}>
							<Card sx={{
								background: themeColors.background?.primary || '#ffffff',
								border: `1px solid ${themeColors.border?.primary || '#e0e0e0'}`,
								boxShadow: `0 2px 8px ${themeColors.primary || '#1976d2'}10`,
								minHeight: 300
							}}>
								<CardContent>
									<Typography variant="h6" sx={{
										mb: 3,
										fontWeight: 600,
										color: themeColors.text?.primary || '#333333'
									}}>
										{t('studentDashboard.sections.upcomingEvents')}
									</Typography>
									<List sx={{ p: 0 }}>
										{upcomingEvents && upcomingEvents.length > 0 ? (
											upcomingEvents.map((event, index) => (
												<ListItem key={index} sx={{ px: 0, py: 1 }}>
													<ListItemAvatar>
														<Avatar sx={{
															bgcolor: `${getPriorityColor(event.priority)}20`,
															color: getPriorityColor(event.priority),
															width: 32,
															height: 32
														}}>
															{event.type === 'quiz' && <Quiz />}
															{event.type === 'assignment' && <Assignment />}
															{event.type === 'exam' && <Book />}
														</Avatar>
													</ListItemAvatar>
													<ListItemText
														primary={event.title}
														secondary={`${event.subject} • ${new Date(event.date).toLocaleDateString()}`}
														primaryTypographyProps={{
															fontSize: '0.9rem',
															fontWeight: 500,
															color: themeColors.text?.primary || '#333333'
														}}
														secondaryTypographyProps={{
															fontSize: '0.8rem',
															color: themeColors.text?.secondary || '#666666'
														}}
													/>
													<Chip
														label={event.priority}
														size="small"
														sx={{
															bgcolor: `${getPriorityColor(event.priority)}20`,
															color: getPriorityColor(event.priority),
															fontWeight: 500
														}}
													/>
												</ListItem>
											))
										) : (
											<ListItem>
												<ListItemText
													primary={t('studentDashboard.messages.noUpcomingEvents')}
													primaryTypographyProps={{
														fontSize: '0.9rem',
														color: themeColors.text?.secondary || '#666666'
													}}
												/>
											</ListItem>
										)}
									</List>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</motion.div>

				{/* Recent Assignments */}
				<motion.div variants={itemVariants}>
					<Card sx={{
						mt: 3,
						background: themeColors.background?.primary || '#ffffff',
						border: `1px solid ${themeColors.border?.primary || '#e0e0e0'}`,
						boxShadow: `0 2px 8px ${themeColors.primary || '#1976d2'}10`
					}}>
						<CardContent>
							<Typography variant="h6" sx={{
								mb: 3,
								fontWeight: 600,
								color: themeColors.text?.primary || '#333333'
							}}>
								{t('studentDashboard.sections.recentAssignments')}
							</Typography>
							<Grid container spacing={2}>
								{recentAssignments && recentAssignments.length > 0 ? (
									recentAssignments.map((assignment, index) => (
										<Grid item xs={12} sm={6} md={3} key={index}>
											<Paper sx={{
												p: 2,
												background: themeColors.background?.secondary || '#f5f5f5',
												border: `1px solid ${themeColors.border?.primary || '#e0e0e0'}`,
												'&:hover': {
													boxShadow: `0 4px 12px ${themeColors.primary || '#1976d2'}15`,
													transform: 'translateY(-2px)',
													transition: 'all 0.3s ease',
													background: themeColors.background?.primary || '#ffffff'
												}
											}}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
													<Typography variant="body2" sx={{
														fontWeight: 600,
														flex: 1,
														color: themeColors.text?.primary || '#333333'
													}}>
														{assignment.title}
													</Typography>
													<Chip
														label={assignment.status}
														size="small"
														sx={{
															bgcolor: `${getStatusColor(assignment.status)}20`,
															color: getStatusColor(assignment.status),
															fontWeight: 500
														}}
													/>
												</Box>
												<Typography variant="caption" sx={{
													color: themeColors.text?.secondary || '#666666',
													display: 'block',
													mb: 1
												}}>
													{assignment.subject}
												</Typography>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
													<Typography variant="caption" sx={{
														color: themeColors.text?.secondary || '#666666'
													}}>
														{t('studentDashboard.labels.due', { date: new Date(assignment.dueDate).toLocaleDateString() })}
													</Typography>
													{assignment.grade && (
														<Chip
															label={assignment.grade}
															size="small"
															sx={{
																bgcolor: `${themeColors.success || '#4caf50'}20`,
																color: themeColors.success || '#4caf50',
																fontWeight: 600
															}}
														/>
													)}
												</Box>
											</Paper>
										</Grid>
									))
								) : (
									<Grid item xs={12}>
										<Paper sx={{
											p: 3,
											textAlign: 'center',
											background: themeColors.background?.secondary || '#f5f5f5',
											border: `1px solid ${themeColors.border?.primary || '#e0e0e0'}`
										}}>
											<Typography variant="body1" sx={{
												color: themeColors.text?.secondary || '#666666'
											}}>
												{t('studentDashboard.messages.noRecentAssignments')}
											</Typography>
										</Paper>
									</Grid>
								)}
							</Grid>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</CustomOutletBox>
	);
};

export default StudentDashboard;