import { Box, Grid, Typography } from '@mui/material'
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext'
import { object } from "yup";
import * as yup from "yup";
import { Permissions } from '../../../constant/Permissions';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import CustomInput from '../../../components/Common/CustomInput';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CheckboxGroup from '../../../components/Inputs/CheckBoxGroup';
import SingleCheckbox from '../../../components/Inputs/SingleCheckBox';
import Button from '../../../components/Inputs/Button';
import { useCreateRoleMutation } from '../../../Redux/features/Admin/RolesSlice';
import UiBlocker from '../../../components/Common/UiBlocker';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';


const NewRoles = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    const schema = object().shape({
        roleName: yup.string().required(t('roles.form.roleNameRequired')),
    });

    const [allPermissions, setAllPermissions] = useState(structuredClone(Permissions));

    const [triggerCreate, { isLoading }] = useCreateRoleMutation()
    const showSnackbar = useSnackbar()
    const navigate = useNavigate()
    const ability = useAbility()

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

        }

    });

    const handleChange = (value, index, subIndex) => {
        allPermissions[index].route[subIndex].selected = value

        setAllPermissions([...allPermissions])
    }

    const selectModule = (index, status) => {
        allPermissions[index].selected = status
        if (status) {
            allPermissions[index].route.forEach(route => {
                route.selected = route.actions?.map(action => action.value)
            })
        }
        else {
            allPermissions[index].route.forEach(route => route.selected = [])
        }

        setAllPermissions([...allPermissions])
    }

    const selectRoute = (index, subIndex, status) => {
        //Update Selected Route Permissions
        allPermissions[index].route[subIndex].selected = status ? allPermissions[index].route[subIndex].actions.map(action => action.value) : []

        setAllPermissions([...allPermissions])
    }

    const saveRole = async(data) => {
        const selected = allPermissions.flatMap((module) =>
            module?.route?.flatMap((subRoute) =>
                subRoute.actions
                    .filter((action) => subRoute?.selected?.includes(action.value)) // Filter only selected actions
                    .map((action) => ({
                        subject: subRoute.subject,
                        action: action.value,
                    }))
            )
        );

        data.permissions = selected

        let created = await triggerCreate(data);
        if(created.error){
            showSnackbar(t('roles.messages.createError'), 'error')
            return
        }
        else{
            showSnackbar(t('roles.messages.createSuccess'), 'success')
            reset()
            setAllPermissions(structuredClone(Permissions))
            navigate(-1)
        }
    }

    const selectAll = (status) => {
        allPermissions.forEach(module => {
            module.selected = status
            if (status) {
                module.route.forEach(route => {
                    route.selected = route.actions?.map(action => action.value)
                })
            }
            else {
                module.route.forEach(route => route.selected = [])
            }
        })
        setAllPermissions([...allPermissions])
    }

    console.log({ allPermissions })

    return (
        <CustomOutletBox>
            <div className='flex flex-col gap-2 mt-5' style={{ background: themeColors.background.primary }}>
                <Box display={"flex"} justifyContent={"flex-between"} flexDirection={"row"} alignItems={"center"} px={2} borderBottom={`1px solid ${themeColors.primary}`} sx={{ backgroundColor: themeColors.background.secondary, borderRadius: 2 }}>
                    <Typography sx={{ color: themeColors.primary }} fontSize={20} fontWeight={700}>{t('roles.createTitle')}</Typography>
                </Box>
                <Grid container spacing={2} px={2} alignItems={"center"}>
                    <Grid item sx={12} md={4}>
                        <CustomInput
                            placeholder={t('roles.form.roleName')}
                            control={control}
                            error={errors.roleName}
                            fieldName="roleName"
                            fieldLabel={t('roles.form.roleName')}
                        />
                    </Grid>
                </Grid>
                <table className="divide-y divide-gray-200 border rounded-lg shadow-lg m-5" style={{ borderColor: themeColors.border.primary, background: themeColors.background.primary }}>
                    <thead style={{ backgroundColor: themeColors.primary }}>
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border border-gray-200"
                            >
                                <div className='flex flex-row gap-2'>
                                    <SingleCheckbox
                                        checked={allPermissions.every((module) =>
                                            module.route.every((subRoute) =>
                                                subRoute.actions.every((action) => subRoute.selected?.includes(action.value))
                                            )
                                        )}
                                        onChange={(status) => selectAll(status)}
                                    />
                                    {t('roles.table.module')}
                                </div>

                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border border-gray-200"
                            >
                                {t('roles.table.menu')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                            >
                                {t('roles.table.action')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200" style={{ background: themeColors.background.primary, color: themeColors.text.primary }}>
                        {allPermissions?.map((row, index) => (
                            <Fragment key={row?.module}>
                                <tr style={{ borderColor: themeColors.border.primary }}>
                                    <td rowSpan={row?.route?.length} className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200 " style={{ color: themeColors.text.primary, borderColor: themeColors.border.primary }}>
                                        <div className='flex flex-row gap-2'>
                                            <SingleCheckbox
                                                checked={row.route.every((subRoute) => subRoute.actions.every((action) => subRoute.selected?.includes(action.value)))}
                                                onChange={(status) => selectModule(index, status)} />
                                            {row.module}
                                        </div>

                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200" style={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        <div className='flex flex-row gap-2'>
                                            <SingleCheckbox
                                                checked={row.route?.[0]?.actions?.length === row.route?.[0]?.selected?.length}
                                                onChange={(status) => selectRoute(index, 0, status)}
                                            />
                                            {row.route?.[0]?.route}
                                        </div>

                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200" style={{ color: themeColors.text.primary, borderColor: themeColors.border.primary }}>
                                        {/* {row.route?.[0]?.actions?.join(',')} */}
                                        <CheckboxGroup
                                            options={row.route?.[0]?.actions}
                                            onChange={(value) => handleChange(value, index, 0)}
                                            selected={row.route?.[0]?.selected ? row.route?.[0]?.selected : []}
                                        />
                                    </td>
                                </tr>
                                {row?.route?.slice(1)?.map((subRow, subIndex) => (
                                    <tr key={subRow.id} style={{ borderColor: themeColors.border.primary }}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200" style={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                            <div className='flex flex-row gap-2'>
                                                <SingleCheckbox
                                                    checked={subRow.actions?.length === subRow?.selected?.length}
                                                    onChange={(status) => selectRoute(index, subIndex + 1, status)}
                                                />
                                                {subRow.route}
                                            </div>

                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200" style={{ color: themeColors.text.primary, borderColor: themeColors.border.primary }}>
                                            <CheckboxGroup
                                                options={subRow.actions}
                                                onChange={(value) => handleChange(value, index, subIndex + 1)}
                                                selected={subRow?.selected ? subRow?.selected : []}
                                            />
                                        </td>

                                    </tr>))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {ability.can("Create", "Roles") && <Box display={"flex"} justifyContent={"end"} alignItems={"end"} p={5}>
                <Button label={t('roles.actions.save')} onClick={handleSubmit(saveRole)} backgroundColor={'red'} />
            </Box>}
            <UiBlocker open={isLoading} />
        </CustomOutletBox>
    )
}

export default NewRoles