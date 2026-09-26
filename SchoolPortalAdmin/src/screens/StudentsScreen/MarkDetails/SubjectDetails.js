import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
	LinearProgress,
	Breadcrumbs,
	Link,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow
} from '@mui/material';
import {
	School,
	TrendingUp,
	EmojiEvents,
	Grade as GradeIcon,
	Subject as SubjectIcon,
	Assessment as AssessmentIcon,
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Warning as WarningIcon,
	Schedule as ScheduleIcon,
	Home as HomeIcon,
	BarChart as BarChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useGetStudentSubjectMarksQuery } from '../../../Redux/features/MarkEntry';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';

const SubjectDetails = () => {
	const { subjectId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const examName = location.state?.examName;

	const { data, isLoading, error } = useGetStudentSubjectMarksQuery({
		subjectId,
		examName
	});

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

	const handleGoBack = () => {
		if (examName) {
			navigate(`/students/exammark/exam-subjects/${encodeURIComponent(examName)}`);
		} else {
			navigate('/students/exammark');
		}
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
							{t('subjectDetails.messages.loading')}
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
							{t('subjectDetails.messages.loadFailed')}
						</Alert>
					</motion.div>
				</Box>
			</CustomOutletBox>
		);
	}

	const { subjectDetails = {}, exams = [] } = data?.data || {};

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
				<motion.div
					variants={containerVariants}
					initial="visible"
					animate="visible"
					style={{ opacity: 1 }}
				>
					{/* Breadcrumbs */}
					<motion.div
						variants={itemVariants}
						initial="visible"
						animate="visible"
						style={{ opacity: 1, transform: 'translateY(0)' }}
					>
						<Box mb={3}>
							<Breadcrumbs
								separator={<ArrowBackIcon fontSize="small" />}
								sx={{
									'& .MuiBreadcrumbs-separator': {
										color: themeColors.text.secondary
									}
								}}
							>
								<Link
									component="button"
									variant="body2"
									onClick={() => navigate('/students/exammark')}
									sx={{
										color: themeColors.primary,
										textDecoration: 'none',
										'&:hover': {
											textDecoration: 'underline'
										},
										display: 'flex',
										alignItems: 'center',
										gap: 0.5
									}}
								>
									<HomeIcon fontSize="small" />
									{t('subjectDetails.breadcrumbs.markDetails')}
								</Link>
								{examName && (
									<Link
										component="button"
										variant="body2"
										onClick={handleGoBack}
										sx={{
											color: themeColors.primary,
											textDecoration: 'none',
											'&:hover': {
												textDecoration: 'underline'
											}
										}}
									>
										{examName}
									</Link>
								)}
								<Typography
									variant="body2"
									sx={{ color: themeColors.text.secondary }}
								>
									{subjectDetails.subjectName}
								</Typography>
							</Breadcrumbs>
						</Box>
					</motion.div>

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
								<SubjectIcon />
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
									{subjectDetails.subjectName}
								</Typography>
								<Typography
									variant="body1"
									sx={{ color: themeColors.text.secondary }}
								>
									{subjectDetails.grade} • {subjectDetails.academicYear} • {subjectDetails.term}
								</Typography>
							</Box>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={handleGoBack}
								sx={{
									borderColor: themeColors.primary,
									color: themeColors.primary,
									'&:hover': {
										borderColor: themeColors.accent,
										backgroundColor: `${themeColors.primary}05`
									}
								}}
							>
								{t('subjectDetails.actions.back')}
							</Button>
						</Box>
					</motion.div>

					{/* Subject Summary Stats */}
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
											{exams.length}
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('subjectDetails.stats.totalExams')}
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
											{exams.length > 0 
												? (exams.reduce((sum, exam) => sum + parseFloat(exam.percentage), 0) / exams.length).toFixed(2)
												: 0}%
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('subjectDetails.stats.averagePerformance')}
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
											<BarChartIcon sx={{ fontSize: 30 }} />
										</Avatar>
										<Typography
											variant="h4"
											sx={{
												fontWeight: 700,
												color: themeColors.accent,
												mb: 1
											}}
										>
											{exams.filter(exam => exam.status === 'present').length}
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: themeColors.text.secondary }}
										>
											{t('subjectDetails.stats.examsAttended')}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</motion.div>

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
										{t('subjectDetails.messages.noExamRecords')}
									</Typography>
									<Typography
										variant="body2"
										sx={{ color: themeColors.text.secondary }}
									>
										{t('subjectDetails.messages.marksAvailableAfterExam')}
									</Typography>
								</CardContent>
							</Card>
						</motion.div>
					) : (
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
								<CardContent sx={{ p: 3 }}>
									<Typography
										variant="h6"
										sx={{
											fontWeight: 600,
											color: themeColors.text.primary,
											mb: 3
										}}
									>
										{t('subjectDetails.sections.examPerformanceDetails')}
									</Typography>
									<TableContainer>
										<Table>
											<TableHead>
												<TableRow>
													<TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>
														{t('subjectDetails.table.examName')}
													</TableCell>
													<TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>
														{t('subjectDetails.table.totalMarks')}
													</TableCell>
													<TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>
														{t('subjectDetails.table.obtained')}
													</TableCell>
													<TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>
														{t('subjectDetails.table.percentage')}
													</TableCell>
													<TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>
														{t('subjectDetails.table.status')}
													</TableCell>
													<TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>
														{t('subjectDetails.table.performance')}
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{exams.map((exam, index) => (
													<TableRow key={index}>
														<TableCell>
															<Typography
																variant="body2"
																sx={{
																	fontWeight: 600,
																	color: themeColors.text.primary
																}}
															>
																{exam.examName}
															</Typography>
														</TableCell>
														<TableCell>
															<Typography
																variant="body2"
																sx={{ color: themeColors.text.secondary }}
															>
																{exam.totalMark}
															</Typography>
														</TableCell>
														<TableCell>
															<Typography
																variant="body2"
																sx={{
																	fontWeight: 600,
																	color: getGradeColor(exam.percentage)
																}}
															>
																{exam.studentMark}
															</Typography>
														</TableCell>
														<TableCell>
															<Box display="flex" alignItems="center" gap={1}>
																{getGradeIcon(exam.percentage)}
																<Typography
																	variant="body2"
																	sx={{
																		fontWeight: 600,
																		color: getGradeColor(exam.percentage)
																	}}
																>
																	{exam.percentage}%
																</Typography>
															</Box>
														</TableCell>
														<TableCell>
															<Chip
																label={exam.status === 'present' ? t('subjectDetails.status.present') : t('subjectDetails.status.absent')}
																size="small"
																sx={{
																	bgcolor: exam.status === 'present'
																		? `${themeColors.success}20`
																		: `${themeColors.error}20`,
																	color: exam.status === 'present'
																		? themeColors.success
																		: themeColors.error,
																	fontWeight: 600
																}}
															/>
														</TableCell>
														<TableCell>
															<Box sx={{ width: '100%', maxWidth: 100 }}>
																<LinearProgress
																	variant="determinate"
																	value={parseFloat(exam.percentage)}
																	sx={{
																		height: 8,
																		borderRadius: 4,
																		backgroundColor: `${themeColors.border.primary}`,
																		'& .MuiLinearProgress-bar': {
																			backgroundColor: getGradeColor(exam.percentage),
																			borderRadius: 4
																		}
																	}}
																/>
															</Box>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</motion.div>
			</Box>
		</CustomOutletBox>
	);
};

export default SubjectDetails;
