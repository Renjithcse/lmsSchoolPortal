import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    filters: null,
};

const assignmentFiltersSlice = createSlice({
    name: "assignmentFilters",
    initialState,
    reducers: {
        setAssignmentFilters: (state, action) => {
            state.filters = action.payload;
        },
        clearAssignmentFilters: (state) => {
            state.filters = null;
        },
    },
});

export const { setAssignmentFilters, clearAssignmentFilters } = assignmentFiltersSlice.actions;
export const assignmentFiltersReducer = assignmentFiltersSlice.reducer;
