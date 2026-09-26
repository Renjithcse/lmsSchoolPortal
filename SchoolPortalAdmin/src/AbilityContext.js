import React, { createContext, useContext } from 'react';
import { defineAbilitiesFor } from './abilities';

const defaultAbility = defineAbilitiesFor([]);

const AbilityContext = createContext(defaultAbility);

export const AbilityProvider = ({ ability, children }) => (
	<AbilityContext.Provider value={ability || defaultAbility}>
		{children}
	</AbilityContext.Provider>
);

export const useAbility = () => {
	const context = useContext(AbilityContext);
	return (context ?? defaultAbility);
};
