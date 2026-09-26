import React from 'react';
import { useTranslation } from 'react-i18next';

const ErrorInfo = ({ message }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="max-w-md w-full p-6 bg-white shadow-lg rounded-lg border border-red-300">
                <div className="text-red-500 flex justify-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-12 h-12"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3m0 3h.01m-6.938 4h13.856c.891 0 1.337-1.077.707-1.707L13.707 3.707c-.63-.63-1.708-.184-1.708.707V20c0 .891-1.077 1.337-1.707.707L3.707 14.707c-.63-.63-.184-1.708.707-1.708H20z"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800 text-center mb-2">{t('errorInfo.title')}</h2>
                <p className="text-gray-600 text-center">{message}</p>
            </div>
        </div>
    );
};

export default ErrorInfo;
