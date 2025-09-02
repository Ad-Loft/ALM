import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';

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
                progress: 0,
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
    // No need to set loading true here, as it's handled in the initial load
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
      setIsLoading(false); // Only set loading to false after the initial fetch
    }
  };

  useEffect(() => {
    setIsLoading(true);
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

        <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-glass-border-light">
                <thead className="bg-white/5">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Project Name</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Progress</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Due Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-glass-border-light">
                    {projects.map((project) => (
                    <tr key={project.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{project.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.status}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                        </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.dueDate && project.dueDate.toDate ? project.dueDate.toDate().toLocaleDateString() : 'N/A'}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
            {projects.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <h4 className="text-lg font-semibold text-foreground">No Projects Found</h4>
                    <p className="text-sm text-muted-foreground mt-1">Get started by creating a new project.</p>
                </div>
            )}
        </div>

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
