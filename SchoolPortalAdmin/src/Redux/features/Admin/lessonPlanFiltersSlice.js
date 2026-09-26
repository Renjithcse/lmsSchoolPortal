import { createSlice } from '@reduxjs/toolkit';

const initialLessonPlanFilters = {
  grade: '',
  subject: '',
  page: 1,
  limit: 10,
  submitted: false,
};

const lessonPlanFiltersSlice = createSlice({
  name: 'lessonPlanFilters',
  initialState: initialLessonPlanFilters,
  reducers: {
    setLessonPlanFilters: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    resetLessonPlanFilters: () => ({ ...initialLessonPlanFilters }),
  },
});

export const { setLessonPlanFilters, resetLessonPlanFilters } = lessonPlanFiltersSlice.actions;
export const selectLessonPlanFilters = (state) => state.lessonPlanFilters ?? initialLessonPlanFilters;
export const lessonPlanFiltersReducer = lessonPlanFiltersSlice.reducer;
