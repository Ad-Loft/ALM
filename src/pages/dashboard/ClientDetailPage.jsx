import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- OVERVIEW TAB ---
// ... (omitted for brevity)
const OverviewTab = ({ client }) => { /* ... */ };

// --- PROJECTS TAB ---
// ... (omitted for brevity)
const ProjectsTab = ({ client }) => { /* ... */ };

// --- INVOICES TAB ---
// ... (omitted for brevity)
const InvoicesTab = ({ client }) => { /* ... */ };

// --- REPORTING TAB (FIXED) ---
const ReportingTab = ({ client }) => {
    const [stats, setStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const statsQuery = query(
                collection(db, `clients/${client.id}/dailyStats`),
                where('date', '>=', dateRange.start),
                where('date', '<=', dateRange.end),
                orderBy('date', 'asc')
            );
            const statsSnapshot = await getDocs(statsQuery);
            const statsData = statsSnapshot.docs.map(d => d.data());
            setStats(statsData);
            setIsLoading(false);
        };
        fetchStats();
    }, [client.id, dateRange]);

    const tooltipStyle = {
        backgroundColor: 'rgba(26, 26, 26, 0.8)', // matte-black with opacity
        border: '1px solid rgba(255, 255, 255, 0.1)', // glass-border
        color: '#e5e7eb' // text-primary
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-text-primary mb-4">Reporting</h3>
            <div className="flex gap-4 mb-6">
                <InputField id="startDate" type="date" label="Start Date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <InputField id="endDate" type="date" label="End Date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
            </div>
            {isLoading ? <LoadingSpinner /> : stats.length > 0 ? (
                <div className="space-y-8">
                    <div>
                        <h4 className="text-lg font-semibold text-text-secondary mb-3">Spend & Conversions Over Time</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis yAxisId="left" stroke="#9ca3af" />
                                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#3b82f6" name="Spend ($)" />
                                <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#8884d8" name="Conversions" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-text-secondary mb-3">Clicks & CPC</h4>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                                <Bar dataKey="cpc" fill="#ffc658" name="CPC ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : <p className="text-text-secondary">No reporting data found for this period.</p>}
        </div>
    );
};


// --- OTHER TABS ---
const LeadsTab = ({ client }) => <div>Leads for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => { /* ... */ };


// --- MAIN COMPONENT ---
const ClientDetailPage = () => {
    // ... (omitted for brevity)
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('reporting'); // Default to reporting
    useEffect(() => { /* ... */ }, [clientId]);
    const tabs = [ { id: 'overview', label: 'Overview' }, { id: 'projects', label: 'Projects' }, { id: 'invoices', label: 'Invoices' }, { id: 'reporting', label: 'Reporting' }, { id: 'leads', label: 'Leads' }, { id: 'interactions', label: 'Interaction Log' }, ];
    const renderTabContent = () => { if (!client) return null; switch (activeTab) { /* ... */ case 'reporting': return <ReportingTab client={client} />; /* ... */ } };
    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!client) return null;
    return (
        <div>
            {/* ... */}
        </div>
    );
};

export default ClientDetailPage;
