import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import TasksTab from './TasksTab';
import UpdatesTab from './UpdatesTab';
import FilesTab from './FilesTab';

// --- Tab Placeholders ---


const ProjectDetailPage = () => {
    const { clientId, projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('tasks');

    useEffect(() => {
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                const projectRef = doc(db, 'clients', clientId, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);
                if (projectSnap.exists()) {
                    setProject({ id: projectSnap.id, ...projectSnap.data() });
                } else {
                    setError('Project not found.');
                }
            } catch (err) {
                console.error("Error fetching project:", err);
                setError('Failed to fetch project data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (clientId && projectId) {
            fetchProject();
        }
    }, [clientId, projectId]);

    const tabs = [
        { id: 'tasks', label: 'Tasks' },
        { id: 'updates', label: 'Updates' },
        { id: 'files', label: 'Files' },
    ];

    const renderTabContent = () => {
        if (!project) return null;
        switch (activeTab) {
            case 'tasks': return <TasksTab client={{id: clientId}} project={project} />;
            case 'updates': return <UpdatesTab client={{id: clientId}} project={project} />;
            case 'files': return <FilesTab client={{id: clientId}} project={project} />;
            default: return <TasksTab client={{id: clientId}} project={project} />;
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!project) return null;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-foreground">{project.name}</h2>
                <p className="text-base text-muted-foreground mt-1">{project.description}</p>
                <button onClick={() => navigate(`/client/${clientId}`)} className="text-sm text-primary hover:underline mt-4">&larr; Back to Client Overview</button>
            </div>

            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={
                                `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProjectDetailPage;
