import React, { useState } from 'react';
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
	School,
	TrendingUp,
	EmojiEvents,
	Grade as GradeIcon,
	Subject as SubjectIcon,
	Assessment as AssessmentIcon,
	ArrowForward as ArrowForwardIcon,
	CheckCircle as CheckCircleIcon,
	Warning as WarningIcon,
	Schedule as ScheduleIcon,
	BarChart as BarChartIcon,
	ShowChart as ShowChartIcon,
	PieChart as PieChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useGetStudentMarkSummaryQuery } from '../../../Redux/features/MarkEntry';
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

const StudentMarks = () => {
	const navigate = useNavigate();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();

	const { data, isLoading, error } = useGetStudentMarkSummaryQuery();

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

	const handleViewSubjectMarks = (examName) => {
		navigate(`/students/exammark/exam-subjects/${encodeURIComponent(examName)}`);
	};

	const getGradeColor = (percentage) => {
		if (percentage >= 90) return themeColors.success;
		if (percentage >= 80) return themeColors.primary;
		if (percentage >= 70) return themeColors.warning;
		if (percentage >= 60) return themeColors.accent;
		return themeColors.error;
	};

	const getGradeIcon = (percentage) => {
		if (percentage >= 90) return <EmojiEvents />;
		if (percentage >= 80) return <TrendingUp />;
		if (percentage >= 70) return <CheckCircleIcon />;
		if (percentage >= 60) return <ScheduleIcon />;
		return <WarningIcon />;
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
							{t('studentMarks.messages.loading')}
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
							{t('studentMarks.messages.loadFailed')}
						</Alert>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	const { exams = [], totalExams = 0, totalSubjects = 0, averagePercentage = 0 } = data?.data || {};

	// Prepare chart data for exam comparisons
	const chartData = {
		labels: exams.map(exam => exam.examName),
		datasets: [
			{
				label: t('studentMarks.chartLabels.averagePerformancePercent'),
				data: exams.map(exam => parseFloat(exam.averagePercentage)),
				backgroundColor: exams.map(exam => {
					const percentage = parseFloat(exam.averagePercentage);
					if (percentage >= 90) return 'rgba(76, 175, 80, 0.8)'; // Green
					if (percentage >= 80) return 'rgba(33, 150, 243, 0.8)'; // Blue
					if (percentage >= 70) return 'rgba(255, 193, 7, 0.8)'; // Yellow
					if (percentage >= 60) return 'rgba(156, 39, 176, 0.8)'; // Purple
					return 'rgba(244, 67, 54, 0.8)'; // Red
				}),
				borderColor: exams.map(exam => {
					const percentage = parseFloat(exam.averagePercentage);
					if (percentage >= 90) return 'rgba(76, 175, 80, 1)';
					if (percentage >= 80) return 'rgba(33, 150, 243, 1)';
					if (percentage >= 70) return 'rgba(255, 193, 7, 1)';
					if (percentage >= 60) return 'rgba(156, 39, 176, 1)';
					return 'rgba(244, 67, 54, 1)';
				}),
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
			}
		]
	};

	const doughnutData = {
		labels: [
			t('studentMarks.performanceLevels.excellent'),
			t('studentMarks.performanceLevels.good'),
			t('studentMarks.performanceLevels.average'),
			t('studentMarks.performanceLevels.belowAverage'),
			t('studentMarks.performanceLevels.needsImprovement')
		],
		datasets: [
			{
				data: [
					exams.filter(exam => parseFloat(exam.averagePercentage) >= 90).length,
					exams.filter(exam => parseFloat(exam.averagePercentage) >= 80 && parseFloat(exam.averagePercentage) < 90).length,
					exams.filter(exam => parseFloat(exam.averagePercentage) >= 70 && parseFloat(exam.averagePercentage) < 80).length,
					exams.filter(exam => parseFloat(exam.averagePercentage) >= 60 && parseFloat(exam.averagePercentage) < 70).length,
					exams.filter(exam => parseFloat(exam.averagePercentage) < 60).length,
				],
				backgroundColor: [
					'rgba(76, 175, 80, 0.8)',
					'rgba(33, 150, 243, 0.8)',
					'rgba(255, 193, 7, 0.8)',
					'rgba(156, 39, 176, 0.8)',
					'rgba(244, 67, 54, 0.8)',
				],
				borderColor: [
					'rgba(76, 175, 80, 1)',
					'rgba(33, 150, 243, 1)',
					'rgba(255, 193, 7, 1)',
					'rgba(156, 39, 176, 1)',
					'rgba(244, 67, 54, 1)',
				],
				borderWidth: 2,
			}
		]
	};

	const lineData = {
		labels: exams.map(exam => exam.examName),
		datasets: [
			{
				label: t('studentMarks.chartLabels.performanceTrend'),
				data: exams.map(exam => parseFloat(exam.averagePercentage)),
				borderColor: 'rgba(33, 150, 243, 1)',
				backgroundColor: 'rgba(33, 150, 243, 0.1)',
				borderWidth: 3,
				fill: true,
				tension: 0.4,
				pointBackgroundColor: exams.map(exam => {
					const percentage = parseFloat(exam.averagePercentage);
					if (percentage >= 90) return 'rgba(76, 175, 80, 1)';
					if (percentage >= 80) return 'rgba(33, 150, 243, 1)';
					if (percentage >= 70) return 'rgba(255, 193, 7, 1)';
					if (percentage >= 60) return 'rgba(156, 39, 176, 1)';
					return 'rgba(244, 67, 54, 1)';
				}),
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
				pointRadius: 6,
				pointHoverRadius: 8,
			}
		]
	};

	const subjectsComparisonData = {
		labels: exams.map(exam => exam.examName),
		datasets: [
			{
				label: t('studentMarks.chartLabels.totalSubjects'),
				data: exams.map(exam => exam.totalSubjects),
				backgroundColor: 'rgba(156, 39, 176, 0.8)',
				borderColor: 'rgba(156, 39, 176, 1)',
				borderWidth: 2,
				borderRadius: 8,
				borderSkipped: false,
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

	const subjectsChartOptions = {
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

	return (
			<Box sx={{ p: 3 }}>
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
								<AssessmentIcon />
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
									{t('studentMarks.title')}
								</Typography>
								<Typography 
									variant="body1"
									sx={{ color: themeColors.text.secondary }}
								>
									{t('studentMarks.subtitle')}
								</Typography>
							</Box>
						</Box>
					</motion.div>



					{/* Summary Stats */}
					<motion.div 
						variants={itemVariants}
						initial="visible"
						animate="visible"
						style={{ opacity: 1, transform: 'translateY(0)' }}
					>
						<Grid container spacing={3} sx={{ mb: 4 }}>
							<Grid item xs={12} md={4}>
								<Card 
									sx={{ 
										background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
										border: `1px solid ${themeColors.primary}20`,
										boxShadow: `0 4px 20px ${themeColors.primary}10`
									}}
								>
									<CardContent sx={{ p: 3, textAlign: 'center' }}>
										<Avatar 
											sx={{ 
												width: 60, 
												height: 60, 
												mx: 'auto',
												mb: 2,
												bgcolor: `${themeColors.primary}20`,
												color: themeColors.primary
											}}
										>
											<AssessmentIcon sx={{ fontSize: 30 }} />
										</Avatar>
										<Typography 
											variant="h4" 
											sx={{ 
												fontWeight: 700,
												color: themeColors.primary,
												mb: 1
											}}
										>
											{totalExams}
										</Typography>
										<Typography 
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('studentMarks.stats.totalExams')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={12} md={4}>
								<Card 
									sx={{ 
										background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
										border: `1px solid ${themeColors.success}20`,
										boxShadow: `0 4px 20px ${themeColors.success}10`
									}}
								>
									<CardContent sx={{ p: 3, textAlign: 'center' }}>
										<Avatar 
											sx={{ 
												width: 60, 
												height: 60, 
												mx: 'auto',
												mb: 2,
												bgcolor: `${themeColors.success}20`,
												color: themeColors.success
											}}
										>
											<TrendingUp sx={{ fontSize: 30 }} />
										</Avatar>
										<Typography 
											variant="h4" 
											sx={{ 
												fontWeight: 700,
												color: themeColors.success,
												mb: 1
											}}
										>
											{averagePercentage}%
										</Typography>
										<Typography 
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('studentMarks.stats.averagePerformance')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={12} md={4}>
								<Card 
									sx={{ 
										background: `linear-gradient(135deg, ${themeColors.accent}10, ${themeColors.accent}05)`,
										border: `1px solid ${themeColors.accent}20`,
										boxShadow: `0 4px 20px ${themeColors.accent}10`
									}}
								>
									<CardContent sx={{ p: 3, textAlign: 'center' }}>
										<Avatar 
											sx={{ 
												width: 60, 
												height: 60, 
												mx: 'auto',
												mb: 2,
												bgcolor: `${themeColors.accent}20`,
												color: themeColors.accent
											}}
										>
											<SubjectIcon sx={{ fontSize: 30 }} />
										</Avatar>
										<Typography 
											variant="h4" 
											sx={{ 
												fontWeight: 700,
												color: themeColors.accent,
												mb: 1
											}}
										>
											{totalSubjects}
										</Typography>
										<Typography 
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('studentMarks.stats.totalSubjects')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</motion.div>

					{/* Exam Comparison Charts */}
					{exams.length > 0 && (
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
									{t('studentMarks.sections.examPerformanceAnalytics')}
								</Typography>
								
								<Grid container spacing={3}>
									{/* Bar Chart - Exam Performance Comparison */}
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
													{t('studentMarks.charts.examPerformanceComparison')}
												</Typography>
												<Box sx={{ height: 400, position: 'relative' }}>
													<Bar data={chartData} options={chartOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>

									{/* Doughnut Chart - Performance Distribution */}
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
													{t('studentMarks.charts.performanceDistribution')}
												</Typography>
												<Box sx={{ height: 400, position: 'relative' }}>
													<Doughnut data={doughnutData} options={doughnutOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>

									{/* Line Chart - Performance Trend */}
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
													{t('studentMarks.charts.performanceTrendAnalysis')}
												</Typography>
												<Box sx={{ height: 350, position: 'relative' }}>
													<Line data={lineData} options={chartOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>

									{/* Bar Chart - Subjects per Exam */}
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
													<SubjectIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
													{t('studentMarks.charts.subjectsPerExam')}
												</Typography>
												<Box sx={{ height: 350, position: 'relative' }}>
													<Bar data={subjectsComparisonData} options={subjectsChartOptions} />
												</Box>
											</CardContent>
										</Card>
									</Grid>
								</Grid>
							</Box>
						</motion.div>
					)}

					{exams.length === 0 ? (
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
										<AssessmentIcon sx={{ fontSize: 40 }} />
									</Avatar>
									<Typography 
										variant="h6" 
										sx={{ 
											color: themeColors.text.secondary,
											mb: 1
										}}
									>
										{t('studentMarks.messages.noMarksAvailable')}
									</Typography>
									<Typography 
										variant="body2"
										sx={{ color: themeColors.text.secondary }}
									>
										{t('studentMarks.messages.marksAvailableAfterPublish')}
									</Typography>
								</CardContent>
							</Card>
						</motion.div>
					) : (
						<Grid container spacing={3}>
							{exams.map((exam, index) => (
								<Grid item xs={12} md={6} lg={4} key={exam.examName}>
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
														<AssessmentIcon />
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
															{exam.examName}
														</Typography>
														<Chip
															label={t('studentMarks.labels.subjectsCount', { count: exam.totalSubjects })}
															size="small"
															sx={{
																bgcolor: `${themeColors.accent}20`,
																color: themeColors.accent,
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
																<Typography 
																	variant="h6" 
																	sx={{ 
																		fontWeight: 700,
																		color: themeColors.primary
																	}}
																>
																	{exam.totalSubjects}
																</Typography>
																<Typography 
																	variant="body2"
																	sx={{ color: themeColors.text.secondary }}
																>
																	{t('studentMarks.labels.subjects')}
																</Typography>
															</Paper>
														</Grid>
														<Grid item xs={6}>
															<Paper 
																sx={{ 
																	p: 2, 
																	textAlign: 'center',
																	background: `linear-gradient(135deg, ${getGradeColor(exam.averagePercentage)}10, ${getGradeColor(exam.averagePercentage)}05)`,
																	border: `1px solid ${getGradeColor(exam.averagePercentage)}20`
																}}
															>
																<Typography 
																	variant="h6" 
																	sx={{ 
																		fontWeight: 700,
																		color: getGradeColor(exam.averagePercentage)
																	}}
																>
																	{exam.averagePercentage}%
																</Typography>
																<Typography 
																	variant="body2"
																	sx={{ color: themeColors.text.secondary }}
																>
																	{t('studentMarks.labels.average')}
																</Typography>
															</Paper>
														</Grid>
													</Grid>
												</Box>

												<Box mb={3}>
													<Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
														<Typography 
															variant="body2"
															sx={{ 
																color: themeColors.text.secondary,
																fontWeight: 600
															}}
														>
															{t('studentMarks.labels.performance')}
														</Typography>
														<Box display="flex" alignItems="center">
															{getGradeIcon(exam.averagePercentage)}
															<Typography 
																variant="body2"
																sx={{ 
																	color: getGradeColor(exam.averagePercentage),
																	fontWeight: 600,
																	ml: 0.5
																}}
															>
																{exam.averagePercentage}%
															</Typography>
														</Box>
													</Box>
													<LinearProgress 
														variant="determinate" 
														value={parseFloat(exam.averagePercentage)} 
														sx={{
															height: 8,
															borderRadius: 4,
															backgroundColor: `${themeColors.border.primary}`,
															'& .MuiLinearProgress-bar': {
																backgroundColor: getGradeColor(exam.averagePercentage),
																borderRadius: 4
															}
														}}
													/>
												</Box>

												<Button
													variant="contained"
													fullWidth
													endIcon={<ArrowForwardIcon />}
													onClick={() => handleViewSubjectMarks(exam.examId)}
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
													{t('studentMarks.actions.viewSubjects')}
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
	);
};

export default StudentMarks;