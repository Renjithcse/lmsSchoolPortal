import { useSelector, useDispatch } from 'react-redux';
import {
    useGetStudentExamSummaryQuery,
    useLazyGetStudentExamSummaryQuery,
    useGetStudentSubjectExamStatusQuery,
    useLazyGetStudentSubjectExamStatusQuery,
    useGetSingleExamDetailsQuery,
    useLazyGetSingleExamDetailsQuery,
    useSubmitStudentExamAnswersMutation,
    useGetStudentAttendedExamDetailsQuery,
    useLazyGetStudentAttendedExamDetailsQuery,
    useGetStudentExamPerformanceQuery,
    useLazyGetStudentExamPerformanceQuery,
    useGetStudentExamAnalyticsQuery,
    useLazyGetStudentExamAnalyticsQuery,
} from './onlineExamSlice';

import {
    startExam,
    endExam,
    setCurrentQuestionIndex,
    nextQuestion,
    previousQuestion,
    setAnswer,
    clearAnswer,
    clearAllAnswers,
    updateTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    openExamDialog,
    closeExamDialog,
    openResultsDialog,
    closeResultsDialog,
    setSelectedTab,
    setSelectedSubject,
    setExamResults,
    clearExamResults,
    setSubmitting,
    setStartingExam,
    setExamError,
    setSubmissionError,
    clearErrors,
    setExamSettings,
    resetExamState,
    updateProgress,
} from './examStateSlice';

