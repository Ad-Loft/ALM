import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton } from '../../components/ui/AuthComponents';

// --- PROJECTS TAB ---
const ProjectsTab = ({ client }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', dueDate: '', estimatedCost: '', totalCost: '' });

    const fetchProjects = async () => {
        setIsLoading(true);
        const projectsCol = collection(db, 'clients', client.id, 'projects');
        const projectSnapshot = await getDocs(projectsCol);
        const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(projectList);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, [client.id]);

    const handleAddProject = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'clients', client.id, 'projects'), {
                name: newProject.name,
                dueDate: newProject.dueDate,
                estimatedCost: parseFloat(newProject.estimatedCost) || 0,
                totalCost: parseFloat(newProject.totalCost) || 0,
                createdAt: serverTimestamp()
            });
            setNewProject({ name: '', dueDate: '', estimatedCost: '', totalCost: '' });
            setShowAddForm(false);
            fetchProjects(); // Refresh the list
        } catch (error) {
            console.error("Error adding project: ", error);
        }
    };

    const handleProjectClick = (projectId) => {
        navigate(`/client/${client.id}/project/${projectId}`);
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">Projects</h3>
                <button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">
                    {showAddForm ? 'Cancel' : '+ Add Project'}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddProject} className="mb-6 p-4 bg-matte-black/30 rounded-lg space-y-4">
                    <InputField id="name" label="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required />
                    <InputField id="dueDate" type="date" label="Due Date" value={newProject.dueDate} onChange={e => setNewProject({...newProject, dueDate: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField id="estimatedCost" type="number" label="Estimated Cost ($)" value={newProject.estimatedCost} onChange={e => setNewProject({...newProject, estimatedCost: e.target.value})} />
                        <InputField id="totalCost" type="number" label="Total Cost ($)" value={newProject.totalCost} onChange={e => setNewProject({...newProject, totalCost: e.target.value})} />
                    </div>
                    <AuthButton type="submit">Save Project</AuthButton>
                </form>
            )}

            <div className="space-y-3">
                {projects.length > 0 ? projects.map(project => (
                    <div key={project.id} onClick={() => handleProjectClick(project.id)} className="p-4 bg-matte-black/30 rounded-lg flex justify-between items-center cursor-pointer hover:bg-glass-border/20">
                        <div>
                            <p className="font-semibold text-text-primary">{project.name}</p>
                            <p className="text-sm text-text-secondary">Due: {project.dueDate || 'N/A'}</p>
                        </div>
                        <p className="font-bold text-text-primary">${(project.totalCost || 0).toLocaleString()}</p>
                    </div>
                )) : (
                    <p className="text-text-secondary">No projects found for this client.</p>
                )}
            </div>
        </div>
    );
};


// --- OTHER TABS (Placeholders) ---
const OverviewTab = ({ client }) => <div>Client Overview for {client.companyName} - Content coming soon.</div>;
const InvoicesTab = ({ client }) => <div>Invoices for {client.companyName} - Content coming soon.</div>;
const ReportingTab = ({ client }) => <div>Reporting for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => <div>Interaction Log for {client.companyName} - Content coming soon.</div>;


// --- MAIN COMPONENT ---
const ClientDetailPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('projects'); // Default to projects tab

    useEffect(() => {
        const fetchClient = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'clients', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setClient({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('No such client found!');
                }
            } catch (err) {
                setError('Failed to fetch client data.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'projects', label: 'Projects' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'reporting', label: 'Reporting & Leads' },
        { id: 'interactions', label: 'Interaction Log' },
    ];

    const renderTabContent = () => {
        if (!client) return null;
        switch (activeTab) {
            case 'overview': return <OverviewTab client={client} />;
            case 'projects': return <ProjectsTab client={client} />;
            case 'invoices': return <InvoicesTab client={client} />;
            case 'reporting': return <ReportingTab client={client} />;
            case 'interactions': return <InteractionsTab client={client} />;
            default: return <OverviewTab client={client} />;
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    if (!client) {
        return null;
    }

    return (
        <div>
            <div className="mb-6">
                <button onClick={() => navigate('/clients/view')} className="text-sm text-primary hover:underline mb-2">&larr; Back to All Clients</button>
                <h2 className="text-3xl font-bold text-text-primary">{client.companyName}</h2>
                <p className="text-lg text-text-secondary">Contact: {client.fullName} ({client.email})</p>
            </div>
            <div className="border-b border-glass-border mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ClientDetailPage;
