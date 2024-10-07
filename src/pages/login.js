import { useState } from 'react';
import { useRouter } from 'next/router';
import SignInSide from "../components/account/SignInSide";

export default function LoginPage() {
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (username, password) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.isLoggedIn) {
                router.push('/'); // Redirect to home page after successful login
            } else {
                setError(data.error || '登入失敗');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('發生了意外錯誤');
        }
    };

    return (
        <SignInSide onSubmit={handleLogin} error={error} />
    );
}