import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- TABS (some are placeholders or temporarily disabled) ---

const OverviewTab = ({ client }) => <div>Client Overview for {client.companyName} - Content coming soon.</div>;
const ProjectsTab = ({ client }) => <div>Projects for {client.companyName} - Content coming soon.</div>;
const InvoicesTab = ({ client }) => <div>Invoices for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => <div>Interaction Log for {client.companyName} - Content coming soon.</div>;
// const ReportingTab = ({ client }) => <div>Reporting Tab</div>; // Temporarily disabled
// const LeadsTab = ({ client }) => <div>Leads Tab</div>; // Temporarily disabled


// --- MAIN COMPONENT ---
const ClientDetailPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchClient = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'clients', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setClient({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('No such client found!');
                }
            } catch (err) {
                console.error("Error fetching client data:", err);
                setError('Failed to fetch client data.');
            } finally {
                setIsLoading(false);
            }
        };
        if (clientId) fetchClient();
    }, [clientId]);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'projects', label: 'Projects' },
        { id: 'invoices', label: 'Invoices' },
        // { id: 'reporting', label: 'Reporting' },
        // { id: 'leads', label: 'Leads' },
        { id: 'interactions', label: 'Interaction Log' },
    ];

    const renderTabContent = () => {
        if (!client) return null;
        switch (activeTab) {
            case 'overview': return <OverviewTab client={client} />;
            case 'projects': return <ProjectsTab client={client} />;
            case 'invoices': return <InvoicesTab client={client} />;
            // case 'reporting': return <ReportingTab client={client} />;
            // case 'leads': return <LeadsTab client={client} />;
            case 'interactions': return <InteractionsTab client={client} />;
            default: return <OverviewTab client={client} />;
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!client) return null;

    return (
        <div>
            <div className="mb-6">
                <button onClick={() => navigate('/clients/view')} className="text-sm text-primary hover:underline mb-2">&larr; Back to All Clients</button>
                <h2 className="text-3xl font-bold text-text-primary mb-2">{client.companyName}</h2>
                <div className="text-base text-text-secondary mt-2 space-y-1">
                    <p><span className="font-semibold text-text-primary">Contact:</span> {client.fullName}</p>
                    <p><span className="font-semibold text-text-primary">Email:</span> <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a></p>
                    <p><span className="font-semibold text-text-primary">Phone:</span> {client.phone || 'N/A'}</p>
                    {client.website && <div><span className="font-semibold text-text-primary">Website:</span> <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{client.website}</a></div>}
                </div>
            </div>
            <div className="border-b border-glass-border mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ClientDetailPage;
