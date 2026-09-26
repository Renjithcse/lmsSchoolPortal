import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Breadcrumbs,
	Card,
	CardContent,
	Grid,
	Link,
	Stack,
	TextField,
	Typography,
	LinearProgress,
	Dialog,
	DialogContent,
	CircularProgress,
	MenuItem,
	FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string } from 'yup';
import * as yup from 'yup';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CustomButton from '../../../components/Common/CustomButton';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useNavigate, useParams } from 'react-router-dom';
import ImageUploadWithProgress from '../../../components/Inputs/ImageUploadWithProgress';
import {
	useCreateEventGalleryMutation,
	useUpdateEventGalleryMutation,
	useGetEventGalleryByIdQuery,
} from '../../../Redux/features/Admin/eventGallerySlice';
import { axiosInstance } from '../../../CustomAxios';

const EventGalleryForm = () => {
	const { t } = useTranslation();
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const { id } = useParams();
	const isEdit = !!id;

	const [images, setImages] = useState([]);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	// Get existing event gallery for edit
	const { data: eventRes, isLoading: isLoadingEvent } = useGetEventGalleryByIdQuery(id, {
		skip: !isEdit,
	});

	const [triggerCreate, { isLoading: isCreating }] = useCreateEventGalleryMutation();
	const [triggerUpdate, { isLoading: isUpdating }] = useUpdateEventGalleryMutation();

	const schema = useMemo(
		() =>
			object().shape({
				eventName: string().trim().required(t('eventGallery.form.validation.eventNameRequired')),
				description: string(),
				eventDate: string().required(t('eventGallery.form.validation.eventDateRequired')),
				publishOption: string().required(),
				scheduledPublishDate: string(),
			}),
		[t]
	);

	const {
		handleSubmit,
		register,
		reset,
		watch,
		control,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			eventName: '',
			description: '',
			eventDate: moment().format('YYYY-MM-DD'),
			publishOption: 'Publish Now',
			scheduledPublishDate: '',
		},
	});

	const publishOption = watch('publishOption');

	// Load existing data for edit
	useEffect(() => {
		if (isEdit && eventRes?.data) {
			const event = eventRes.data;
			reset({
				eventName: event.eventName || '',
				description: event.description || '',
				eventDate: event.eventDate ? moment(event.eventDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
				publishOption: event.publishOption || 'Publish Now',
				scheduledPublishDate: event.scheduledPublishDate ? moment(event.scheduledPublishDate).format('YYYY-MM-DD') : '',
			});
			// Set existing images (URLs)
			if (event.images && Array.isArray(event.images)) {
				setImages(event.images.map((img) => img.url));
			}
		}
	}, [isEdit, eventRes, reset]);

	const onSubmit = async (data) => {
		if (images.length === 0) {
			showSnackbar(t('eventGallery.form.validation.imagesRequired'), 'error');
			return;
		}

		try {
			if (isEdit) {
				const res = await triggerUpdate({
					id,
					data: {
						eventName: data.eventName,
						description: data.description,
						eventDate: data.eventDate,
						images,
						publishOption: data.publishOption,
						scheduledPublishDate: data.scheduledPublishDate || undefined,
					},
				});

				if (res?.error) {
					showSnackbar(res?.error?.data?.message || t('eventGallery.form.messages.updateError'), 'error');
					return;
				}

				showSnackbar(t('eventGallery.form.messages.updateSuccess'), 'success');
				navigate('/event-gallery');
			} else {
				// For create, use axios to track upload progress
				setIsUploading(true);
				setUploadProgress(0);

				try {
					const response = await axiosInstance.post(
						'/v1/admin/event-gallery',
						{
							eventName: data.eventName,
							description: data.description,
							eventDate: data.eventDate,
							images,
							publishOption: data.publishOption,
							scheduledPublishDate: data.scheduledPublishDate || undefined,
						},
						{
							headers: {
								'Content-Type': 'application/json',
							},
							onUploadProgress: (progressEvent) => {
								if (progressEvent.total) {
									const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
									setUploadProgress(percentCompleted);
								} else {
									// If total is not available, simulate progress
									setUploadProgress((prev) => Math.min(prev + 10, 90));
								}
							},
						}
					);

					setUploadProgress(100);
					setTimeout(() => {
						setIsUploading(false);
						setUploadProgress(0);
						showSnackbar(t('eventGallery.form.messages.createSuccess'), 'success');
						navigate('/event-gallery');
					}, 500);
				} catch (error) {
					setIsUploading(false);
					setUploadProgress(0);
					showSnackbar(
						error?.response?.data?.message || error?.message || t('eventGallery.form.messages.createError'),
						'error'
					);
				}
			}
		} catch (error) {
			console.error('Submit error:', error);
			showSnackbar(t('eventGallery.form.messages.error'), 'error');
		}
	};

	if (isEdit && isLoadingEvent) {
		return (
			<CustomOutletBox>
				<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
					<Typography sx={{ color: themeColors.text.secondary }}>{t('eventGallery.form.loading')}</Typography>
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
					<Typography sx={{ color: themeColors.text.primary }}>
						{isEdit ? t('eventGallery.breadcrumbs.edit') : t('eventGallery.breadcrumbs.new')}
					</Typography>
				</Breadcrumbs>

				<Box mb={2}>
					<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
						{isEdit ? t('eventGallery.form.title.edit') : t('eventGallery.form.title.create')}
					</Typography>
					<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
						{isEdit ? t('eventGallery.form.subtitle.edit') : t('eventGallery.form.subtitle.create')}
					</Typography>
				</Box>

				<Card sx={{ borderRadius: 2, boxShadow: 2, border: `1px solid ${themeColors.border.primary}` }}>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										label={t('eventGallery.form.fields.eventName')}
										placeholder={t('eventGallery.form.placeholders.eventName')}
										{...register('eventName')}
										error={!!errors.eventName}
										helperText={errors.eventName?.message}
									/>
								</Grid>

								<Grid item xs={12} md={6}>
									<TextField
										fullWidth
										type="date"
										label={t('eventGallery.form.fields.eventDate')}
										InputLabelProps={{ shrink: true }}
										{...register('eventDate')}
										error={!!errors.eventDate}
										helperText={errors.eventDate?.message}
									/>
								</Grid>

								<Grid item xs={12}>
									<TextField
										fullWidth
										multiline
										minRows={4}
										label={t('eventGallery.form.fields.description')}
										placeholder={t('eventGallery.form.placeholders.description')}
										{...register('description')}
										error={!!errors.description}
										helperText={errors.description?.message}
									/>
								</Grid>

								<Grid item xs={12} md={6}>
									<TextField
										select
										fullWidth
										label={t('eventGallery.form.fields.publishOption')}
										{...register('publishOption')}
										error={!!errors.publishOption}
										helperText={errors.publishOption?.message}
										defaultValue="Publish Now"
									>
										<MenuItem value="Publish Now">{t('eventGallery.form.publishNow')}</MenuItem>
										<MenuItem value="Publish Later">{t('eventGallery.form.publishLater')}</MenuItem>
									</TextField>
								</Grid>

								{publishOption === 'Publish Later' && (
									<Grid item xs={12} md={6}>
										<Controller
											name="scheduledPublishDate"
											control={control}
											rules={{
												required: publishOption === 'Publish Later' ? t('eventGallery.form.validation.scheduledDateRequired') : false,
											}}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													type="date"
													label={t('eventGallery.form.fields.scheduledPublishDate')}
													InputLabelProps={{ shrink: true }}
													error={!!errors.scheduledPublishDate}
													helperText={errors.scheduledPublishDate?.message}
												/>
											)}
										/>
									</Grid>
								)}

								<Grid item xs={12}>
									<ImageUploadWithProgress
										images={images}
										onImagesChange={setImages}
										fieldLabel={t('eventGallery.form.fields.images')}
										maxImages={50}
									/>
									{images.length === 0 && (
										<Typography variant="caption" sx={{ color: themeColors.text.secondary, mt: 1, display: 'block' }}>
											{t('eventGallery.form.help.images')}
										</Typography>
									)}
								</Grid>
							</Grid>

							<Stack direction="row" justifyContent="flex-end" spacing={2} mt={3}>
								<CustomButton
									onClick={() => navigate('/event-gallery')}
									label={t('eventGallery.form.actions.cancel')}
									isIcon={false}
									width="120px"
								/>
								<CustomButton
									onClick={handleSubmit(onSubmit)}
									label={isEdit ? t('eventGallery.form.actions.update') : t('eventGallery.form.actions.submit')}
									isIcon={false}
									width="150px"
									loading={isCreating || isUpdating}
								/>
							</Stack>
						</form>
					</CardContent>
				</Card>

				{/* Upload Progress Dialog */}
				<Dialog open={isUploading} maxWidth="sm" fullWidth>
					<DialogContent>
						<Box sx={{ textAlign: 'center', py: 3 }}>
							<CircularProgress size={60} sx={{ color: themeColors.primary, mb: 2 }} />
							<Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
								{t('eventGallery.form.uploading')}
							</Typography>
							<Box sx={{ width: '100%', mb: 1 }}>
								<LinearProgress
									variant="determinate"
									value={uploadProgress}
									sx={{
										height: 10,
										borderRadius: 5,
										backgroundColor: `${themeColors.primary}20`,
										'& .MuiLinearProgress-bar': {
											background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.accent})`,
											borderRadius: 5,
										},
									}}
								/>
							</Box>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{uploadProgress}%
							</Typography>
						</Box>
					</DialogContent>
				</Dialog>
			</Box>
		</CustomOutletBox>
	);
};

export default EventGalleryForm;
