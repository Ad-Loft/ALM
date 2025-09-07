import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- TABS (some are placeholders or temporarily disabled) ---

const OverviewTab = ({ client }) => <div>Client Overview for {client.companyName} - Content coming soon.</div>;

const ProjectsTab = ({ client }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const projectsCollectionRef = collection(db, 'clients', client.id, 'projects');
            const q = query(projectsCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
        } catch (error) {
            console.error("Error fetching projects:", error);
            // Optionally set an error state here to show in the UI
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [client.id]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) {
            alert('Project name is required.');
            return;
        }
        setIsCreating(true);
        try {
            const projectsCollectionRef = collection(db, 'clients', client.id, 'projects');
            await addDoc(projectsCollectionRef, {
                name: newProjectName,
                description: newProjectDescription,
                createdAt: serverTimestamp(),
                status: 'In Progress', // Default status
            });
            setShowCreateModal(false);
            setNewProjectName('');
            setNewProjectDescription('');
            await fetchProjects(); // Refetch projects to show the new one
        } catch (error) {
            console.error("Error creating project:", error);
            // Optionally set an error state here
        } finally {
            setIsCreating(false);
        }
    };

    const handleProjectClick = (projectId) => {
        // This will navigate to the project detail page in a future step
        // navigate(`/client/${client.id}/project/${projectId}`);
        console.log(`Navigating to project ${projectId}`);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center py-8"><LoadingSpinner /></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">Projects</h3>
                <AuthButton onClick={() => setShowCreateModal(true)}>Create New Project</AuthButton>
            </div>

            {/* Project List */}
            <div className="space-y-3">
                {projects.length > 0 ? (
                    projects.map(project => (
                        <div key={project.id} onClick={() => handleProjectClick(project.id)}
                             className="bg-glass-bg/50 p-4 rounded-lg border border-glass-border hover:border-primary/80 cursor-pointer transition-all duration-200">
                            <h4 className="font-semibold text-text-primary">{project.name}</h4>
                            <p className="text-sm text-text-secondary mt-1">{project.description || 'No description provided.'}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 bg-glass-bg/50 rounded-lg border border-glass-border">
                        <p className="text-text-secondary">No projects found for this client.</p>
                        <p className="text-sm text-text-secondary/80">Click "Create New Project" to get started.</p>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-glass-bg-solid w-full max-w-md p-6 rounded-2xl shadow-glass border border-glass-border m-4">
                        <h3 className="text-2xl font-bold text-text-primary mb-4">Create New Project</h3>
                        <form onSubmit={handleCreateProject}>
                            <div className="space-y-4">
                                <InputField
                                    label="Project Name"
                                    id="projectName"
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    required
                                />
                                <TextAreaField
                                    label="Project Description (Optional)"
                                    id="projectDescription"
                                    value={newProjectDescription}
                                    onChange={(e) => setNewProjectDescription(e.target.value)}
                                    rows="4"
                                />
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <AuthButton type="button" onClick={() => setShowCreateModal(false)} className="bg-transparent border border-text-secondary/50 hover:bg-text-secondary/20">
                                    Cancel
                                </AuthButton>
                                <AuthButton type="submit" disabled={isCreating}>
                                    {isCreating ? <LoadingSpinner className="w-5 h-5" /> : 'Create Project'}
                                </AuthButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InvoicesTab = ({ client }) => <div>Invoices for {client.companyName} - Content coming soon.</div>;
const InteractionsTab = ({ client }) => <div>Interaction Log for {client.companyName} - Content coming soon.</div>;
// const ReportingTab = ({ client }) => <div>Reporting Tab</div>; // Temporarily disabled
// const LeadsTab = ({ client }) => <div>Leads Tab</div>; // Temporarily disabled


// --- MAIN COMPONENT ---
const ClientDetailPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

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
                console.error("Error fetching client data:", err);
                setError('Failed to fetch client data.');
            } finally {
                setIsLoading(false);
            }
        };
        if (clientId) fetchClient();
    }, [clientId]);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'projects', label: 'Projects' },
        { id: 'invoices', label: 'Invoices' },
        // { id: 'reporting', label: 'Reporting' },
        // { id: 'leads', label: 'Leads' },
        { id: 'interactions', label: 'Interaction Log' },
    ];

    const renderTabContent = () => {
        if (!client) return null;
        switch (activeTab) {
            case 'overview': return <OverviewTab client={client} />;
            case 'projects': return <ProjectsTab client={client} />;
            case 'invoices': return <InvoicesTab client={client} />;
            // case 'reporting': return <ReportingTab client={client} />;
            // case 'leads': return <LeadsTab client={client} />;
            case 'interactions': return <InteractionsTab client={client} />;
            default: return <OverviewTab client={client} />;
        }
    };

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
            <div className="border-b border-glass-border mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}>{tab.label}</button>
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
