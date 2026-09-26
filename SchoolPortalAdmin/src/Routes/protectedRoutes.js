/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { Outlet, useMatches, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAbility } from '../AbilityContext';
import NotAuthorized from '../components/Common/NotAuthorized';
import CustomOutletBox from '../components/Common/CustomOutletBox';

const ProtectedRouter = ({ children }) => {
	const ability = useAbility()
	const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

	const matches = useMatches(); // Get the matched routes
	const currentRoute = matches[matches.length - 1]; // Get the deepest matched route
	const { subject, action } = currentRoute?.handle || {};
	const isLoginRoute = matches.some((match) => match.pathname === '/login' || match.pathnameBase === '/login');

	// If ability is not yet loaded (abilities array is empty), allow access temporarily
	if (!ability) {
		return <Outlet />
	}

	if (!isAuthenticated && !isLoginRoute) {
		return <Navigate to="/login" replace />
	}

	if (subject && action) {
		if (ability.cannot(action, subject)) {
			return <CustomOutletBox><NotAuthorized /></CustomOutletBox>
		}
		else {
			return <Outlet />
		}
	}
	else {
		return <Outlet />
	}
	// useEffect(() => {
	//   if (!(localStorage.getItem("token") && localStorage.getItem("user"))) {

	//     navigate('/login')
	//   }
	// }, [!localStorage.getItem("token"), !localStorage.getItem("user")])

	// console.log({subject, ability})




	// if (!(localStorage.getItem("token") && localStorage.getItem("user"))) {
	//   // not logged in so redirect to login page with the return url
	//   return <Navigate to="/login" />
	// }

	// authorized so return child components

}

export default ProtectedRouter