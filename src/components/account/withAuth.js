// components/withAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function withAuth(WrappedComponent) {
    return function WithAuth(props) {
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const router = useRouter();

        useEffect(() => {
            const checkAuth = async () => {
                try {
                    const response = await fetch('http://127.0.0.1:5000/auth/check-auth', {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        setIsAuthenticated(true);
                    } else {
                        throw new Error('Not authenticated');
                    }
                } catch (error) {
                    console.error('Authentication check failed:', error);
                    setIsAuthenticated(false);
                } finally {
                    setIsLoading(false);
                }
            };

            checkAuth();
        }, []);

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/login');
            }
        }, [isLoading, isAuthenticated, router]);

        if (isLoading) {
            return <div>正在加載...</div>;
        }

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}