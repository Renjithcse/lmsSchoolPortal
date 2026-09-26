import React from 'react';
import { useTranslation } from 'react-i18next';

const NotAuthorized = () => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center h-[85vh] bg-gray-100">
            <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                <div className="mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-red-500 mx-auto"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 002 0V7zm-1 6a1 1 0 100 2 1 1 0 000-2z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('notAuthorized.title')}</h1>
                <p className="text-gray-600 mb-4">
                    {t('notAuthorized.message')}
                </p>
                <button
                    onClick={() => (window.location.href = '/')} // Replace with actual redirect logic
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {t('notAuthorized.goToHomepage')}
                </button>
            </div>
        </div>
    );
};

export default NotAuthorized;
