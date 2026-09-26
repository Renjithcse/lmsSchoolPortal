import React, { useEffect, useMemo } from 'react';
import { Grid, MenuItem, Box } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object } from 'yup';
import * as yup from 'yup';

import CustomModal from '../../Common/CustomModal';
import CustomSelect from '../../Common/CustomSelect';
import CustomButton from '../../Common/CustomButton';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

import { useGetAllTeachersQuery, useSetClassTeacherMutation } from '../../../Redux/features/Admin/GradeSubject';

const ClassTeacherModal = ({ open, close, label, filters, currentTeacherId }) => {
  const { t } = useTranslation();
  const showSnackbar = useSnackbar();
  const ability = useAbility();

  const schema = useMemo(
    () =>
      object().shape({
        teacher: yup.string().required(t('gradeSubject.classTeacher.validation.teacherRequired')),
      }),
    [t]
  );

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { teacher: '' },
  });

  // Fetch all teachers (name + id)
  const { data: teachersData, isLoading: isLoadingTeachers } = useGetAllTeachersQuery(
    {},
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const [triggerSave, { isLoading: isSaving }] = useSetClassTeacherMutation();

  useEffect(() => {
    if (open) {
      reset({ teacher: currentTeacherId || '' });
    } else {
      reset({ teacher: '' });
    }
  }, [open, currentTeacherId, reset]);

  const onSubmit = async (data) => {
    if (!filters?.grade || !filters?.gender || !filters?.section) {
      showSnackbar(t('gradeSubject.classTeacher.messages.missingFilters'), 'error');
      return;
    }

    const payload = {
      grade: filters.grade,
      gender: filters.gender,
      section: filters.section,
      teacher: data.teacher,
    };

    const res = await triggerSave(payload);
    if (res?.error) {
      showSnackbar(res?.error?.data?.message || t('gradeSubject.classTeacher.messages.error'), 'error');
      return;
    }

    showSnackbar(t('gradeSubject.classTeacher.messages.success'), 'success');
    close();
  };

  return (
    <CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CustomSelect
            control={control}
            error={errors.teacher}
            fieldName="teacher"
            fieldLabel={t('gradeSubject.classTeacher.fields.teacher')}
            size="16px"
          >
            <MenuItem value="" disabled>
              <em>{t('gradeSubject.classTeacher.placeholders.selectTeacher')}</em>
            </MenuItem>
            {teachersData?.data?.map((teacher) => (
              <MenuItem key={teacher._id} value={teacher._id}>
                {teacher.employeeId ? `${teacher.employeeId} - ${teacher.employeeName}` : teacher.employeeName}
              </MenuItem>
            ))}
          </CustomSelect>
          {isLoadingTeachers && (
            <Box sx={{ mt: 1, color: 'text.secondary', fontSize: '14px' }}>
              {t('gradeSubject.classTeacher.loading.teachers')}
            </Box>
          )}
        </Grid>
      </Grid>

      <Box px={20} py={4}>
        {ability.can('Edit', 'GradeSubject') && (
          <CustomButton
            onClick={handleSubmit(onSubmit)}
            width="90%"
            label={t('gradeSubject.classTeacher.actions.save')}
            isIcon={false}
            loading={isSaving || isLoadingTeachers}
          />
        )}
      </Box>
    </CustomModal>
  );
};

export default ClassTeacherModal;

