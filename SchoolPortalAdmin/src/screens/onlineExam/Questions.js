import { Box, Container, Typography } from "@mui/material"
import QuestionCard from "../../components/OnlineExam/QuestionCard"
import QuestionBankCard from "../../components/OnlineExam/QuestionBankCard";
import NewQuestion from "../../components/OnlineExam/NewQuestion";
import { useCallback, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import useModal from "../../hooks/modalHook";
import CustomAddButton from "../../components/Common/CustomAddButton";
import { viewQuestionBank } from "../../api/onlineExam";
import { useQuery } from "@tanstack/react-query";
import UiBlocker from "../../components/Common/UiBlocker";
import { useTheme } from "../../contexts/ThemeContext";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

export default function Questions() {
    const { themeColors } = useTheme();
    const { t } = useTranslation();
    const { modal, openModal, closeModal } = useModal();
    const [title, setTitle] = useState('');
    const ability = useAbility();
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const { data, isLoading } = useQuery({ queryKey: ['questionBank', id], queryFn: () => viewQuestionBank(id), enabled: !!id });

    console.log({data})

    const exam = useOutletContext();

    const openAdd = useCallback(() => {
        navigate('newquestion', { state: { questionBank: data?.questionBank } });
    }, [modal, data?.questionBank]);

    const closeAdd = useCallback(() => {
        closeModal('addModal');
    }, [modal]);

    const handleEditQuestion = useCallback((question) => {
        // Navigate to edit screen with question preloaded in state
        navigate('newquestion', { state: { questionBank: data?.questionBank, question, mode: 'edit' } });
    }, [navigate, location?.state]);

    return (
        <Box sx={{ 
            backgroundColor: themeColors.background.primary, 
            minHeight: '100vh',
            paddingTop: 2
        }}>
            {/* Header Section */}
            <Box sx={{ 
                p: 3, 
                backgroundColor: themeColors.background.secondary,
                borderBottom: `1px solid ${themeColors.border.primary}`,
                mb: 2
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" sx={{ 
                            color: themeColors.text.primary,
                            fontWeight: 600,
                            mb: 1
                        }}>
                            {t('questions.questionBankDetails')}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                            color: themeColors.text.secondary 
                        }}>
                            {data?.questionBank?.questionBankName || t('questions.loading')}
                        </Typography>
                    </Box>
                    <Box position="relative">
                        {ability.can("Create", "QuestionBank") && <CustomAddButton 
                            ClickEvent={openAdd} 
                            label={t('questions.actions.addQuestion')} 
                            justifyContent={'flex-end'} 
                        />}
                    </Box>
                </Box>
            </Box>

            <Container maxWidth="lg">
                {/* Question Bank Card */}
                <Box sx={{ mb: 3 }}>
                    <QuestionBankCard 
                        data={data?.questionBank} 
                        exam={exam} 
                        editable={false} 
                    />
                </Box>

                {/* Questions List */}
                <Box sx={{ 
                    backgroundColor: themeColors.background.secondary,
                    borderRadius: 2,
                    p: 3,
                    border: `1px solid ${themeColors.border.primary}`
                }}>
                    <Typography variant="h6" sx={{ 
                        color: themeColors.text.primary,
                        mb: 2,
                        fontWeight: 600
                    }}>
                        {t('questions.title', { count: data?.questionBank?.questions?.length || 0 })}
                    </Typography>
                    
                    {data?.questionBank?.questions && data.questionBank.questions.length > 0 ? (
                        <Box display={'flex'} flexDirection={'column'} gap={2}>
                            {data.questionBank.questions.map((question, index) => (
                                <QuestionCard
                                    key={question.id || index}
                                    question={question}
                                    onEdit={handleEditQuestion}
                                />
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ 
                            textAlign: 'center', 
                            py: 4,
                            color: themeColors.text.secondary
                        }}>
                            <Typography variant="body1">
                                {t('questions.messages.noQuestionsFound')}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Container>

            {/* Modals */}
            {modal.addModal && (
                <NewQuestion 
                    open={modal.addModal} 
                    close={closeAdd} 
                    label={title} 
                    hide={false} 
                    id={false} 
                    state={exam} 
                />
            )}
            
            {/* Loading Blocker */}
            <UiBlocker open={isLoading} />
        </Box>
    )
}