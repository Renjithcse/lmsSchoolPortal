import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    // Current exam session
    currentExam: null,
    currentQuestionIndex: 0,
    answers: {},
    timeLeft: null,
    examStarted: false,
    examCompleted: false,
    
    // Exam dialog states
    examDialogOpen: false,
    resultsDialogOpen: false,
    
    // UI states
    selectedTab: 0,
    selectedSubject: null,
    
    // Timer states
    timerRunning: false,
    timerPaused: false,
    
    // Exam results
    examResults: null,
    lastSubmittedExam: null,
    
    // Loading states
    isSubmitting: false,
    isStartingExam: false,
    
    // Error states
    examError: null,
    submissionError: null,
    
    // Exam settings
    autoSubmit: true,
    showTimer: true,
    allowReview: false,
    
    // Navigation state
    canGoBack: false,
    canGoForward: false,
    
    // Progress tracking
    answeredQuestions: 0,
    totalQuestions: 0,
    progressPercentage: 0,
};

const examStateSlice = createSlice({
    name: "examState",
    initialState,
    reducers: {
        // Exam session management
        startExam: (state, action) => {
            state.currentExam = action.payload;
            state.currentQuestionIndex = 0;
            state.answers = {};
            state.timeLeft = action.payload.duration * 60; // Convert to seconds
            state.examStarted = true;
            state.examCompleted = false;
            state.examDialogOpen = true;
            state.timerRunning = true;
            state.timerPaused = false;
            state.examError = null;
            state.submissionError = null;
            state.answeredQuestions = 0;
            state.totalQuestions = action.payload.totalQuestions || 0;
            state.progressPercentage = 0;
        },

        endExam: (state) => {
            state.examStarted = false;
            state.examCompleted = true;
            state.examDialogOpen = false;
            state.timerRunning = false;
            state.timerPaused = false;
            state.currentExam = null;
            state.timeLeft = null;
        },

        // Question navigation
        setCurrentQuestionIndex: (state, action) => {
            state.currentQuestionIndex = action.payload;
            state.canGoBack = action.payload > 0;
            state.canGoForward = action.payload < (state.totalQuestions - 1);
        },

        nextQuestion: (state) => {
            if (state.currentQuestionIndex < state.totalQuestions - 1) {
                state.currentQuestionIndex += 1;
                state.canGoBack = true;
                state.canGoForward = state.currentQuestionIndex < (state.totalQuestions - 1);
            }
        },

        previousQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex -= 1;
                state.canGoBack = state.currentQuestionIndex > 0;
                state.canGoForward = true;
            }
        },

        // Answer management
        setAnswer: (state, action) => {
            const { questionId, answer } = action.payload;
            const wasAnswered = state.answers[questionId] !== undefined;
            
            state.answers[questionId] = answer;
            
            // Update progress
            if (!wasAnswered) {
                state.answeredQuestions += 1;
            }
            
            state.progressPercentage = (state.answeredQuestions / state.totalQuestions) * 100;
        },

        clearAnswer: (state, action) => {
            const questionId = action.payload;
            const wasAnswered = state.answers[questionId] !== undefined;
            
            delete state.answers[questionId];
            
            if (wasAnswered) {
                state.answeredQuestions -= 1;
            }
            
            state.progressPercentage = (state.answeredQuestions / state.totalQuestions) * 100;
        },

        clearAllAnswers: (state) => {
            state.answers = {};
            state.answeredQuestions = 0;
            state.progressPercentage = 0;
        },

        // Timer management
        updateTimer: (state, action) => {
            state.timeLeft = action.payload;
            if (state.timeLeft <= 0) {
                state.timerRunning = false;
                state.examCompleted = true;
            }
        },

        pauseTimer: (state) => {
            state.timerPaused = true;
            state.timerRunning = false;
        },

        resumeTimer: (state) => {
            state.timerPaused = false;
            state.timerRunning = true;
        },

        stopTimer: (state) => {
            state.timerRunning = false;
            state.timerPaused = false;
            state.timeLeft = null;
        },

        // Dialog management
        openExamDialog: (state) => {
            state.examDialogOpen = true;
        },

        closeExamDialog: (state) => {
            state.examDialogOpen = false;
        },

        openResultsDialog: (state) => {
            state.resultsDialogOpen = true;
        },

        closeResultsDialog: (state) => {
            state.resultsDialogOpen = false;
        },

        // Tab management
        setSelectedTab: (state, action) => {
            state.selectedTab = action.payload;
        },

        setSelectedSubject: (state, action) => {
            state.selectedSubject = action.payload;
        },

        // Results management
        setExamResults: (state, action) => {
            state.examResults = action.payload;
            state.lastSubmittedExam = {
                examId: state.currentExam?.publishId,
                results: action.payload,
                submittedAt: new Date().toISOString(),
            };
        },

        clearExamResults: (state) => {
            state.examResults = null;
            state.lastSubmittedExam = null;
        },

        // Loading states
        setSubmitting: (state, action) => {
            state.isSubmitting = action.payload;
        },

        setStartingExam: (state, action) => {
            state.isStartingExam = action.payload;
        },

        // Error management
        setExamError: (state, action) => {
            state.examError = action.payload;
        },

        setSubmissionError: (state, action) => {
            state.submissionError = action.payload;
        },

        clearErrors: (state) => {
            state.examError = null;
            state.submissionError = null;
        },

        // Settings management
        setExamSettings: (state, action) => {
            state.autoSubmit = action.payload.autoSubmit ?? state.autoSubmit;
            state.showTimer = action.payload.showTimer ?? state.showTimer;
            state.allowReview = action.payload.allowReview ?? state.allowReview;
        },

        // Reset state
        resetExamState: (state) => {
            return {
                ...initialState,
                selectedTab: state.selectedTab,
                selectedSubject: state.selectedSubject,
            };
        },

        // Progress tracking
        updateProgress: (state, action) => {
            const { answered, total } = action.payload;
            state.answeredQuestions = answered;
            state.totalQuestions = total;
            state.progressPercentage = total > 0 ? (answered / total) * 100 : 0;
        },
    },
});

export const {
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
} = examStateSlice.actions;

export default examStateSlice.reducer; 