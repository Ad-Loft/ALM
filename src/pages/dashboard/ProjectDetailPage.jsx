import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';

const ProjectDetailPage = () => {
    const { clientId, projectId } = useParams(); // Get both IDs from the URL
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                // Construct the correct path to the project document in the sub-collection
                const docRef = doc(db, 'clients', clientId, 'projects', projectId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProject({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('No such project found!');
                }
            } catch (err) {
                setError('Failed to fetch project data.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (clientId && projectId) {
            fetchProject();
        }
    }, [clientId, projectId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    if (!project) {
        return null;
    }

    return (
        <div>
            {/* Go back to the specific client's page */}
            <button onClick={() => navigate(`/client/${clientId}`)} className="text-sm text-primary hover:underline mb-2">&larr; Back to Client</button>
            <h2 className="text-3xl font-bold text-text-primary mb-2">{project.name}</h2>
            <p className="text-lg text-text-secondary mb-6">
                Total Cost: ${(project.totalCost || 0).toLocaleString()}
            </p>

            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Project Workspace</h3>
                <p>Tasks, notes, and file uploads for this project will be built out here.</p>
                <div className="mt-4">
                    <button className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">
                        Create Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;
