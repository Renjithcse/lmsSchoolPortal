import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, get, useFieldArray, set } from 'react-hook-form';
import { useState } from 'react';
import { 
    Box, 
    Button, 
    FormControl, 
    FormControlLabel, 
    FormLabel, 
    Grid, 
    MenuItem, 
    Radio, 
    RadioGroup, 
    Typography,
    Card,
    CardContent,
    Divider,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import { 
    Add as AddIcon,
    Delete as DeleteIcon,
    Quiz as QuizIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import CustomSelect from '../Common/CustomSelect';
import CustomTextArea from '../Common/CustomTextArea';
import CustomInput from '../Common/CustomInput';
import ImagePicker from '../Inputs/ImagePicker';
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { convertToBase64 } from '../../helpers/ImageHelper';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { newQuestion } from '../../api/onlineExam';
import UiBlocker from '../Common/UiBlocker';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const NewQuestion = () => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    
    const questionSchema = useMemo(() => yup.object().shape({
        questionType: yup.string().required(t('onlineExam.newQuestion.validation.questionTypeRequired')),
        questionText: yup.string().required(t('onlineExam.newQuestion.validation.questionTextRequired')),
        questionImage: yup.mixed().nullable(true),
        marks: yup
            .number()
            .required(t('onlineExam.newQuestion.validation.marksRequired'))
            .min(1, t('onlineExam.newQuestion.validation.marksMin')).typeError(t('onlineExam.newQuestion.validation.marksNumber')),
        correctAnswer: yup.string().required(t('onlineExam.newQuestion.validation.correctAnswerRequired')),
    }), [t]);

    const objectSchema = useMemo(() => yup.object().shape({
        questionType: yup.string().required(t('onlineExam.newQuestion.validation.questionTypeRequired')),
        questionText: yup.string().required(t('onlineExam.newQuestion.validation.questionTextRequired')),
        questionImage: yup.mixed().nullable(true),
        marks: yup
            .number()
            .required(t('onlineExam.newQuestion.validation.marksRequired'))
            .min(1, t('onlineExam.newQuestion.validation.marksMin')).typeError(t('onlineExam.newQuestion.validation.marksNumber')),
        correctAnswer: yup.string().required(t('onlineExam.newQuestion.validation.correctAnswerRequired')),
        options: yup.array(
            yup.object({
                type: yup.string().required(t('onlineExam.newQuestion.validation.optionTypeRequired')),
                value: yup.mixed().required(t('onlineExam.newQuestion.validation.optionValueRequired')),
            })
        ).min(2, t('onlineExam.newQuestion.validation.minOptionsRequired')).required(t('onlineExam.newQuestion.validation.optionsRequired')),
    }), [t]);

    const [currentSchema, setCurrentSchema] = useState(questionSchema);
    const [defaults, setDefaults] = useState(null);

    const location = useLocation();
    const navigate = useNavigate()
    const showSnackbar = useSnackbar();

    const queryClient = useQueryClient()

    const { mutate, isPending } = useMutation({
		mutationFn: newQuestion,
		onSuccess: async (data) => {
			showSnackbar(t('onlineExam.newQuestion.messages.createSuccess'), 'success');
			await queryClient.invalidateQueries({ queryKey: ['questionBank', location?.state?._id] })
			navigate(-1);
		},
		onError: (error, variables, context) => {
			showSnackbar(error?.message, 'error');
		},
	});


    const [objectives, setObjectives] = useState([
        { type: "text", value: "" },
        { type: "text", value: "" },
        { type: "text", value: "" },
        { type: "text", value: "" },
    ])

    const questionTypes = useMemo(() => [
        { label: t('onlineExam.newQuestion.questionTypes.objective'), value: "objective" },
        { label: t('onlineExam.newQuestion.questionTypes.fillInTheBlanks'), value: "fill-in-the-blanks" },
        { label: t('onlineExam.newQuestion.questionTypes.trueFalse'), value: "true/false" },
    ], [t])

    const objectiveDefaults = {
        questionType: "",
        questionText: "",
        questionImage: null,
        marks: "",
        correctAnswer: "",
        options: objectives,
    }

    const otherDefaults = {
        questionType: "",
        questionText: "",
        questionImage: null,
        marks: "",
        correctAnswer: "",
    }


    const {
        control,
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: defaults,
        resolver: yupResolver(currentSchema),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "options",
    });

    const questionType = watch("questionType");

    useEffect(() => {
        if (questionType === "objective") {
            setCurrentSchema(objectSchema);
            setDefaults(objectiveDefaults)
        }
        else {
            setCurrentSchema(questionSchema);
            setDefaults(otherDefaults)
        }
    }, [questionType])

    // Reset correct answer when options change
    useEffect(() => {
        if (questionType === "objective") {
            const validOptionsCount = fields.filter((field, index) => {
                const optionValue = watch(`options.${index}.value`);
                const optionType = watch(`options.${index}.type`);
                
                // Safety check for undefined values
                if (!optionValue || !optionType) {
                    return false;
                }
                
                return optionType === 'text' ? optionValue.trim() !== '' : optionValue;
            }).length;

            const currentCorrectAnswer = watch('correctAnswer');
            if (currentCorrectAnswer && typeof currentCorrectAnswer === 'string') {
                const correctAnswerIndex = currentCorrectAnswer.charCodeAt(0) - 65;
                if (correctAnswerIndex >= validOptionsCount) {
                    setValue('correctAnswer', '');
                }
            }
        }
    }, [fields, questionType, watch, setValue])

    // console.log({location})



    const onSubmit = async(data) => {
        if(questionType === "objective") {
            // Filter out options with empty values
            const validOptions = data.options?.filter(option => {
                // Safety check for undefined option
                if (!option || !option.type || !option.value) {
                    return false;
                }
                
                if (option.type === 'text') {
                    return option.value && option.value.trim() !== '';
                }
                return option.value; // For image type
            }) || [];

            // Validate that we have at least 2 options
            if (validOptions.length < 2) {
                showSnackbar(t('onlineExam.newQuestion.messages.minOptionsRequired'), 'error');
                return;
            }

            // Validate that the correct answer corresponds to a valid option
            const correctAnswerIndex = data.correctAnswer ? data.correctAnswer.charCodeAt(0) - 65 : -1;
            if (correctAnswerIndex < 0 || correctAnswerIndex >= validOptions.length) {
                showSnackbar(t('onlineExam.newQuestion.messages.selectValidAnswer'), 'error');
                return;
            }

            let datas = {
                ...data,
                options: validOptions,
                questionBank: location?.state?.questionBank?._id
            }

            mutate(datas)
        }
        else{
            delete data.options;
            let datas = {
                ...data,
                questionBank: location?.state?._id
            }
            mutate(datas)
        }
    };

    console.log({ errors })

    return (
        <Box sx={{ 
            backgroundColor: themeColors.background.primary,
            minHeight: '100vh',
            p: 3
        }}>
            {/* Header */}
            <Box sx={{ 
                mb: 3,
                p: 3,
                backgroundColor: themeColors.background.secondary,
                borderRadius: 2,
                border: `1px solid ${themeColors.border.primary}`
            }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <QuizIcon sx={{ color: themeColors.primary, fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" sx={{ 
                            color: themeColors.text.primary,
                            fontWeight: 600
                        }}>
                            {t('onlineExam.newQuestion.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                            color: themeColors.text.secondary 
                        }}>
                            {t('onlineExam.newQuestion.subtitle')}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Card sx={{ 
                backgroundColor: themeColors.background.secondary,
                border: `1px solid ${themeColors.border.primary}`,
                borderRadius: 2
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                {/* Question Type */}
                <Grid item xs={12}>
                    <CustomSelect
                        control={control}
                        error={errors.questionType}
                        fieldName="questionType"
                        fieldLabel={t('onlineExam.newQuestion.fieldLabel.questionType')}
                        size="16px"
                    >
                        {questionTypes?.map((res) => (
                            <MenuItem key={res.value} value={res.value}>
                                {res.label}
                            </MenuItem>
                        ))}
                    </CustomSelect>
                </Grid>

                {/* Question Text */}
                <Grid item xs={12} md={9}>
                    <CustomTextArea
                        readOnly={false}
                        control={control}
                        error={errors.questionText}
                        fieldName="questionText"
                        multiline={true}
                        height={90}
                        row={10}
                        fieldLabel={t('onlineExam.newQuestion.fieldLabel.question')}
                    />
                </Grid>

                {/* Question Image */}
                <Grid item xs={12} md={3}>
                    <ImagePicker
                        control={control}
                        fieldName="questionImage"
                        fieldLabel={t('onlineExam.newQuestion.fieldLabel.questionImage')}
                    />
                </Grid>

                {/* Options */}
                {questionType === "objective" &&
                    fields.map((field, index) => (
                        <Grid item xs={12} md={6} key={field.id}>
                            <Box display="flex" flexDirection="column" gap={2}>
                                {/* Option Label */}
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Chip 
                                        label={t('onlineExam.newQuestion.optionLabel', { letter: String.fromCharCode(65 + index) })}
                                        sx={{
                                            backgroundColor: themeColors.primary,
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </Box>

                                {/* Option Type */}
                                <Controller
                                    name={`options.${index}.type`}
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            {...field}
                                            row
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                setValue(`options.${index}.type`, e.target.value);
                                            }}
                                        >
                                            <FormControlLabel
                                                value="text"
                                                control={
                                                    <Radio
                                                        sx={{
                                                            color: themeColors.primary,
                                                            "&.Mui-checked": { color: themeColors.primary },
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography sx={{ color: themeColors.text.primary }}>
                                                        {t('onlineExam.newQuestion.optionType.text')}
                                                    </Typography>
                                                }
                                            />
                                            <FormControlLabel
                                                value="image"
                                                control={
                                                    <Radio
                                                        sx={{
                                                            color: themeColors.primary,
                                                            "&.Mui-checked": { color: themeColors.primary },
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography sx={{ color: themeColors.text.primary }}>
                                                        {t('onlineExam.newQuestion.optionType.image')}
                                                    </Typography>
                                                }
                                            />
                                        </RadioGroup>
                                    )}
                                />

                                {/* Dynamic Input Based on Type */}
                                {watch(`options.${index}.type`) === "text" ? (
                                    <CustomInput
                                        placeholder={t('onlineExam.newQuestion.placeholder.enterOptionText', { letter: String.fromCharCode(65 + index) })}
                                        control={control}
                                        fieldName={`options.${index}.value`}
                                        error={errors.options?.[index]?.value}
                                        fieldLabel={t('onlineExam.newQuestion.fieldLabel.optionText', { letter: String.fromCharCode(65 + index) })}
                                    />
                                ) : (
                                    <Box>
                                        <Typography sx={{ 
                                            color: themeColors.text.primary,
                                            mb: 1,
                                            fontWeight: 600
                                        }}>
                                            {t('onlineExam.newQuestion.fieldLabel.optionImage', { letter: String.fromCharCode(65 + index) })}
                                        </Typography>
                                        <ImagePicker
                                            control={control}
                                            fieldName={`options.${index}.value`}
                                        />
                                    </Box>
                                )}

                                {/* Remove Option */}
                                <Button
                                    variant="outlined"
                                    onClick={() => remove(index)}
                                    startIcon={<DeleteIcon />}
                                    sx={{
                                        borderColor: themeColors.error,
                                        color: themeColors.error,
                                        '&:hover': {
                                            borderColor: themeColors.error,
                                            backgroundColor: `${themeColors.error}10`
                                        }
                                    }}
                                >
                                    {t('onlineExam.newQuestion.actions.removeOption', { letter: String.fromCharCode(65 + index) })}
                                </Button>
                            </Box>
                        </Grid>
                    ))}

                {/* Add Option */}
                {questionType === "objective" && (
                    <Grid item xs={12} md={12}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => append({ type: "text", value: "" })}
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: themeColors.accent
                                }
                            }}
                        >
                            {t('onlineExam.newQuestion.actions.addOption')}
                        </Button>
                    </Grid>
                )}
                {/* Correct Answer Dropdown */}
                {questionType === "objective" && (
                    <Grid item xs={12} md={6}>
                        <CustomSelect
                            control={control}
                            error={errors.correctAnswer}
                            fieldName="correctAnswer"
                            fieldLabel={t('onlineExam.newQuestion.fieldLabel.correctAnswer')}
                            onChangeValue={(value) => {
                                try {
                                    console.log({value})
                                    // Handle both direct value and event object
                                    let actualValue = value;
                                    
                                    // If it's an event object, extract the value
                                    if (value && typeof value === 'object' && value.target) {
                                        actualValue = value.target.value;
                                    }
                                    
                                    // Additional safety check for event object without target
                                    if (value && typeof value === 'object' && !value.target && value.value !== undefined) {
                                        actualValue = value.value;
                                    }
                                    
                                    // Safety check for undefined or null values
                                    if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
                                        setValue("correctAnswer", actualValue);
                                    }
                                } catch (error) {
                                    console.error('Error in onChangeValue:', error);
                                    // Fallback: try to set the value directly if it's a string
                                    if (typeof value === 'string' && value !== '') {
                                        setValue("correctAnswer", value);
                                    }
                                }
                            }}
                        >
                            {fields.map((field, index) => {
                                // Check if the option has a valid value before rendering
                                const optionValue = watch(`options.${index}.value`);
                                const optionType = watch(`options.${index}.type`);
                                
                                // Safety check for undefined values
                                if (!optionValue || !optionType) {
                                    return null;
                                }
                                
                                // Only show options that have valid values
                                if (optionType === 'text' ? optionValue.trim() !== '' : optionValue) {
                                    return (
                                        <MenuItem key={field.id} value={String.fromCharCode(65 + index)}>
                                            {t('onlineExam.newQuestion.optionLabel', { letter: String.fromCharCode(65 + index) })}
                                        </MenuItem>
                                    );
                                }
                                return null;
                            })}
                        </CustomSelect>
                    </Grid>
                )}
                {questionType === "fill-in-the-blanks" && (
                    <Grid item xs={12} md={6}>
                        <Typography sx={{ 
                            color: themeColors.text.primary,
                            mb: 1,
                            fontWeight: 600
                        }}>
                            {t('onlineExam.newQuestion.fieldLabel.answer')}
                        </Typography>
                        <CustomInput
                            control={control}
                            error={errors.correctAnswer}
                            fieldName="correctAnswer"
                            placeholder={t('onlineExam.newQuestion.placeholder.enterCorrectAnswer')}
                        />
                    </Grid>
                )}

                {questionType === "true/false" && (
                    <Grid item xs={12} md={6}>
                        <Typography sx={{ 
                            color: themeColors.text.primary,
                            mb: 1,
                            fontWeight: 600
                        }}>
                            {t('onlineExam.newQuestion.fieldLabel.selectCorrectAnswer')}
                        </Typography>
                        <Controller
                            control={control}
                            name="correctAnswer"
                            render={({ field }) => (
                                <RadioGroup {...field}>
                                    <FormControlLabel
                                        value="true"
                                        control={
                                            <Radio 
                                                sx={{
                                                    color: themeColors.primary,
                                                    '&.Mui-checked': {
                                                        color: themeColors.primary
                                                    }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: themeColors.text.primary }}>
                                                {t('onlineExam.newQuestion.trueFalse.true')}
                                            </Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value="false"
                                        control={
                                            <Radio 
                                                sx={{
                                                    color: themeColors.primary,
                                                    '&.Mui-checked': {
                                                        color: themeColors.primary
                                                    }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: themeColors.text.primary }}>
                                                {t('onlineExam.newQuestion.trueFalse.false')}
                                            </Typography>
                                        }
                                    />
                                </RadioGroup>
                            )}
                        />
                        {errors.correctAnswer?.message && (
                            <Typography
                                role="alert"
                                sx={{
                                    color: themeColors.error,
                                    display: "flex",
                                    flexDirection: "start",
                                    paddingLeft: "10px",
                                    fontSize: "12px",
                                    mt: 1
                                }}
                            >
                                {errors.correctAnswer?.message}
                            </Typography>
                        )}
                    </Grid>
                )}
                <Grid item xs={12} md={6}>
                    <CustomInput
                        control={control}
                        error={errors.marks}
                        fieldName="marks"
                        fieldLabel={t('onlineExam.newQuestion.fieldLabel.marks')}
                        type="number"
                    />
                </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <Box sx={{ 
                mt: 4,
                display: 'flex',
                justifyContent: 'center',
                gap: 2
            }}>
                <Button 
                    onClick={handleSubmit(onSubmit)} 
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ 
                        backgroundColor: themeColors.primary,
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                            backgroundColor: themeColors.accent,
                            transform: 'translateY(-1px)',
                            boxShadow: 2
                        },
                        transition: 'all 0.2s ease-in-out',
                        fontWeight: 600
                    }}
                    disabled={isPending}
                >
                    {isPending ? t('onlineExam.newQuestion.actions.creating') : t('onlineExam.newQuestion.actions.createQuestion')}
                </Button>
            </Box>
            
            <UiBlocker open={isPending} />
        </Box>
    );
};

export default NewQuestion;
