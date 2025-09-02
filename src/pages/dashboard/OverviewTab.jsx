import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';

const OverviewTab = ({ client }) => {
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

        // Fetch Weekly Stats (assuming a 'dailyStats' sub-collection)
        const statsQuery = query(
          collection(db, 'clients', clientId, 'dailyStats'),
          orderBy('date', 'desc'),
          limit(7)
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
  }, [client.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-foreground">Client Overview</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        This is the overview tab for {client.companyName}. The date picker feature has been temporarily removed to fix a bug.
      </p>
    </div>
  );
};

export default OverviewTab;