export const useOnlineExam = () => {
    const dispatch = useDispatch();
    const examState = useSelector((state) => state.examState);

    // API hooks
    const [getExamSummary, examSummaryResult] = useLazyGetStudentExamSummaryQuery();
    const [getSubjectExams, subjectExamsResult] = useLazyGetStudentSubjectExamStatusQuery();
    const [getExamDetails, examDetailsResult] = useLazyGetSingleExamDetailsQuery();
    const [submitAnswers, submitResult] = useSubmitStudentExamAnswersMutation();
    const [getAttendedExams, attendedExamsResult] = useLazyGetStudentAttendedExamDetailsQuery();
    const [getPerformance, performanceResult] = useLazyGetStudentExamPerformanceQuery();
    const [getAnalytics, analyticsResult] = useLazyGetStudentExamAnalyticsQuery();

    // State management functions
    const startExamSession = (examData) => {
        dispatch(startExam(examData));
    };

    const endExamSession = () => {
        dispatch(endExam());
    };

    const navigateToQuestion = (index) => {
        dispatch(setCurrentQuestionIndex(index));
    };

    const goToNextQuestion = () => {
        dispatch(nextQuestion());
    };

    const goToPreviousQuestion = () => {
        dispatch(previousQuestion());
    };

    const saveAnswer = (questionId, answer) => {
        dispatch(setAnswer({ questionId, answer }));
    };

    const removeAnswer = (questionId) => {
        dispatch(clearAnswer(questionId));
    };

    const clearAnswers = () => {
        dispatch(clearAllAnswers());
    };

    const updateExamTimer = (timeLeft) => {
        dispatch(updateTimer(timeLeft));
    };

    const pauseExamTimer = () => {
        dispatch(pauseTimer());
    };

    const resumeExamTimer = () => {
        dispatch(resumeTimer());
    };

    const stopExamTimer = () => {
        dispatch(stopTimer());
    };

    const openExam = () => {
        dispatch(openExamDialog());
    };

    const closeExam = () => {
        dispatch(closeExamDialog());
    };

    const openResults = () => {
        dispatch(openResultsDialog());
    };

    const closeResults = () => {
        dispatch(closeResultsDialog());
    };

    const changeTab = (tabIndex) => {
        dispatch(setSelectedTab(tabIndex));
    };

    const changeSubject = (subjectId) => {
        dispatch(setSelectedSubject(subjectId));
    };

    const saveExamResults = (results) => {
        dispatch(setExamResults(results));
    };

    const clearExamResultsData = () => {
        dispatch(clearExamResults());
    };

    const setSubmittingState = (isSubmitting) => {
        dispatch(setSubmitting(isSubmitting));
    };

    const setStartingState = (isStarting) => {
        dispatch(setStartingExam(isStarting));
    };

    const setError = (error) => {
        dispatch(setExamError(error));
    };

    const setSubmissionErrorState = (error) => {
        dispatch(setSubmissionError(error));
    };

    const clearAllErrors = () => {
        dispatch(clearErrors());
    };

    const updateExamSettings = (settings) => {
        dispatch(setExamSettings(settings));
    };

    const resetExam = () => {
        dispatch(resetExamState());
    };

    const updateExamProgress = (answered, total) => {
        dispatch(updateProgress({ answered, total }));
    };

    // API functions
    const fetchExamSummary = async (params) => {
        try {
            const result = await getExamSummary(params).unwrap();
            return result;
        } catch (error) {
            dispatch(setExamError(error.message));
            throw error;
        }
    };

    const fetchSubjectExams = async (subjectId, params) => {
        try {
            const result = await getSubjectExams({ subjectId, ...params }).unwrap();
            return result;
        } catch (error) {
            dispatch(setExamError(error.message));
            throw error;
        }
    };

    const fetchExamDetails = async (publishId) => {
        try {
            const result = await getExamDetails(publishId).unwrap();
            return result;
        } catch (error) {
            dispatch(setExamError(error.message));
            throw error;
        }
    };

    const submitExamAnswers = async (data) => {
        try {
            dispatch(setSubmitting(true));
            const result = await submitAnswers(data).unwrap();
            dispatch(setSubmitting(false));
            saveExamResults(result);
            return result;
        } catch (error) {
            dispatch(setSubmitting(false));
            
            // Handle different error formats
            let errorMessage = 'Failed to submit exam';
            
            if (error.data && error.data.message) {
                // Backend returned error with message
                errorMessage = error.data.message;
            } else if (error.error && error.error.data && error.error.data.message) {
                // RTK Query error format
                errorMessage = error.error.data.message;
            } else if (error.message) {
                // Standard error message
                errorMessage = error.message;
            }
            
            dispatch(setSubmissionError(errorMessage));
            
            // Create a custom error object with the proper message
            const customError = new Error(errorMessage);
            customError.data = error.data || error.error?.data;
            throw customError;
        }
    };

    const fetchAttendedExams = async (params) => {
        try {
            const result = await getAttendedExams(params).unwrap();
            return result;
        } catch (error) {
            dispatch(setExamError(error.message));
            throw error;
        }
    };

    const fetchPerformance = async (params) => {
        try {
            const result = await getPerformance(params).unwrap();
            return result;
        } catch (error) {
            dispatch(setExamError(error.message));
            throw error;
        }
    };

    const fetchAnalytics = async (params) => {
        try {
            const result = await getAnalytics(params).unwrap();
            return result;
        } catch (error) {
            dispatch(setExamError(error.message));
            throw error;
        }
    };

    // Utility functions
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        return examState.progressPercentage;
    };

    const getAnsweredQuestions = () => {
        return examState.answeredQuestions;
    };

    const getTotalQuestions = () => {
        return examState.totalQuestions;
    };

    const isExamActive = () => {
        return examState.examStarted && !examState.examCompleted;
    };

    const canNavigateBack = () => {
        return examState.canGoBack;
    };

    const canNavigateForward = () => {
        return examState.canGoForward;
    };

    return {
        // State
        examState,
        
        // State management functions
        startExamSession,
        endExamSession,
        navigateToQuestion,
        goToNextQuestion,
        goToPreviousQuestion,
        saveAnswer,
        removeAnswer,
        clearAnswers,
        updateExamTimer,
        pauseExamTimer,
        resumeExamTimer,
        stopExamTimer,
        openExam,
        closeExam,
        openResults,
        closeResults,
        changeTab,
        changeSubject,
        saveExamResults,
        clearExamResultsData,
        setSubmittingState,
        setStartingState,
        setError,
        setSubmissionErrorState,
        clearAllErrors,
        updateExamSettings,
        resetExam,
        updateExamProgress,

        // API functions
        fetchExamSummary,
        fetchSubjectExams,
        fetchExamDetails,
        submitExamAnswers,
        fetchAttendedExams,
        fetchPerformance,
        fetchAnalytics,

        // API results
        examSummaryResult,
        subjectExamsResult,
        examDetailsResult,
        submitResult,
        attendedExamsResult,
        performanceResult,
        analyticsResult,

        // Utility functions
        formatTime,
        getProgressPercentage,
        getAnsweredQuestions,
        getTotalQuestions,
        isExamActive,
        canNavigateBack,
        canNavigateForward,
    };
}; 