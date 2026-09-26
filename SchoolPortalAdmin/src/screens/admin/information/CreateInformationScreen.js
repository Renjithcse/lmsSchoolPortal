import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    TextField,
    Chip,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Divider,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Breadcrumbs,
    Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useForm, Controller } from 'react-hook-form';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomMultiSelect from '../../../components/Common/CustomMultiSelect';
import CustomInput from '../../../components/Common/CustomInput';
import CustomTextArea from '../../../components/Common/CustomTextArea';
import {
    useCreateInformationMutation,
    useGetTargetAudienceCountMutation
} from '../../../Redux/features/Admin/informationApiSlice';
import {
    getInformationCategories,
    getPublishToOptions,
    getTargetTypeOptions,
    getPriorityOptions,
    getGenderOptions
} from '../../../api/information';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const CreateInformationScreen = () => {
    const { themeColors } = useThemeContext();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();

    // RTK Query hooks
    const [createInformation, { isLoading: loading }] = useCreateInformationMutation();
    const [getTargetAudienceCount, { data: targetAudienceCount }] = useGetTargetAudienceCountMutation();

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewAudience, setPreviewAudience] = useState(false);

    // React Hook Form setup
    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            category: 'General Information',
            publishTo: 'All Students',
            publishOption: 'Publish Now',
            scheduledPublishDate: '',
            priority: 'Medium',
            tags: '',
            expiryDate: '',
            studentTargeting: {
                academicYear: '',
                targetType: 'All Students',
                gender: 'Both',
                grades: [],
                grade: '', // Single grade for Section Wise
                sectionGender: 'Both', // Single gender for Section Wise
                sections: []
            }
        }
    });

    // Watch form values for conditional rendering
    const watchedValues = watch();
    const publishTo = watch('publishTo');
    const publishOption = watch('publishOption');
    const targetType = watch('studentTargeting.targetType');
    
   

    // API queries
    const { data: academicYears, isLoading: academicLoading } = useGetAcademicYearQuery();
    const [getGradePermissions, { data: grades, isLoading: gradesLoading }] = useLazyGetMyGradePermissionsQuery();
    const [getSectionPermissions, { data: sections, isLoading: sectionsLoading }] = useLazyGetMySectionPermissionsQuery();

    // Options
    const categoryOptions = getInformationCategories();
    const publishToOptions = getPublishToOptions();
    const targetTypeOptions = getTargetTypeOptions();
    const priorityOptions = getPriorityOptions();
    const genderOptions = getGenderOptions();

    // Load grades when academic year is selected
    useEffect(() => {
        if (watchedValues.studentTargeting?.academicYear) {
            getGradePermissions();
        }
    }, [watchedValues.studentTargeting?.academicYear, getGradePermissions]);

    // Debug grades data
    useEffect(() => {
        if (grades) {
            console.log('Grades loaded in CreateInformationScreen:', grades);
        }
    }, [grades]);

    // Debug form values for Section Wise targeting
    useEffect(() => {
        if (targetType === 'Section Wise') {
            console.log('=== SECTION WISE FORM VALUES DEBUG ===');
            console.log('Target type:', targetType);
            console.log('Grade value:', watchedValues.studentTargeting?.grade);
            console.log('Section gender:', watchedValues.studentTargeting?.sectionGender);
            console.log('Sections:', watchedValues.studentTargeting?.sections);
            console.log('Full student targeting:', watchedValues.studentTargeting);
        }
    }, [targetType, watchedValues.studentTargeting]);

    // Handle grade value persistence when grades are loaded
    useEffect(() => {
        if (grades && grades.data && targetType === 'Section Wise') {
            console.log('Grades loaded for Section Wise, checking form state');
            const currentGrade = watchedValues.studentTargeting?.grade;
            console.log('Current grade in form:', currentGrade);
            
            if (currentGrade) {
                // Check if the grade value exists in the available grades
                const gradeExists = grades.data.find(g => g.gradeName === currentGrade);
                console.log('Grade exists in available grades:', gradeExists);
                
                if (gradeExists) {
                    console.log('Re-setting grade value to ensure persistence:', currentGrade);
                    setValue('studentTargeting.grade', currentGrade);
                }
            }
        }
    }, [grades, targetType, watchedValues.studentTargeting?.grade, setValue]);

    // Load sections when Section Wise is selected
    useEffect(() => {
        if (targetType === 'Section Wise' && watchedValues.studentTargeting?.academicYear && watchedValues.studentTargeting?.grade && watchedValues.studentTargeting?.sectionGender) {

            console.log({watchedValues})
            // Find the grade ID from the grades data
            const selectedGrade = grades?.data?.find(grade => grade.gradeName === watchedValues.studentTargeting.grade);
            if (selectedGrade) {
                getSectionPermissions({
                    grade: selectedGrade._id,
                    gender: watchedValues.studentTargeting.sectionGender.toLowerCase()
                });
            }
        }
    }, [targetType, watchedValues.studentTargeting?.academicYear, watchedValues.studentTargeting?.grade, watchedValues.studentTargeting?.sectionGender, getSectionPermissions, grades]);

    // Handle errors - RTK Query handles errors automatically

    // File handling
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        
        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const validTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain'
            ];
            
            if (!validTypes.includes(file.type)) {
                showSnackbar(t('information.form.fileTypeError', { type: file.type }), 'error');
                return false;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB
                showSnackbar(t('information.form.fileSizeError', { name: file.name }), 'error');
                return false;
            }
            
            return true;
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Preview target audience
    const handlePreviewAudience = () => {
        const formData = watchedValues;
        // Convert section IDs to section objects for preview
        const studentTargeting = {
            ...formData.studentTargeting,
            // Convert grade string to grade object
            grade: formData.studentTargeting.grade ? (() => {
                const gradeObj = grades?.data?.find(g => g.gradeName === formData.studentTargeting.grade);
                return gradeObj ? {
                    _id: gradeObj._id,
                    gradeName: gradeObj.gradeName
                } : formData.studentTargeting.grade;
            })() : formData.studentTargeting.grade,
            sections: formData.studentTargeting.sections?.map(sectionId => {
                const section = sections?.data?.find(s => s._id === sectionId);
                return section ? {
                    _id: section._id,
                    sectionName: section.sectionName,
                    grade: section.grade?.gradeName || section.gradeName,
                    gender: section.gender || 'Both'
                } : null;
            }).filter(Boolean) || []
        };
        
        getTargetAudienceCount({
            publishTo: formData.publishTo,
            studentTargeting: studentTargeting
        });
        setPreviewAudience(true);
    };

    // Form submission
    const onSubmit = async (data) => {
        try {
            console.log('=== FORM SUBMISSION DEBUG ===');
            console.log('Full form data:', data);
            console.log('Student targeting data:', data.studentTargeting);
            console.log('Grade value:', data.studentTargeting?.grade);
            console.log('Grade type:', typeof data.studentTargeting?.grade);
            
            const formData = new FormData();
            
            // Convert section IDs to section objects for submission
            const studentTargeting = {
                ...data.studentTargeting,
                // Convert grade string to grade object
                grade: data.studentTargeting.grade ? (() => {
                    const gradeObj = grades?.data?.find(g => g.gradeName === data.studentTargeting.grade);
                    return gradeObj ? {
                        _id: gradeObj._id,
                        gradeName: gradeObj.gradeName
                    } : data.studentTargeting.grade;
                })() : data.studentTargeting.grade,
                sections: data.studentTargeting.sections?.map(sectionId => {
                    const section = sections?.data?.find(s => s._id === sectionId);
                    return section ? {
                        _id: section._id,
                        sectionName: section.sectionName,
                        grade: section.grade?.gradeName || section.gradeName,
                        gender: section.gender || 'Both'
                    } : null;
                }).filter(Boolean) || []
            };
            
            console.log('Processed student targeting:', studentTargeting);
            
            // Determine status based on publish option
            let status = 'Draft';
            if (data.publishOption === 'Publish Now') {
                status = 'Published';
            } else if (data.publishOption === 'Publish Later' && data.scheduledPublishDate) {
                status = 'Draft'; // Will be published automatically when scheduled date arrives
            }
            
            // Add form fields
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('category', data.category);
            formData.append('publishTo', data.publishTo);
            formData.append('status', status);
            formData.append('priority', data.priority);
            formData.append('studentTargeting', JSON.stringify(studentTargeting));
            
            if (data.tags) {
                formData.append('tags', data.tags);
            }
            
            if (data.expiryDate) {
                formData.append('expiryDate', data.expiryDate);
            }
            
            if (data.publishOption === 'Publish Later' && data.scheduledPublishDate) {
                formData.append('scheduledPublishDate', data.scheduledPublishDate);
            }

            // Add files
            console.log('Selected files to upload:', selectedFiles);
            selectedFiles.forEach((file, index) => {
                console.log(`File ${index}:`, {
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
                formData.append('attachments', file);
            });

            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            await createInformation(formData).unwrap();
            showSnackbar(t('information.messages.createSuccess'), 'success');
            navigate('/information');
        } catch (error) {
            showSnackbar(error.data?.message || error.message || t('information.messages.createError'), 'error');
        }
    };

    const handleCancel = () => {
        navigate('/information');
    };

    return (
        <Box sx={{ 
            p: 3,
            backgroundColor: themeColors.background.primary,
            minHeight: '100vh'
        }}>
            {/* Breadcrumbs */}
            <Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
                <Link
                    underline="hover"
                    sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    {t('timetable.breadcrumbs.admin')}
                </Link>
                <Link
                    underline="hover"
                    sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
                    onClick={() => navigate('/information')}
                >
                    {t('information.title')}
                </Link>
                <Typography sx={{ color: themeColors.text.primary }}>
                    {t('information.form.createTitle')}
                </Typography>
            </Breadcrumbs>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ 
                            border: `1px solid ${themeColors.border.primary}`, 
                            mb: 3,
                            backgroundColor: themeColors.background.secondary
                        }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                    {t('information.form.basicInfo')}
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <CustomInput
                                            fieldName="title"
                                            control={control}
                                            fieldLabel={t('information.form.title')}
                                            placeholder={t('information.form.titlePlaceholder')}
                                            error={errors.title}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <CustomTextArea
                                            fieldName="description"
                                            control={control}
                                            fieldLabel={t('information.form.description')}
                                            placeholder={t('information.form.descriptionPlaceholder')}
                                            rows={4}
                                            error={errors.description}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <CustomSelect
                                            fieldName="category"
                                            control={control}
                                            fieldLabel={t('information.form.category')}
                                            error={errors.category}
                                        >
                                            {categoryOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <CustomSelect
                                            fieldName="priority"
                                            control={control}
                                            fieldLabel={t('information.form.priority')}
                                            error={errors.priority}
                                        >
                                            {priorityOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <CustomInput
                                            fieldName="tags"
                                            control={control}
                                            fieldLabel={t('information.form.tags')}
                                            placeholder={t('information.form.tagsPlaceholder')}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="expiryDate"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('information.form.expiryDate')}
                                                    type="datetime-local"
                                                    InputLabelProps={{ 
                                                        shrink: true,
                                                        sx: { color: themeColors.text.primary }
                                                    }}
                                                    inputProps={{
                                                        min: moment().format('YYYY-MM-DDTHH:mm'),
                                                        sx: { color: themeColors.text.primary }
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: themeColors.background.primary,
                                                            border: `1px solid ${themeColors.border.primary}`,
                                                            color: themeColors.text.primary,
                                                            '&:hover': {
                                                                borderColor: themeColors.primary
                                                            },
                                                            '&.Mui-focused': {
                                                                borderColor: themeColors.primary,
                                                                boxShadow: `0 0 0 2px ${themeColors.primary}20`
                                                            }
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            color: themeColors.text.secondary,
                                                            '&.Mui-focused': {
                                                                color: themeColors.primary
                                                            }
                                                        },
                                                        '& .MuiOutlinedInput-input': {
                                                            color: themeColors.text.primary
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* File Attachments */}
                        <Card sx={{ 
                            border: `1px solid ${themeColors.border.primary}`, 
                            mb: 3,
                            backgroundColor: themeColors.background.secondary
                        }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                    {t('information.form.attachments')}
                                </Typography>
                                
                                <Box mb={2}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<ICONS.CloudUpload.component />}
                                        sx={{ 
                                            borderColor: themeColors.border.primary,
                                            color: themeColors.text.primary,
                                            backgroundColor: themeColors.background.primary,
                                            '&:hover': {
                                                backgroundColor: themeColors.background.tertiary,
                                                borderColor: themeColors.primary
                                            }
                                        }}
                                    >
                                        {t('information.form.uploadFiles')}
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                                            onChange={handleFileSelect}
                                        />
                                    </Button>
                                    <Typography variant="caption" sx={{ ml: 2, color: themeColors.text.secondary }}>
                                        {t('information.form.fileLimit')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ ml: 2, color: themeColors.text.secondary }}>
                                        {t('information.form.attachmentsHelper')}
                                    </Typography>
                                </Box>

                                {selectedFiles.length > 0 && (
                                    <List>
                                        {selectedFiles.map((file, index) => (
                                            <ListItem 
                                                key={index} 
                                                sx={{ 
                                                    border: `1px solid ${themeColors.border.primary}`, 
                                                    mb: 1, 
                                                    borderRadius: 1,
                                                    backgroundColor: themeColors.background.primary,
                                                    '&:hover': {
                                                        backgroundColor: themeColors.background.tertiary
                                                    }
                                                }}
                                            >
                                                <ListItemText
                                                    primary={file.name}
                                                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                                    primaryTypographyProps={{ color: themeColors.text.primary }}
                                                    secondaryTypographyProps={{ color: themeColors.text.secondary }}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton 
                                                        onClick={() => removeFile(index)} 
                                                        sx={{ 
                                                            color: themeColors.error,
                                                            '&:hover': {
                                                                backgroundColor: `${themeColors.error}20`
                                                            }
                                                        }}
                                                    >
                                                        <ICONS.Delete.component />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Publishing Configuration */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            border: `1px solid ${themeColors.border.primary}`, 
                            mb: 3,
                            backgroundColor: themeColors.background.secondary
                        }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                                    {t('information.form.publishingConfig')}
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <CustomSelect
                                            fieldName="publishTo"
                                            control={control}
                                            fieldLabel={t('information.form.publishTo')}
                                            error={errors.publishTo}
                                        >
                                            {publishToOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <CustomSelect
                                            fieldName="publishOption"
                                            control={control}
                                            fieldLabel={t('information.form.publishOption')}
                                            error={errors.publishOption}
                                        >
                                            <MenuItem value="Publish Now">{t('information.form.publishNow')}</MenuItem>
                                            <MenuItem value="Publish Later">{t('information.form.publishLater')}</MenuItem>
                                        </CustomSelect>
                                    </Grid>
                                    
                                    {publishOption === 'Publish Later' && (
                                        <Grid item xs={12}>
                                            <Controller
                                                name="scheduledPublishDate"
                                                control={control}
                                                rules={{
                                                    required: publishOption === 'Publish Later' ? t('information.form.scheduledDateRequired') : false,
                                                    validate: (value) => {
                                                        if (publishOption === 'Publish Later' && value) {
                                                            const selectedDate = new Date(value);
                                                            const now = new Date();
                                                            if (selectedDate <= now) {
                                                                return t('information.form.scheduledDateMustBeFuture');
                                                            }
                                                        }
                                                        return true;
                                                    }
                                                }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        fullWidth
                                                        label={t('information.form.scheduledPublishDate')}
                                                        type="datetime-local"
                                                        error={!!errors.scheduledPublishDate}
                                                        helperText={errors.scheduledPublishDate?.message}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        inputProps={{
                                                            min: new Date().toISOString().slice(0, 16)
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                backgroundColor: themeColors.background.primary,
                                                                '& fieldset': {
                                                                    borderColor: themeColors.border.primary,
                                                                },
                                                                '&:hover fieldset': {
                                                                    borderColor: themeColors.primary.main,
                                                                },
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: themeColors.primary.main,
                                                                },
                                                            },
                                                            '& .MuiInputLabel-root': {
                                                                color: themeColors.text.primary,
                                                            },
                                                            '& .MuiOutlinedInput-input': {
                                                                color: themeColors.text.primary,
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    )}

                                    {/* Student Targeting (when applicable) */}
                                    {(publishTo === 'All Students' || publishTo === 'Specific Students' || publishTo === 'Both Teachers and Students') && (
                                        <>
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                    {t('information.form.studentTargeting')}
                                                </Typography>
                                            </Grid>
                                            
                                            <Grid item xs={12}>
                                                <CustomSelect
                                                    fieldName="studentTargeting.academicYear"
                                                    control={control}
                                                    fieldLabel={t('information.form.academicYear')}
                                                    error={errors.studentTargeting?.academicYear}
                                                >
                                                    {academicYears && Array.isArray(academicYears) ? academicYears.map((year) => (
                                                        <MenuItem key={year._id} value={year.academicYear}>
                                                            {year.academicYear}
                                                        </MenuItem>
                                                    )) : (
                                                        <MenuItem disabled>
                                                            {academicLoading ? t('information.form.loadingAcademicYears') : t('information.form.noAcademicYears')}
                                                        </MenuItem>
                                                    )}
                                                </CustomSelect>
                                            </Grid>
                                            
                                            <Grid item xs={12}>
                                                <CustomSelect
                                                    fieldName="studentTargeting.targetType"
                                                    control={control}
                                                    fieldLabel={t('information.form.targetType')}
                                                    error={errors.studentTargeting?.targetType}
                                                >
                                                    {targetTypeOptions.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>
                                            </Grid>

                                            {/* Gender selection for Gender Wise and Grade and Gender Wise */}
                                            {['Gender Wise', 'Grade and Gender Wise'].includes(targetType) && (
                                                <Grid item xs={12}>
                                                    <CustomSelect
                                                        fieldName="studentTargeting.gender"
                                                        control={control}
                                                        fieldLabel={t('information.form.gender')}
                                                        error={errors.studentTargeting?.gender}
                                                    >
                                                        {genderOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Grid>
                                            )}

                                            {/* Gender selection for Section Wise (single select) */}
                                            {targetType === 'Section Wise' && (
                                                <Grid item xs={12}>
                                                    <CustomSelect
                                                        fieldName="studentTargeting.sectionGender"
                                                        control={control}
                                                        fieldLabel={t('information.form.gender')}
                                                        error={errors.studentTargeting?.sectionGender}
                                                        onChangeValue={(value) => {
                                                            // Clear sections when gender changes
                                                            setValue('studentTargeting.sections', []);
                                                        }}
                                                    >
                                                        {genderOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Grid>
                                            )}

                                            {/* Grade selection for Grade Wise and Grade and Gender Wise */}
                                            {['Grade Wise', 'Grade and Gender Wise'].includes(targetType) && (
                                                <Grid item xs={12}>
                                                    <CustomMultiSelect
                                                        fieldName="studentTargeting.grades"
                                                        control={control}
                                                        fieldLabel={t('information.form.grades')}
                                                        error={errors.studentTargeting?.grades}
                                                    >
                                                        {grades?.data && Array.isArray(grades.data) ? grades.data.map((grade) => (
                                                            <MenuItem key={grade._id} value={grade.gradeName}>
                                                                {grade.gradeName}
                                                            </MenuItem>
                                                        )) : (
                                                            <MenuItem disabled>
                                                                {gradesLoading ? t('information.form.loadingGrades') : t('information.form.noGrades')}
                                                            </MenuItem>
                                                        )}
                                                    </CustomMultiSelect>
                                                </Grid>
                                            )}

                                            {/* Grade selection for Section Wise (single select) */}
                                            {targetType === 'Section Wise' && (
                                                <Grid item xs={12}>
                                                    {console.log('Rendering grade selection for Section Wise in CreateInformationScreen, targetType:', targetType, 'grades:', grades)}
                                                    <CustomSelect
                                                        key={`grade-select-create-${grades?.data?.length || 0}-${watchedValues.studentTargeting?.grade || 'empty'}`}
                                                        fieldName="studentTargeting.grade"
                                                        control={control}
                                                        fieldLabel={t('information.form.grade')}
                                                        error={errors.studentTargeting?.grade}
                                                        onChangeValue={(value) => {
                                                            console.log('Grade changed to:', value);
                                                            console.log('Grade value type:', typeof value);
                                                            console.log('Form values after grade change:', watchedValues.studentTargeting);
                                                            // Clear sections when grade changes
                                                            setValue('studentTargeting.sections', []);
                                                        }}
                                                    >
                                                        {grades?.data && Array.isArray(grades.data) ? grades.data.map((grade) => (
                                                            <MenuItem key={grade._id} value={grade.gradeName}>
                                                                {grade.gradeName}
                                                            </MenuItem>
                                                        )) : (
                                                            <MenuItem disabled>
                                                                {gradesLoading ? t('information.form.loadingGrades') : t('information.form.noGrades')}
                                                            </MenuItem>
                                                        )}
                                                    </CustomSelect>
                                                </Grid>
                                            )}

                                            {/* Section selection for Section Wise targeting */}
                                            {targetType === 'Section Wise' && watchedValues.studentTargeting?.grade && watchedValues.studentTargeting?.sectionGender && (
                                                <Grid item xs={12}>
                                                    <CustomMultiSelect
                                                        fieldName="studentTargeting.sections"
                                                        control={control}
                                                        fieldLabel={t('information.form.sections')}
                                                        error={errors.studentTargeting?.sections}
                                                    >
                                                        {sections?.data && Array.isArray(sections.data) ? (
                                                            sections.data.map((section) => (
                                                                <MenuItem 
                                                                    key={section._id} 
                                                                    value={section._id}
                                                                >
                                                                    {section.sectionName} {section.gender && section.gender !== 'Both' ? `(${section.gender})` : ''}
                                                                </MenuItem>
                                                            ))
                                                        ) : (
                                                            <MenuItem disabled>
                                                                {sectionsLoading ? t('information.form.loadingSections') : t('information.form.selectGradeGenderFirst')}
                                                            </MenuItem>
                                                        )}
                                                    </CustomMultiSelect>
                                                </Grid>
                                            )}
                                        </>
                                    )}

                                    {/* Preview Audience Button */}
                                    <Grid item xs={12}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={handlePreviewAudience}
                                            startIcon={<ICONS.Visibility.component />}
                                            sx={{ 
                                                borderColor: themeColors.primary,
                                                color: themeColors.primary,
                                                backgroundColor: themeColors.background.primary,
                                                '&:hover': {
                                                    backgroundColor: themeColors.background.tertiary,
                                                    borderColor: themeColors.primary
                                                }
                                            }}
                                        >
                                            {t('information.form.previewAudience')}
                                        </Button>
                                    </Grid>

                                    {/* Target Audience Count */}
                                    {targetAudienceCount && (
                                        <Grid item xs={12}>
                                            <Alert severity="info">
                                                <Typography variant="body2">
                                                    <strong>{t('information.form.targetAudience')}:</strong> {targetAudienceCount.targetCount} {t('information.form.recipients')}
                                                </Typography>
                                            </Alert>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card sx={{ 
                            border: `1px solid ${themeColors.border.primary}`,
                            backgroundColor: themeColors.background.secondary
                        }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={handleCancel}
                                            sx={{ 
                                                borderColor: themeColors.border.primary,
                                                color: themeColors.text.primary,
                                                backgroundColor: themeColors.background.primary,
                                                '&:hover': {
                                                    backgroundColor: themeColors.background.tertiary,
                                                    borderColor: themeColors.primary
                                                }
                                            }}
                                        >
                                            {t('information.form.cancel')}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            fullWidth
                                            type="submit"
                                            variant="contained"
                                            disabled={loading}
                                            startIcon={loading ? <CircularProgress size={20} /> : <ICONS.Save.component />}
                                            sx={{ 
                                                backgroundColor: themeColors.primary,
                                                color: themeColors.text.inverse,
                                                '&:hover': {
                                                    backgroundColor: themeColors.primary,
                                                    opacity: 0.9
                                                }
                                            }}
                                        >
                                            {loading ? t('information.form.creating') : t('information.form.createButton')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default CreateInformationScreen;
