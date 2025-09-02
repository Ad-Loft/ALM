import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, DollarSignIcon, ClockIcon, FileTextIcon, ActivityIcon, TrendingUpIcon } from '../../components/ui/Icons';

const KpiCard = ({ title, value, icon }) => (
    <div className="bg-card p-5 rounded-lg border border-border transition-all duration-300 hover:border-primary">
        <div className="flex items-start justify-between">
            <div className="flex flex-col">
                <p className="text-base text-muted-foreground mb-2">{title}</p>
                <p className="text-3xl font-bold text-foreground">{value}</p>
            </div>
            <div className="bg-secondary p-3 rounded-lg text-primary">{icon}</div>
        </div>
    </div>
);

const ClientListItem = ({ client }) => {
    const navigate = useNavigate();
    return (
        <div onClick={() => navigate(`/client/${client.id}`)} className="flex items-center justify-between p-4 hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-foreground ring-2 ring-border">
                    {client.companyName ? client.companyName.split(' ').map(n => n[0]).join('') : 'C'}
                </div>
                <span className="font-medium text-foreground">{client.companyName || 'Unnamed Client'}</span>
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

                // --- Aggregate data from sub-collections ---
                let totalProposalSpend = 0;
                let totalAdSpend = 0;

                for (const client of clientsData) {
                    // Aggregate proposal spend from each client's projects
                    const projectsCol = collection(db, 'clients', client.id, 'projects');
                    const projectsSnapshot = await getDocs(projectsCol);
                    projectsSnapshot.forEach(doc => {
                        totalProposalSpend += doc.data().totalCost || 0;
                    });

                    // Aggregate ad spend from each client's daily stats
                    const statsCol = collection(db, 'clients', client.id, 'dailyStats');
                    const statsSnapshot = await getDocs(statsCol);
                    statsSnapshot.forEach(doc => {
                        totalAdSpend += doc.data().spend || 0;
                    });
                }

                // --- KPI Calculations (with defaults) ---
                const currentMonth = new Date().getMonth();
                const monthlyRevenue = invoicesData
                    .filter(inv => inv.status === 'paid' && inv.paidDate && new Date(inv.paidDate.toDate()).getMonth() === currentMonth)
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

                const paymentsOutstanding = invoicesData
                    .filter(inv => inv.status === 'unpaid')
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

                const totalRevenue = invoicesData.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);

                const roasGoogle = totalAdSpend > 0 ? (totalRevenue / totalAdSpend) : 0;
                const roasUpwork = totalProposalSpend > 0 ? (totalRevenue / totalProposalSpend) : 0;

                setKpiData([
                    { title: "Monthly Revenue", value: `$${monthlyRevenue.toLocaleString()}`, icon: <DollarSignIcon /> },
                    { title: "Payments Outstanding", value: `$${paymentsOutstanding.toLocaleString()}`, icon: <ClockIcon /> },
                    { title: "Proposal Spend", value: `$${totalProposalSpend.toLocaleString()}`, icon: <FileTextIcon /> },
                    { title: "Ad Spend", value: `$${totalAdSpend.toLocaleString()}`, icon: <ActivityIcon /> },
                    { title: "ROAS (Google)", value: `${roasGoogle.toFixed(2)}x`, icon: <TrendingUpIcon /> },
                    { title: "ROAS (Upwork)", value: `${roasUpwork.toFixed(2)}x`, icon: <TrendingUpIcon /> },
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
                <h2 className="text-3xl font-bold text-foreground">Metrics for {monthYear}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {kpiData.map((kpi, index) => <KpiCard key={index} {...kpi} />)}
            </div>
            <div className="bg-card rounded-lg border border-border">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Active Clients</h2>
                </div>
                <div className="divide-y divide-border">
                    {clients.length > 0 ? (
                        clients.map(client => <ClientListItem key={client.id} client={client} />)
                    ) : (
                        <p className="p-4 text-muted-foreground text-center">No clients found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardMetrics;
