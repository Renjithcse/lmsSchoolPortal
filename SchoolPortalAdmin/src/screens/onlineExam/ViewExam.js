import { Box, Button, Stack, Typography, Chip } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import CustomButton from "../../components/Common/CustomButton";
import { Link, Outlet, useLocation, useParams, useNavigate } from "react-router-dom";
import CustomAddButton from "../../components/Common/CustomAddButton";
import useModal from "../../hooks/modalHook";
import { viewExam } from "../../api/onlineExam";
import { useQuery } from "@tanstack/react-query";
import NewPublish from "../../components/OnlineExam/NewPublish";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { 
    School as SchoolIcon,
    PublishedWithChanges as PublishedIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function ViewExam() {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [value, setValue] = useState(0);
    const pathName = useLocation().pathname
    const [title, setTitle] = useState('');
    const [exam, setExam] = useState(null);

    const params = useParams();
    const location = useLocation();

    useEffect(() => {
       setExam(location?.state)
    }, [])

    // const { data, isLoading } = useQuery({ queryKey: ['viewExam', params?.id], queryFn: () => viewExam(params?.id), enabled: !!params?.id });

    let paths = location.pathname.split('/');

    const { modal, openModal, closeModal } = useModal();

    const openAdd = useCallback(() => {
        if (paths?.[paths.length - 1] === 'published') {
            setTitle(t('viewExam.titles.newPublish'));
            openModal('addModal');
        }
    }, [modal, t]);

    const closeAdd = useCallback(() => {
        closeModal('addModal');
    }, [modal]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    function a11yProps(index) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    const isPublishedActive = pathName.includes('published');

    return (
        <>
            {/* Header */}
            <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                mb={3}
                sx={{
                    backgroundColor: themeColors.background.primary,
                    p: 3,
                    borderRadius: '12px',
                    border: `1px solid ${themeColors.border.primary}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <Box display="flex" alignItems="center" flex={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                        sx={{ 
                            mr: 2,
                            borderColor: themeColors.border.primary,
                            color: themeColors.text.primary,
                            '&:hover': {
                                borderColor: themeColors.primary,
                                backgroundColor: `${themeColors.primary}10`
                            }
                        }}
                    >
                        {t('viewExam.actions.back')}
                    </Button>
                    <SchoolIcon sx={{ fontSize: 32, color: themeColors.primary, mr: 2 }} />
                    <Box flex={1}>
                        <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 600, mb: 1 }}>
                            {exam?.examName || t('viewExam.examDetails')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2 }}>
                            {t('viewExam.subtitle')}
                        </Typography>
                        
                        {/* Navigation Tabs */}
                        <Stack direction="row" gap={2}>
                            <Link to={'published'} style={{ textDecoration: 'none' }}>
                                <Button 
                                    variant={isPublishedActive ? "contained" : "outlined"}
                                    startIcon={<PublishedIcon />}
                                    sx={{ 
                                        color: isPublishedActive ? 'white' : themeColors.text.primary,
                                        backgroundColor: isPublishedActive ? themeColors.primary : 'transparent',
                                        borderColor: isPublishedActive ? themeColors.primary : themeColors.border.primary,
                                        borderRadius: '8px',
                                        px: 3,
                                        py: 1,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        '&:hover': {
                                            backgroundColor: isPublishedActive ? themeColors.accent : `${themeColors.primary}10`,
                                            borderColor: themeColors.primary,
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    {t('viewExam.navigation.publishedExams')}
                                </Button>
                            </Link>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* Content Area */}
            <Box sx={{ 
                backgroundColor: themeColors.background.primary,
                borderRadius: '12px',
                border: `1px solid ${themeColors.border.primary}`,
                overflow: 'hidden'
            }}>
                <Outlet context={exam} />
            </Box>

            {/* Modals */}
            {modal.addModal && paths?.[paths.length - 1] === 'published' && (
                <NewPublish 
                    open={modal.addModal} 
                    close={closeAdd} 
                    label={title} 
                    hide={false} 
                    id={false} 
                    state={exam} 
                />
            )}
        </>
    );
}