import React from 'react';
import { LogOutIcon } from '../ui/Icons';

const Header = ({ user, onSignOut }) => (
    <header className="flex-shrink-0 bg-glass-bg/80 backdrop-blur-xl flex items-center justify-between h-16 px-6 border-b border-glass-border z-20">
        <div className="flex items-center gap-3">
            <img src="https://adlandingpro.com/blog/wp-content/uploads/2025/06/Ad-Loft-Google-Ads.png" alt="Ad Loft Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-text-primary">Ad Loft</h1>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary hidden sm:block truncate">{user.email}</span>
            <button
                onClick={onSignOut}
                className="p-2 rounded-full text-text-secondary hover:bg-glass-border hover:text-text-primary transition-colors"
                title="Sign Out"
            >
                <LogOutIcon />
            </button>
        </div>
    </header>
);

export default Header;
