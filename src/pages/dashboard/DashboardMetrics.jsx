import React from 'react';
import { DollarSignIcon, ClockIcon, FileTextIcon, ActivityIcon } from '../../components/ui/Icons';

const KpiCard = ({ title, value, icon }) => (
    <div className="bg-glass-bg backdrop-blur-xl p-5 rounded-2xl shadow-glass border border-glass-border flex items-start justify-between transition-all duration-300 hover:bg-glass-border/50 hover:border-glass-border">
        <div className="flex flex-col">
            <p className="text-base text-text-secondary mb-2">{title}</p>
            <p className="text-4xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="bg-matte-black/50 p-3 rounded-lg text-primary">{icon}</div>
    </div>
);

const ClientListItem = ({ client }) => (
    <div className="flex items-center justify-between p-4 hover:bg-glass-border/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-glass-bg flex items-center justify-center font-bold text-sm text-text-primary ring-2 ring-glass-border">
                {client.name.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="font-medium text-text-primary">{client.name}</span>
        </div>
        <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full">{client.status}</span>
    </div>
);

const DashboardMetrics = () => {
    const kpiData = [
        { title: "Monthly Revenue", value: "$12,500", icon: <DollarSignIcon /> },
        { title: "Payments Outstanding", value: "$3,200", icon: <ClockIcon /> },
        { title: "Proposal Spend", value: "$1,800", icon: <FileTextIcon /> },
        { title: "Ad Spend", value: "$6,750", icon: <ActivityIcon /> },
    ];
    const activeClients = [
        { id: 1, name: "Starlight Bakery", status: "Active" },
        { id: 2, name: "QuantumLeap Tech", status: "Active" },
        { id: 3, name: "Evergreen Landscaping", status: "Active" },
        { id: 4, name: "Riverstone Legal", status: "Active" },
        { id: 5, name: "Apex Fitness", status: "Active" },
    ];
    const currentDate = new Date();
    const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="w-full">
             <div className="mb-8">
                <h2 className="text-3xl font-bold text-text-primary">Metrics for {monthYear}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {kpiData.map((kpi, index) => <KpiCard key={index} {...kpi} />)}
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border">
                <div className="p-4 sm:p-6 border-b border-glass-border">
                    <h2 className="text-xl font-bold text-text-primary">Active Clients</h2>
                </div>
                <div className="divide-y divide-glass-border">
                    {activeClients.map(client => <ClientListItem key={client.id} client={client} />)}
                </div>
            </div>
        </div>
    );
};

export default DashboardMetrics;
