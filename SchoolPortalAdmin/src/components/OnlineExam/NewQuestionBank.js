import React, { useEffect, useState, useMemo } from 'react'
import CustomModal from '../Common/CustomModal'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { array, object } from "yup";
import * as yup from "yup";
import { useSnackbar } from '../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGrade, updateGrade } from '../../api/grade';
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput } from '@mui/material';
import CustomInput from '../Common/CustomInput';
import CustomButton from '../Common/CustomButton';
import { newExam, newQuestionBank, updateExam, updateQuestionBank } from '../../api/onlineExam';
import { useTranslation } from 'react-i18next';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const NewQuestionBank = ({
  close,
  open,
  label,
  hide,
  data,
  subjects,
  selectedSubject,
  onSubjectSelect,
  gradeOptions = [],
}) => {

	const { t } = useTranslation();
	const showSnackbar = useSnackbar();
	const queryClient = useQueryClient();

	const schema = useMemo(() => object().shape({
		questionBankName: yup.string().required(t('onlineExam.newQuestionBank.validation.questionBankNameRequired')),
		subject: yup.string().required(t('onlineExam.newQuestionBank.validation.subjectRequired')),
		grades: array().min(1, t('onlineExam.newQuestionBank.validation.gradeRequired')),
	}), [t]);

	const {
		handleSubmit,
		control,
		setValue,
		setError,
		reset,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			questionBankName: '',
			subject: '',
			grades: []
		}
	});

	useEffect(() => {
		if (data) {
			setValue('questionBankName', data?.questionBankName);
			setValue('subject', data?.subject?._id || data?.subject);
		}
	}, [data, setValue]);

	const [selectedGrades, setSelectedGrades] = useState([]);

	useEffect(() => {
		if (data?.grades) {
			const gradeIds = data.grades.map((grade) => (grade?._id ? grade._id : grade));
			setSelectedGrades(gradeIds);
			setValue('grades', gradeIds);
		} else {
			setSelectedGrades([]);
			setValue('grades', []);
		}
	}, [data, setValue]);

	const { mutate, isPending } = useMutation({
		mutationFn: data ? updateQuestionBank : newQuestionBank,
		onSuccess: async (data) => {
			showSnackbar(data ? t('onlineExam.newQuestionBank.messages.updateSuccess') : t('onlineExam.newQuestionBank.messages.createSuccess'), 'success');
			await queryClient.invalidateQueries({ queryKey: ['allQuestionBanks'] })
			close()
		},
		onError: (error, variables, context) => {
			showSnackbar(error?.message, 'error');
		},
	});

	const handleGradeSelection = (event) => {
		const {
			target: { value },
		} = event;
		const nextGrades = typeof value === 'string' ? value.split(',') : value;
		setSelectedGrades(nextGrades);
		setValue('grades', nextGrades);
	};

	const SubmitForm = (datas) => {
		const value = {
			questionBankName: datas?.questionBankName,
			subject: datas?.subject,
			grades: datas?.grades
		}

		if (data) {
			value['id'] = data?._id
		}
		console.log({value})
		mutate(value)
	}

	return (
		<CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
			<Grid container spacing={2}>
				<Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
					<FormControl fullWidth>
						<InputLabel>{t('onlineExam.newQuestionBank.fieldLabel.subject')}</InputLabel>
						<Select
							value={selectedSubject}
							onChange={(e) => {
								onSubjectSelect(e);
								setValue('subject', e.target.value);
							}}
							label={t('onlineExam.newQuestionBank.fieldLabel.subject')}
						>
							<MenuItem value="">
								<em>{t('onlineExam.newQuestionBank.placeholder.selectSubject')}</em>
							</MenuItem>
							{subjects?.map((subject) => (
								<MenuItem key={subject._id} value={subject._id}>
									{subject.subjectName}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
					<FormControl fullWidth>
						<InputLabel>{t('onlineExam.newQuestionBank.fieldLabel.grades')}</InputLabel>
						<Select
							multiple
							value={selectedGrades}
							onChange={handleGradeSelection}
							input={<OutlinedInput label={t('onlineExam.newQuestionBank.fieldLabel.grades')} />}
							renderValue={(selected) => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map((value) => {
										const grade = gradeOptions.find((item) => item._id === value);
										return <Chip key={value} label={grade?.gradeName || grade?.name || value} size="small" />;
									})}
								</Box>
							)}
							MenuProps={MenuProps}
						>
							{gradeOptions?.map((grade) => (
								<MenuItem key={grade._id} value={grade._id}>
									{grade.gradeName}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
					<CustomInput
						placeholder={t('onlineExam.newQuestionBank.placeholder.questionBankName')}
						readonly={hide}
						control={control}
						error={errors.questionBankName}
						fieldName="questionBankName"
						fieldLabel={t('onlineExam.newQuestionBank.fieldLabel.questionBankName')}
					/>
				</Grid>
			</Grid>
			{!hide &&
				<Box px={20} py={4} >
					<CustomButton
						onClick={handleSubmit(SubmitForm)}
						width="100%"
						label={isPending ? t('onlineExam.newQuestionBank.actions.loading') : (data ? t('onlineExam.newQuestionBank.actions.update') : t('onlineExam.newQuestionBank.actions.create'))}
						isIcon={false}
					/>
				</Box>
			}
		</CustomModal>
	)
}

export default NewQuestionBank