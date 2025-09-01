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
                    {client.companyName.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="font-medium text-text-primary">{client.companyName}</span>
            </div>
            {/* Future: Add a status indicator here if needed */}
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

            // Fetch all necessary data
            const clientsSnapshot = await getDocs(collection(db, 'clients'));
            const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
            const invoicesData = invoicesSnapshot.docs.map(doc => doc.data());

            // This is a simplification. A real app would likely need to iterate through project subcollections.
            const projectsSnapshot = await getDocs(collection(db, 'projects')); // Assuming a top-level projects collection for now
            const projectsData = projectsSnapshot.docs.map(doc => doc.data());

            // --- KPI Calculations ---
            const currentMonth = new Date().getMonth();
            const monthlyRevenue = invoicesData
                .filter(inv => inv.status === 'paid' && new Date(inv.paidDate?.toDate()).getMonth() === currentMonth)
                .reduce((sum, inv) => sum + inv.amount, 0);

            const paymentsOutstanding = invoicesData
                .filter(inv => inv.status === 'unpaid')
                .reduce((sum, inv) => sum + inv.amount, 0);

            const proposalSpend = projectsData.reduce((sum, proj) => sum + (proj.totalCost || 0), 0);

            // Assuming Ad Spend is tracked somewhere, placeholder for now
            const adSpend = 6750; // Placeholder

            const totalRevenue = invoicesData.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

            const roasGoogle = adSpend > 0 ? (totalRevenue / adSpend) : 0;
            const roasUpwork = proposalSpend > 0 ? (totalRevenue / proposalSpend) : 0;

            setKpiData([
                { title: "Monthly Revenue", value: `$${monthlyRevenue.toLocaleString()}`, icon: <DollarSignIcon /> },
                { title: "Payments Outstanding", value: `$${paymentsOutstanding.toLocaleString()}`, icon: <ClockIcon /> },
                { title: "Proposal Spend", value: `$${proposalSpend.toLocaleString()}`, icon: <FileTextIcon /> },
                { title: "Ad Spend", value: `$${adSpend.toLocaleString()}`, icon: <ActivityIcon /> },
                { title: "ROAS (Google)", value: `${roasGoogle.toFixed(2)}x`, icon: <TrendingUpIcon /> },
                { title: "ROAS (Upwork)", value: `${roasUpwork.toFixed(2)}x`, icon: <TrendingUpIcon /> },
            ]);

            setClients(clientsData);
            setIsLoading(false);
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
                    {clients.map(client => <ClientListItem key={client.id} client={client} />)}
                </div>
            </div>
        </div>
    );
};

export default DashboardMetrics;
