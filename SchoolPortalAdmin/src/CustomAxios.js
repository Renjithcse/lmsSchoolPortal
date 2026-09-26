import axios from 'axios';
import { BASE_URL } from './config';
import { useHistory } from 'react-router-dom'; // Import useHistory for navigation

const API_TIMEOUT_MS = 10000;

const axiosInstance = axios.create({
	withCredentials: true,
	baseURL: BASE_URL,
	timeout: API_TIMEOUT_MS,
});

const requestHandler = (request) => {
	let token = localStorage.getItem("token");

	if (token) {
		request.headers.Authorization = `Bearer ${token}`;
	}

	return request;
};

const responseHandler = async (response) => {
	if (response.status === 200) {
		// handle success case
	} else if (response.status === 403) {
		// handle forbidden case
		await localStorage.clear();
	} else if (response.status === 404) {
		// handle not found case
	} else if (response.status === 401) {
		// handle unauthorized case
		localStorage.clear();
		window.location.href = '/login'; // Redirect to login on 401
	}

	return response;
};

const errorHandler = async (error) => {
	if (error?.response?.status === 401) {
		// Handle unauthorized errors
		localStorage.clear();
		window.location.href = '/login';
	}
	else if (error.response?.status === 403) {
		throw error;
	}
	else if (error?.response?.data?.message) {
		console.log({ error: error.response.data.message });
		throw new Error(error.response.data.message);
	} else {
		throw new Error(error.message || 'An unexpected error occurred');
	}
	// throw error;
};

axiosInstance.interceptors.request.use(
	(request) => requestHandler(request),
	(error) => errorHandler(error)
);

axiosInstance.interceptors.response.use(
	(response) => responseHandler(response),
	(error) => errorHandler(error)
);

export { axiosInstance };
