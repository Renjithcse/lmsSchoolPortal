import { Box, Grid, MenuItem } from '@mui/material'
import React, { memo, useEffect, useState, useMemo } from 'react'
import CustomSelect from './CustomSelect'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { COLORS } from '../../assets/colors';
import CustomButton from './CustomButton';
import { useNavigate } from 'react-router-dom';
import { useGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import UiBlocker from './UiBlocker';
import { capitalize } from 'lodash-es';
import { useTranslation } from 'react-i18next';

const ClassSelector = memo(({ hide, redirectTo }) => {
    const { t } = useTranslation();
    const [terms, setTerms] = useState([]);
    const [showSubmit, setShowSubmit] = useState(true);
    const navigate = useNavigate()

    const { data: grades, refetch, isLoading: gradeLoading } = useGetMyGradePermissionsQuery()
    const [triggerGender, { data: genders , isLoading: genderLoading}] = useLazyGetMyGenderPermissionsQuery()
    const [triggerSections, { data: sections , isFetching: sectionLoading}] = useLazyGetMySectionPermissionsQuery()

    useEffect(() => {
        refetch()
    }, [])
    

    const schema = useMemo(() => object().shape({
        grade: yup.string().required(t('classSelector.validation.required')),
        gender: yup.string().required(t('classSelector.validation.required')),
        section: yup.string().required(t('classSelector.validation.required')),
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
        resolver: yupResolver(schema),
    });


    const academicYear = watch('academicYear');
    const grade = watch('grade');
    const gender = watch('gender');
    const section = watch('section');

    useEffect(() => {
        if(grade){
            triggerGender({ grade})
        }
    }, [grade])

    useEffect(() => {
        if(grade && gender){
            triggerSections({ grade, gender})
        }
    }, [grade, gender])
    

    useEffect(() => {
        setShowSubmit(true)
        navigate(redirectTo)
    }, [academicYear, grade, gender, section])






    const submit = (data) => {
        setShowSubmit(false)
        let datas = structuredClone(data)
        // Use redirectTo directly if it already ends with /list, otherwise append /list
        const targetRoute = redirectTo.endsWith('/list') ? redirectTo : `${redirectTo}/list`;
        navigate(targetRoute, { state: datas })
    }

    return (
        <Box sx={{ border: `1px solid ${COLORS.primary}`, p: 3, background: COLORS.sidebarHover, borderRadius: 2, boxShadow: 4 }}>
            <Grid container spacing={2}>
                {hide === 'term' ? null :
                    <Grid item md={4} lg={3}>
                        <CustomSelect
                            control={control}
                            error={errors.term}
                            fieldName="term"
                            fieldLabel={t('classSelector.fields.term')}
                            size="16px"
                            onChangeValue={null}
                        >
                            <MenuItem value="" disabled >
                                <em>{t('classSelector.placeholders.selectTerm')}</em>
                            </MenuItem>
                            {terms?.map((res, i) => (
                                <MenuItem key={i} value={res.termName}>
                                    {res?.termName}
                                </MenuItem>
                            ))}
                        </CustomSelect>

                    </Grid>}
                <Grid item md={4} lg={3}>
                    <CustomSelect
                        control={control}
                        error={errors.grade_id}
                        fieldName="grade"
                        fieldLabel={t('classSelector.fields.grade')}
                        // defaultValue={ grade }
                        size="16px"
                        onChangeValue={null}
                    >
                        <MenuItem value="" disabled >
                            <em>{t('classSelector.placeholders.selectGrade')}</em>
                        </MenuItem>
                        {grades?.data?.map((res, i) => (
                            <MenuItem key={i} value={res?._id}>
                                {res?.gradeName}
                            </MenuItem>
                        ))}

                    </CustomSelect>

                </Grid>
                <Grid item md={4} lg={3}>
                    <CustomSelect
                        control={control}
                        error={errors.gender}
                        fieldName="gender"
                        fieldLabel={t('classSelector.fields.gender')}
                        // defaultValue={ gender }
                        size="16px"
                        onChangeValue={null}
                    >
                        <MenuItem value="" disabled >
                            <em>{t('classSelector.placeholders.selectGender')}</em>
                        </MenuItem>
                        {genders?.data?.map((res, i) => (
                            <MenuItem key={i} value={res} >
                                {capitalize(res)}
                            </MenuItem>
                        ))}

                    </CustomSelect>

                </Grid>
                <Grid item md={4} lg={3}>
                    <CustomSelect
                        control={control}
                        error={errors.section}
                        fieldName="section"
                        fieldLabel={t('classSelector.fields.section')}
                        // defaultValue={ section }
                        size="16px"
                    // onChangeValue={ null }
                    >
                        <MenuItem value="" disabled >
                            <em>{t('classSelector.placeholders.selectSection')}</em>
                        </MenuItem>
                        {sections?.data?.map((res, i) => (
                            <MenuItem key={i} value={res._id} >
                                {res?.sectionName}
                            </MenuItem>
                        ))}

                    </CustomSelect>
                </Grid>
                {showSubmit && <Grid item lg={3} >
                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 20 }}>
                        <CustomButton
                            onClick={handleSubmit(submit)}
                            label={t('classSelector.actions.submit')}
                            isIcon={false}
                            width="150px"
                        />

                    </div>
                </Grid>}

            </Grid>
            <UiBlocker open={gradeLoading || genderLoading || sectionLoading } />
        </Box>
    )
})

export default ClassSelector