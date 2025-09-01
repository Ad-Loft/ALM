import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Sub-component for a single client row
const ClientRow = ({ client }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState({ indicator: 'none', text: '' }); // none, upcoming, outstanding
    const [dailyStats, setDailyStats] = useState(null);

    useEffect(() => {
        // Check for upcoming payment
        const today = new Date();
        const dayOfMonth = today.getDate();
        if (client.paymentDueDate && client.monthlyRetainer) {
            const dueDate = parseInt(client.paymentDueDate, 10);
            const daysUntilDue = dueDate - dayOfMonth;
            if (daysUntilDue > 0 && daysUntilDue <= 3) {
                setStatus({ indicator: 'upcoming', text: `Payment due in ${daysUntilDue} day(s)` });
            }
        }

        // Check for outstanding invoices (this is a more expensive query)
        const checkInvoices = async () => {
            const q = query(collection(db, 'invoices'), where('clientId', '==', client.id), where('status', '==', 'unpaid'), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setStatus({ indicator: 'outstanding', text: 'Outstanding Invoice' });
            }
        };

        // Fetch today's stats
        const fetchStats = async () => {
            const todayStr = getTodayDateString();
            const statsQuery = query(collection(db, `clients/${client.id}/dailyStats`), where('date', '==', todayStr), limit(1));
            const statsSnapshot = await getDocs(statsQuery);
            if (!statsSnapshot.empty) {
                setDailyStats(statsSnapshot.docs[0].data());
            }
        };

        checkInvoices();
        fetchStats();
    }, [client]);

    const handleNavigate = () => {
        navigate(`/client/${client.id}`);
    };

    return (
        <div
            className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center cursor-pointer hover:bg-glass-border/30 transition-colors duration-200"
            onClick={handleNavigate}
        >
            {/* Client Name & Status */}
            <div className="flex flex-col">
                <span className="font-medium text-text-primary text-lg">{client.companyName}</span>
                {status.indicator === 'outstanding' && <span className="text-sm font-semibold text-red-500">{status.text}</span>}
                {status.indicator === 'upcoming' && <span className="text-sm font-semibold text-yellow-400">{status.text}</span>}
            </div>

            {/* Daily Stats */}
            <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                {dailyStats ? (
                    <>
                        <div className="flex flex-col"><span className="text-text-secondary">Spend</span><span className="font-bold text-text-primary">${dailyStats.spend.toFixed(2)}</span></div>
                        <div className="flex flex-col"><span className="text-text-secondary">Clicks</span><span className="font-bold text-text-primary">{dailyStats.clicks}</span></div>
                        <div className="flex flex-col"><span className="text-text-secondary">Conv.</span><span className="font-bold text-text-primary">{dailyStats.conversions}</span></div>
                        <div className="flex flex-col"><span className="text-text-secondary">CPC</span><span className="font-bold text-text-primary">${dailyStats.cpc.toFixed(2)}</span></div>
                    </>
                ) : (
                    <div className="col-span-4 text-text-secondary">No stats for today.</div>
                )}
            </div>
        </div>
    );
};


const ViewClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'clients'));
                const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(clientsData);
            } catch (err) {
                setError('Failed to fetch clients. Please try again.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">View Clients</h2>
                    <p className="text-base text-text-secondary mt-1">A list of all your active clients.</p>
                </div>
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border">
                <div className="divide-y divide-glass-border">
                    {clients.length > 0 ? (
                        clients.map(client => <ClientRow key={client.id} client={client} />)
                    ) : (
                        <p className="p-4 text-text-secondary text-center">No clients found. You can create one from the sidebar.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewClientsPage;
