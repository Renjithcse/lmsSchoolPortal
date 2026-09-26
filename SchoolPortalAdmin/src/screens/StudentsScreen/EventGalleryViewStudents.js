import React, { useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	Grid,
	Stack,
	Typography,
	CircularProgress,
	Chip,
	Breadcrumbs,
	Link,
} from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import EventIcon from '@mui/icons-material/Event';
import { motion } from 'framer-motion';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useNavigate } from 'react-router-dom';
import { useGetAllStudentEventGalleriesQuery } from '../../Redux/features/Student/eventGalleryApiSlice';
import { BASE_PATH } from '../../config';

const resolveImageUrl = (src) => {
	if (!src) return '';
	if (typeof src !== 'string') return '';
	if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
	const trimmed = src.startsWith('/') ? src.slice(1) : src;
	return `${BASE_PATH}${trimmed}`;
};

const EventGalleryViewStudents = () => {
	const { t } = useTranslation();
	const { themeColors } = useThemeContext();
	const navigate = useNavigate();

	const { data: listRes, isLoading: isListLoading } = useGetAllStudentEventGalleriesQuery();
	const publishedEvents = listRes?.data || [];

	const handleEventClick = (eventId) => {
		navigate(`/students/event-gallery/${eventId}`);
	};

	if (isListLoading) {
		return (
			<CustomOutletBox>
				<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
					<CircularProgress sx={{ color: themeColors.primary }} />
				</Box>
			</CustomOutletBox>
		);
	}

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
				{/* Breadcrumbs */}
				<Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/students')}
					>
						{t('eventGallery.students.breadcrumbs.dashboard')}
					</Link>
					<Typography sx={{ color: themeColors.text.primary }}>
						{t('eventGallery.students.breadcrumbs.eventGallery')}
					</Typography>
				</Breadcrumbs>

				<Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
					<Box>
						<Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 700, mb: 1 }}>
							{t('eventGallery.students.title')}
						</Typography>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('eventGallery.students.subtitle')}
						</Typography>
					</Box>
				</Stack>

				{publishedEvents.length > 0 ? (
					<Grid container spacing={3}>
						{publishedEvents.map((event, index) => {
							const thumbnailImage = event.images && event.images.length > 0 ? resolveImageUrl(event.images[0].url) : null;
							return (
								<Grid item key={event._id} xs={12} sm={6} md={4} lg={3}>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3, delay: index * 0.1 }}
										whileHover={{ scale: 1.02, y: -4 }}
										style={{ height: '100%' }}
									>
										<Card
											sx={{
												borderRadius: 2,
												boxShadow: 2,
												border: `1px solid ${themeColors.border.primary}`,
												overflow: 'hidden',
												cursor: 'pointer',
												height: '100%',
												display: 'flex',
												flexDirection: 'column',
												background: `linear-gradient(135deg, ${themeColors.background.secondary} 0%, ${themeColors.background.primary} 100%)`,
												'&:hover': {
													boxShadow: 6,
													borderColor: themeColors.primary,
													'& .event-image': {
														transform: 'scale(1.1)',
													},
												},
											}}
											onClick={() => handleEventClick(event._id)}
										>
											{/* Thumbnail Image */}
											<Box
												sx={{
													position: 'relative',
													width: '100%',
													paddingTop: '60%',
													overflow: 'hidden',
													backgroundColor: themeColors.background.tertiary || themeColors.background.secondary,
												}}
											>
												{thumbnailImage ? (
													<Box
														component="img"
														className="event-image"
														src={thumbnailImage}
														alt={event.eventName}
														sx={{
															position: 'absolute',
															top: 0,
															left: 0,
															width: '100%',
															height: '100%',
															objectFit: 'cover',
															transition: 'transform 0.3s ease',
														}}
													/>
												) : (
													<Box
														sx={{
															position: 'absolute',
															top: 0,
															left: 0,
															width: '100%',
															height: '100%',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															backgroundColor: themeColors.background.tertiary || themeColors.background.secondary,
														}}
													>
														<PhotoLibraryIcon sx={{ fontSize: 64, color: themeColors.text.secondary, opacity: 0.5 }} />
													</Box>
												)}
												{/* Image Count Badge */}
												{event.images && event.images.length > 0 && (
													<Chip
														icon={<PhotoLibraryIcon sx={{ fontSize: 16 }} />}
														label={event.images.length}
														size="small"
														sx={{
															position: 'absolute',
															top: 8,
															right: 8,
															backgroundColor: 'rgba(0, 0, 0, 0.6)',
															color: 'white',
															fontWeight: 600,
															'& .MuiChip-icon': {
																color: 'white',
															},
														}}
													/>
												)}
											</Box>

											<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
												<Typography
													variant="h6"
													sx={{
														color: themeColors.text.primary,
														fontWeight: 600,
														mb: 1,
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical',
														overflow: 'hidden',
														minHeight: '3em',
													}}
												>
													{event.eventName}
												</Typography>

												{event.description && (
													<Typography
														variant="body2"
														sx={{
															color: themeColors.text.secondary,
															mb: 2,
															display: '-webkit-box',
															WebkitLineClamp: 2,
															WebkitBoxOrient: 'vertical',
															overflow: 'hidden',
															flex: 1,
														}}
													>
														{event.description}
													</Typography>
												)}

												<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
													<EventIcon sx={{ fontSize: 16, color: themeColors.primary }} />
													<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
														{moment(event.eventDate).format('DD MMM YYYY')}
													</Typography>
												</Stack>
											</CardContent>
										</Card>
									</motion.div>
								</Grid>
							);
						})}
					</Grid>
				) : (
					<Card
						sx={{
							borderRadius: 2,
							boxShadow: 2,
							border: `1px solid ${themeColors.border.primary}`,
							p: 4,
							textAlign: 'center',
						}}
					>
						<PhotoLibraryIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2, opacity: 0.5 }} />
						<Typography variant="h6" sx={{ color: themeColors.text.secondary, mb: 1 }}>
							{t('eventGallery.students.noEvents')}
						</Typography>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('eventGallery.students.noEventsDescription')}
						</Typography>
					</Card>
				)}
			</Box>
		</CustomOutletBox>
	);
};

export default EventGalleryViewStudents;
