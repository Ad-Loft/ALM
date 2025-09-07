import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, DollarSignIcon, ClockIcon, FileTextIcon, ActivityIcon, TrendingUpIcon } from '../../components/ui/Icons';

const KpiCard = ({ title, value, icon }) => (
    <div className="bg-glass-bg backdrop-blur-xl p-5 rounded-2xl shadow-glass border border-glass-border flex items-start justify-between transition-all duration-300 hover:bg-glass-border/50 hover:border-glass-border">
        <div className="flex flex-col">
            <p className="text-base text-text-secondary mb-2">{title}</p>
            <p className="text-4xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="bg-matte-black/50 p-3 rounded-lg text-primary">{icon}</div>
    </div>
);

const ClientListItem = ({ client }) => {
    const navigate = useNavigate();
    return (
        <div onClick={() => navigate(`/client/${client.id}`)} className="flex items-center justify-between p-4 hover:bg-glass-border/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-glass-bg flex items-center justify-center font-bold text-sm text-text-primary ring-2 ring-glass-border">
                    {client.companyName ? client.companyName.split(' ').map(n => n[0]).join('') : 'C'}
                </div>
                <span className="font-medium text-text-primary">{client.companyName || 'Unnamed Client'}</span>
            </div>
        </div>
    );
};

const DashboardMetrics = () => {
    const [kpiData, setKpiData] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // --- Fetch primary collections ---
                const clientsSnapshot = await getDocs(collection(db, 'clients'));
                const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
                const invoicesData = invoicesSnapshot.docs.map(doc => doc.data());

                // --- KPI Calculations (with defaults) ---
                const currentMonth = new Date().getMonth();
                const monthlyRevenue = invoicesData
                    .filter(inv => inv.status === 'paid' && inv.paidDate && new Date(inv.paidDate.toDate()).getMonth() === currentMonth)
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

                const paymentsOutstanding = invoicesData
                    .filter(inv => inv.status === 'unpaid')
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

                // Reporting features have been temporarily removed as per user request to fix permission errors.
                // We can re-add Proposal Spend, Ad Spend, and ROAS calculations later.

                setKpiData([
                    { title: "Monthly Revenue", value: `$${monthlyRevenue.toLocaleString()}`, icon: <DollarSignIcon /> },
                    { title: "Payments Outstanding", value: `$${paymentsOutstanding.toLocaleString()}`, icon: <ClockIcon /> },
                ]);

                setClients(clientsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const currentDate = new Date();
    const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    }

    return (
        <div className="w-full">
             <div className="mb-8">
                <h2 className="text-3xl font-bold text-text-primary">Metrics for {monthYear}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {kpiData.map((kpi, index) => <KpiCard key={index} {...kpi} />)}
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border">
                <div className="p-4 sm:p-6 border-b border-glass-border">
                    <h2 className="text-xl font-bold text-text-primary">Active Clients</h2>
                </div>
                <div className="divide-y divide-glass-border">
                    {clients.length > 0 ? (
                        clients.map(client => <ClientListItem key={client.id} client={client} />)
                    ) : (
                        <p className="p-4 text-text-secondary text-center">No clients found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardMetrics;
