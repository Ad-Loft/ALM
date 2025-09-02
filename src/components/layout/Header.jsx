import React from 'react';
import { LogOutIcon } from '../ui/Icons';
import { Button } from "@/components/ui/button";

const Header = ({ user, onSignOut }) => (
    <header className="flex-shrink-0 bg-card flex items-center justify-between h-16 px-6 border-b border-border z-20">
        <div className="flex items-center gap-3">
            <img src="https://adlandingpro.com/blog/wp-content/uploads/2025/06/Ad-Loft-Google-Ads.png" alt="Ad Loft Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-foreground">Ad Loft</h1>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block truncate">{user.email}</span>
            <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                title="Sign Out"
            >
                <LogOutIcon />
            </Button>
        </div>
    </header>
);

export default Header;
