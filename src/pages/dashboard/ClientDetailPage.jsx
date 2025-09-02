import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import OverviewTab from './OverviewTab';

// --- TABS (placeholders for now) ---
const ProjectsTab = ({ client }) => <div>Projects for {client.companyName} - Content coming soon.</div>;
const InvoicesTab = ({ client }) => <div>Invoices for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => <div>Interaction Log for {client.companyName} - Content coming soon.</div>;


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
        { id: 'interactions', label: 'Interaction Log' },
    ];

    const renderTabContent = () => {
        if (!client) return null;
        switch (activeTab) {
            case 'overview': return <OverviewTab client={client} />;
            case 'projects': return <ProjectsTab client={client} />;
            case 'invoices': return <InvoicesTab client={client} />;
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
                <h2 className="text-3xl font-bold text-foreground">{client.companyName}</h2>
                <button onClick={() => navigate('/clients/view')} className="text-sm text-primary hover:underline mt-2">&larr; Back to All Clients</button>
            </div>

            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={
                                `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ClientDetailPage;
