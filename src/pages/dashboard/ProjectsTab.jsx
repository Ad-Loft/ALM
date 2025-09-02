import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';

// --- Sub-components for the Projects Tab ---

const ProjectCard = ({ project }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return 'bg-blue-500';
            case 'Completed': return 'bg-green-500';
            case 'Not Started':
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h4 className="text-lg font-semibold text-foreground">{project.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 h-20 overflow-hidden">{project.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-glass-border-light text-sm text-muted-foreground">
                <p>Due: {project.dueDate ? new Date(project.dueDate.toDate()).toLocaleDateString() : 'N/A'}</p>
            </div>
        </div>
    );
};

const CreateProjectModal = ({ isOpen, setIsOpen, client, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('Not Started');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !description) return; // Basic validation
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'clients', client.id, 'projects'), {
                name,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                status,
                createdAt: serverTimestamp(),
            });
            onProjectCreated(); // This will trigger a re-fetch in the parent
            setIsOpen(false); // Close modal on success
            // Reset form
            setName('');
            setDescription('');
            setDueDate('');
            setStatus('Not Started');
        } catch (error) {
            console.error("Error creating project:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Fill out the details below to create a new project for {client.companyName}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background">
                            <option>Not Started</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="h-4 w-4" /> : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


// --- Main Projects Tab Component ---

const ProjectsTab = ({ client }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const projectsQuery = query(
        collection(db, 'clients', client.id, 'projects'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(projectsQuery);
      setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [client.id]);

  const handleProjectCreated = () => {
    fetchProjects(); // Re-fetch projects when a new one is created
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-xl font-bold leading-6 text-foreground">Projects</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    A list of all projects for {client.companyName}.
                </p>
            </div>
            <div>
                <Button onClick={() => setIsModalOpen(true)}>Create New Project</Button>
            </div>
        </div>

        {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl shadow-lg">
                <h4 className="text-lg font-semibold text-foreground">No Projects Found</h4>
                <p className="text-sm text-muted-foreground mt-1">Get started by creating a new project.</p>
            </div>
        )}

        <CreateProjectModal
            isOpen={isModalOpen}
            setIsOpen={setIsModalOpen}
            client={client}
            onProjectCreated={handleProjectCreated}
        />
    </div>
  );
};

export default ProjectsTab;
