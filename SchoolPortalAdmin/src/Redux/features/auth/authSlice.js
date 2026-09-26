// src/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';



const initialState = {
    role: 'user', // default role
    ability: null,
    isAuthenticated: false,
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setRole(state, action) {
            state.role = action.payload;
        },
        setAbility(state, action){
            state.ability = action.payload
        },
        setAuthenticated(state, action) {
            state.isAuthenticated = action.payload;
        },
        setUser(state, action) {
            state.user = action.payload;
        },
    },
});

export const { setRole, setAbility, setAuthenticated, role, setUser } = authSlice.actions;
export default authSlice.reducer;
