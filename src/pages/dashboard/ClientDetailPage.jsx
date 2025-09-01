import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton } from '../../components/ui/AuthComponents';

// --- OVERVIEW TAB ---
const OverviewTab = ({ client }) => {
    const [summary, setSummary] = useState({
        outstandingAmount: 0,
        upcomingTasks: [],
        recentInteractions: [],
        adSpendLast7Days: 0,
        conversionsLast7Days: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // Fetch outstanding invoices
            const invoicesQuery = query(collection(db, 'invoices'), where('clientId', '==', client.id), where('status', '==', 'unpaid'));
            const invoicesSnapshot = await getDocs(invoicesQuery);
            const outstandingAmount = invoicesSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

            // Fetch upcoming tasks from all projects
            const projectsCol = collection(db, 'clients', client.id, 'projects');
            const projectsSnapshot = await getDocs(projectsCol);
            let upcomingTasks = [];
            for (const projectDoc of projectsSnapshot.docs) {
                const tasksQuery = query(collection(projectDoc.ref, 'tasks'), where('isCompleted', '==', false), orderBy('dueDate'), limit(3));
                const tasksSnapshot = await getDocs(tasksQuery);
                upcomingTasks.push(...tasksSnapshot.docs.map(d => ({...d.data(), projectName: projectDoc.data().name})));
            }
            upcomingTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            // Fetch recent interactions
            const interactionsQuery = query(collection(db, 'interactions'), where('clientId', '==', client.id), orderBy('date', 'desc'), limit(3));
            const interactionsSnapshot = await getDocs(interactionsQuery);
            const recentInteractions = interactionsSnapshot.docs.map(d => d.data());

            // Fetch ad stats for last 7 days
            // This is simplified. A real app might use a backend function to aggregate this.
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const statsQuery = query(collection(db, `clients/${client.id}/dailyStats`), where('date', '>=', sevenDaysAgo.toISOString().split('T')[0]));
            const statsSnapshot = await getDocs(statsQuery);
            const { adSpendLast7Days, conversionsLast7Days } = statsSnapshot.docs.reduce((acc, doc) => {
                acc.adSpendLast7Days += doc.data().spend;
                acc.conversionsLast7Days += doc.data().conversions;
                return acc;
            }, { adSpendLast7Days: 0, conversionsLast7Days: 0 });

            setSummary({ outstandingAmount, upcomingTasks, recentInteractions, adSpendLast7Days, conversionsLast7Days });
            setIsLoading(false);
        };

        fetchData();
    }, [client.id]);

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Ad Performance */}
                <div>
                    <h4 className="text-lg font-bold text-text-primary mb-3">Ad Performance (Last 7 Days)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Ad Spend</p><p className="text-2xl font-bold">${summary.adSpendLast7Days.toLocaleString()}</p></div>
                        <div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Conversions</p><p className="text-2xl font-bold">{summary.conversionsLast7Days}</p></div>
                    </div>
                </div>
                {/* Upcoming Deadlines */}
                <div>
                    <h4 className="text-lg font-bold text-text-primary mb-3">Upcoming Deadlines</h4>
                    <div className="space-y-2">
                        {summary.upcomingTasks.length > 0 ? summary.upcomingTasks.slice(0,3).map((task,i) => (
                             <div key={i} className="p-3 bg-matte-black/30 rounded-lg"><p className="font-semibold">{task.name} ({task.projectName})</p><p className="text-sm text-text-secondary">Due: {task.dueDate}</p></div>
                        )) : <p className="text-text-secondary">No upcoming deadlines.</p>}
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                {/* Financials */}
                <div>
                    <h4 className="text-lg font-bold text-text-primary mb-3">Financials</h4>
                    <div className="space-y-2">
                        <div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Outstanding</p><p className="text-2xl font-bold text-red-500">${summary.outstandingAmount.toLocaleString()}</p></div>
                        <div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Monthly Retainer</p><p className="text-2xl font-bold">${(client.monthlyRetainer || 0).toLocaleString()}</p></div>
                    </div>
                </div>
                {/* Recent Activity */}
                <div>
                    <h4 className="text-lg font-bold text-text-primary mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                        {summary.recentInteractions.length > 0 ? summary.recentInteractions.map((int, i) => (
                             <div key={i} className="p-3 bg-matte-black/30 rounded-lg"><p className="font-semibold">{int.type}</p><p className="text-sm text-text-secondary">{new Date(int.date).toLocaleDateString()}</p></div>
                        )) : <p className="text-text-secondary">No recent interactions.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- PROJECTS TAB ---
