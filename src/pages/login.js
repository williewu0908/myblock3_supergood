import SignInSide from "../components/account/SignInSide";
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [loginError, setLoginError] = useState('');

    const handleLogin = async (username, password) => {
        try {
            const response = await fetch('http://127.0.0.1:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('username', data.username);
                localStorage.setItem('email', data.email);
                localStorage.setItem('encoded_data', data.encoded_data);
                router.push('/');
            } else {
                const errorData = await response.json();
                setLoginError(errorData.message || '登入失敗，請檢查您的用戶名和密碼。');
            }
        } catch (error) {
            console.error('Error during login:', error);
            setLoginError('登入失敗，請檢查您的用戶名和密碼。');
        }
    };

    return (
        <SignInSide onSubmit={handleLogin} loginError={loginError} />
    );
}
