import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedClassTeacherId: '',
  gradeId: '',
  gender: '',
  sectionId: '',
  type: 'feedback',
};

const classFeedbackFilterSlice = createSlice({
  name: 'classFeedbackFilters',
  initialState,
  reducers: {
    setSelectedClassTeacherId: (state, action) => {
      state.selectedClassTeacherId = action.payload || '';
    },
    setGradeId: (state, action) => {
      state.gradeId = action.payload || '';
      state.gender = '';
      state.sectionId = '';
    },
    setGender: (state, action) => {
      state.gender = action.payload || '';
      state.sectionId = '';
    },
    setSectionId: (state, action) => {
      state.sectionId = action.payload || '';
    },
    setClassFeedbackType: (state, action) => {
      state.type = action.payload || 'feedback';
    },
    resetClassFeedbackFilters: (state) => {
      state.selectedClassTeacherId = '';
      state.gradeId = '';
      state.gender = '';
      state.sectionId = '';
      state.type = 'feedback';
    },
  },
});

export const { setSelectedClassTeacherId, setGradeId, setGender, setSectionId, setClassFeedbackType, resetClassFeedbackFilters } = classFeedbackFilterSlice.actions;
export default classFeedbackFilterSlice.reducer;

