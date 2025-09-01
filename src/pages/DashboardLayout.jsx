import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

import DashboardMetrics from './dashboard/DashboardMetrics';
import CreateClientPage from './dashboard/CreateClientPage';
import ViewClientsPage from './dashboard/ViewClientsPage';
import ClientDetailPage from './dashboard/ClientDetailPage';
import ProjectDetailPage from './dashboard/ProjectDetailPage';

const DashboardLayout = ({ user, onSignOut }) => {
    return (
        <div className="flex flex-col h-screen bg-matte-black">
            <Header user={user} onSignOut={onSignOut} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-8">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<DashboardMetrics />} />
                            <Route path="/clients/create" element={<CreateClientPage user={user} />} />
                            <Route path="/clients/view" element={<ViewClientsPage />} />
                            <Route path="/client/:clientId" element={<ClientDetailPage />} />
                            <Route path="/client/:clientId/project/:projectId" element={<ProjectDetailPage />} />
                            {/* Define other nested routes here */}
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
