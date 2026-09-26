import { Box, Grid, Typography } from '@mui/material'
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext'
import { object } from "yup";
import * as yup from "yup";
import { Permissions } from '../../../constant/Permissions';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import CustomInput from '../../../components/Common/CustomInput';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CheckboxGroup from '../../../components/Inputs/CheckBoxGroup';
import SingleCheckbox from '../../../components/Inputs/SingleCheckBox';
import Button from '../../../components/Inputs/Button';
import { useGetSingleRoleQuery, useUpdateRoleMutation } from '../../../Redux/features/Admin/RolesSlice';
import UiBlocker from '../../../components/Common/UiBlocker';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';


const EditRoles = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    const schema = object().shape({
        roleName: yup.string().required(t('roles.form.roleNameRequired')),
    });

    const [allPermissions, setAllPermissions] = useState(structuredClone(Permissions));

    const params = useParams()
    const location = useLocation()
    const ability = useAbility()

    const { data, isLoading: roleDetailsLoading } = useGetSingleRoleQuery(params.id)

    useEffect(() => {
        if(data){
            reset({
                roleName: data?.roleName,
            })
            let updated = allPermissions.map((module) => ({
                ...module,
                route: module.route.map((subRoute) => {
                  // Get all selected actions for this route (subject)
                  const selectedActions = data?.permissions
                    .filter((subRouteAction) => subRouteAction.subject === subRoute.subject)
                    .map((subRouteAction) => subRouteAction.action);
            
                  // Check if selected actions match with the subRoute actions and update selected
                  const updatedSelected = subRoute.actions
                    .filter((action) => selectedActions.includes(action.value))
                    .map((action) => action.value);
            
                  return {
                    ...subRoute,
                    selected: updatedSelected, // Update selected actions for this subRoute
                  };
                }),
            }));

            setAllPermissions([...updated])
        }
    }, [data])
    

    const [triggerUpdate, { isLoading }] = useUpdateRoleMutation()
    const showSnackbar = useSnackbar()
    const navigate = useNavigate()

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

    const saveRole = async(datas) => {
        const selected = allPermissions.flatMap((module) =>
            module.route.flatMap((subRoute) =>
                subRoute.actions
                    .filter((action) => subRoute.selected.includes(action.value)) // Filter only selected actions
                    .map((action) => ({
                        subject: subRoute.subject,
                        action: action.value,
                    }))
            )
        );

        datas.permissions = selected

        let created = await triggerUpdate({id: data?._id, data: datas});
        if(created.error){
            showSnackbar(t('roles.messages.updateError'), 'error')
            return
        }
        else{
            showSnackbar(t('roles.messages.updateSuccess'), 'success')
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

    const closePage = () => {
        navigate(-1)
    }

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
                <Box className='flex flex-row justify-between p-5 border-b border-[2px]'
                    sx={{ backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.primary, borderRadius: 2 }}
                >
                    <Typography sx={{ color: themeColors.primary }} fontSize={20} fontWeight={700}>{location?.state === "edit" ? t('roles.editTitle') : t('roles.viewTitle')}</Typography>
                    <Button onClick={closePage} label={t('roles.actions.close')} justifyContent={'flex-end'} className='bg-blue-500 border-red-500 border-2 text-[#000] hover:bg-red-500 hover:text-white' />
                </Box>
                <Grid container spacing={2} px={2} alignItems={"center"}>
                    <Grid item sx={12} md={4}>
                        <CustomInput
                            placeholder={t('roles.form.roleName')}
                            control={control}
                            error={errors.roleName}
                            fieldName="roleName"
                            fieldLabel={t('roles.form.roleName')}
                            readonly
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
                                        mode={location.state}
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
                                                mode={location.state}
                                                onChange={(status) => selectModule(index, status)} />
                                            {row.module}
                                        </div>

                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200" style={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        <div className='flex flex-row gap-2'>
                                            <SingleCheckbox
                                                checked={row.route?.[0]?.actions?.length === row.route?.[0]?.selected?.length}
                                                mode={location.state}
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
                                            mode={location.state}
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
                                                    mode={location.state}
                                                    onChange={(status) => selectRoute(index, subIndex + 1, status)}
                                                />
                                                {subRow.route}
                                            </div>

                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm border border-gray-200" style={{ color: themeColors.text.primary, borderColor: themeColors.border.primary }}>
                                            <CheckboxGroup
                                                options={subRow.actions}
                                                onChange={(value) => handleChange(value, index, subIndex + 1)}
                                                mode={location.state}
                                                selected={subRow?.selected ? subRow?.selected : []}
                                            />
                                        </td>

                                    </tr>))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </Box>
            {(location?.state === "edit" && ability.can("Edit", "Roles")) && <Box display={"flex"} justifyContent={"end"} alignItems={"end"} p={5}>
                <Button label={t('roles.actions.update')} onClick={handleSubmit(saveRole)} backgroundColor={'red'} />
            </Box>}
            <UiBlocker open={isLoading || roleDetailsLoading} />
        </CustomOutletBox>
    )
}

export default EditRoles