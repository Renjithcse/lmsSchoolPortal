import React, { useEffect, useState, useMemo } from 'react'
import { useGetAllGradeQuery, useGetTeacherGradePermissionsQuery, useSaveGradePermissionsMutation } from '../../Redux/features/Admin/TeachersSlice'
import UiBlocker from '../Common/UiBlocker'
import { capitalize } from 'lodash-es'
import { useLocation } from 'react-router-dom'
import { useSnackbar } from '../../hooks/SnackBar'
import { Box, Card, CardContent, Typography, Grid, Checkbox, FormControlLabel, Button } from '@mui/material'
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

const GradePermissions = () => {

    const { t } = useTranslation();
    const location = useLocation()

    const { data, isLoading: isGradeLoading } = useGetAllGradeQuery()
    const { data: permissions, isLoading: permissionLoading } = useGetTeacherGradePermissionsQuery(location.state)

    console.log({permissions})

    const showSnackBar = useSnackbar()

    

    const [triggerSave, { isLoading: saveLoading}] = useSaveGradePermissionsMutation()

    const [selectedGrade, setSelectedGrade] = useState(null);
    const [grades, setGrades] = useState();


    const genderOptions = useMemo(() => [
        { label: t('gradePermissions.gender.male'), selected: false, name: 'male' },
        { label: t('gradePermissions.gender.female'), selected: false, name: 'female' },
    ], [t]);

    useEffect(() => {
        if (data && data?.length > 0) {
            if(permissions?.data?.length){
                const grades = data?.map(grade => {
                    let find = permissions?.data?.find(per => per?.grade?._id === grade?._id)
                    let sections = genderOptions.map(opt => ({ ...opt }))
                    if (find) {
                        sections?.map(sec => {
                            if (find?.gender?.includes(sec.name)) {
                                sec.selected = true;
                            }
                        })
                    }
                    

                    return {
                        _id: grade._id,
                        name: grade.gradeName,
                        sections: sections,
                    }
                })

                setGrades(grades);
            }
            else{
                setGrades(data?.map(grade => ({
                    _id: grade._id,
                    name: grade.gradeName,
                    sections: genderOptions.map(opt => ({ ...opt })),
                })));
            }
            
        } else {
            setGrades([]);
        }
    }, [data, permissions, genderOptions])



    const handleGradeToggle = (gradeName) => {
        const grade = grades.find(g => g.name === gradeName);
        if (grade && grade.sections.some(s => s.selected)) return;
        setGrades(prevGrades =>
            prevGrades.map(grade => ({
                ...grade,
                isOpen: grade.name === gradeName ? !grade.isOpen : grade.isOpen,
            }))
        );
    };

    const toggleSection = (gradeName, sectionName) => {
        setGrades(prevGrades =>
            prevGrades.map(grade => {
                if (grade.name === gradeName) {
                    return {
                        ...grade,
                        sections: grade.sections.map(section =>
                            section.name === sectionName
                                ? { ...section, selected: !section.selected }
                                : section
                        ),
                    };
                }
                return grade;
            })
        );
    };

    const toggleAllSections = (gradeName) => {
        setGrades(prevGrades =>
            prevGrades.map(grade => {
                if (grade.name === gradeName) {
                    const allSelected = grade.sections.every(s => s.selected);
                    return {
                        ...grade,
                        sections: grade.sections.map(section => ({
                            ...section,
                            selected: !allSelected,
                        })),
                    };
                }
                return grade;
            })
        );
    };

    const saveGrades = async() => {
        let selectedArray = [];
        grades?.map(grade => {
            let selected = grade?.sections?.filter(section => section.selected)
            console.log({selected})
            if(selected && selected.length>0){
                selectedArray.push({
                    grade: grade._id,
                    gender: selected.map(s => s.name)
                })
            }
        })

        // if(selectedArray.length){
            let data = {
                grades: selectedArray,
                teacherId: location.state
            }
            const saved = await triggerSave(data)

            if(saved.error){
                showSnackBar(saved.error?.data?.message, "error")
                return false;
            }
            

            showSnackBar(t('gradePermissions.messages.saveSuccess'), "success")
        // }
        // else{
        //     showSnackBar("Please select at least one gender for a grade", "error")
        // }
    }

    const { themeColors } = useThemeContext();
    return (
        <Box sx={{ p: 2, backgroundColor: themeColors.background.primary }}>
            <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 800, mb: 2 }}>{t('gradePermissions.title')}</Typography>
            <Grid container spacing={2}>
                {grades?.map(grade => {
                        const hasSelections = grade.sections.some(s => s.selected);

                        return (
                            <Grid item xs={12} md={6} lg={4} key={grade.name}>
                                <Card sx={{ border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.primary }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography sx={{ fontWeight: 700, color: themeColors.text.primary }}>{capitalize(grade.name)}</Typography>
                                            <FormControlLabel
                                                control={<Checkbox checked={grade.sections.every(s => s.selected)} onChange={() => toggleAllSections(grade.name)} />}
                                                label={<Typography sx={{ color: themeColors.text.secondary, fontSize: 14 }}>{t('gradePermissions.selectAll')}</Typography>}
                                            />
                                        </Box>
                                        <Grid container spacing={1}>
                                            {grade.sections.map(section => (
                                                <Grid item key={section.name}>
                                                    <FormControlLabel
                                                        control={<Checkbox checked={section.selected} onChange={() => toggleSection(grade.name, section.name)} />}
                                                        label={<Typography sx={{ color: themeColors.text.secondary, fontSize: 14 }}>{section.label}</Typography>}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                <Button variant="contained" onClick={saveGrades} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('gradePermissions.actions.submit')}</Button>
            </Box>
            <UiBlocker open={isGradeLoading || permissionLoading || saveLoading} />
        </Box>
    );
}

export default GradePermissions