import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';

// --- OVERVIEW TAB ---
// ... (omitted for brevity)
const OverviewTab = ({ client }) => { const [summary, setSummary] = useState({ outstandingAmount: 0, upcomingTasks: [], recentInteractions: [], adSpendLast7Days: 0, conversionsLast7Days: 0, }); const [isLoading, setIsLoading] = useState(true); useEffect(() => { const fetchData = async () => { setIsLoading(true); try { const [invoicesSnapshot, projectsSnapshot, interactionsSnapshot, statsSnapshot] = await Promise.all([ getDocs(query(collection(db, 'invoices'), where('clientId', '==', client.id), where('status', '==', 'unpaid'))), getDocs(collection(db, 'clients', client.id, 'projects')), getDocs(query(collection(db, 'interactions'), where('clientId', '==', client.id), orderBy('date', 'desc'), limit(3))), getDocs(query(collection(db, `clients/${client.id}/dailyStats`), where('date', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]))) ]); const outstandingAmount = invoicesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0); let upcomingTasks = []; for (const projectDoc of projectsSnapshot.docs) { const tasksQuery = query(collection(projectDoc.ref, 'tasks'), where('isCompleted', '==', false), orderBy('dueDate'), limit(3)); const tasksSnapshot = await getDocs(tasksQuery); upcomingTasks.push(...tasksSnapshot.docs.map(d => ({...d.data(), projectName: projectDoc.data().name || 'Unnamed Project'}))); } upcomingTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); const recentInteractions = interactionsSnapshot.docs.map(d => d.data()); const { adSpendLast7Days, conversionsLast7Days } = statsSnapshot.docs.reduce((acc, doc) => { acc.adSpendLast7Days += doc.data().spend || 0; acc.conversionsLast7Days += doc.data().conversions || 0; return acc; }, { adSpendLast7Days: 0, conversionsLast7Days: 0 }); setSummary({ outstandingAmount, upcomingTasks, recentInteractions, adSpendLast7Days, conversionsLast7Days }); } catch (error) { console.error("Error fetching overview data:", error); } finally { setIsLoading(false); } }; fetchData(); }, [client.id]); if (isLoading) return <LoadingSpinner />; return ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> <div className="lg:col-span-2 space-y-6"> <div><h4 className="text-lg font-bold text-text-primary mb-3">Ad Performance (Last 7 Days)</h4><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Ad Spend</p><p className="text-2xl font-bold">${summary.adSpendLast7Days.toLocaleString()}</p></div><div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Conversions</p><p className="text-2xl font-bold">{summary.conversionsLast7Days}</p></div></div></div> <div><h4 className="text-lg font-bold text-text-primary mb-3">Upcoming Deadlines</h4><div className="space-y-2">{summary.upcomingTasks.length > 0 ? summary.upcomingTasks.slice(0,3).map((task,i) => ( <div key={i} className="p-3 bg-matte-black/30 rounded-lg"><p className="font-semibold">{task.name || 'Unnamed Task'} ({task.projectName})</p><p className="text-sm text-text-secondary">Due: {task.dueDate || 'N/A'}</p></div> )) : <p className="text-text-secondary">No upcoming deadlines.</p>}</div></div> </div> <div className="space-y-6"> <div><h4 className="text-lg font-bold text-text-primary mb-3">Financials</h4><div className="space-y-2"><div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Outstanding</p><p className="text-2xl font-bold text-red-500">${summary.outstandingAmount.toLocaleString()}</p></div><div className="p-4 bg-matte-black/30 rounded-lg"><p className="text-sm text-text-secondary">Monthly Retainer</p><p className="text-2xl font-bold">${(client.monthlyAmount || 0).toLocaleString()}</p></div></div></div> <div><h4 className="text-lg font-bold text-text-primary mb-3">Recent Activity</h4><div className="space-y-2">{summary.recentInteractions.length > 0 ? summary.recentInteractions.map((int, i) => ( <div key={i} className="p-3 bg-matte-black/30 rounded-lg"><p className="font-semibold">{int.type || 'Interaction'}</p><p className="text-sm text-text-secondary">{int.date ? new Date(int.date).toLocaleDateString() : 'N/A'}</p></div> )) : <p className="text-text-secondary">No recent interactions.</p>}</div></div> </div> </div> ); };

