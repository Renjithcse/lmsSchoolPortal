
import './App.css';
import { RouterPath } from './Routes';
import { RouterProvider } from 'react-router-dom';

import {
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import { SnackbarProvider } from './hooks/SnackBar';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import { defineAbilitiesFor } from './abilities';
import { AbilityProvider } from './AbilityContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useGetProfileQuery, useLazyGetProfileQuery } from './Redux/features/auth/userSlice';
import { setRole, setAbility as setAbilityAction, setAuthenticated as setAuthenticatedAction, setUser } from './Redux/features/auth/authSlice';
import { StudentPermissions } from './constant/Permissions';
// Define dark theme
// const darkTheme = createTheme({
//   palette: {
//     mode: 'dark',
//     // Add dark mode color scheme here
//   },
// });

// Define light theme (optional)
// const lightTheme = createTheme({
//   palette: {
//     mode: 'light',
//     // Add light mode color scheme here
//   },
// });

function App() {
	const queryClient = new QueryClient()
	const authState = useSelector((state) => state.auth);
	const ability = useSelector((state) => state.auth.ability);
	const [loading, setLoading] = useState(true)
	const dispatch = useDispatch()

	const [getProfile, { data, isLoading, error }] = useLazyGetProfileQuery()

	const applyAbility = useCallback((permissions, isAuthenticated = true) => {
		const definedAbility = defineAbilitiesFor(permissions);
		dispatch(setAbilityAction(definedAbility));
		dispatch(setAuthenticatedAction(isAuthenticated));
		setLoading(false);
	}, [dispatch]);

	const applyFallbackAbility = useCallback(() => {
		applyAbility([], false);
	}, [applyAbility]);

	const getUserProfile = useCallback(async () => {
		let user = await getProfile();
		// console.log({users: user})
		if(user?.error){
			//console.log(window.location.pathname)
            // console.error('Failed to get user profile', user?.error)
			// window.location.href = '/login'
			if(window.location.pathname !== '/login'){
				window.location.href = '/login'
			}
			else{
				applyFallbackAbility();
			}
        }
		else{
			// console.log({user})
			if(user?.data?.data?.user?.role === "admin"){
				dispatch(setUser(user?.data?.data?.user))
				dispatch(setRole('admin'))
				applyAbility([
					{ "action": "manage", "subject": "all" }
				], true);
			}
			else if(user?.data?.data?.teacher){
				dispatch(setRole('teacher'))
				let users = {
					_id: user?.data?.data?.teacher?.userId,
					teacher: user?.data?.data?.teacher,
					role: {
						roleName: user?.data?.data?.teacher?.role?.roleName,
					}
				}
				dispatch(setUser(users));
				applyAbility(user?.data?.data?.teacher?.role?.permissions || [], true);
			}
			else if(user?.data?.data?.student){
				dispatch(setRole('student'))
				let permissions = StudentPermissions.map(student => { 
					return {
						"action": "manage", 
						"subject": student
					}
				})
				applyAbility(permissions, true);
			}
			else{
				applyFallbackAbility();
			}
		}
	}, [getProfile, dispatch, applyAbility, applyFallbackAbility])

	useEffect(() => {
		getUserProfile();
	}, [getUserProfile]);

	useEffect(() => {
		if (!loading && ability) {
			const isAdmin = authState.role === 'admin';
			const isTeacher = authState.role === 'teacher';
			const isStudent = authState.role === 'student';
			const currentPath = window.location.pathname;

			if (currentPath === '/login') {
				if (isAdmin) {
					RouterPath.navigate('/', { replace: true });
				} else if (isTeacher) {
					RouterPath.navigate('/teacher/my-dashboard', { replace: true });
				} else if (isStudent) {
					RouterPath.navigate('/students', { replace: true });
				} else {
					RouterPath.navigate('/', { replace: true });
				}
			}
		}
	}, [loading, ability, authState.role]);
	

	if (loading || !ability) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
			</div>
		)
	}


	console.log({ability})
	
	// State to track current theme
	// const [isDarkMode, setIsDarkMode] = useState(true);

	// // Toggle theme function
	// const toggleTheme = () => {
	//   setIsDarkMode(prevMode => !prevMode);
	// };

	// Determine which theme to use
	// const theme = isDarkMode ? darkTheme : lightTheme;

	
	return (
		<AbilityProvider ability={ability}>
			<QueryClientProvider client={queryClient}>
				<SnackbarProvider>
					<ThemeProvider>
						<RouterProvider router={RouterPath} />
					</ThemeProvider>
				</SnackbarProvider>
			</QueryClientProvider>
		</AbilityProvider>
	);
}

export default App;
