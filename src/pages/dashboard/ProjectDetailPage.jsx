import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';

// --- Task Detail Modal (retains most of its logic) ---
const TaskDetailModal = ({ task, clientId, projectId, onClose, onUpdate, isNewTask = false }) => {
    const [editingTask, setEditingTask] = useState(task);
    const [isEditingName, setIsEditingName] = useState(isNewTask);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        setEditingTask(task);
        setIsEditingName(isNewTask);
    }, [task, isNewTask]);

    useEffect(() => {
        if (!isNewTask) {
            const commentsCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks', task.id, 'comments');
            const q = query(commentsCol, orderBy('createdAt', 'asc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return unsubscribe;
        }
    }, [clientId, projectId, task.id, isNewTask]);

    const handleUpdate = async (field, value) => {
        if (isNewTask) return; // Don't update if it's a new task not yet created
        const taskRef = doc(db, 'clients', clientId, 'projects', projectId, 'tasks', task.id);
        await updateDoc(taskRef, { [field]: value });
        onUpdate();
    };

    const handleCreate = async () => {
        if (!editingTask.name.trim()) {
            alert("Task name is required.");
            return;
        }
        const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');
        await addDoc(tasksCol, {
            ...editingTask,
            createdAt: serverTimestamp(),
        });
        onUpdate();
        onClose();
    };

    const handleStatusChange = (newStatus) => {
        setEditingTask(prev => ({ ...prev, status: newStatus }));
        if (!isNewTask) handleUpdate('status', newStatus);
    };

    // Other handlers (subtask, comments) would be adapted similarly,
    // disabling them or queuing changes if isNewTask is true. For now, we simplify.

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-glass-bg-solid w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl shadow-glass border border-glass-border m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-glass-border flex-shrink-0 flex justify-between items-center">
                     <h3 className="text-xl font-bold text-text-primary">{isNewTask ? "Create New Task" : "Task Details"}</h3>
                </div>
                <div className="p-4 overflow-y-auto flex-grow space-y-4">
                    <InputField label="Task Name" value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} required />
                    <TextAreaField label="Description" value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})} rows="4" />
                     <div className="flex flex-col">
                        <label className="text-sm font-medium text-text-secondary mb-1">Status</label>
                        <select value={editingTask.status || 'todo'} onChange={(e) => handleStatusChange(e.target.value)} className="bg-matte-black/50 border border-glass-border rounded-md px-3 py-2 text-text-primary focus:ring-primary focus:border-primary">
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>
                    {/* Simplified for now, subtasks and comments can be re-added once click works */}
                </div>
                <div className="p-4 bg-matte-black/30 rounded-b-2xl flex justify-end gap-4">
                    <AuthButton type="button" onClick={onClose} className="bg-transparent border border-text-secondary/50 hover:bg-text-secondary/20">Cancel</AuthButton>
                    {isNewTask && <AuthButton onClick={handleCreate}>Create Task</AuthButton>}
                </div>
            </div>
        </div>
    );
};


