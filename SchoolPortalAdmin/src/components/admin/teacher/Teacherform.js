import React, { useEffect, useMemo } from 'react'
import CustomDatePicker from '../../Common/CustomDatefilter'
import CustomInput from '../../Common/CustomInput'
import CustomSelect from '../../Common/CustomSelect'
import { MenuItem, Card, CardContent, Typography, Box, Grid, Button } from '@mui/material'
import CustomAutocomplete from '../../Common/CustomAutoComplete'
import CustomTextArea from '../../Common/CustomTextArea'
import { useSnackbar } from '../../../hooks/SnackBar'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLazyCityBasedOnStateQuery, useLazyStateListBasedOnCountryQuery, useNationalityListQuery, useReligionListQuery } from '../../../Redux/features/commonSlice'
import { useCreateTeacherMutation, useGetTeacherProfileQuery, useUpdateTeacherMutation } from '../../../Redux/features/Admin/TeachersSlice'
import { useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import UiBlocker from '../../Common/UiBlocker'
import CustomBackButton from '../../Common/CustomBackbutton'
import Autocomplete from '../../Common/AutoComplete'
import ImagePicker from '../../Inputs/ImagePicker'
import dayjs from 'dayjs'
import PersonIcon from '@mui/icons-material/Person';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import CustomOutletBox from '../../Common/CustomOutletBox'
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

const TeacherForm = () => {
	const { t } = useTranslation();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate()
	const location = useLocation()
	const { id } = useParams()

	const { data: nationalityData, isFetching: nationalityLoading } = useNationalityListQuery()
	const { data: religions, isFetching: religionLoading } = useReligionListQuery()
	const [triggerState, { data: stateList, isFetching: stateLoading }] = useLazyStateListBasedOnCountryQuery()
	const [triggerCity, { data: cityList, isFetching: cityLoading }] = useLazyCityBasedOnStateQuery()
	const [createTeacher, { isLoading: createTeacherLoading }] = useCreateTeacherMutation()
	const [updateTeacher, { isLoading: updateTeacherLoading }] = useUpdateTeacherMutation()
	const isEditMode = location?.state?.mode === 'edit' || Boolean(id)
	const { data: teacherProfile } = useGetTeacherProfileQuery(id, { skip: !isEditMode || !id })

	const schema = useMemo(() => yup.object().shape({
		employeeName: yup.string().required(t('teacher.form.validation.employeeNameRequired')),
		employeeId: yup.string().required(t('teacher.form.validation.employeeIdRequired')),
		contactNo: yup.string().required(t('teacher.form.validation.contactNoRequired')),
		email: yup.string().email(t('teacher.form.validation.invalidEmail')).required(t('teacher.form.validation.emailRequired')),
		profilePicture: yup.string(),
		designation: yup.string(),
		qualification: yup.string(),
		alternativeNumber: yup.string(),
		dob: yup.string(),
		gender: yup.string(),
		Religion: yup.string(),
		dateOfJoining: yup.string(),
		experienceInYears: yup.number().positive(t('teacher.form.validation.experiencePositive')),
		place: yup.string(),
		zip: yup.string(),
		communicationAddress: yup.string(),
		permanentAddress: yup.string(),
		passportNo: yup.string(),
		passportExpiry: yup.string(),
		iqamaNo: yup.string(),
		iqamaExpiry: yup.string(),
	}), [t]);

	const {
		handleSubmit,
		control,
		setValue,
		setError,
		reset,
		formState: { errors },
		watch
	} = useForm({
		resolver: yupResolver(schema)
	});

	const { themeColors } = useThemeContext()
    // Populate form in edit mode
    useEffect(() => {
        if (isEditMode && teacherProfile?.data) {
            const t = teacherProfile.data;
            setValue('employeeName', t?.employeeName || '')
            setValue('employeeId', t?.employeeId || '')
            setValue('contactNo', t?.contactNo || '')
            setValue('email', t?.email || '')
            setValue('designation', t?.designation || '')
            setValue('qualification', t?.qualification || '')
            setValue('alternativeNumber', t?.alternativeNumber || '')
            setValue('dob', t?.dob ? dayjs(t.dob) : null)
            setValue('gender', t?.gender || '')
            setValue('Religion', t?.Religion || '')
            setValue('dateOfJoining', t?.dateOfJoining ? dayjs(t.dateOfJoining) : null)
            setValue('experienceInYears', t?.experienceInYears || '')
            setValue('place', t?.place || '')
            setValue('zip', t?.zip || '')
            setValue('communicationAddress', t?.communicationAddress || '')
            setValue('permanentAddress', t?.permanentAddress || '')
            // Autocomplete fields expect full objects
            setValue('nationality', t?.nationality || null)
            setValue('province', t?.province || null)
            setValue('city', t?.city || null)
            setValue('passportNo', t?.passportNo || '')
            setValue('passportExpiry', t?.passportExpiry ? dayjs(t.passportExpiry) : null)
            setValue('iqamaNo', t?.iqamaNo || '')
            setValue('iqamaExpiry', t?.iqamaExpiry ? dayjs(t.iqamaExpiry) : null)
            // Set profile picture if it exists (can be URL from S3 or base64)
            if (t?.profilePicture) {
                setValue('profilePicture', t.profilePicture)
            }
        }
    }, [isEditMode, teacherProfile, setValue])


	const nationality = watch('nationality');
	const province = watch('province');

	useEffect(() => {
		if (nationality) {
			triggerState(nationality?._id)
		}
	}, [nationality])

	useEffect(() => {
		if (province) {
			triggerCity(province?._id)
		}
	}, [province])

	const SubmitForm = async (data) => {
		try {
			let formData = {
				...data,
				nationality: nationality?._id || data?.nationality?._id || data?.nationality,
				province: province?._id || data?.province?._id || data?.province,
				city: data?.city?._id || data?.city,
				Religion: data?.Religion, // Religion is already an ObjectId from the select
				dob: data?.dob ? dayjs(data?.dob).format("YYYY-MM-DD") : null,
				dateOfJoining: data?.dateOfJoining ? dayjs(data?.dateOfJoining).format("YYYY-MM-DD") : null,
				passportExpiry: data?.passportExpiry ? dayjs(data?.passportExpiry).format("YYYY-MM-DD") : null,
				iqamaExpiry: data?.iqamaExpiry ? dayjs(data?.iqamaExpiry).format("YYYY-MM-DD") : null,
				...location.state
			}
			
			// Handle profile picture: only send if it's a new base64 image
			// If it's an existing URL (from edit mode), don't send it unless it was changed to base64
			if (formData.profilePicture) {
				// Only send if it's a new base64 image (starts with 'data:image/')
				// If it's a URL (starts with 'http'), it means it's the existing image, so remove it
				if (formData.profilePicture.startsWith('http')) {
					// It's an existing URL - don't send it unless user changed the image
					delete formData.profilePicture;
				}
				// If it's base64 (starts with 'data:image/'), keep it - backend will upload to S3
			}

			let response;
			if (isEditMode && id) {
				response = await updateTeacher({ id, data: formData }).unwrap()
				if (response.status === 'success') {
					showSnackbar(t('teacher.form.messages.updateSuccess'), 'success')
					navigate(-1)
				} else {
					showSnackbar(t('teacher.form.messages.updateError'), 'error')
				}
			} else {
				response = await createTeacher(formData).unwrap()
				if (response.status === 'success') {
					showSnackbar(t('teacher.form.messages.createSuccess'), 'success')
					reset()
					navigate(-1)
				} else {
					showSnackbar(t('teacher.form.messages.createError'), 'error')
				}
			}
		} catch (error) {
			console.error('Teacher creation error:', error)
			showSnackbar(error?.data?.message || (isEditMode ? t('teacher.form.messages.updateError') : t('teacher.form.messages.createError')), 'error')
		}
	}

	const SectionHeader = ({ icon, title, subtitle }) => (
		<Box display="flex" alignItems="center" gap={2} mb={3}>
			<Box
				sx={{
					backgroundColor: themeColors.primary,
					borderRadius: '50%',
					width: 40,
					height: 40,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: themeColors.text.inverse
				}}
			>
				{icon}
			</Box>
			<Box>
				<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
					{title}
				</Typography>
				<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
					{subtitle}
				</Typography>
			</Box>
		</Box>
	);

	const RequiredField = ({ children, required = false }) => (
		<Box>
			{children}
		</Box>
	);

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
				<Box display="flex" alignItems="center" gap={2} mb={3}>
					<CustomBackButton />
					<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{isEditMode ? t('teacher.breadcrumbs.editTeacher') : t('teacher.breadcrumbs.addTeacher')}
					</Typography>
				</Box>

				<form onSubmit={handleSubmit(SubmitForm)}>
					{/* Personal Information */}
					<Card sx={{ mb: 3, boxShadow: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<CardContent sx={{ p: 3 }}>
							<SectionHeader
								icon={<PersonIcon />}
								title={t('teacher.form.sections.personalInformation.title')}
								subtitle={t('teacher.form.sections.personalInformation.subtitle')}
							/>

							<Grid container spacing={3}>
								<Grid item xs={12}>
									<ImagePicker
										fieldName="profilePicture"
										control={control}
										fieldLabel={t('teacher.form.fields.profilePicture', 'Profile Picture')}
										error={errors.profilePicture}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<RequiredField required>
										<CustomInput
											control={control}
											error={errors.employeeName}
											fieldName="employeeName"
											fieldLabel={t('teacher.form.fields.employeeName')}
										/>
									</RequiredField>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<RequiredField required>
										<CustomInput
											control={control}
											error={errors.employeeId}
											fieldName="employeeId"
											fieldLabel={t('teacher.form.fields.employeeId')}
										/>
									</RequiredField>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<RequiredField required>
										<CustomInput
											control={control}
											error={errors.contactNo}
											fieldName="contactNo"
											fieldLabel={t('teacher.form.fields.contactNo')}
										/>
									</RequiredField>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<RequiredField required>
										<CustomInput
											control={control}
											error={errors.email}
											fieldName="email"
											fieldLabel={t('teacher.form.fields.email')}
										/>
									</RequiredField>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomInput
										control={control}
										error={errors.alternativeNumber}
										fieldName="alternativeNumber"
										fieldLabel={t('teacher.form.fields.alternativeNumber')}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomDatePicker
										fieldName='dob'
										control={control}
										error={errors.dob}
										fieldLabel={t('teacher.form.fields.dateOfBirth')}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomSelect
										control={control}
										error={errors.gender}
										fieldName="gender"
										fieldLabel={t('teacher.form.fields.gender')}
										size="16px"
									>
										<MenuItem value="" disabled>
											<em>{t('teacher.form.placeholders.selectGender')}</em>
										</MenuItem>
										<MenuItem value="male">{t('teacher.dashboard.gender.male')}</MenuItem>
										<MenuItem value="female">{t('teacher.dashboard.gender.female')}</MenuItem>
										<MenuItem value="other">{t('teacher.dashboard.gender.other')}</MenuItem>
									</CustomSelect>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomInput
										control={control}
										error={errors.place}
										fieldName="place"
										fieldLabel={t('teacher.form.fields.place')}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomSelect
										control={control}
										error={errors.Religion}
										fieldName="Religion"
										fieldLabel={t('teacher.form.fields.religion')}
										size="16px"
									>
										<MenuItem value="" disabled>
											<em>{t('teacher.form.placeholders.selectReligion')}</em>
										</MenuItem>
										{religions && religions?.map((res, i) => (
											<MenuItem key={res?._id} value={res?._id}>
												{res?.religionName}
											</MenuItem>
										))}
									</CustomSelect>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					{/* Professional Information */}
					<Card sx={{ mb: 3, boxShadow: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<CardContent sx={{ p: 3 }}>
							<SectionHeader
								icon={<WorkIcon />}
								title={t('teacher.form.sections.professionalInformation.title')}
								subtitle={t('teacher.form.sections.professionalInformation.subtitle')}
							/>

							<Grid container spacing={3}>
								<Grid item xs={12} md={6} lg={3}>
									<CustomInput
										control={control}
										error={errors.designation}
										fieldName="designation"
										fieldLabel={t('teacher.form.fields.designation')}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomInput
										control={control}
										error={errors.qualification}
										fieldName="qualification"
										fieldLabel={t('teacher.form.fields.qualification')}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomDatePicker
										fieldName='dateOfJoining'
										control={control}
										error={errors.dateOfJoining}
										fieldLabel={t('teacher.form.fields.dateOfJoining')}
									/>
								</Grid>
								<Grid item xs={12} md={6} lg={3}>
									<CustomInput
										control={control}
										error={errors.experienceInYears}
										fieldName="experienceInYears"
										fieldLabel={t('teacher.form.fields.experience')}
										type="number"
									/>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					{/* Location Information */}
					<Card sx={{ mb: 3, boxShadow: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<CardContent sx={{ p: 3 }}>
							<SectionHeader
								icon={<LocationOnIcon />}
								title={t('teacher.form.sections.locationInformation.title')}
								subtitle={t('teacher.form.sections.locationInformation.subtitle')}
							/>

							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<Autocomplete
										fieldName="nationality"
										control={control}
										fieldLabel={t('teacher.form.fields.nationality')}
										placeholder={t('teacher.form.placeholders.selectNationality')}
										options={nationalityData}
										labelField="name"
										error={errors.nationality}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<Autocomplete
										fieldName="province"
										control={control}
										fieldLabel={t('teacher.form.fields.province')}
										placeholder={t('teacher.form.placeholders.selectProvince')}
										options={stateList}
										labelField="name"
										error={errors.province}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<Autocomplete
										fieldName="city"
										control={control}
										fieldLabel={t('teacher.form.fields.city')}
										placeholder={t('teacher.form.placeholders.selectCity')}
										options={cityList}
										labelField="name"
										error={errors.city}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<CustomInput
										control={control}
										error={errors.zip}
										fieldName="zip"
										fieldLabel={t('teacher.form.fields.zipCode')}
									/>
								</Grid>
								<Grid item xs={12}>
									<CustomTextArea
										control={control}
										error={errors.communicationAddress}
										fieldName="communicationAddress"
										multiline={true}
										height={120}
										row={10}
										fieldLabel={t('teacher.form.fields.communicationAddress')}
									/>
								</Grid>
								<Grid item xs={12}>
									<CustomTextArea
										control={control}
										error={errors.permanentAddress}
										fieldName="permanentAddress"
										multiline={true}
										height={90}
										row={10}
										fieldLabel={t('teacher.form.fields.permanentAddress')}
									/>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					{/* Document Information */}
					<Card sx={{ mb: 3, boxShadow: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
						<CardContent sx={{ p: 3 }}>
							<SectionHeader
								icon={<BadgeIcon />}
								title={t('teacher.form.sections.documentInformation.title')}
								subtitle={t('teacher.form.sections.documentInformation.subtitle')}
							/>

							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<CustomInput
										control={control}
										error={errors.passportNo}
										fieldName="passportNo"
										fieldLabel={t('teacher.form.fields.passportNumber')}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<CustomDatePicker
										fieldName='passportExpiry'
										control={control}
										error={errors.passportExpiry}
										fieldLabel={t('teacher.form.fields.passportExpiry')}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<CustomInput
										control={control}
										error={errors.iqamaNo}
										fieldName="iqamaNo"
										fieldLabel={t('teacher.form.fields.iqamaNumber')}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<CustomDatePicker
										fieldName='iqamaExpiry'
										control={control}
										error={errors.iqamaExpiry}
										fieldLabel={t('teacher.form.fields.iqamaExpiry')}
									/>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					{/* Submit Button */}
					<Box display="flex" justifyContent="flex-end" mt={3}>
						<Button
							variant="contained"
							onClick={handleSubmit(SubmitForm)}
							sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, px: 4, py: 1.5, '&:hover': { backgroundColor: themeColors.primary } }}
						>
							{t('teacher.form.actions.save')}
						</Button>
					</Box>
				</form>

					<UiBlocker open={nationalityLoading || stateLoading || religionLoading || cityLoading || createTeacherLoading || updateTeacherLoading} />
			</Box>
		</CustomOutletBox>
	)
}

export default TeacherForm
