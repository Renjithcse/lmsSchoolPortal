import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  gradeId: '',
  gender: '',
  sectionId: '',
  subjectId: '',
  type: 'feedback',
};

const subjectFeedbackFilterSlice = createSlice({
  name: 'subjectFeedbackFilters',
  initialState,
  reducers: {
    setGradeId: (state, action) => {
      state.gradeId = action.payload || '';
      // reset downstream
      state.gender = '';
      state.sectionId = '';
      state.subjectId = '';
    },
    setGender: (state, action) => {
      state.gender = action.payload || '';
      state.sectionId = '';
      state.subjectId = '';
    },
    setSectionId: (state, action) => {
      state.sectionId = action.payload || '';
      state.subjectId = '';
    },
    setSubjectId: (state, action) => {
      state.subjectId = action.payload || '';
    },
    setSubjectFeedbackType: (state, action) => {
      state.type = action.payload || 'feedback';
    },
    resetSubjectFeedbackFilters: (state) => {
      state.gradeId = '';
      state.gender = '';
      state.sectionId = '';
      state.subjectId = '';
      state.type = 'feedback';
    },
  },
});

export const { setGradeId, setGender, setSectionId, setSubjectId, setSubjectFeedbackType, resetSubjectFeedbackFilters } =
  subjectFeedbackFilterSlice.actions;
export default subjectFeedbackFilterSlice.reducer;

