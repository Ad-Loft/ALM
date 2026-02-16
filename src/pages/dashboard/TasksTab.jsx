import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';

const CreateTaskModal = ({ isOpen, setIsOpen, client, project, onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('To Do');
    const [priority, setPriority] = useState('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'clients', client.id, 'projects', project.id, 'tasks'), {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                status,
                priority,
                createdAt: serverTimestamp(),
            });
            onTaskCreated();
            setIsOpen(false);
            // Reset form
            setTitle('');
            setDescription('');
            setDueDate('');
            setStatus('To Do');
            setPriority('Medium');
        } catch (error) {
            console.error("Error creating task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to the project: {project.name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-10 rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner className="h-4 w-4" /> : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const TaskCard = ({ task }) => (
    <div className="bg-white/10 p-4 rounded-lg shadow-md border border-white/10">
        <h5 className="font-bold text-foreground">{task.title}</h5>
        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
        <div className="flex justify-between items-center mt-3 text-xs">
            <span className="text-muted-foreground">{task.dueDate ? new Date(task.dueDate.toDate()).toLocaleDateString() : ''}</span>
            <span className="font-semibold text-primary">{task.priority}</span>
        </div>
    </div>
);

const KanbanColumn = ({ status, tasks }) => (
    <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-4 shadow-lg flex flex-col">
        <h4 className="text-lg font-semibold text-foreground mb-4 px-2">{status} ({tasks.length})</h4>
        <div className="space-y-4 overflow-y-auto flex-1 h-0 min-h-[200px]">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center pt-10">No tasks here.</p>}
        </div>
    </div>
);

const TasksTab = ({ client, project }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const tasksQuery = query(
        collection(db, 'clients', client.id, 'projects', project.id, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(tasksQuery);
      setTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTasks();
  }, [client.id, project.id]);

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const columns = {
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'Done': tasks.filter(task => task.status === 'Done'),
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>Add New Task</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(columns).map(([status, tasksInColumn]) => (
          <KanbanColumn key={status} status={status} tasks={tasksInColumn} />
        ))}
      </div>
      <CreateTaskModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        client={client}
        project={project}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default TasksTab;
