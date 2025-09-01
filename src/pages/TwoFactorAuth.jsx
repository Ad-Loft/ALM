import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AuthCard, AuthHeader, InputField, AuthButton } from '../components/ui/AuthComponents';

// IMPORTANT: These libraries are loaded via CDN in the HTML for QR code and TOTP generation.
// <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/otpauth/9.1.3/otpauth.min.js"></script>

const APP_NAME = "Ad Loft";

const TwoFactorAuth = ({ user, onVerified }) => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists() || !userDoc.data().twoFactorSecret) {
                throw new Error("2FA not configured for this account.");
            }
            const secret = userDoc.data().twoFactorSecret;
            const totp = new otpauth.TOTP({
                issuer: APP_NAME,
                label: user.email,
                secret: secret,
            });
            const delta = totp.validate({ token });
            if (delta === null) {
                throw new Error("Invalid authentication code. Please try again.");
            }
            onVerified(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <AuthCard>
                    <AuthHeader title="Two-Factor Authentication" subtitle="Enter the code from your authenticator app." />
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <InputField id="2fa-token" type="text" label="6-Digit Code" value={token} onChange={(e) => setToken(e.target.value)} required inputMode="numeric" pattern="\\d{6}" maxLength="6" />
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <AuthButton isLoading={isLoading}>Verify</AuthButton>
                    </form>
                </AuthCard>
            </div>
        </div>
    );
};

export default TwoFactorAuth;
