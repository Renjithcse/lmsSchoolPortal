import React, { useState, useRef } from 'react';
import {
	Box,
	Button,
	Typography,
	Grid,
	IconButton,
	Avatar,
	Popover,
	Stack,
	Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ImageUploadWithProgress = ({
	images = [],
	onImagesChange,
	fieldLabel,
	maxImages = 50,
	disabled = false,
}) => {
	const { t } = useTranslation();
	const { themeColors } = useThemeContext();
	const fileInputRef = useRef(null);
	const [anchorEl, setAnchorEl] = useState(null);
	const [previewSrc, setPreviewSrc] = useState(null);

	const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

	const convertFileToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	const handleFiles = async (fileList) => {
		const files = Array.from(fileList || []);
		
		// Validate file types
		const invalidFiles = files.filter((f) => !allowedImageTypes.includes(f.type));
		if (invalidFiles.length > 0) {
			alert(t('imageUploadWithProgress.errors.onlyImageFilesAllowed'));
			return;
		}

		// Check max images limit
		if (images.length + files.length > maxImages) {
			alert(t('imageUploadWithProgress.errors.maxImagesExceeded', { max: maxImages }));
			return;
		}

		// Convert files to base64
		const newImages = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			try {
				const base64 = await convertFileToBase64(file);
				newImages.push(base64);
			} catch (error) {
				console.error('Error converting file:', error);
			}
		}

		// Update parent component
		if (newImages.length > 0) {
			onImagesChange([...images, ...newImages]);
		}
	};

	const removeImage = (index) => {
		const newImages = images.filter((_, i) => i !== index);
		onImagesChange(newImages);
	};

	const openPreview = (event, src) => {
		setPreviewSrc(src);
		setAnchorEl(event.currentTarget);
	};

	const closePreview = () => {
		setAnchorEl(null);
		setPreviewSrc(null);
	};

	return (
		<Box>
			{fieldLabel && (
				<Typography
					fontFamily={'Raleway, sans-serif'}
					fontWeight={'700'}
					sx={{ color: themeColors.text.primary, mb: 1 }}
				>
					{fieldLabel}
				</Typography>
			)}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				style={{ display: 'none' }}
				onChange={(e) => {
					handleFiles(e.target.files);
					e.target.value = ''; // Reset input
				}}
				disabled={disabled}
			/>
			<Box
				sx={{
					border: `1px solid ${themeColors.border.primary}`,
					p: 2,
					borderRadius: 2,
					backgroundColor: themeColors.background.primary,
				}}
			>
				<Stack direction="row" spacing={2} alignItems="center" mb={2}>
					<Button
						variant="contained"
						component="label"
						startIcon={<CloudUploadIcon />}
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled || images.length >= maxImages}
						sx={{
							background: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': { background: themeColors.accent },
						}}
					>
						{t('imageUploadWithProgress.uploadImages')}
					</Button>
					{images.length > 0 && (
						<Chip
							label={t('imageUploadWithProgress.selectedCount', { count: images.length, max: maxImages })}
							color="primary"
							variant="outlined"
						/>
					)}
				</Stack>

				{/* Image Grid */}
				{images.length > 0 && (
					<Grid container spacing={2}>
						{images.map((src, idx) => {
							// Check if it's a URL (existing image) or base64 (new upload)
							const isUrl = typeof src === 'string' && !src.startsWith('data:image');
							const displaySrc = isUrl ? src : src;

							return (
								<Grid item key={`${src}-${idx}`} xs={6} sm={4} md={3}>
									<Box sx={{ position: 'relative' }}>
										<Box
											component="img"
											src={displaySrc}
											alt={`Image ${idx + 1}`}
											sx={{
												width: '100%',
												height: 200,
												objectFit: 'cover',
												border: `1px solid ${themeColors.border.primary}`,
												borderRadius: 1,
												backgroundColor: themeColors.background.secondary,
											}}
										/>
										<IconButton
											size="small"
											onClick={() => removeImage(idx)}
											disabled={disabled}
											sx={{
												position: 'absolute',
												top: -8,
												right: -8,
												bgcolor: themeColors.background.primary,
												border: `1px solid ${themeColors.border.primary}`,
												'&:hover': {
													bgcolor: themeColors.error,
													color: themeColors.text.inverse,
												},
											}}
										>
											<HighlightOffIcon sx={{ fontSize: 18 }} />
										</IconButton>
										<IconButton
											size="small"
											onClick={(e) => openPreview(e, displaySrc)}
											sx={{
												position: 'absolute',
												bottom: -8,
												right: -8,
												bgcolor: themeColors.background.primary,
												border: `1px solid ${themeColors.border.primary}`,
											}}
										>
											<ZoomInIcon sx={{ fontSize: 18, color: themeColors.text.primary }} />
										</IconButton>
									</Box>
								</Grid>
							);
						})}
					</Grid>
				)}
			</Box>

			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={closePreview}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				PaperProps={{
					sx: {
						backgroundColor: themeColors.background.primary,
						border: `1px solid ${themeColors.border.primary}`,
						borderRadius: 2,
						maxWidth: '90vw',
						maxHeight: '90vh',
					},
				}}
			>
				<Box sx={{ p: 2 }}>
					{previewSrc && (
						<img
							alt={t('imageUploadWithProgress.preview')}
							src={previewSrc}
							style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, display: 'block' }}
						/>
					)}
				</Box>
			</Popover>
		</Box>
	);
};

export default ImageUploadWithProgress;
