import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    HomeIcon,
    FilterIcon,
    UsersIcon,
    BarChartIcon,
    TrendingUpIcon,
    FileTextIcon,
    SettingsIcon,
    ChevronDownIcon
} from '../ui/Icons';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isClientsOpen, setClientsOpen] = useState(true);

    useEffect(() => {
        // Keep the "Clients" dropdown open if we are on a client-related page
        if (location.pathname.startsWith('/clients') || location.pathname.startsWith('/client/')) {
            setClientsOpen(true);
        }
    }, [location.pathname]);

    const handleNavigation = (path, isSubItemToggle = false) => {
        if (isSubItemToggle) {
            setClientsOpen(!isClientsOpen);
        } else {
            navigate(path);
        }
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
        { path: '/leads', label: 'Leads', icon: <FilterIcon /> },
        {
            id: 'clients-toggle', // Special ID for the toggle button
            label: 'Clients',
            icon: <UsersIcon />,
            subItems: [
                { path: '/clients/create', label: 'Create Client' },
                { path: '/clients/view', label: 'View Clients' },
            ]
        },
        { path: '/reporting', label: 'Reporting', icon: <BarChartIcon /> },
        { path: '/ad-spend', label: 'Ad Spend', icon: <TrendingUpIcon /> },
        { path: '/proposal-spend', label: 'Proposal Spend', icon: <FileTextIcon /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    return (
        <aside className="w-64 bg-glass-bg/80 backdrop-blur-xl border-r border-glass-border flex-col flex-shrink-0 shadow-2xl z-10 hidden md:flex">
            <nav className="flex-1 px-4 py-8 space-y-1">
                {navItems.map(item => (
                    <div key={item.id || item.path}>
                        <button
                            onClick={() => handleNavigation(item.path, !!item.subItems)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-base font-semibold transition-all duration-200 ease-in-out ${
                                (location.pathname === item.path || (item.subItems && location.pathname.startsWith('/client')))
                                    ? 'bg-primary text-white shadow-lg shadow-blue-600/30'
                                    : 'text-text-secondary hover:bg-glass-border hover:text-text-primary'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.subItems && <ChevronDownIcon className={`transform transition-transform duration-200 ${isClientsOpen ? 'rotate-180' : ''}`} />}
                        </button>
                        {item.subItems && isClientsOpen && (
                            <div className="pl-8 pt-2 space-y-1">
                                {item.subItems.map(subItem => (
                                     <button
                                        key={subItem.path}
                                        onClick={() => handleNavigation(subItem.path)}
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors ${
                                            location.pathname === subItem.path
                                                ? 'text-primary font-semibold'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        {subItem.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
