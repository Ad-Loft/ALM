import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/config';

import Login from './pages/Login';
import TwoFactorAuth from './pages/TwoFactorAuth';
import DashboardLayout from './pages/DashboardLayout'; // I will create this next
import { LoadingSpinner } from './components/ui/Icons';

// A wrapper component to handle the redirect logic after login
const AppWrapper = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [interimUser, setInterimUser] = useState(null); // For the user between login and 2FA

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <BrowserRouter>
            <AppRoutes
                user={user}
                setUser={setUser}
                interimUser={interimUser}
                setInterimUser={setInterimUser}
            />
        </BrowserRouter>
    );
};


const AppRoutes = ({ user, setUser, interimUser, setInterimUser }) => {
    const navigate = useNavigate();

    const handleLoginSuccess = (userCredential) => {
        setInterimUser(userCredential.user);
        navigate('/2fa');
    };

    const handle2FAVerified = (authedUser) => {
        setUser(authedUser);
        setInterimUser(null);
        navigate('/');
    }

    const handleSignOut = async () => {
        await signOut(auth);
        setUser(null);
        setInterimUser(null);
        navigate('/login');
    };

    return (
        <Routes>
            <Route path="/login" element={
                !user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />
            } />
            <Route path="/2fa" element={
                interimUser ? <TwoFactorAuth user={interimUser} onVerified={handle2FAVerified} /> : <Navigate to="/login" />
            } />
            <Route path="/*" element={
                user ? <DashboardLayout user={user} onSignOut={handleSignOut} /> : <Navigate to="/login" />
            } />
        </Routes>
    );
}


// The main App component is now just the wrapper
const App = () => <AppWrapper />;

export default App;