const ProjectsTab = ({ client }) => {
    // ... (omitted for brevity)
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', dueDate: '', estimatedCost: '', totalCost: '' });
    const fetchProjects = async () => { setIsLoading(true); const projectsCol = collection(db, 'clients', client.id, 'projects'); const projectSnapshot = await getDocs(projectsCol); const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setProjects(projectList); setIsLoading(false); };
    useEffect(() => { fetchProjects(); }, [client.id]);
    const handleAddProject = async (e) => { e.preventDefault(); try { await addDoc(collection(db, 'clients', client.id, 'projects'), { name: newProject.name, dueDate: newProject.dueDate, estimatedCost: parseFloat(newProject.estimatedCost) || 0, totalCost: parseFloat(newProject.totalCost) || 0, createdAt: serverTimestamp() }); setNewProject({ name: '', dueDate: '', estimatedCost: '', totalCost: '' }); setShowAddForm(false); fetchProjects(); } catch (error) { console.error("Error adding project: ", error); } };
    const handleProjectClick = (projectId) => { navigate(`/client/${client.id}/project/${projectId}`); };
    if (isLoading) return <LoadingSpinner />;
    return (
        <div>
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-text-primary">Projects</h3><button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">{showAddForm ? 'Cancel' : '+ Add Project'}</button></div>
            {showAddForm && (<form onSubmit={handleAddProject} className="mb-6 p-4 bg-matte-black/30 rounded-lg space-y-4"><InputField id="name" label="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required /><InputField id="dueDate" type="date" label="Due Date" value={newProject.dueDate} onChange={e => setNewProject({...newProject, dueDate: e.target.value})} /><div className="grid grid-cols-2 gap-4"><InputField id="estimatedCost" type="number" label="Estimated Cost ($)" value={newProject.estimatedCost} onChange={e => setNewProject({...newProject, estimatedCost: e.target.value})} /><InputField id="totalCost" type="number" label="Total Cost ($)" value={newProject.totalCost} onChange={e => setNewProject({...newProject, totalCost: e.target.value})} /></div><AuthButton type="submit">Save Project</AuthButton></form>)}
            <div className="space-y-3">{projects.length > 0 ? projects.map(project => (<div key={project.id} onClick={() => handleProjectClick(project.id)} className="p-4 bg-matte-black/30 rounded-lg flex justify-between items-center cursor-pointer hover:bg-glass-border/20"><div><p className="font-semibold text-text-primary">{project.name}</p><p className="text-sm text-text-secondary">Due: {project.dueDate || 'N/A'}</p></div><p className="font-bold text-text-primary">${(project.totalCost || 0).toLocaleString()}</p></div>)) : (<p className="text-text-secondary">No projects found for this client.</p>)}</div>
        </div>
    );
};

// --- OTHER TABS (Placeholders) ---
const InvoicesTab = ({ client }) => <div>Invoices for {client.companyName} - Content coming soon.</div>;
const ReportingTab = ({ client }) => <div>Reporting for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => <div>Interaction Log for {client.companyName} - Content coming soon.</div>;


// --- MAIN COMPONENT ---
const ClientDetailPage = () => {
    // ... (omitted for brevity)
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    useEffect(() => { const fetchClient = async () => { setIsLoading(true); const docRef = doc(db, 'clients', clientId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setClient({ id: docSnap.id, ...docSnap.data() }); } else { setError('No such client found!'); } setIsLoading(false); }; if (clientId) fetchClient(); }, [clientId]);
    const tabs = [ { id: 'overview', label: 'Overview' }, { id: 'projects', label: 'Projects' }, { id: 'invoices', label: 'Invoices' }, { id: 'reporting', label: 'Reporting & Leads' }, { id: 'interactions', label: 'Interaction Log' }, ];
    const renderTabContent = () => { if (!client) return null; switch (activeTab) { case 'overview': return <OverviewTab client={client} />; case 'projects': return <ProjectsTab client={client} />; case 'invoices': return <InvoicesTab client={client} />; case 'reporting': return <ReportingTab client={client} />; case 'interactions': return <InteractionsTab client={client} />; default: return <OverviewTab client={client} />; } };
    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!client) return null;
    return (
        <div>
            <div className="mb-6"><button onClick={() => navigate('/clients/view')} className="text-sm text-primary hover:underline mb-2">&larr; Back to All Clients</button><h2 className="text-3xl font-bold text-text-primary">{client.companyName}</h2><p className="text-lg text-text-secondary">Contact: {client.fullName} ({client.email})</p></div>
            <div className="border-b border-glass-border mb-6"><nav className="-mb-px flex space-x-6 overflow-x-auto">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}>{tab.label}</button>))}</nav></div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6">{renderTabContent()}</div>
        </div>
    );
};

export default ClientDetailPage;
