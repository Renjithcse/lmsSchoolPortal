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
import UiBlocker from './UiBlocker';
import { useTranslation } from 'react-i18next';

const CustomDelete = ({ open, onClose, heading, paragraph, fun, _id, fetch }) => {
	const { t } = useTranslation();
	const { themeColors } = useTheme()

	console.log({ _id }, 'in delte')

	const showSnackbar = useSnackbar();
	const queryClient = useQueryClient();

	const { mutate, isPending, error } = useMutation({
		mutationFn: fun,
		onSuccess: async (data) => {
			await queryClient.invalidateQueries({ queryKey: [fetch] })
			showSnackbar(t('customDelete.messages.deleteSuccess'), 'success');
			onClose()

		},
		onError: (error, variables, context) => {
			onClose()
			showSnackbar(error?.message, 'error');
		},
		// onSettled: async () => {
		//     console.log("I'm second!")
		// },
	})

	console.log({isPending}, 'in delte')

	const submitForm = () => {
		mutate(_id)
	}

	return (
		<Dialog
			sx={{ 
				zIndex: 30000,
				'& .MuiDialog-paper': {
					backgroundColor: themeColors.background.primary,
					borderRadius: '12px',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
					border: `1px solid ${themeColors.border.primary}`
				}
			}}
			maxWidth={'md'}
			onClose={onClose} open={open}>
			<DialogTitle id="alert-dialog-title">
				<Box display={'flex'} justifyContent={'space-between'} marginBottom={'1px solid "#000"'} width={'100%'}>
					<Typography variant="body1" color={themeColors.primary} fontFamily={'Raleway, sans-serif'} fontSize={24} fontWeight={'bold'}>{t('customDelete.title', { heading })}</Typography>
					<CancelIcon sx={{
						"&:hover": { color: themeColors.text.primary },
						color: themeColors.primary,
						cursor: 'pointer',
						transition: 'color 0.2s ease-in-out'
					}} onClick={onClose} />
				</Box>
			</DialogTitle>
			<DialogContent dividers sx={{
				backgroundColor: themeColors.background.primary,
				color: themeColors.text.primary
			}}>
				<Box display={'flex'} justifyContent={'center'} mb={1}>
					<ReportProblemIcon sx={{ color: themeColors.warning, fontSize: 40 }} />
				</Box>
				<DialogContentText id="alert-dialog-description" sx={{
					color: themeColors.text.primary
				}}>
					<Box display={'flex'} justifyContent={'center'}>
						<Typography width={'70%'} textAlign={'center'} fontFamily={'Raleway, sans-serif'} fontSize={16} fontWeight={'bold'} color={themeColors.text.primary}>{t('customDelete.confirmation', { paragraph })}</Typography>
					</Box>
				</DialogContentText>
				<Box display={'flex'} justifyContent={'center'} py={1} >
					<CustomButton
						disabled={false}
						btncolor=''
						height={'100%'}
						IconEnd={""}
						IconStart={''}
						startIcon={false}
						endIcon={false}
						onClick={submitForm}
						label={t('customDelete.confirm')} />
				</Box>
			</DialogContent>
			<UiBlocker open={isPending} />
		</Dialog>
	)
}

export default CustomDelete
