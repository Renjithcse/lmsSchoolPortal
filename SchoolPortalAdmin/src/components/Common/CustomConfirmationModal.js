import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../assets/colors';
import { useTranslation } from 'react-i18next';

const CustomConfirmationModal = ({ open, handleClose, label, mutateStatus, item, finallabel }) => {
    const { t } = useTranslation();

    const confirmation = () => {
        mutateStatus.mutate(item);
        handleClose()
    }

    return (
        <Dialog
            open={ open }
            onClose={ handleClose }
            aria-describedby="alert-dialog-description"
        >
            <Box py={ 2 } px={ 4 }>
                <Typography sx={ { fontSize: 16, fontFamily: 'Raleway, sans-serif' } }>
                    { label }
                </Typography>
                <Box display={ 'flex' } alignItems={ 'center' } justifyContent={ 'flex-end' }>
                    <Typography sx={ { fontSize: 16, fontFamily: 'Raleway, sans-serif' } }>
                        { finallabel }
                    </Typography>
                </Box>

            </Box>

            <DialogActions>
                <Button sx={ { color: COLORS.secondary } } onClick={ handleClose }>{t('confirmationModal.disagree')}</Button>
                <Button sx={ { color: COLORS.secondary } } onClick={ confirmation } autoFocus>
                    {t('confirmationModal.agree')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default CustomConfirmationModal