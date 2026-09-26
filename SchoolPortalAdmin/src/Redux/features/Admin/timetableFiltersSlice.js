import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    filters: null,
};

const timetableFiltersSlice = createSlice({
    name: "timetableFilters",
    initialState,
    reducers: {
        setTimetableFilters: (state, action) => {
            state.filters = action.payload;
        },
        clearTimetableFilters: (state) => {
            state.filters = null;
        },
    },
});

export const { setTimetableFilters, clearTimetableFilters } = timetableFiltersSlice.actions;
export const timetableFiltersReducer = timetableFiltersSlice.reducer;
