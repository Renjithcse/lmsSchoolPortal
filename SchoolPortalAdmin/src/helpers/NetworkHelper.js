import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../config';
// import { redirect, useNavigate } from 'react-router-dom';

const baseQuery =  fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
        const token = localStorage.getItem("token");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
})

export const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error) {
        console.log({error: result.error, extraOptions})
        // Global error handling
        if (result.error.status === 401) {
            // Handle token expiration, e.g., refresh token logic
            // window.location.href = '/login';
            console.error('Unauthorized, attempting to refresh token...');
            // Optionally, you can dispatch actions to handle logout or refresh logic here
        } else if (result.error.status === 500) {
            console.error('Server error:', result.error.data);
        } else {
            console.error('API error:', result.error.data);
        }
    }

    return result;
};