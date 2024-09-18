import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.tsx';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</ConvexProviderWithClerk>
		</ClerkProvider>
	</StrictMode>,
);
