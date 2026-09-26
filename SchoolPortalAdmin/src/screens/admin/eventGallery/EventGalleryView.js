import React, { useState, useEffect } from 'react';
import {
	Box,
	Breadcrumbs,
	Card,
	CardContent,
	Grid,
	IconButton,
	Link,
	Stack,
	Typography,
	Dialog,
	Backdrop,
	CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetEventGalleryByIdQuery } from '../../../Redux/features/Admin/eventGallerySlice';

const EventGalleryView = () => {
	const { t } = useTranslation();
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const { id } = useParams();

	const [selectedImageIndex, setSelectedImageIndex] = useState(null);
	const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

	const { data: eventRes, isLoading: isLoadingEvent } = useGetEventGalleryByIdQuery(id);

	const event = eventRes?.data;
	const images = event?.images || [];

	// Keyboard navigation for full-screen viewer
	useEffect(() => {
		if (!isFullScreenOpen) return;

		const handleKeyPress = (e) => {
			if (e.key === 'ArrowLeft') {
				handlePrevious();
			} else if (e.key === 'ArrowRight') {
				handleNext();
			} else if (e.key === 'Escape') {
				handleCloseFullScreen();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [isFullScreenOpen, selectedImageIndex, images.length]);

	const handleImageClick = (index) => {
		setSelectedImageIndex(index);
		setIsFullScreenOpen(true);
	};

	const handleCloseFullScreen = () => {
		setIsFullScreenOpen(false);
		setTimeout(() => setSelectedImageIndex(null), 300);
	};

	const handleNext = () => {
		if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
			setSelectedImageIndex(selectedImageIndex + 1);
		} else if (selectedImageIndex === images.length - 1) {
			setSelectedImageIndex(0); // Loop to first image
		}
	};

	const handlePrevious = () => {
		if (selectedImageIndex !== null && selectedImageIndex > 0) {
			setSelectedImageIndex(selectedImageIndex - 1);
		} else if (selectedImageIndex === 0) {
			setSelectedImageIndex(images.length - 1); // Loop to last image
		}
	};

	if (isLoadingEvent) {
		return (
			<CustomOutletBox>
				<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
					<CircularProgress sx={{ color: themeColors.primary }} />
				</Box>
			</CustomOutletBox>
		);
	}

	if (!event) {
		return (
			<CustomOutletBox>
				<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
					<Typography sx={{ color: themeColors.text.secondary }}>{t('eventGallery.view.notFound')}</Typography>
				</Box>
			</CustomOutletBox>
		);
	}

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
				<Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/')}
					>
						{t('eventGallery.breadcrumbs.admin')}
					</Link>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/event-gallery')}
					>
						{t('eventGallery.breadcrumbs.eventGallery')} • {t('eventGallery.breadcrumbs.list')}
					</Link>
					<Typography sx={{ color: themeColors.text.primary }}>{t('eventGallery.breadcrumbs.view')}</Typography>
				</Breadcrumbs>

				{/* Event Details Card */}
				<Card
					sx={{
						borderRadius: 2,
						boxShadow: 2,
						border: `1px solid ${themeColors.border.primary}`,
						mb: 3,
						background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
					}}
				>
					<CardContent>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
							<Box sx={{ flex: 1 }}>
								<Typography variant="h4" sx={{ color: themeColors.text.primary, fontWeight: 700, mb: 1 }}>
									{event.eventName}
								</Typography>
								<Typography variant="body1" sx={{ color: themeColors.text.secondary, mb: 2 }}>
									{event.description}
								</Typography>
								<Stack direction="row" spacing={2} alignItems="center">
									<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
										{t('eventGallery.view.eventDate')}: {moment(event.eventDate).format('DD MMMM YYYY')}
									</Typography>
									<Stack direction="row" spacing={0.5} alignItems="center">
										<PhotoLibraryIcon sx={{ fontSize: 18, color: themeColors.primary }} />
										<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
											{images.length} {t('eventGallery.view.images')}
										</Typography>
									</Stack>
								</Stack>
							</Box>
						</Stack>
					</CardContent>
				</Card>

				{/* Image Gallery */}
				{images.length > 0 ? (
					<Grid container spacing={2}>
						{images.map((imageObj, index) => {
							const imageUrl = imageObj.url || imageObj;
							return (
								<Grid item key={index} xs={12} sm={6} md={4} lg={3}>
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.3, delay: index * 0.05 }}
										whileHover={{ scale: 1.05, zIndex: 1 }}
										style={{ height: '100%' }}
									>
										<Card
											sx={{
												borderRadius: 2,
												boxShadow: 2,
												border: `1px solid ${themeColors.border.primary}`,
												overflow: 'hidden',
												cursor: 'pointer',
												position: 'relative',
												height: '100%',
												'&:hover': {
													boxShadow: 6,
													borderColor: themeColors.primary,
												},
												'&:hover .image-overlay': {
													opacity: 1,
												},
											}}
											onClick={() => handleImageClick(index)}
										>
											<Box
												sx={{
													position: 'relative',
													width: '100%',
													paddingTop: '75%', // 4:3 aspect ratio
													overflow: 'hidden',
												}}
											>
												<Box
													component="img"
													src={imageUrl}
													alt={`${event.eventName} - Image ${index + 1}`}
													sx={{
														position: 'absolute',
														top: 0,
														left: 0,
														width: '100%',
														height: '100%',
														objectFit: 'cover',
														transition: 'transform 0.3s ease',
														'&:hover': {
															transform: 'scale(1.1)',
														},
													}}
												/>
												<Box
													className="image-overlay"
													sx={{
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														bottom: 0,
														background: `linear-gradient(to bottom, transparent 0%, ${themeColors.primary}80 100%)`,
														opacity: 0,
														transition: 'opacity 0.3s ease',
														display: 'flex',
														alignItems: 'flex-end',
														justifyContent: 'center',
														padding: 2,
													}}
												>
													<Typography
														variant="body2"
														sx={{
															color: themeColors.text.inverse,
															fontWeight: 600,
															textAlign: 'center',
														}}
													>
														{t('eventGallery.view.clickToView')}
													</Typography>
												</Box>
											</Box>
										</Card>
									</motion.div>
								</Grid>
							);
						})}
					</Grid>
				) : (
					<Card sx={{ borderRadius: 2, boxShadow: 2, border: `1px solid ${themeColors.border.primary}`, p: 4 }}>
						<Box sx={{ textAlign: 'center' }}>
							<PhotoLibraryIcon sx={{ fontSize: 64, color: themeColors.text.secondary, mb: 2 }} />
							<Typography variant="h6" sx={{ color: themeColors.text.secondary }}>
								{t('eventGallery.view.noImages')}
							</Typography>
						</Box>
					</Card>
				)}

				{/* Full Screen Image Viewer */}
				<AnimatePresence>
					{isFullScreenOpen && selectedImageIndex !== null && (
						<Dialog
							open={isFullScreenOpen}
							onClose={handleCloseFullScreen}
							maxWidth={false}
							fullWidth
							PaperProps={{
								sx: {
									backgroundColor: 'rgba(0, 0, 0, 0.95)',
									boxShadow: 'none',
									m: 0,
									maxWidth: '100vw',
									maxHeight: '100vh',
									width: '100vw',
									height: '100vh',
									borderRadius: 0,
								},
							}}
							BackdropComponent={Backdrop}
							BackdropProps={{
								sx: {
									backgroundColor: 'rgba(0, 0, 0, 0.95)',
								},
							}}
						>
							<Box
								sx={{
									position: 'relative',
									width: '100%',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{/* Close Button */}
								<IconButton
									onClick={handleCloseFullScreen}
									sx={{
										position: 'absolute',
										top: 16,
										right: 16,
										zIndex: 10,
										color: 'white',
										backgroundColor: 'rgba(0, 0, 0, 0.5)',
										'&:hover': {
											backgroundColor: 'rgba(0, 0, 0, 0.7)',
										},
									}}
								>
									<CloseIcon />
								</IconButton>

								{/* Previous Button */}
								{images.length > 1 && (
									<IconButton
										onClick={handlePrevious}
										sx={{
											position: 'absolute',
											left: 16,
											zIndex: 10,
											color: 'white',
											backgroundColor: 'rgba(0, 0, 0, 0.5)',
											'&:hover': {
												backgroundColor: 'rgba(0, 0, 0, 0.7)',
											},
										}}
									>
										<NavigateBeforeIcon sx={{ fontSize: 40 }} />
									</IconButton>
								)}

								{/* Next Button */}
								{images.length > 1 && (
									<IconButton
										onClick={handleNext}
										sx={{
											position: 'absolute',
											right: 16,
											zIndex: 10,
											color: 'white',
											backgroundColor: 'rgba(0, 0, 0, 0.5)',
											'&:hover': {
												backgroundColor: 'rgba(0, 0, 0, 0.7)',
											},
										}}
									>
										<NavigateNextIcon sx={{ fontSize: 40 }} />
									</IconButton>
								)}

								{/* Image Counter */}
								{images.length > 1 && (
									<Box
										sx={{
											position: 'absolute',
											bottom: 16,
											left: '50%',
											transform: 'translateX(-50%)',
											zIndex: 10,
											backgroundColor: 'rgba(0, 0, 0, 0.5)',
											padding: '8px 16px',
											borderRadius: 2,
										}}
									>
										<Typography variant="body2" sx={{ color: 'white' }}>
											{selectedImageIndex + 1} / {images.length}
										</Typography>
									</Box>
								)}

								{/* Main Image */}
								<AnimatePresence mode="wait">
									<motion.div
										key={selectedImageIndex}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.8 }}
										transition={{ duration: 0.3 }}
										style={{
											maxWidth: '90%',
											maxHeight: '90%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Box
											component="img"
											src={images[selectedImageIndex]?.url || images[selectedImageIndex]}
											alt={`${event.eventName} - Image ${selectedImageIndex + 1}`}
											sx={{
												maxWidth: '100%',
												maxHeight: '90vh',
												objectFit: 'contain',
												borderRadius: 1,
											}}
										/>
									</motion.div>
								</AnimatePresence>
							</Box>
						</Dialog>
					)}
				</AnimatePresence>
			</Box>
		</CustomOutletBox>
	);
};

export default EventGalleryView;