// --- PROJECTS TAB ---
// ... (omitted for brevity)
const ProjectsTab = ({ client }) => { const navigate = useNavigate(); const [projects, setProjects] = useState([]); const [isLoading, setIsLoading] = useState(true); const [showAddForm, setShowAddForm] = useState(false); const [newProject, setNewProject] = useState({ name: '', dueDate: '', estimatedCost: '', totalCost: '' }); const fetchProjects = async () => { setIsLoading(true); const projectsCol = collection(db, 'clients', client.id, 'projects'); const projectSnapshot = await getDocs(projectsCol); const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setProjects(projectList); setIsLoading(false); }; useEffect(() => { fetchProjects(); }, [client.id]); const handleAddProject = async (e) => { e.preventDefault(); try { await addDoc(collection(db, 'clients', client.id, 'projects'), { name: newProject.name, dueDate: newProject.dueDate, estimatedCost: parseFloat(newProject.estimatedCost) || 0, totalCost: parseFloat(newProject.totalCost) || 0, createdAt: serverTimestamp() }); setNewProject({ name: '', dueDate: '', estimatedCost: '', totalCost: '' }); setShowAddForm(false); fetchProjects(); } catch (error) { console.error("Error adding project: ", error); } }; const handleProjectClick = (projectId) => { navigate(`/client/${client.id}/project/${projectId}`); }; if (isLoading) return <LoadingSpinner />; return ( <div> <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-text-primary">Projects</h3><button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">{showAddForm ? 'Cancel' : '+ Add Project'}</button></div> {showAddForm && (<form onSubmit={handleAddProject} className="mb-6 p-4 bg-matte-black/30 rounded-lg space-y-4"><InputField id="name" label="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required /><InputField id="dueDate" type="date" label="Due Date" value={newProject.dueDate} onChange={e => setNewProject({...newProject, dueDate: e.target.value})} /><div className="grid grid-cols-2 gap-4"><InputField id="estimatedCost" type="number" label="Estimated Cost ($)" value={newProject.estimatedCost} onChange={e => setNewProject({...newProject, estimatedCost: e.target.value})} /><InputField id="totalCost" type="number" label="Total Cost ($)" value={newProject.totalCost} onChange={e => setNewProject({...newProject, totalCost: e.target.value})} /></div><AuthButton type="submit">Save Project</AuthButton></form>)} <div className="space-y-3">{projects.length > 0 ? projects.map(project => (<div key={project.id} onClick={() => handleProjectClick(project.id)} className="p-4 bg-matte-black/30 rounded-lg flex justify-between items-center cursor-pointer hover:bg-glass-border/20"><div><p className="font-semibold text-text-primary">{project.name}</p><p className="text-sm text-text-secondary">Due: {project.dueDate || 'N/A'}</p></div><p className="font-bold text-text-primary">${(project.totalCost || 0).toLocaleString()}</p></div>)) : (<p className="text-text-secondary">No projects found for this client.</p>)}</div> </div> ); };

// --- INVOICES TAB ---
const InvoicesTab = ({ client }) => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            setIsLoading(true);
            const q = query(collection(db, 'invoices'), where('clientId', '==', client.id), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const invoiceList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvoices(invoiceList);
            setIsLoading(false);
        };
        fetchInvoices();
    }, [client.id]);

    const openInvoices = invoices.filter(inv => inv.status === 'unpaid');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');

    return (
        <div>
            <h3 className="text-xl font-bold text-text-primary mb-4">Invoices</h3>
            {isLoading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold text-text-secondary mb-3">Open</h4>
                        <div className="space-y-3">
                            {openInvoices.length > 0 ? openInvoices.map(invoice => (
                                <div key={invoice.id} className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-text-primary">Invoice #{invoice.id.slice(0, 6)}</p>
                                        <p className="text-sm text-text-secondary">Due: {invoice.dueDate || 'N/A'}</p>
                                    </div>
                                    <p className="font-bold text-red-400">${(invoice.amount || 0).toLocaleString()}</p>
                                </div>
                            )) : <p className="text-text-secondary">No open invoices.</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-text-secondary mb-3">Paid</h4>
                        <div className="space-y-3">
                            {paidInvoices.length > 0 ? paidInvoices.map(invoice => (
                                <div key={invoice.id} className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-text-primary">Invoice #{invoice.id.slice(0, 6)}</p>
                                        <p className="text-sm text-text-secondary">Paid: {invoice.paidDate?.toDate().toLocaleDateString() || 'N/A'}</p>
                                    </div>
                                    <p className="font-bold text-green-400">${(invoice.amount || 0).toLocaleString()}</p>
                                </div>
                            )) : <p className="text-text-secondary">No paid invoices.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- OTHER TABS (Placeholders) ---
const ReportingTab = ({ client }) => <div>Reporting for {client.companyName} - Content coming soon.</div>;
const LeadsTab = ({ client }) => <div>Leads for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => {
    // ... (omitted for brevity)
    const [interactions, setInteractions] = useState([]); const [isLoading, setIsLoading] = useState(true); const [showAddForm, setShowAddForm] = useState(false); const [newInteraction, setNewInteraction] = useState({ type: 'Email', notes: '', date: new Date().toISOString().split('T')[0] }); const interactionsCol = collection(db, 'interactions'); const fetchInteractions = async () => { setIsLoading(true); const q = query(interactionsCol, where('clientId', '==', client.id), orderBy('date', 'desc')); const querySnapshot = await getDocs(q); const interactionList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setInteractions(interactionList); setIsLoading(false); }; useEffect(() => { fetchInteractions(); }, [client.id]); const handleAddInteraction = async (e) => { e.preventDefault(); try { await addDoc(interactionsCol, { ...newInteraction, clientId: client.id, createdAt: serverTimestamp() }); setNewInteraction({ type: 'Email', notes: '', date: new Date().toISOString().split('T')[0] }); setShowAddForm(false); fetchInteractions(); } catch (error) { console.error("Error adding interaction: ", error); } };
    return ( <div> <div className="flex justify-between items-center mb-4"> <h3 className="text-xl font-bold text-text-primary">Interaction Log</h3> <button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm"> {showAddForm ? 'Cancel' : '+ Log Interaction'} </button> </div> {showAddForm && ( <form onSubmit={handleAddInteraction} className="mb-6 p-4 bg-matte-black/30 rounded-lg space-y-4"> <div className="grid grid-cols-2 gap-4"> <InputField id="date" type="date" label="Date" value={newInteraction.date} onChange={e => setNewInteraction({...newInteraction, date: e.target.value})} required /> <div> <label htmlFor="type" className="block text-sm font-medium text-text-secondary mb-2">Type</label> <select id="type" value={newInteraction.type} onChange={e => setNewInteraction({...newInteraction, type: e.target.value})} className="bg-matte-black/50 text-text-primary block w-full px-3 py-2 border border-glass-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"> <option>Email</option> <option>Phone Call</option> <option>Zoom</option> <option>Message</option> </select> </div> </div> <TextAreaField id="notes" label="Notes" value={newInteraction.notes} onChange={e => setNewInteraction({...newInteraction, notes: e.target.value})} rows="4" required /> <AuthButton type="submit">Save Log</AuthButton> </form> )} <div className="space-y-3"> {isLoading ? <LoadingSpinner /> : interactions.length > 0 ? interactions.map(item => ( <div key={item.id} className="p-4 bg-matte-black/30 rounded-lg"> <p className="font-semibold text-text-primary">{item.type} on {item.date}</p> <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{item.notes}</p> </div> )) : ( <p className="text-text-secondary">No interactions logged for this client.</p> )} </div> </div> );
};


// --- MAIN COMPONENT ---
const ClientDetailPage = () => {
    // ... (omitted for brevity)
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('invoices'); // Default to invoices tab
    useEffect(() => { const fetchClient = async () => { setIsLoading(true); const docRef = doc(db, 'clients', clientId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setClient({ id: docSnap.id, ...docSnap.data() }); } else { setError('No such client found!'); } setIsLoading(false); }; if (clientId) fetchClient(); }, [clientId]);
    const tabs = [ { id: 'overview', label: 'Overview' }, { id: 'projects', label: 'Projects' }, { id: 'invoices', label: 'Invoices' }, { id: 'reporting', label: 'Reporting' }, { id: 'leads', label: 'Leads' }, { id: 'interactions', label: 'Interaction Log' }, ];
    const renderTabContent = () => { if (!client) return null; switch (activeTab) { case 'overview': return <OverviewTab client={client} />; case 'projects': return <ProjectsTab client={client} />; case 'invoices': return <InvoicesTab client={client} />; case 'reporting': return <ReportingTab client={client} />; case 'leads': return <LeadsTab client={client} />; case 'interactions': return <InteractionsTab client={client} />; default: return <OverviewTab client={client} />; } };
    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!client) return null;
    return (
        <div>
            <div className="mb-6">
                <button onClick={() => navigate('/clients/view')} className="text-sm text-primary hover:underline mb-2">&larr; Back to All Clients</button>
                <h2 className="text-3xl font-bold text-text-primary mb-2">{client.companyName}</h2>
                <div className="text-base text-text-secondary mt-2 space-y-1">
                    <p><span className="font-semibold text-text-primary">Contact:</span> {client.fullName}</p>
                    <p><span className="font-semibold text-text-primary">Email:</span> <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a></p>
                    <p><span className="font-semibold text-text-primary">Phone:</span> {client.phone || 'N/A'}</p>
                    {client.website && <div><span className="font-semibold text-text-primary">Website:</span> <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{client.website}</a></div>}
                </div>
            </div>
            <div className="border-b border-glass-border mb-6"><nav className="-mb-px flex space-x-6 overflow-x-auto">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}>{tab.label}</button>))}</nav></div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6">{renderTabContent()}</div>
        </div>
    );
};

export default ClientDetailPage;
