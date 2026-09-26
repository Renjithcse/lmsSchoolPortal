// Export all online exam slices and hooks
export { onlineExamSlice } from './onlineExamSlice';
export { adminExamSlice } from './adminExamSlice';
export { default as examStateReducer } from './examStateSlice';

// Export all hooks from student exam slice
export {
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

// Export all hooks from admin exam slice
export {
    // Exam Management
    useCreateOnlineExamMutation,
    useGetOnlineExamsQuery,
    useLazyGetOnlineExamsQuery,
    useGetOnlineExamByIdQuery,
    useLazyGetOnlineExamByIdQuery,
    useUpdateOnlineExamMutation,
    useDeleteOnlineExamMutation,

    // Question Bank Management
    useCreateQuestionBankMutation,
    useGetQuestionBanksQuery,
    useLazyGetQuestionBanksQuery,
    useGetQuestionBankByIdQuery,
    useLazyGetQuestionBankByIdQuery,
    useUpdateQuestionBankMutation,
    useDeleteQuestionBankMutation,

    // Question Management
    useAddQuestionsToBankMutation,
    useGetQuestionsFromBankQuery,
    useLazyGetQuestionsFromBankQuery,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,

    // Exam Publishing
    usePublishExamMutation,
    useGetPublishedExamsQuery,
    useLazyGetPublishedExamsQuery,
    useUpdatePublishedExamMutation,
    useDeletePublishedExamMutation,

    // Results and Analytics
    useGetExamResultsQuery,
    useLazyGetExamResultsQuery,
    useGetStudentPerformanceQuery,
    useLazyGetStudentPerformanceQuery,
    useGetExamAnalyticsQuery,
    useLazyGetExamAnalyticsQuery,
} from './adminExamSlice';

// Export all actions from exam state slice
export {
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