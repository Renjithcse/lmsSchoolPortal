import React, { useEffect, useMemo, useState } from 'react';
import { Box, Breadcrumbs, Card, CardContent, Grid, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object } from 'yup';
import * as yup from 'yup';
import { capitalize } from 'lodash-es';

import CustomButton from '../../components/Common/CustomButton';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTranslation } from 'react-i18next';

import {
  useCreateClassFeedbackMutation,
  useGetMyClassTeacherClassesQuery,
  useGetStudentsForClassTeacherQuery,
} from '../../Redux/features/Feedback/ClassFeedbackSlice';
import {
  useLazyGetMyGradePermissionsQuery,
  useLazyGetMyGenderPermissionsQuery,
  useLazyGetMySectionPermissionsQuery,
} from '../../Redux/features/Admin/TeachersSlice';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setClassFeedbackType, setSelectedClassTeacherId, setGradeId, setGender, setSectionId } from '../../Redux/features/Feedback/classFeedbackFilterSlice';

const ClassFeedback = () => {
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAdmin = useSelector((state) => state.auth.role === 'admin');
  const selectedClassTeacherId = useSelector((state) => state.classFeedbackFilters.selectedClassTeacherId);
  const gradeId = useSelector((state) => state.classFeedbackFilters.gradeId);
  const gender = useSelector((state) => state.classFeedbackFilters.gender);
  const sectionId = useSelector((state) => state.classFeedbackFilters.sectionId);
  const type = useSelector((state) => state.classFeedbackFilters.type);
  const [selectedAcademicStudentIds, setSelectedAcademicStudentIds] = useState([]);

  // Teacher: get class teacher classes
  const { data: classesRes, isLoading: isClassesLoading } = useGetMyClassTeacherClassesQuery(undefined, {
    skip: isAdmin,
  });
  const classes = classesRes?.data || [];

  // Admin: get grades/genders/sections
  const [triggerGrades, { data: gradesRes, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
  const [triggerGender, { data: gendersRes, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
  const [triggerSections, { data: sectionsRes, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

  const grades = gradesRes?.data || [];
  const genders = gendersRes?.data || [];
  const sections = sectionsRes?.data || [];

  // Get students based on role
  const studentsQueryParams = isAdmin
    ? { grade: gradeId, gender, section: sectionId }
    : { classTeacherId: selectedClassTeacherId };

  const { data: studentsRes, isLoading: isStudentsLoading, refetch: refetchStudents } =
    useGetStudentsForClassTeacherQuery(studentsQueryParams, {
      skip: isAdmin ? !gradeId || !gender || !sectionId : !selectedClassTeacherId,
      refetchOnMountOrArgChange: true,
    });

  const students = studentsRes?.data || [];

  // Admin: load grades on mount
  useEffect(() => {
    if (isAdmin) {
      triggerGrades();
    }
  }, [isAdmin, triggerGrades]);

  // Admin: load genders when grade changes
  useEffect(() => {
    if (isAdmin && gradeId) {
      setSelectedAcademicStudentIds([]);
      triggerGender({ grade: gradeId });
    }
  }, [isAdmin, gradeId, triggerGender]);

  // Admin: load sections when grade and gender change
  useEffect(() => {
    if (isAdmin && gradeId && gender) {
      setSelectedAcademicStudentIds([]);
      triggerSections({ grade: gradeId, gender });
    }
  }, [isAdmin, gradeId, gender, triggerSections]);

  const schema = useMemo(
    () =>
      object().shape({
        feedback: yup.string().trim().required(t('feedback.class.validation.feedbackRequired')),
      }),
    [t]
  );

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { feedback: '', feedbackDate: new Date().toISOString().slice(0, 10) },
  });

  const [triggerCreate, { isLoading: isSaving }] = useCreateClassFeedbackMutation();

  // Teacher: refetch students when class changes
  useEffect(() => {
    if (!isAdmin) {
      setSelectedAcademicStudentIds([]);
      reset((prev) => ({ ...prev, feedback: '' }));
      if (selectedClassTeacherId) {
        refetchStudents();
      }
    }
  }, [isAdmin, selectedClassTeacherId, reset, refetchStudents]);

  // Admin: refetch students when filters change
  useEffect(() => {
    if (isAdmin && gradeId && gender && sectionId) {
      setSelectedAcademicStudentIds([]);
      reset((prev) => ({ ...prev, feedback: '' }));
      refetchStudents();
    }
  }, [isAdmin, gradeId, gender, sectionId, reset, refetchStudents]);

  const onSubmit = async (data) => {
    if (isAdmin) {
      if (!gradeId || !gender || !sectionId) {
        showSnackbar(t('feedback.class.messages.selectClassFirst'), 'error');
        return;
      }
    } else {
      if (!selectedClassTeacherId) {
        showSnackbar(t('feedback.class.messages.selectClassFirst'), 'error');
        return;
      }
    }
    if (!selectedAcademicStudentIds.length) {
      showSnackbar(t('feedback.class.messages.selectStudentFirst'), 'error');
      return;
    }

    const baseData = isAdmin
      ? {
          grade: gradeId,
          gender,
          section: sectionId,
          feedback: data.feedback,
          feedbackDate: data.feedbackDate,
          type,
        }
      : {
          classTeacherId: selectedClassTeacherId,
          feedback: data.feedback,
          feedbackDate: data.feedbackDate,
          type,
        };

    for (const academicStudentId of selectedAcademicStudentIds) {
      const res = await triggerCreate({
        ...baseData,
        academicStudentId,
      });
      if (res?.error) {
        showSnackbar(res?.error?.data?.message || t('feedback.class.messages.error'), 'error');
        return;
      }
    }

    showSnackbar(t('feedback.class.messages.success'), 'success');
    // After adding, go back to list (filter stays in RTK store)
    navigate('/feedback/class');
  };

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
        <Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
          <Link
            underline="hover"
            sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
            onClick={() => navigate('/feedback')}
          >
            {t('feedback.breadcrumbs.feedback')}
          </Link>
          <Link
            underline="hover"
            sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
            onClick={() => navigate('/feedback/class')}
          >
            {t('feedback.breadcrumbs.classFeedback')} • {t('feedback.breadcrumbs.list')}
          </Link>
          <Typography sx={{ color: themeColors.text.primary }}>{t('feedback.breadcrumbs.new')}</Typography>
        </Breadcrumbs>

        <Box mb={2}>
          <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
            {t('feedback.class.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
            {t('feedback.class.subtitle')}
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <CustomButton
            onClick={() => navigate('/feedback/class')}
            label={t('feedback.class.actions.viewList')}
            isIcon={false}
            width="190px"
          />
        </Stack>

        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: 2, 
          border: `1px solid ${themeColors.border.primary}`,
          backgroundColor: themeColors.background.secondary
        }}>
          <CardContent>
            <Grid container spacing={2}>
              {isAdmin ? (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={gradeId}
                      onChange={(e) => dispatch(setGradeId(e.target.value))}
                      label={t('feedback.class.fields.grade')}
                      disabled={gradeLoading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: themeColors.background.primary,
                          color: themeColors.text.primary,
                          '&:hover': {
                            borderColor: themeColors.primary
                          },
                          '&.Mui-focused': {
                            borderColor: themeColors.primary
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: themeColors.text.secondary,
                          '&.Mui-focused': {
                            color: themeColors.primary
                          }
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>{t('feedback.class.placeholders.selectGrade')}</em>
                      </MenuItem>
                      {grades.map((g) => (
                        <MenuItem key={g._id} value={g._id}>
                          {g.gradeName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={gender}
                      onChange={(e) => dispatch(setGender(e.target.value))}
                      label={t('feedback.class.fields.gender')}
                      disabled={!gradeId || genderLoading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: themeColors.background.primary,
                          color: themeColors.text.primary,
                          '&:hover': {
                            borderColor: themeColors.primary
                          },
                          '&.Mui-focused': {
                            borderColor: themeColors.primary
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: themeColors.text.secondary,
                          '&.Mui-focused': {
                            color: themeColors.primary
                          }
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>{t('feedback.class.placeholders.selectGender')}</em>
                      </MenuItem>
                      {genders.map((g) => (
                        <MenuItem key={g} value={g}>
                          {capitalize(g)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={sectionId}
                      onChange={(e) => dispatch(setSectionId(e.target.value))}
                      label={t('feedback.class.fields.section')}
                      disabled={!gradeId || !gender || sectionLoading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: themeColors.background.primary,
                          color: themeColors.text.primary,
                          '&:hover': {
                            borderColor: themeColors.primary
                          },
                          '&.Mui-focused': {
                            borderColor: themeColors.primary
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: themeColors.text.secondary,
                          '&.Mui-focused': {
                            color: themeColors.primary
                          }
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>{t('feedback.class.placeholders.selectSection')}</em>
                      </MenuItem>
                      {sections.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.sectionName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedClassTeacherId}
                    onChange={(e) => dispatch(setSelectedClassTeacherId(e.target.value))}
                    label={t('feedback.class.fields.class')}
                    sx={{ 
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: themeColors.background.primary,
                        color: themeColors.text.primary,
                        '&:hover': {
                          borderColor: themeColors.primary
                        },
                        '&.Mui-focused': {
                          borderColor: themeColors.primary
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: themeColors.text.secondary,
                        '&.Mui-focused': {
                          color: themeColors.primary
                        }
                      }
                    }}
                    disabled={isClassesLoading}
                  >
                    <MenuItem value="" disabled>
                      <em>{t('feedback.class.placeholders.selectClass')}</em>
                    </MenuItem>
                    {classes.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  {!isClassesLoading && classes.length === 0 && (
                    <Typography variant="body2" sx={{ mt: 1, color: themeColors.text.secondary }}>
                      {t('feedback.class.messages.noClasses')}
                    </Typography>
                  )}
                </Grid>
              )}

              <Grid item xs={12} md={isAdmin ? 12 : 6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={selectedAcademicStudentIds}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedAcademicStudentIds(typeof value === 'string' ? value.split(',') : value);
                  }}
                  label={t('feedback.class.fields.student')}
                  disabled={
                    isAdmin
                      ? !gradeId || !gender || !sectionId || isStudentsLoading
                      : !selectedClassTeacherId || isStudentsLoading
                  }
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => {
                      const selectedLabels = students
                        .filter((s) => selected.includes(s.academicStudentId))
                        .map((s) => (s.studentID ? `${s.studentID} - ${s.studentName}` : s.studentName));
                      return selectedLabels.join(', ');
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: themeColors.background.primary,
                      color: themeColors.text.primary,
                      '&:hover': {
                        borderColor: themeColors.primary
                      },
                      '&.Mui-focused': {
                        borderColor: themeColors.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: themeColors.text.secondary,
                      '&.Mui-focused': {
                        color: themeColors.primary
                      }
                    }
                  }}
                >
                  {students.map((s) => (
                    <MenuItem key={s.academicStudentId} value={s.academicStudentId}>
                      {s.studentID ? `${s.studentID} - ${s.studentName}` : s.studentName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={type}
                  onChange={(e) => dispatch(setClassFeedbackType(e.target.value))}
                  label={t('feedback.class.fields.type')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: themeColors.background.primary,
                      color: themeColors.text.primary,
                      '&:hover': {
                        borderColor: themeColors.primary
                      },
                      '&.Mui-focused': {
                        borderColor: themeColors.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: themeColors.text.secondary,
                      '&.Mui-focused': {
                        color: themeColors.primary
                      }
                    }
                  }}
                >
                  <MenuItem value="feedback">{t('feedback.types.feedback')}</MenuItem>
                  <MenuItem value="discipline">{t('feedback.types.discipline')}</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('feedback.class.fields.date')}
                  InputLabelProps={{ shrink: true }}
                  {...register('feedbackDate')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: themeColors.background.primary,
                      color: themeColors.text.primary,
                      '&:hover': {
                        borderColor: themeColors.primary
                      },
                      '&.Mui-focused': {
                        borderColor: themeColors.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: themeColors.text.secondary,
                      '&.Mui-focused': {
                        color: themeColors.primary
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label={t('feedback.class.fields.feedback')}
                  placeholder={t('feedback.class.placeholders.feedback')}
                  {...register('feedback')}
                  error={!!errors.feedback}
                  helperText={errors.feedback?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: themeColors.background.primary,
                      color: themeColors.text.primary,
                      '&:hover': {
                        borderColor: themeColors.primary
                      },
                      '&.Mui-focused': {
                        borderColor: themeColors.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: themeColors.text.secondary,
                      '&.Mui-focused': {
                        color: themeColors.primary
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: themeColors.text.primary
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end" mt={3}>
              <CustomButton
                onClick={handleSubmit(onSubmit)}
                label={t('feedback.class.actions.submit')}
                isIcon={false}
                width="180px"
                loading={isSaving}
                disable={
                  isAdmin
                    ? !gradeId || !gender || !sectionId || selectedAcademicStudentIds.length === 0
                    : !selectedClassTeacherId || selectedAcademicStudentIds.length === 0
                }
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </CustomOutletBox>
  );
};

export default ClassFeedback;

