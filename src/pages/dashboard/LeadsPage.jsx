import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { useNavigate } from 'react-router-dom';

const LeadDetailModal = ({ lead, onClose, onConvertToCustomer }) => {
    if (!lead) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-glass-bg rounded-2xl shadow-glass border border-glass-border w-full max-w-lg m-4">
                <div className="p-6 border-b border-glass-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-text-primary">{lead.name}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">&times;</button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4">
                        {Object.entries(lead).map(([key, value]) => (
                            <div key={key}>
                                <p className="text-sm font-bold text-text-secondary capitalize">{key.replace(/_/g, ' ')}</p>
                                <p className="text-text-primary">{typeof value === 'object' && value.seconds ? new Date(value.seconds * 1000).toLocaleString() : value.toString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-matte-black/30 rounded-b-2xl flex justify-end gap-4">
                    <button onClick={onClose} className="text-text-primary font-semibold py-2 px-4 rounded-lg">Close</button>
                    <button onClick={() => onConvertToCustomer(lead)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg">
                        Convert to Customer
                    </button>
                </div>
            </div>
        </div>
    );
};


const LeadsPage = () => {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLeads = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const leadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLeads(leadsData);
            } catch (err) {
                setError('Failed to fetch leads. Ensure the \'leads\' collection exists and has read permissions.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeads();
    }, []);

    const handleConvertToCustomer = (leadData) => {
        setSelectedLead(null); // Close modal
        navigate('/clients/create', { state: { leadData } });
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-text-primary">Business Leads</h2>
                <p className="text-base text-text-secondary mt-1">A list of all your incoming business leads.</p>
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border">
                <div className="divide-y divide-glass-border">
                    {leads.length > 0 ? (
                        leads.map(lead => (
                            <div key={lead.id} onClick={() => setSelectedLead(lead)} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center cursor-pointer hover:bg-glass-border/30 transition-colors">
                                <span className="font-medium text-text-primary">{lead.name}</span>
                                <span className="text-text-secondary">{lead.email}</span>
                                <span className="text-text-secondary">{lead.phone}</span>
                                <span className="text-text-secondary text-right">{lead.createdAt?.toDate().toLocaleDateString() || 'No Date'}</span>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-text-secondary text-center">No leads found.</p>
                    )}
                </div>
            </div>
            <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onConvertToCustomer={handleConvertToCustomer} />
        </div>
    );
};

export default LeadsPage;
