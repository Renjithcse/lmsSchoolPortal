import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    filters: null,
};

const examFiltersSlice = createSlice({
    name: "examFilters",
    initialState,
    reducers: {
        setExamFilters: (state, action) => {
            state.filters = action.payload;
        },
        clearExamFilters: (state) => {
            state.filters = null;
        },
    },
});

export const { setExamFilters, clearExamFilters } = examFiltersSlice.actions;
export const examFiltersReducer = examFiltersSlice.reducer;
