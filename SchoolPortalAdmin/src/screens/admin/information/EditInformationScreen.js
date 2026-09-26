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
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useForm, Controller } from 'react-hook-form';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomMultiSelect from '../../../components/Common/CustomMultiSelect';
import CustomInput from '../../../components/Common/CustomInput';
import CustomTextArea from '../../../components/Common/CustomTextArea';
import {
    useGetInformationQuery,
    useUpdateInformationMutation,
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

const EditInformationScreen = () => {
    const { id } = useParams();
    const { themeColors } = useThemeContext();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();

    // RTK Query hooks
    const { 
        data: informationResponse, 
        isLoading: loading, 
        error 
    } = useGetInformationQuery(id, { skip: !id });
    
    // Extract the actual information data from the response
    // Backend returns: { status: 'success', data: { information: {...} } }
    const currentInformation = informationResponse?.data?.information;
    
    // Debug the response structure (remove in production)
    console.log('RTK Query response:', informationResponse);
    console.log('Extracted currentInformation:', currentInformation);
    
    const [updateInformation, { isLoading: updateLoading }] = useUpdateInformationMutation();
    const [getTargetAudienceCount, { data: targetAudienceCount }] = useGetTargetAudienceCountMutation();

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [previewAudience, setPreviewAudience] = useState(false);

    // React Hook Form setup
    const { control, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
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
    
    // Debug form values
    useEffect(() => {
        console.log('Form values changed:', {
            targetType,
            publishTo,
            studentTargeting: watchedValues.studentTargeting
        });
    }, [targetType, publishTo, watchedValues.studentTargeting]);

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

    // Information data is automatically loaded by RTK Query hook

    // Populate existing attachments when information is loaded
    useEffect(() => {
        if (currentInformation && currentInformation.attachments) {
            console.log('Loading existing attachments:', currentInformation.attachments);
            setExistingAttachments(currentInformation.attachments);
        }
    }, [currentInformation]);

    // Populate form when data is loaded
    useEffect(() => {
        if (currentInformation) {
            console.log('=== FULL CURRENT INFORMATION OBJECT ===');
            console.log(JSON.stringify(currentInformation, null, 2));
            console.log('=== STUDENT TARGETING DATA ===');
            console.log(JSON.stringify(currentInformation.studentTargeting, null, 2));
            console.log('=== GRADE DATA ===');
            console.log('Grade:', currentInformation.studentTargeting?.grade);
            console.log('Grade type:', typeof currentInformation.studentTargeting?.grade);
            console.log('Grade stringified:', JSON.stringify(currentInformation.studentTargeting?.grade));
            console.log('=== SECTIONS DATA ===');
            console.log('Sections:', currentInformation.studentTargeting?.sections);
            console.log('Sections type:', typeof currentInformation.studentTargeting?.sections);
            console.log('Sections is array:', Array.isArray(currentInformation.studentTargeting?.sections));
            
            // Determine publishOption based on current status and scheduledPublishDate
            let publishOption = 'Publish Now';
            if (currentInformation.status === 'Draft' && currentInformation.scheduledPublishDate) {
                publishOption = 'Publish Later';
            } else if (currentInformation.status === 'Published') {
                publishOption = 'Publish Now';
            } else {
                publishOption = 'Publish Now';
            }
            
            const formData = {
                title: currentInformation.title || '',
                description: currentInformation.description || '',
                category: currentInformation.category || 'General Information',
                publishTo: currentInformation.publishTo || 'All Students',
                publishOption: publishOption,
                scheduledPublishDate: currentInformation.scheduledPublishDate ? moment(currentInformation.scheduledPublishDate).format('YYYY-MM-DDTHH:mm') : '',
                priority: currentInformation.priority || 'Medium',
                tags: currentInformation.tags || '',
                expiryDate: currentInformation.expiryDate ? moment(currentInformation.expiryDate).format('YYYY-MM-DDTHH:mm') : '',
                studentTargeting: {
                    academicYear: currentInformation.studentTargeting?.academicYear || '',
                    targetType: currentInformation.studentTargeting?.targetType || 'All Students',
                    gender: currentInformation.studentTargeting?.gender || 'Both',
                    grades: currentInformation.studentTargeting?.grades || [],
                    grade: currentInformation.studentTargeting?.grade?.gradeName || currentInformation.studentTargeting?.grade || '',
                    sectionGender: currentInformation.studentTargeting?.sectionGender || 'Both',
                    sections: currentInformation.studentTargeting?.sections?.map(s => s._id || s) || []
                }
            };
            
            console.log('=== FORM DATA TO BE SET ===');
            console.log(JSON.stringify(formData, null, 2));
            console.log('=== GRADE IN FORM DATA ===');
            console.log('Grade in form data:', formData.studentTargeting.grade);
            console.log('Grade type in form:', typeof formData.studentTargeting.grade);
            console.log('=== SECTIONS IN FORM DATA ===');
            console.log('Sections in form data:', formData.studentTargeting.sections);
            console.log('Sections type in form:', typeof formData.studentTargeting.sections);
            console.log('Sections is array in form:', Array.isArray(formData.studentTargeting.sections));
            console.log('Sections mapping result:', currentInformation.studentTargeting?.sections?.map(s => {
                console.log('Mapping section:', s, 'to ID:', s._id || s);
                return s._id || s;
            }));
            // If it's Section Wise targeting, load the required data first
            if (currentInformation.studentTargeting?.targetType === 'Section Wise' && 
                currentInformation.studentTargeting?.academicYear) {
                console.log('Loading grades for Section Wise targeting');
                console.log('Grade value to be set:', formData.studentTargeting.grade);
                // Load grades first, then reset form
                getGradePermissions().then(() => {
                    console.log('Grades loaded, now resetting form');
                    console.log('Available grades after loading:', grades?.data);
                    reset(formData);
                }).catch((error) => {
                    console.error('Error loading grades:', error);
                    // Still reset the form even if grades fail to load
                    reset(formData);
                });
            } else {
                reset(formData);
            }
        }
    }, [currentInformation, reset, getGradePermissions]);

    // Load grades when academic year is selected
    useEffect(() => {
        if (watchedValues.studentTargeting?.academicYear) {
            console.log('Loading grades for academic year:', watchedValues.studentTargeting.academicYear);
            getGradePermissions();
        }
    }, [watchedValues.studentTargeting?.academicYear, getGradePermissions]);

    // Handle form update when grades are loaded
    useEffect(() => {
        if (grades && grades.data) {
            console.log('Grades loaded:', {grades, watchedValues});
            console.log('Available grades:', grades.data?.map(g => ({ id: g._id, name: g.gradeName })));
            
            // If we have current information with Section Wise targeting and a grade value
            if (currentInformation && 
                currentInformation.studentTargeting?.targetType === 'Section Wise' && 
                currentInformation.studentTargeting?.grade) {
                
                const gradeValue = currentInformation.studentTargeting.grade?.gradeName || currentInformation.studentTargeting.grade;
                console.log('Current grade value from information:', gradeValue);
                
                // Check if the current grade value matches any of the available options
                const matchingGrade = grades.data.find(g => g.gradeName === gradeValue);
                console.log('Matching grade found:', matchingGrade);
                
                if (matchingGrade) {
                    console.log('Setting grade value after grades loaded:', gradeValue);
                    setValue('studentTargeting.grade', gradeValue);
                } else {
                    console.log('Grade not found in available grades');
                }
            }
            
            // Also handle the case where form already has a grade value
            const currentGrade = watchedValues.studentTargeting?.grade;
            if (currentGrade && grades.data) {
                console.log('Form already has grade value:', currentGrade);
                const matchingGrade = grades.data.find(g => g.gradeName === currentGrade);
                if (matchingGrade) {
                    console.log('Re-setting existing grade value:', currentGrade);
                    setValue('studentTargeting.grade', currentGrade);
                }
            }
        }
    }, [grades, currentInformation, watchedValues.studentTargeting?.grade, setValue]);

    // Debug sections data
    useEffect(() => {
        if (sections) {
            console.log('Sections loaded:', sections);
            console.log('Available sections:', sections.data);
            console.log('Sections data type:', typeof sections.data);
            console.log('Sections is array:', Array.isArray(sections.data));
            if (sections.data && Array.isArray(sections.data)) {
                console.log('First section example:', sections.data[0]);
                console.log('Section IDs available:', sections.data.map(s => s._id));
            }
        }
    }, [sections]);

    // Debug form values after reset
    useEffect(() => {
        console.log('=== FORM VALUES AFTER RESET ===');
        console.log('Target Type:', watchedValues.studentTargeting?.targetType);
        console.log('Grade:', watchedValues.studentTargeting?.grade);
        console.log('Grade type:', typeof watchedValues.studentTargeting?.grade);
        console.log('Section Gender:', watchedValues.studentTargeting?.sectionGender);
        console.log('Sections:', watchedValues.studentTargeting?.sections);
        console.log('Sections type:', typeof watchedValues.studentTargeting?.sections);
        console.log('Sections is array:', Array.isArray(watchedValues.studentTargeting?.sections));
        console.log('Full form values:', JSON.stringify(watchedValues, null, 2));
    }, [watchedValues.studentTargeting]);

    // Handle section loading when form is populated with existing data
    useEffect(() => {
        if (currentInformation && 
            currentInformation.studentTargeting?.targetType === 'Section Wise' && 
            currentInformation.studentTargeting?.grade && 
            currentInformation.studentTargeting?.sectionGender &&
            grades?.data) {
            
            console.log('Loading sections for existing data:', {
                grade: currentInformation.studentTargeting.grade,
                gender: currentInformation.studentTargeting.sectionGender,
                hasSections: !!sections?.data
            });
            
            // Find the grade ID from the grades data
            const selectedGrade = grades.data.find(grade => grade.gradeName === currentInformation.studentTargeting.grade);
            if (selectedGrade) {
                console.log('Found grade for section loading:', selectedGrade);
                getSectionPermissions({
                    grade: selectedGrade._id,
                    gender: currentInformation.studentTargeting.sectionGender.toLowerCase()
                });
            } else {
                console.log('Grade not found for section loading');
            }
        }
    }, [currentInformation, grades, getSectionPermissions]);

    // Re-populate form when sections are loaded and we have existing section data
    useEffect(() => {
        console.log('Section re-population check:', {
            hasCurrentInfo: !!currentInformation,
            isSectionWise: currentInformation?.studentTargeting?.targetType === 'Section Wise',
            hasExistingSections: !!currentInformation?.studentTargeting?.sections,
            hasSectionsData: !!sections?.data,
            currentFormSections: watchedValues.studentTargeting?.sections,
            formSectionsLength: watchedValues.studentTargeting?.sections?.length
        });
        
        if (currentInformation && 
            currentInformation.studentTargeting?.targetType === 'Section Wise' && 
            currentInformation.studentTargeting?.sections &&
            sections?.data) {
            
            console.log('Re-populating sections after sections are loaded:', {
                existingSections: currentInformation.studentTargeting.sections,
                availableSections: sections.data,
                currentFormSections: watchedValues.studentTargeting?.sections
            });
            
            // Map the existing sections to IDs
            const sectionIds = currentInformation.studentTargeting.sections.map(s => s._id || s);
            console.log('Setting section IDs:', sectionIds);
            
            // Update the form with the section IDs
            setValue('studentTargeting.sections', sectionIds);
        }
    }, [currentInformation, sections, watchedValues.studentTargeting?.sections, setValue]);

    // Force re-populate grade and sections when all data is available
    useEffect(() => {
        if (currentInformation && 
            currentInformation.studentTargeting?.targetType === 'Section Wise' && 
            grades?.data) {
            
            console.log('=== FORCE RE-POPULATION ===');
            console.log('Current form values before re-population:', watchedValues.studentTargeting);
            console.log('Available grades:', grades.data.map(g => g.gradeName));
            
            // Force set the grade
            const gradeValue = currentInformation.studentTargeting.grade?.gradeName || currentInformation.studentTargeting.grade;
            console.log('Grade value to set:', gradeValue);
            if (gradeValue) {
                // Check if the grade value exists in the available grades
                const gradeExists = grades.data.find(g => g.gradeName === gradeValue);
                console.log('Grade exists in available grades:', gradeExists);
                if (gradeExists) {
                    console.log('Force setting grade:', gradeValue);
                    setValue('studentTargeting.grade', gradeValue);
                } else {
                    console.log('Grade not found in available grades, available grades:', grades.data.map(g => g.gradeName));
                }
            }
            
            // Force set the sections if sections data is available
            if (sections?.data) {
                const sectionIds = currentInformation.studentTargeting.sections?.map(s => s._id || s) || [];
                if (sectionIds.length > 0) {
                    console.log('Force setting sections:', sectionIds);
                    setValue('studentTargeting.sections', sectionIds);
                }
                
                // Force set the section gender
                const sectionGender = currentInformation.studentTargeting.sectionGender;
                if (sectionGender) {
                    console.log('Force setting section gender:', sectionGender);
                    setValue('studentTargeting.sectionGender', sectionGender);
                }
            }
            
            console.log('Form values after force re-population:', watchedValues.studentTargeting);
        }
    }, [currentInformation, grades, sections, setValue]);

    // Backup timeout-based re-population
    useEffect(() => {
        if (currentInformation && 
            currentInformation.studentTargeting?.targetType === 'Section Wise') {
            
            const timeoutId = setTimeout(() => {
                console.log('=== TIMEOUT RE-POPULATION ===');
                console.log('Current form values:', watchedValues.studentTargeting);
                
                // Force set all values again
                const gradeValue = currentInformation.studentTargeting.grade?.gradeName || currentInformation.studentTargeting.grade;
                if (gradeValue) {
                    setValue('studentTargeting.grade', gradeValue);
                }
                
                const sectionIds = currentInformation.studentTargeting.sections?.map(s => s._id || s) || [];
                if (sectionIds.length > 0) {
                    setValue('studentTargeting.sections', sectionIds);
                }
                
                const sectionGender = currentInformation.studentTargeting.sectionGender;
                if (sectionGender) {
                    setValue('studentTargeting.sectionGender', sectionGender);
                }
                
                console.log('Form values after timeout re-population:', watchedValues.studentTargeting);
            }, 2000); // 2 second delay
            
            return () => clearTimeout(timeoutId);
        }
    }, [currentInformation, setValue]);


    // Load sections when currentInformation is loaded and grades are available
    useEffect(() => {
        console.log('Section loading effect triggered:', {
            currentInformation: !!currentInformation,
            targetType: currentInformation?.studentTargeting?.targetType,
            grade: currentInformation?.studentTargeting?.grade,
            sectionGender: currentInformation?.studentTargeting?.sectionGender,
            gradesData: !!grades?.data
        });
        
        if (currentInformation && 
            currentInformation.studentTargeting?.targetType === 'Section Wise' && 
            currentInformation.studentTargeting?.grade && 
            currentInformation.studentTargeting?.sectionGender &&
            grades?.data) {
            
            console.log('Loading sections for:', {
                grade: currentInformation.studentTargeting.grade,
                gender: currentInformation.studentTargeting.sectionGender,
                availableGrades: grades.data.map(g => g.gradeName)
            });
            
            // Find the grade ID from the grades data
            const selectedGrade = grades.data.find(grade => grade.gradeName === currentInformation.studentTargeting.grade);
            console.log('Selected grade:', selectedGrade);
            
            if (selectedGrade) {
                console.log('Calling getSectionPermissions with:', {
                    grade: selectedGrade._id,
                    gender: currentInformation.studentTargeting.sectionGender.toLowerCase()
                });
                getSectionPermissions({
                    grade: selectedGrade._id,
                    gender: currentInformation.studentTargeting.sectionGender.toLowerCase()
                });
            } else {
                console.log('Grade not found in grades data');
            }
        }
    }, [currentInformation, grades, getSectionPermissions]);

    // Load sections when Section Wise is selected and grades are loaded
    useEffect(() => {
        if (targetType === 'Section Wise' && 
            watchedValues.studentTargeting?.academicYear && 
            watchedValues.studentTargeting?.grade && 
            watchedValues.studentTargeting?.sectionGender &&
            grades?.data) {
            
            // Find the grade ID from the grades data
            const selectedGrade = grades.data.find(grade => grade.gradeName === watchedValues.studentTargeting.grade);
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

    const removeExistingAttachment = (index) => {
        setExistingAttachments(prev => prev.filter((_, i) => i !== index));
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
            console.log('Form submission data:', data);
            console.log('Selected files:', selectedFiles);
            console.log('Existing attachments:', existingAttachments);
            
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
            
            // Determine status based on publish option
            let status = 'Draft';
            if (data.publishOption === 'Publish Now') {
                status = 'Published';
            } else if (data.publishOption === 'Publish Later' && data.scheduledPublishDate) {
                status = 'Draft'; // Will be published automatically when scheduled date arrives
            } else {
                // If editing and already published, keep it published unless explicitly changed
                status = currentInformation?.status === 'Published' ? 'Published' : 'Draft';
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
            
            if (data.publishOption === 'Publish Later' && data.scheduledPublishDate) {
                formData.append('scheduledPublishDate', data.scheduledPublishDate);
            } else {
                // Clear scheduled date if switching to Publish Now
                formData.append('scheduledPublishDate', '');
            }
            
            if (data.expiryDate) {
                formData.append('expiryDate', data.expiryDate);
            }

            // Add files
            selectedFiles.forEach(file => {
                formData.append('attachments', file);
            });

            // Always add existingAttachments information (even if empty array)
            // This ensures the backend knows about the attachment status
            formData.append('existingAttachments', JSON.stringify(existingAttachments));

            // Debug: Log FormData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            await updateInformation({ id, formData }).unwrap();
            showSnackbar(t('information.messages.updateSuccess'), 'success');
            navigate('/information');
        } catch (error) {
            showSnackbar(error.data?.message || error.message || t('information.messages.updateError'), 'error');
        }
    };

    const handleCancel = () => {
        navigate('/information');
    };

    // Manual trigger for testing
    const handleManualRepopulate = () => {
        console.log('=== MANUAL RE-POPULATION TRIGGERED ===');
        if (currentInformation && currentInformation.studentTargeting?.targetType === 'Section Wise') {
            const gradeValue = currentInformation.studentTargeting.grade?.gradeName || currentInformation.studentTargeting.grade;
            if (gradeValue) {
                setValue('studentTargeting.grade', gradeValue);
                console.log('Manually set grade:', gradeValue);
            }
            
            const sectionIds = currentInformation.studentTargeting.sections?.map(s => s._id || s) || [];
            if (sectionIds.length > 0) {
                setValue('studentTargeting.sections', sectionIds);
                console.log('Manually set sections:', sectionIds);
            }
            
            const sectionGender = currentInformation.studentTargeting.sectionGender;
            if (sectionGender) {
                setValue('studentTargeting.sectionGender', sectionGender);
                console.log('Manually set section gender:', sectionGender);
            }
        }
    };

    if (loading || !currentInformation) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

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
                    {t('information.form.editTitle')}
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
                {/* Manual trigger button for testing */}
                {currentInformation?.studentTargeting?.targetType === 'Section Wise' && (
                    <Button
                        onClick={handleManualRepopulate}
                        variant="outlined"
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
                        {t('information.form.forceRepopulate')}
                    </Button>
                )}
            </Box>

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
                                </Box>

                                {/* Existing Attachments */}
                                {existingAttachments.length > 0 && (
                                    <Box mb={2}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: themeColors.text.primary, fontWeight: 'bold' }}>
                                            {t('information.form.existingAttachments')}
                                        </Typography>
                                        <List>
                                            {existingAttachments.map((attachment, index) => (
                                                <ListItem 
                                                    key={`existing-${index}`} 
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
                                                        primary={attachment.originalName}
                                                        secondary={`${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`}
                                                        primaryTypographyProps={{ color: themeColors.text.primary }}
                                                        secondaryTypographyProps={{ color: themeColors.text.secondary }}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton 
                                                            onClick={() => removeExistingAttachment(index)} 
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
                                    </Box>
                                )}

                                {/* New Attachments */}
                                {selectedFiles.length > 0 && (
                                    <Box mb={2}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: themeColors.text.primary, fontWeight: 'bold' }}>
                                            {t('information.form.newAttachments')}
                                        </Typography>
                                        <List>
                                            {selectedFiles.map((file, index) => (
                                                <ListItem 
                                                    key={`new-${index}`} 
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
                                    </Box>
                                )}

                                {/* Show message if no attachments */}
                                {existingAttachments.length === 0 && selectedFiles.length === 0 && (
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, fontStyle: 'italic' }}>
                                        {t('information.form.noAttachments')}
                                    </Typography>
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
                                            {console.log('Rendering Student Targeting section, publishTo:', publishTo)}
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
                                                    {console.log('Rendering grade selection for Section Wise, targetType:', targetType, 'grades:', grades)}
                                                    {console.log('Current form grade value:', watchedValues.studentTargeting?.grade)}
                                                    {console.log('Available grades:', grades?.data)}
                                                    <CustomSelect
                                                        key={`grade-select-${grades?.data?.length || 0}-${watchedValues.studentTargeting?.grade || 'empty'}`}
                                                        fieldName="studentTargeting.grade"
                                                        control={control}
                                                        fieldLabel={t('information.form.grade')}
                                                        error={errors.studentTargeting?.grade}
                                                        onChangeValue={(value) => {
                                                            console.log('Grade changed to:', value);
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
                                                    {console.log('Rendering section selection, sections data:', sections, 'form sections:', watchedValues.studentTargeting?.sections)}
                                                    {console.log('Available sections for selection:', sections?.data)}
                                                    {console.log('Current form value for sections:', watchedValues.studentTargeting?.sections)}
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
                                            disabled={loading || updateLoading}
                                            startIcon={(loading || updateLoading) ? <CircularProgress size={20} /> : <ICONS.Save.component />}
                                            sx={{ 
                                                backgroundColor: themeColors.primary,
                                                color: themeColors.text.inverse,
                                                '&:hover': {
                                                    backgroundColor: themeColors.primary,
                                                    opacity: 0.9
                                                }
                                            }}
                                        >
                                            {(loading || updateLoading) ? t('information.form.updating') : t('information.form.updateButton')}
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

export default EditInformationScreen;
