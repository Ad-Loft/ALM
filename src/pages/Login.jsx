import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthCard, AuthHeader, InputField, AuthButton } from '../components/ui/AuthComponents';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess(userCredential);
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('Incorrect email or password.');
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <AuthCard>
                    <AuthHeader title="Welcome Back!" />
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField id="email" type="email" label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <InputField id="password" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <AuthButton isLoading={isLoading}>Sign In</AuthButton>
                    </form>
                </AuthCard>
            </div>
        </div>
    );
};

export default Login;
