import React, { useEffect, useMemo, useState } from 'react'
import CustomModal from '../Common/CustomModal'
import { useForm, useController } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useSnackbar } from '../../hooks/SnackBar';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Stack
} from '@mui/material';
import CustomInput from '../Common/CustomInput';
import { useAddNewAssignmentMutation, useUpdateAssignmentMutation } from '../../Redux/features/assignmentSlice';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomTextArea from '../Common/CustomTextArea';
import ImagePicker from '../Inputs/ImagePicker';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTranslation } from 'react-i18next';
import { BASE_PATH } from '../../config';

const NewAssignment = ({ open, close, label, hide, id, state, data }) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();
    const showSnackbar = useSnackbar();
    const [questionFileObject, setQuestionFileObject] = useState(null);
    const [removedSupportingDocuments, setRemovedSupportingDocuments] = useState([]);

    const SUPPORTED_ATTACHMENT_TYPES = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const SUPPORTING_DOCUMENTS_ACCEPT = ".jpg,.jpeg,.png,.pdf,.doc,.docx";

    const schema = useMemo(() => object().shape({
        assignmentName: yup.string().required(t('assignments.newAssignment.validation.assignmentNameRequired')),
        questionFile: yup.string(),
        questionText: yup.string().required(t('assignments.newAssignment.validation.questionTextRequired')),
        supportingNotes: yup.string().nullable(),
        supportingDocuments: yup.array().of(
            yup.object({
                fileName: yup.string().required(),
                file: yup.mixed().required(),
            })
        ).default([]),
    }), [t]);

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            assignmentName: data?.assignmentName || '',
            questionText: data?.question || '',
            questionFile: data?.questionFile || '',
            supportingNotes: data?.supportingNotes || '',
            supportingDocuments: []
        }
    });

    const {
        field: { value: supportingDocumentsValue, onChange: onSupportingDocumentsChange },
    } = useController({
        name: 'supportingDocuments',
        control,
        defaultValue: [],
    });
    const supportingDocuments = supportingDocumentsValue || [];
    const savedSupportingDocuments = useMemo(
        () => supportingDocuments.filter((doc) => !doc.file),
        [supportingDocuments]
    );
    const newSupportingDocuments = useMemo(
        () => supportingDocuments.filter((doc) => doc.file),
        [supportingDocuments]
    );
    const initialSupportingDocuments = useMemo(
        () => (data?.supportingDocuments?.map((doc) => ({
            _id: doc._id,
            fileName: doc.fileName,
            filePath: doc.filePath,
        })) || []),
        [data?.supportingDocuments]
    );

    const [triggerAddAssignment, { isLoading }] = useAddNewAssignmentMutation();
    const [triggerUpdateAssignment, { isLoading: isUpdateLoading }] = useUpdateAssignmentMutation();

    // Reset form when modal opens/closes or data changes
    useEffect(() => {
        if (open) {
            // Small delay to ensure modal is fully rendered
            const timer = setTimeout(() => {
                if (data) {
                    // Edit mode - populate form with existing data
                    reset({
                        assignmentName: data?.assignmentName || '',
                        questionText: data?.question || '',
                        questionFile: data?.questionFile || '',
                        supportingNotes: data?.supportingNotes || '',
                        supportingDocuments: [],
                    });
                    onSupportingDocumentsChange(initialSupportingDocuments);
                } else {
                    // Create mode - reset to empty form
                    reset({
                        assignmentName: '',
                        questionText: '',
                        questionFile: '',
                        supportingNotes: '',
                        supportingDocuments: []
                    });
                    onSupportingDocumentsChange([]);
                }
                setQuestionFileObject(null);
                setRemovedSupportingDocuments([]);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [open, data, reset, onSupportingDocumentsChange, initialSupportingDocuments]);

    const handleViewFile = (fileUrl) => {
        if (fileUrl) {
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_PATH}/${fileUrl}`;
            window.open(fullUrl, '_blank');
        }
    };

    const handleDownloadFile = (fileUrl) => {
        if (fileUrl) {
            const link = document.createElement('a');
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_PATH}/${fileUrl}`;
            link.href = fullUrl;
            link.download = fileUrl.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const buildFormPayload = (formValues) => {
        const payload = new FormData();
        payload.append('assignmentName', formValues.assignmentName);
        payload.append('question', formValues.questionText);

        if (formValues.supportingNotes) {
            payload.append('supportingNotes', formValues.supportingNotes);
        }

        const gradeId = state?.grade || data?.grade?._id || data?.grade;
        if (gradeId) {
            payload.append('grade', gradeId);
        }

        const subjectId = state?.subjectId || data?.subjectId?._id || data?.subjectId;
        if (subjectId) {
            payload.append('subjectId', subjectId);
        }

        if (questionFileObject) {
            payload.append('questionFile', questionFileObject);
        }

        supportingDocuments.forEach((doc) => {
            if (doc?.file) {
                payload.append('supportingDocuments', doc.file);
            }
        });

        if (removedSupportingDocuments.length) {
            payload.append('removedSupportingDocuments', JSON.stringify(removedSupportingDocuments));
        }

        return payload;
    };

    const SubmitForm = async (datas) => {
        const payload = buildFormPayload(datas);

        try {
            if (data?._id) {
                // Update existing assignment
                const updateRes = await triggerUpdateAssignment({ id: data._id, data: payload });
                if (updateRes.error) {
                    showSnackbar(t('assignments.newAssignment.messages.updateError'), 'error');
                    return;
                }
                showSnackbar(t('assignments.newAssignment.messages.updateSuccess'), 'success');
                close();
            } else {
                // Create new assignment
                const addRes = await triggerAddAssignment(payload);
                if (addRes.error) {
                    showSnackbar(t('assignments.newAssignment.messages.createError'), 'error');
                    return;
                }
                showSnackbar(t('assignments.newAssignment.messages.createSuccess'), 'success');
                close();
            }
        } catch (error) {
            showSnackbar(t('assignments.newAssignment.messages.genericError'), 'error');
        }
    };

    const handleSupportingDocumentsUpload = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const invalidFile = files.find((file) => !SUPPORTED_ATTACHMENT_TYPES.includes(file.type));
        if (invalidFile) {
            showSnackbar(t('assignments.newAssignment.supportingDocuments.errors.unsupportedFile'), 'error');
            event.target.value = '';
            return;
        }

        const newDocuments = files.map((file) => ({
            fileName: file.name,
            file,
        }));
        onSupportingDocumentsChange([...supportingDocuments, ...newDocuments]);
        event.target.value = '';
    };

    const removeSupportingDocument = (index) => {
        const doc = supportingDocuments[index];
        if (doc && !doc.file && (doc._id || doc.id)) {
            setRemovedSupportingDocuments((prev) => [
                ...prev,
                doc._id || doc.id,
            ]);
        }
        const next = supportingDocuments.filter((_, idx) => idx !== index);
        onSupportingDocumentsChange(next);
    };

    const SectionHeader = ({ icon, title, subtitle }) => (
        <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
                sx={{
                    backgroundColor: `${themeColors.primary}22`,
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeColors.primary
                }}
            >
                {React.cloneElement(icon, {
                    sx: { color: themeColors.primary }
                })}
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

    return (
        <CustomModal close={close} open={open} maxWidth="md" fullWidth>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary }}>
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={3}
                    sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
                >
                    <Box
                        sx={{
                            backgroundColor: `${themeColors.primary}22`,
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: themeColors.primary
                        }}
                    >
                        <AssignmentIcon />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {label || (data?._id ? t('assignments.modal.edit') : t('assignments.modal.new'))}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {data?._id ? t('assignments.newAssignment.subtitle.edit') : t('assignments.newAssignment.subtitle.create')}
                        </Typography>
                    </Box>
                </Box>

                <form>
                    {/* Basic Information */}
                    <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <SectionHeader
                                icon={<AssignmentIcon />}
                                title={t('assignments.newAssignment.sections.basicInformation.title')}
                                subtitle={t('assignments.newAssignment.sections.basicInformation.subtitle')}
                            />

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <CustomInput
                                        placeholder={t('assignments.newAssignment.placeholders.assignmentName')}
                                        control={control}
                                        error={errors.assignmentName}
                                        fieldName="assignmentName"
                                        fieldLabel={t('assignments.newAssignment.fields.assignmentName')}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <ImagePicker
                                        fieldName={"questionFile"}
                                        control={control}
                                        fieldLabel={t('assignments.newAssignment.fields.questionFile')}
                                        accept="image/*,.pdf,.doc,.docx"
                                        supportedFiles={SUPPORTED_ATTACHMENT_TYPES}
                                        onChangeFile={setQuestionFileObject}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Question Details */}
                    <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <SectionHeader
                                icon={<DescriptionIcon />}
                                title={t('assignments.newAssignment.sections.questionDetails.title')}
                                subtitle={t('assignments.newAssignment.sections.questionDetails.subtitle')}
                            />

                            <CustomTextArea
                                readOnly={false}
                                control={control}
                                error={errors.questionText}
                                fieldName="questionText"
                                multiline={true}
                                height={120}
                                rows={8}
                                fieldLabel={t('assignments.newAssignment.fields.questionText')}
                                placeholder={t('assignments.newAssignment.placeholders.questionText')}
                            />
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <SectionHeader
                                icon={<CloudUploadIcon />}
                                title={t('assignments.newAssignment.supportingDocuments.section.title')}
                                subtitle={t('assignments.newAssignment.supportingDocuments.section.subtitle')}
                            />
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <CustomTextArea
                                        readOnly={false}
                                        control={control}
                                        fieldName="supportingNotes"
                                        fieldLabel={t('assignments.newAssignment.supportingDocuments.fields.notes')}
                                        placeholder={t('assignments.newAssignment.supportingDocuments.placeholders.notes')}
                                        rows={4}
                                        height={100}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <input
                                        id="supportingDocuments-upload"
                                        type="file"
                                        hidden
                                        multiple
                                        accept={SUPPORTING_DOCUMENTS_ACCEPT}
                                        onChange={handleSupportingDocumentsUpload}
                                    />
                                    <label htmlFor="supportingDocuments-upload">
                                        <Button
                                            variant="contained"
                                            component="span"
                                            startIcon={<CloudUploadIcon />}
                                            sx={{
                                                backgroundColor: themeColors.primary,
                                                '&:hover': {
                                                    backgroundColor: themeColors.accent
                                                }
                                            }}
                                        >
                                            {t('assignments.newAssignment.supportingDocuments.actions.upload')}
                                        </Button>
                                    </label>
                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: themeColors.text.secondary }}>
                                        {t('assignments.newAssignment.supportingDocuments.acceptedFormats')}
                                    </Typography>
                                    {savedSupportingDocuments.length > 0 && (
                                        <Box display="flex" flexDirection="column" gap={1} mt={2}>
                                            {savedSupportingDocuments.map((doc, idx) => (
                                                <Box
                                                    key={`${doc.fileName}-${idx}`}
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    sx={{
                                                        border: `1px dashed ${themeColors.border.primary}`,
                                                        borderRadius: 2,
                                                        p: 2,
                                                        backgroundColor: themeColors.background.secondary,
                                                    }}
                                                >
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <AttachFileIcon fontSize="small" sx={{ color: themeColors.text.secondary }} />
                                                        <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                            {doc.fileName || doc.filePath?.split('/').pop()}
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<VisibilityIcon />}
                                                            onClick={() => handleViewFile(doc.filePath)}
                                                            sx={{
                                                                color: themeColors.primary,
                                                                borderColor: themeColors.primary,
                                                                '&:hover': {
                                                                    backgroundColor: themeColors.primary,
                                                                    color: '#fff'
                                                                }
                                                            }}
                                                        >
                                                            {t('assignments.view.actions.viewFile')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<DownloadIcon />}
                                                            onClick={() => handleDownloadFile(doc.filePath)}
                                                            sx={{
                                                                color: themeColors.accent,
                                                                borderColor: themeColors.accent,
                                                                '&:hover': {
                                                                    backgroundColor: themeColors.accent,
                                                                    color: '#fff'
                                                                }
                                                            }}
                                                        >
                                                            {t('assignments.view.actions.download')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="error"
                                                            onClick={() => removeSupportingDocument(supportingDocuments.indexOf(doc))}
                                                            sx={{ minWidth: 0 }}
                                                        >
                                                            {t('assignments.newAssignment.supportingDocuments.actions.remove')}
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    {newSupportingDocuments.length > 0 && (
                                        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                            {newSupportingDocuments.map((doc, idx) => (
                                                <Chip
                                                    key={`${doc.fileName}-${idx}`}
                                                    label={doc.fileName || `${t('assignments.newAssignment.supportingDocuments.fields.documents')} ${idx + 1}`}
                                                    onDelete={() => removeSupportingDocument(supportingDocuments.indexOf(doc))}
                                                    variant="outlined"
                                                    sx={{ borderColor: themeColors.border.primary }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                        <Button
                            variant="outlined"
                            onClick={close}
                            sx={{
                                color: themeColors.text.secondary,
                                borderColor: themeColors.border.primary,
                                px: 3,
                                py: 1.5,
                                '&:hover': {
                                    borderColor: themeColors.primary,
                                    color: themeColors.primary
                                }
                            }}
                        >
                            {t('assignments.newAssignment.actions.cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            type="button"
                            onClick={handleSubmit(SubmitForm)}
                            disabled={isLoading || isUpdateLoading}
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: '#fff',
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                    backgroundColor: themeColors.accent,
                                },
                                '&:disabled': {
                                    backgroundColor: themeColors.background.secondary
                                }
                            }}
                        >
                            {isLoading || isUpdateLoading ? t('assignments.newAssignment.actions.saving') : (data?._id ? t('assignments.newAssignment.actions.update') : t('assignments.newAssignment.actions.create'))}
                        </Button>
                    </Box>
                </form>
            </Box>
        </CustomModal>
    )
}

export default NewAssignment