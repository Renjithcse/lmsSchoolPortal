import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	TextField,
	CircularProgress,
	Alert,
	IconButton,
	Divider,
	Paper,
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Avatar,
	Breadcrumbs,
	Link,
	Chip
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Assignment as AssignmentIcon,
	Upload as UploadIcon,
	Delete as DeleteIcon,
	Save as SaveIcon,
	School,
	Timer,
	CalendarToday,
	Book,
	Download as DownloadIcon,
	Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useGetStudentAssignmentDetailsQuery, useSaveStudentAssignmentMutation } from '../../../Redux/features/studentAssignmentSlice';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { BASE_PATH } from '../../../config';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';

const SubmitAssignment = () => {
	const { assignmentId } = useParams();
	const navigate = useNavigate();
	const showSnackbar = useSnackbar();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const [selectedFile, setSelectedFile] = useState(null);
	const [filePreview, setFilePreview] = useState(null);

	const { data, isLoading, error } = useGetStudentAssignmentDetailsQuery(assignmentId);
	const [saveAssignment, { isLoading: isSaving }] = useSaveStudentAssignmentMutation();

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

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm();

	const watchedAnswer = watch('studentAnswer');

	const handleBack = () => {
		navigate(`/students/online-assignment/view/${assignmentId}`);
	};

	const handleFileChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			setSelectedFile(file);

			// Create preview for image files
			if (file.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = (e) => setFilePreview(e.target.result);
				reader.readAsDataURL(file);
			} else {
				setFilePreview(null);
			}
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(null);
		setFilePreview(null);
		// Reset file input
		const fileInput = document.getElementById('file-input');
		if (fileInput) fileInput.value = '';
	};

	const convertFileToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const base64String = reader.result.split(',')[1]; // Remove data URL prefix
				resolve({
					data: base64String,
					filename: file.name,
					type: file.type
				});
			};
			reader.onerror = (error) => reject(error);
		});
	};

	const onSubmit = async (formData) => {
		try {
			const submissionData = {
				studentAnswer: formData.studentAnswer || null,
				studentAttachment: null,
			};

			// Convert file to base64 if selected
			if (selectedFile) {
				submissionData.studentAttachment = await convertFileToBase64(selectedFile);
			}

			// Validate that at least one submission method is provided
			if (!submissionData.studentAnswer && !submissionData.studentAttachment) {
				showSnackbar(t('submitAssignment.validation.provideAnswerOrFile'), 'error');
				return;
			}

			await saveAssignment({
				attemptId: data?.data?.studentAttempt?._id,
				...submissionData
			}).unwrap();

			showSnackbar(t('submitAssignment.messages.submitSuccess'), 'success');
			navigate(`/students/online-assignment/view/${assignmentId}`);
		} catch (error) {
			console.error('Submission error:', error);
			const errorMessage = error?.data?.message || t('submitAssignment.messages.submitFailed');
			showSnackbar(errorMessage, 'error');
		}
	};

	if (isLoading) {
		return (
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
							{t('submitAssignment.messages.loading')}
						</Typography>
					</motion.div>
				</Box>
		);
	}

	if (error) {
		return (
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
							{t('submitAssignment.messages.loadFailed')}
						</Alert>
					</motion.div>
				</Box>
		);
	}

	const { assignmentDetails, studentAttempt } = data?.data || {};

	if (!assignmentDetails) {
		return (
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
							{t('submitAssignment.messages.assignmentNotFound')}
						</Alert>
					</motion.div>
				</Box>
		);
	}

	// Check if assignment is already submitted or expired
	const currentDate = new Date();
	const endDate = new Date(assignmentDetails.publishedEndDate);
	const isExpired = endDate < currentDate;
	const isSubmitted = studentAttempt?.attendedStatus;
	const timeRemaining = Math.max(0, Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)));

	if (isSubmitted) {
		return (
				<Box p={3}>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<Alert 
							severity="info"
							sx={{
								background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
								border: `1px solid ${themeColors.primary}20`,
								borderRadius: 2,
								mb: 2
							}}
						>
							{t('submitAssignment.messages.alreadySubmitted')}
						</Alert>
						<Button 
							variant="outlined" 
							onClick={handleBack}
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
							{t('submitAssignment.actions.backToDetails')}
						</Button>
					</motion.div>
				</Box>
		);
	}

	if (isExpired) {
		return (
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
								borderRadius: 2,
								mb: 2
							}}
						>
							{t('submitAssignment.messages.deadlinePassed')}
						</Alert>
						<Button 
							variant="outlined" 
							onClick={handleBack}
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
							{t('submitAssignment.actions.backToDetails')}
						</Button>
					</motion.div>
				</Box>
		);
	}

	return (
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
						<Breadcrumbs 
							sx={{ 
								mb: 3,
								p: 2,
								background: `linear-gradient(135deg, ${themeColors.background.secondary}, ${themeColors.background.primary})`,
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
								{t('submitAssignment.actions.backToDetails')}
							</Link>
							<Typography 
								color="text.primary"
								sx={{ color: themeColors.text.primary }}
							>
								{t('submitAssignment.title')}
							</Typography>
						</Breadcrumbs>
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
									{t('submitAssignment.title')}
								</Typography>
								<Typography 
									variant="body1"
									sx={{ color: themeColors.text.secondary }}
								>
									{assignmentDetails.name}
								</Typography>
							</Box>
							<Chip
								icon={<Timer />}
								label={t('submitAssignment.labels.daysRemaining', { count: timeRemaining })}
								sx={{
									bgcolor: timeRemaining <= 1 ? `${themeColors.error}20` : `${themeColors.warning}20`,
									color: timeRemaining <= 1 ? themeColors.error : themeColors.warning,
									fontWeight: 600,
									fontSize: '1rem',
									py: 1
								}}
							/>
						</Box>
					</motion.div>

					<Grid container spacing={3}>
						<Grid item xs={12} md={8}>
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
									<CardContent sx={{ p: 4 }}>
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
											<Typography 
												variant="h5" 
												sx={{ 
													fontWeight: 600,
													color: themeColors.text.primary
												}}
											>
												{assignmentDetails.name}
											</Typography>
										</Box>

										<Divider sx={{ mb: 4, borderColor: themeColors.border.primary }} />

										<Box mb={4}>
											<Typography 
												variant="h6" 
												sx={{ 
													mb: 3,
													fontWeight: 600,
													color: themeColors.text.primary
												}}
											>
												{t('submitAssignment.sections.question')}
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
													{t('submitAssignment.sections.questionFile')}
												</Typography>
												<Button
													variant="outlined"
													startIcon={<DownloadIcon />}
													onClick={() => {
														window.open(assignmentDetails.questionFile, '_blank');
													}}
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
													{t('submitAssignment.actions.downloadQuestionFile')}
												</Button>
											</Box>
										)}

										<Divider sx={{ mb: 4, borderColor: themeColors.border.primary }} />

										<form onSubmit={handleSubmit(onSubmit)}>
											<Box mb={4}>
												<Typography 
													variant="h6" 
													sx={{ 
														mb: 3,
														fontWeight: 600,
														color: themeColors.text.primary
													}}
												>
													{t('submitAssignment.sections.yourAnswer')}
												</Typography>
												<TextField
													{...register('studentAnswer', {
														required: !selectedFile ? t('submitAssignment.validation.provideAnswerOrFile') : false,
													})}
													multiline
													rows={8}
													fullWidth
													variant="outlined"
													placeholder={t('submitAssignment.placeholders.typeAnswer')}
													error={!!errors.studentAnswer}
													helperText={errors.studentAnswer?.message}
													sx={{
														'& .MuiOutlinedInput-root': {
															'& fieldset': {
																borderColor: themeColors.border.primary
															},
															'&:hover fieldset': {
																borderColor: themeColors.primary
															},
															'&.Mui-focused fieldset': {
																borderColor: themeColors.primary
															}
														}
													}}
												/>
											</Box>

											<Box mb={4}>
												<Typography 
													variant="h6" 
													sx={{ 
														mb: 3,
														fontWeight: 600,
														color: themeColors.text.primary
													}}
												>
													{t('submitAssignment.sections.attachFile')}
												</Typography>
												<input
													id="file-input"
													type="file"
													accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
													onChange={handleFileChange}
													style={{ display: 'none' }}
												/>
												<label htmlFor="file-input">
													<Button
														variant="outlined"
														component="span"
														startIcon={<UploadIcon />}
														sx={{ 
															mb: 2,
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
														{t('submitAssignment.actions.chooseFile')}
													</Button>
												</label>

												{selectedFile && (
													<Paper 
														sx={{ 
															p: 3, 
															mt: 2,
															background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
															border: `1px solid ${themeColors.success}20`,
															borderRadius: 2
														}}
													>
														<Box display="flex" alignItems="center" justifyContent="space-between">
															<Box>
																<Typography 
																	variant="body2" 
																	sx={{ 
																		fontWeight: 600,
																		color: themeColors.text.primary
																	}}
																>
																	{selectedFile.name}
																</Typography>
																<Typography 
																	variant="caption" 
																	sx={{ color: themeColors.text.secondary }}
																>
																	{(selectedFile.size / 1024 / 1024).toFixed(2)} {t('submitAssignment.labels.mb')}
																</Typography>
															</Box>
															<IconButton 
																onClick={handleRemoveFile} 
																sx={{ 
																	color: themeColors.error,
																	'&:hover': {
																		bgcolor: `${themeColors.error}10`
																	}
																}} 
																size="small"
															>
																<DeleteIcon />
															</IconButton>
														</Box>

														{filePreview && (
															<Box mt={2}>
																<img
																	src={filePreview}
																	alt="Preview"
																	style={{ 
																		maxWidth: '100%', 
																		maxHeight: '200px', 
																		objectFit: 'contain',
																		borderRadius: 8
																	}}
																/>
															</Box>
														)}
													</Paper>
												)}
											</Box>

											<Box display="flex" gap={2}>
												<Button
													type="submit"
													variant="contained"
													startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
													disabled={isSaving || (!watchedAnswer && !selectedFile)}
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
														},
														'&:disabled': {
															background: themeColors.text.disabled
														}
													}}
												>
													{isSaving ? t('submitAssignment.actions.submitting') : t('submitAssignment.actions.submitAssignment')}
												</Button>
												<Button
													variant="outlined"
													onClick={handleBack}
													disabled={isSaving}
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
													{t('submitAssignment.actions.cancel')}
												</Button>
											</Box>
										</form>
									</CardContent>
								</Card>
							</motion.div>
						</Grid>

						<Grid item xs={12} md={4}>
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
												mb: 3,
												fontWeight: 600,
												color: themeColors.text.primary
											}}
										>
											{t('submitAssignment.sections.submissionGuidelines')}
										</Typography>

										<Box mb={3}>
											<Typography 
												variant="body2" 
												sx={{ 
													color: themeColors.text.secondary,
													mb: 2
												}}
											>
												• {t('submitAssignment.guidelines.provideAnswerOrFile')}
											</Typography>
											<Typography 
												variant="body2" 
												sx={{ 
													color: themeColors.text.secondary,
													mb: 2
												}}
											>
												• {t('submitAssignment.guidelines.supportedFileTypes')}
											</Typography>
											<Typography 
												variant="body2" 
												sx={{ 
													color: themeColors.text.secondary,
													mb: 2
												}}
											>
												• {t('submitAssignment.guidelines.maxFileSize')}
											</Typography>
											<Typography 
												variant="body2" 
												sx={{ 
													color: themeColors.text.secondary,
													mb: 2
												}}
											>
												• {t('submitAssignment.guidelines.submitTextOrFile')}
											</Typography>
										</Box>

										<Divider sx={{ mb: 3, borderColor: themeColors.border.primary }} />

										<Typography 
											variant="h6" 
											sx={{ 
												mb: 3,
												fontWeight: 600,
												color: themeColors.text.primary
											}}
										>
											{t('submitAssignment.sections.assignmentDetails')}
										</Typography>

										<Box mb={3}>
											<Grid container spacing={2}>
												<Grid item xs={12}>
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
																{t('submitAssignment.labels.subject')}:
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
												<Grid item xs={12}>
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
																{t('submitAssignment.labels.dueDate')}:
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
												<Grid item xs={12}>
													<Paper 
														sx={{ 
															p: 2,
															background: `linear-gradient(135deg, ${themeColors.accent}10, ${themeColors.accent}05)`,
															border: `1px solid ${themeColors.accent}20`
														}}
													>
														<Box display="flex" alignItems="center" mb={1}>
															<CalendarToday sx={{ 
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
																{t('submitAssignment.labels.timeRemaining')}:
															</Typography>
														</Box>
														<Typography 
															variant="body1"
															sx={{ 
																color: themeColors.text.primary,
																fontWeight: 500
															}}
														>
															{t('submitAssignment.labels.days', { count: timeRemaining })}
														</Typography>
													</Paper>
												</Grid>
											</Grid>
										</Box>

										{!watchedAnswer && !selectedFile && (
											<Alert 
												severity="warning"
												sx={{
													background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
													border: `1px solid ${themeColors.warning}20`,
													borderRadius: 2
												}}
											>
												{t('submitAssignment.messages.provideAnswerOrFileToSubmit')}
											</Alert>
										)}
									</CardContent>
								</Card>
							</motion.div>
						</Grid>
					</Grid>
				</motion.div>
			</Box>
	);
};

export default SubmitAssignment; 