import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from "react-redux";
import store from "./Redux/store";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const LoadingFallback = () => (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#f8fafc',
            fontFamily: '"Raleway", sans-serif',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
        }}
    >
        Initialising Experience…
    </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<I18nextProvider i18n={i18n}>
			<Provider store={store}>
				<Suspense fallback={<LoadingFallback />}>
					<App />
				</Suspense>
			</Provider>
		</I18nextProvider>
	</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
