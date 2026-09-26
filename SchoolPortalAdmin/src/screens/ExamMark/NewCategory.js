import { Box, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CustomAddButton from '../../components/Common/CustomAddButton'
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomInput from '../../components/Common/CustomInput'
import { useFieldArray, useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import Button from '../../components/Inputs/Button'
import SubCategory from '../../components/ExamMark/SubCategory'
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../../Redux/features/MarkEntry'
import UiBlocker from '../../components/Common/UiBlocker'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from '../../hooks/SnackBar'
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

const NewCategory = () => {

    const [show, setShow] = useState(false)
     const showSnackbar = useSnackbar();
    const childRef = useRef();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    const location = useLocation()

    console.log({state: location.state})
    const navigate = useNavigate()

    const [createCategory, { isLoading }] = useCreateCategoryMutation()
    const [updateCategory, { isLoading: updateLoading }] = useUpdateCategoryMutation()

    const schema = React.useMemo(() => object().shape({
        categoryName: yup.string().required(t('newCategory.validation.required')),
        mark: yup.number().required(t('newCategory.validation.mark')),
        subCategory: yup.array().of(yup.object().shape({
            name: yup.string().required(t('newCategory.validation.required')),
            mark: yup.number().required(t('newCategory.validation.required'))
        })
        )
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

    const { fields, append, remove } = useFieldArray({
        control,
        name: "subCategory",
    });

    const subCategory = watch('subCategory')
    const categoryMark = watch('mark')


    const addSubCategory = (data) => {
        //calculate total value from all sub categories
        const totalMark = subCategory.reduce((acc, curr) => acc + curr.mark, 0)

        if(categoryMark >= (totalMark + data?.mark)){
            childRef.current.resetForm()
            setShow(false)
            append(data)
        }
        else{
            childRef.current.setMarkError(t('newCategory.messages.totalMarkExceeded'))
        }

        
    }

    const enableSubCategory = useCallback(() => {
        setShow(true)
    }, [])

    const disableSubCategory = useCallback(() => {
        setShow(false)
    }, [])


    useEffect(() => {
        if(location?.state?.category){
            reset(location?.state?.category)
        }
    }, [location?.state?.category])
    

    const saveCategory = async(data) => {
        const totalMark = data?.subCategory.reduce((acc, curr) => acc + curr.mark, 0)
        
        
        if(data?.subCategory?.length > 0){
            if(totalMark === data?.mark){

                let datas = {
                    ...location.state,
                    ...data
                }

                let saved;

                if(location?.state?.category){
                    delete datas?.category
                    datas['id'] = location.state?.category._id

                    saved = await updateCategory(datas)
                }
                else{
                    saved = await createCategory(datas)
                }
                if(saved.error){
                    showSnackbar(saved.error?.data?.message, 'error')
                }
                else{
                    if(location?.state?.category){
                        showSnackbar(t('newCategory.messages.updateSuccess'), 'success')
                    }
                    else{
                        showSnackbar(t('newCategory.messages.createSuccess'), 'success')
                    }
                    navigate(-1)
                }
            }
            else{
                setError('mark', { type: 'custom', message: t('newCategory.messages.totalMarkEqual') })
            }
        }
        else{
            console.log({ data })
        }

    }


    return (
        <Box sx={{ p: 3 }}>
            <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ 
                    p: 2, 
                    mb: 2,
                    borderBottom: `2px solid ${themeColors.primary}`,
                    backgroundColor: themeColors.background.primary,
                    borderRadius: 1
                }}
            >
                <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    sx={{ color: themeColors.primary }}
                >
                    {location.state?.category ? t('newCategory.title.edit') : t('newCategory.title.new')}
                </Typography>
            </Box>
            
            <Box sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <CustomInput
                            placeholder={t('newCategory.placeholders.categoryName')}
                            control={control}
                            error={errors.category}
                            fieldName="categoryName"
                            fieldLabel={t('newCategory.labels.categoryName')}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <CustomInput
                            placeholder={t('newCategory.placeholders.categoryMark')}
                            control={control}
                            error={errors.mark}
                            fieldName="mark"
                            fieldLabel={t('newCategory.labels.categoryMark')}
                            type={"number"}
                        />
                    </Grid>
                    {categoryMark && (
                        <Grid item xs={12} md={4} display="flex" gap={2}>
                            <Button 
                                label={t('newCategory.actions.addSubCategory')} 
                                onClick={enableSubCategory} 
                                backgroundColor={themeColors.secondary} 
                            />
                        </Grid>
                    )}
                </Grid>
            </Box>
            
            {show && <SubCategory onComplete={addSubCategory} onCancel={disableSubCategory} ref={childRef} />}
            
            {(subCategory && subCategory?.length > 0) && (
                <Box sx={{ p: 2 }}>
                    <TableContainer 
                        component={Paper} 
                        sx={{ 
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                            borderRadius: 2,
                            boxShadow: 3
                        }}
                    >
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: themeColors.primary }}>
                                    <TableCell 
                                        sx={{ 
                                            color: 'white', 
                                            fontWeight: 'bold',
                                            fontFamily: 'Raleway, sans-serif'
                                        }}
                                    >
                                        {t('newCategory.table.subCategoryName')}
                                    </TableCell>
                                    <TableCell 
                                        sx={{ 
                                            color: 'white', 
                                            fontWeight: 'bold',
                                            fontFamily: 'Raleway, sans-serif'
                                        }}
                                    >
                                        {t('newCategory.table.mark')}
                                    </TableCell>
                                    <TableCell 
                                        sx={{ 
                                            color: 'white', 
                                            fontWeight: 'bold',
                                            fontFamily: 'Raleway, sans-serif'
                                        }}
                                    >
                                        {t('newCategory.table.action')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {subCategory?.map((row, index) => (
                                    <TableRow 
                                        key={row.id} 
                                        sx={{ 
                                            backgroundColor: themeColors.background.primary,
                                            '&:hover': {
                                                backgroundColor: themeColors.background.hover
                                            }
                                        }}
                                    >
                                        <TableCell 
                                            sx={{ 
                                                color: themeColors.text.primary,
                                                fontFamily: 'Raleway, sans-serif',
                                                fontWeight: 500
                                            }}
                                        >
                                            {row.name}
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                color: themeColors.text.secondary,
                                                fontFamily: 'Raleway, sans-serif'
                                            }}
                                        >
                                            {row.mark}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={t('newCategory.actions.removeSubCategory')}>
                                                <IconButton
                                                    onClick={() => remove(index)}
                                                    sx={{ 
                                                        color: themeColors.error,
                                                        '&:hover': {
                                                            backgroundColor: `${themeColors.error}20`
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            
            <Box display="flex" justifyContent="flex-end" p={3}>
                <Button 
                    disabled={isLoading} 
                    label={location?.state?.category ? t('newCategory.actions.update') : t('newCategory.actions.save')} 
                    onClick={handleSubmit(saveCategory)}  
                    backgroundColor={themeColors.primary} 
                />
            </Box>
            
            <UiBlocker open={isLoading || updateLoading} />
        </Box>
    )
}

export default NewCategory