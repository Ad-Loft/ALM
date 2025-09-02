import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner, DollarSignIcon, ClockIcon, FileTextIcon, ActivityIcon } from '../../components/ui/Icons';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { addDays } from 'date-fns';

// --- Sub-components for the Overview Tab ---

const ContactInfoCard = ({ client }) => (
  <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-6 shadow-lg">
    <h3 className="text-lg font-semibold text-foreground mb-4">Contact & Payment</h3>
    <div className="space-y-2 text-sm">
      <p><strong className="text-muted-foreground">Name:</strong> {client.fullName}</p>
      <p><strong className="text-muted-foreground">Email:</strong> <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a></p>
      <p><strong className="text-muted-foreground">Phone:</strong> {client.phone || 'N/A'}</p>
      <div className="pt-2 mt-2 border-t border-glass-border-light">
        <p><strong className="text-muted-foreground">Monthly Payment:</strong> ${client.monthlyAmount?.toLocaleString() || 'N/A'}</p>
        <p><strong className="text-muted-foreground">Due Date:</strong> Day {client.paymentDueDate || 'N/A'} of month</p>
      </div>
    </div>
  </div>
);

const DueItemsCard = ({ title, items, icon }) => (
  <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-6 shadow-lg">
    <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
    <ul className="space-y-2 text-sm">
      {items.length > 0 ? items.map(item => (
        <li key={item.id} className="flex justify-between items-center">
          <span>{item.description || `Invoice #${item.invoiceNumber}`}</span>
          <span className="font-medium text-muted-foreground">${item.amount?.toLocaleString()}</span>
        </li>
      )) : <p className="text-sm text-muted-foreground">No due items.</p>}
    </ul>
  </div>
);

const StatCard = ({ title, value, icon }) => (
    <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-4 shadow-lg flex items-center gap-4">
        <div className="bg-secondary/10 p-3 rounded-lg text-primary">
            {icon}
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    </div>
);

const RecentActivityFeed = ({ activity }) => (
  <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-6 shadow-lg">
    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
    <ul className="space-y-3">
      {activity.length > 0 ? activity.map(act => (
        <li key={act.id} className="flex items-center gap-3 text-sm">
          <div className="bg-secondary/10 p-2 rounded-full"><ActivityIcon /></div>
          <div>
            <p className="text-foreground">{act.description}</p>
            <p className="text-xs text-muted-foreground">{new Date(act.timestamp?.toDate()).toLocaleString()}</p>
          </div>
        </li>
      )) : <p className="text-sm text-muted-foreground">No recent activity.</p>}
    </ul>
  </div>
);


// --- Main Overview Tab Component ---

const OverviewTab = ({ client }) => {
  const [date, setDate] = useState({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [dueInvoices, setDueInvoices] = useState([]);
  const [dueTasks, setDueTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const clientId = client.id;

        // Fetch Due Invoices
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('clientId', '==', clientId),
          where('status', '==', 'unpaid'),
          orderBy('dueDate', 'asc')
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        setDueInvoices(invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Due Tasks (assuming a 'tasks' collection)
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('clientId', '==', clientId),
          where('isCompleted', '==', false),
          orderBy('dueDate', 'asc')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        setDueTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Stats for selected date range
        const statsQuery = query(
          collection(db, 'clients', clientId, 'dailyStats'),
          where('date', '>=', date.from),
          where('date', '<=', date.to)
        );
        const statsSnapshot = await getDocs(statsQuery);
        const weeklyStats = statsSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc.spend += data.spend || 0;
          acc.clicks += data.clicks || 0;
          acc.conversions += data.conversions || 0;
          return acc;
        }, { spend: 0, clicks: 0, conversions: 0 });
        weeklyStats.cpc = weeklyStats.clicks > 0 ? weeklyStats.spend / weeklyStats.clicks : 0;
        setStats(weeklyStats);

        // Fetch Recent Activity (assuming an 'activity' collection)
        const activityQuery = query(
          collection(db, 'activity'),
          where('clientId', '==', clientId),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const activitySnapshot = await getDocs(activityQuery);
        setActivity(activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [client.id, date]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-foreground">Performance Stats</h3>
            <DateRangePicker date={date} setDate={setDate} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Spend" value={`$${stats?.spend.toFixed(2) || '0.00'}`} icon={<DollarSignIcon />} />
              <StatCard title="Clicks" value={stats?.clicks || 0} icon={<ActivityIcon />} />
              <StatCard title="CPC" value={`$${stats?.cpc.toFixed(2) || '0.00'}`} icon={<DollarSignIcon />} />
              <StatCard title="Conversions" value={stats?.conversions || 0} icon={<FileTextIcon />} />
          </div>
        </div>
        <RecentActivityFeed activity={activity} />
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <ContactInfoCard client={client} />
        <DueItemsCard title="Due Invoices" items={dueInvoices} icon={<DollarSignIcon />} />
        <DueItemsCard title="Due Tasks" items={dueTasks} icon={<ClockIcon />} />
      </div>

    </div>
  );
};

export default OverviewTab;