// --- New Task List Component ---
const TaskList = ({ clientId, projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const fetchTasks = async () => {
        setIsLoading(true);
        const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');
        const q = query(tasksCol, orderBy('createdAt', 'desc'));
        const taskSnapshot = await getDocs(q);
        const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(taskList);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, [clientId, projectId]);

    const handleOpenModal = (task) => {
        setSelectedTask(task);
        setIsCreatingTask(false);
    };

    const handleAddNewTask = () => {
        setSelectedTask({ name: '', description: '', status: 'todo' });
        setIsCreatingTask(true);
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
        setIsCreatingTask(false);
    };

    // Process tasks into categories
    const now = new Date();
    const completedTasks = tasks.filter(t => t.status === 'done');
    const incompleteTasks = tasks.filter(t => t.status !== 'done');

    const dueTasks = incompleteTasks
        .filter(t => t.dueDate && new Date(t.dueDate) >= now)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const otherTasks = incompleteTasks.filter(t => !t.dueDate || new Date(t.dueDate) < now);


    const TaskItem = ({ task }) => (
        <div
            key={task.id}
            onClick={() => handleOpenModal(task)}
            className="p-4 mb-3 bg-matte-black/40 rounded-xl shadow-md border border-glass-border hover:border-primary transition-all duration-200 cursor-pointer"
        >
            <p className="font-semibold text-text-primary">{task.name}</p>
            <p className="text-sm text-text-secondary mt-1">{task.description || 'No description'}</p>
            {task.dueDate && <p className="text-xs text-primary/80 mt-2">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
        </div>
    );

    if (isLoading) return <div className="flex justify-center items-center py-8"><LoadingSpinner /></div>;

    return (
        <>
            <div className="mb-6 flex justify-end">
                <AuthButton onClick={handleAddNewTask}>Add New Task</AuthButton>
            </div>
            <div className="space-y-8">
                {/* Due Tasks */}
                <section>
                    <h3 className="text-xl font-bold text-text-primary mb-4">Due Soon</h3>
                    {dueTasks.length > 0 ? dueTasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-text-secondary">No tasks due soon.</p>}
                </section>

                {/* Other Tasks */}
                <section>
                    <h3 className="text-xl font-bold text-text-primary mb-4">Tasks</h3>
                    {otherTasks.length > 0 ? otherTasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-text-secondary">No other tasks.</p>}
                </section>

                {/* Completed Tasks */}
                <section>
                    <h3 className="text-xl font-bold text-text-primary mb-4">Completed</h3>
                    {completedTasks.length > 0 ? completedTasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-text-secondary">No completed tasks.</p>}
                </section>
            </div>

            {(selectedTask) && (
                <TaskDetailModal
                    task={selectedTask}
                    clientId={clientId}
                    projectId={projectId}
                    onClose={handleCloseModal}
                    onUpdate={fetchTasks}
                    isNewTask={isCreatingTask}
                />
            )}
        </>
    );
};


// --- MAIN COMPONENT ---
const ProjectDetailPage = ({ clientId, projectId }) => {
    const params = useParams();
    const navigate = useNavigate();
    // Use params from the hook, but allow overriding for storybook/testing
    const finalClientId = clientId || params.clientId;
    const finalProjectId = projectId || params.projectId;

    const [project, setProject] = useState(null);
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const projectRef = doc(db, 'clients', finalClientId, 'projects', finalProjectId);
                const clientRef = doc(db, 'clients', finalClientId);

                const [projectSnap, clientSnap] = await Promise.all([getDoc(projectRef), getDoc(clientRef)]);

                if (projectSnap.exists()) setProject({ id: projectSnap.id, ...projectSnap.data() });
                else setError('No such project found!');

                if (clientSnap.exists()) setClient({ id: clientSnap.id, ...clientSnap.data() });
                else setError(prev => prev + ' No such client found!');

            } catch (err) {
                console.error("Error fetching data:", err);
                setError('Failed to fetch project or client data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (finalClientId && finalProjectId) {
            fetchData();
        }
    }, [finalClientId, finalProjectId]);

    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!project) return null;

    return (
        <div>
            <div className="mb-4">
                <button onClick={() => navigate(`/client/${finalClientId}`)} className="text-sm text-primary hover:underline">
                    &larr; Back to {client ? client.companyName : 'Client'}
                </button>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    {client && <h3 className="text-lg font-semibold text-text-secondary">{client.companyName}</h3>}
                    <h2 className="text-3xl font-bold text-text-primary">{project.name}</h2>
                    <p className="text-base text-text-secondary mt-1">{project.description || 'This project has no description.'}</p>
                </div>
            </div>
            <TaskList clientId={finalClientId} projectId={finalProjectId} />
        </div>
    );
};

export default ProjectDetailPage;
