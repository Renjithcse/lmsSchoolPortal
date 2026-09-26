import { Backdrop, Box, CircularProgress, Dialog, Typography } from '@mui/material'
import React, { useState } from 'react'

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CancelIcon from '@mui/icons-material/Cancel';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';


import CustomButton from './CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';





const DeleteDialog = ({ open, onClose, heading, paragraph, fun, _id, queryKeytoRefetch, mode }) => {
	const { t } = useTranslation();

	// console.log({ _id }, 'in delte')

	const showSnackbar = useSnackbar();
	const queryClient = useQueryClient();

    const { mutate, isPending, error } = useMutation({
		mutationFn: fun,
		onSuccess: async (data) => {
			console.log({data})
			await queryClient.invalidateQueries({ queryKey: queryKeytoRefetch })
			showSnackbar(t('deleteDialog.messages.deleteSuccess'), 'success');
			onClose()

		},
		onError: (error, variables, context) => {
			console.log({error})
			// Extract error message from RTK Query error response
			onClose()
			const errorMessage = error?.data?.message || error?.message || t('deleteDialog.messages.deleteError');
			showSnackbar(errorMessage, 'error');
		},
		// onSettled: async () => {
		//     console.log("I'm second!")
		// },
	})


	const submitForm = async() => {
		if(mode === "redux"){
			try {
				const result = await fun(_id).unwrap();
				showSnackbar(t('deleteDialog.messages.deleteSuccess'), 'success');
				onClose();
			} catch (error) {
				const errorMessage = error?.data?.message || error?.message || t('deleteDialog.messages.deleteFailed');
				showSnackbar(errorMessage, 'error');
			}
		}
		else{
			mutate(_id)
		}
		
	}


    const { themeColors } = useTheme();

    return (
        <Dialog
            sx={{ zIndex: 30000 }}
            maxWidth={'md'}
            onClose={onClose}
            open={open}
            PaperProps={{
                sx: {
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: '12px'
                }
            }}
        >
            <DialogTitle id="alert-dialog-title" sx={{ borderBottom: `1px solid ${themeColors.border.primary}` }}>
                <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'100%'}>
                    <Typography variant="body1" sx={{ color: themeColors.text.primary, fontFamily: 'Raleway, sans-serif', fontSize: 20, fontWeight: 'bold' }}>
                        {heading}
                    </Typography>
                    <CancelIcon
                        onClick={onClose}
                        sx={{
                            color: themeColors.text.secondary,
                            cursor: 'pointer',
                            '&:hover': {
                                color: themeColors.text.primary
                            }
                        }}
                    />
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: themeColors.border.primary }}>
                <Box display={'flex'} justifyContent={'center'} mb={1}>
                    <ReportProblemIcon sx={{ color: themeColors.warning, fontSize: 40 }} />
                </Box>
                <DialogContentText id="alert-dialog-description">
                    <Box display={'flex'} justifyContent={'center'}>
                        <Typography width={'70%'} textAlign={'center'} sx={{ color: themeColors.text.secondary, fontFamily: 'Raleway, sans-serif', fontSize: 16, fontWeight: 'bold' }}>
                            {t('deleteDialog.confirmation', { paragraph })}
                        </Typography>
                    </Box>
                </DialogContentText>
                <Box display={'flex'} justifyContent={'center'} py={1}>
                    <CustomButton
                        disabled={isPending}
                        btncolor=''
                        height={'100%'}
                        IconEnd={""}
                        IconStart={''}
                        startIcon={false}
                        endIcon={false}
                        loading={false}
                        onClick={submitForm}
                        label={t('deleteDialog.confirm')}
                    />
                </Box>
            </DialogContent>
            <Backdrop
                sx={{ color: themeColors.text.inverse, zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isPending}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Dialog>
    )
}

export default DeleteDialog
