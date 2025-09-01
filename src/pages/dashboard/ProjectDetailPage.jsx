import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';

// --- ADD TASK MODAL (from previous implementation) ---
const AddTaskModal = ({ clientId, projectId, onClose, onTaskAdded }) => {
    const [taskData, setTaskData] = useState({ name: '', description: '', dueDate: '' });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => setTaskData({...taskData, [e.target.id]: e.target.value});
    const handleFileChange = (e) => setFile(e.target.files[0]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let fileURL = '';
            if (file) {
                const storage = getStorage();
                const storageRef = ref(storage, `tasks/${projectId}/${file.name}`);
                const uploadTask = await uploadBytesResumable(storageRef, file);
                fileURL = await getDownloadURL(uploadTask.ref);
            }
            const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');
            await addDoc(tasksCol, { ...taskData, isCompleted: false, fileURL: fileURL, fileName: file ? file.name : '', createdAt: serverTimestamp() });
            onTaskAdded();
            onClose();
        } catch (error) { console.error("Error adding task:", error); } finally { setIsSubmitting(false); }
    };
    return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in"> <div className="bg-glass-bg rounded-2xl shadow-glass border border-glass-border w-full max-w-lg m-4"> <form onSubmit={handleSubmit}> <div className="p-6 border-b border-glass-border"><h3 className="text-xl font-bold text-text-primary">Add New Task</h3></div> <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4"> <InputField id="name" label="Task Name" value={taskData.name} onChange={handleChange} required /> <TextAreaField id="description" label="Description" value={taskData.description} onChange={handleChange} rows="4" /> <InputField id="dueDate" type="date" label="Due Date" value={taskData.dueDate} onChange={handleChange} /> <InputField id="file" type="file" label="Attach File" onChange={handleFileChange} /> </div> <div className="p-4 bg-matte-black/30 rounded-b-2xl flex justify-end gap-4"> <button type="button" onClick={onClose} className="text-text-primary font-semibold py-2 px-4 rounded-lg">Cancel</button> <AuthButton type="submit" isLoading={isSubmitting}>Add Task</AuthButton> </div> </form> </div> </div> );
};

// --- TASKS COMPONENT (with modal logic) ---
const TasksSection = ({ clientId, projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');
    const fetchTasks = async () => { setIsLoading(true); const q = query(tasksCol, orderBy('createdAt', 'desc')); const taskSnapshot = await getDocs(q); const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setTasks(taskList); setIsLoading(false); };
    useEffect(() => { fetchTasks(); }, [clientId, projectId]);
    const toggleTaskCompletion = async (taskId, currentStatus) => { const taskDoc = doc(db, 'clients', clientId, 'projects', projectId, 'tasks', taskId); try { await updateDoc(taskDoc, { isCompleted: !currentStatus }); fetchTasks(); } catch (error) { console.error("Error updating task: ", error); } };
    const handleDeleteTask = async (taskId) => { const taskDoc = doc(db, 'clients', clientId, 'projects', projectId, 'tasks', taskId); try { await deleteDoc(taskDoc); fetchTasks(); } catch (error) { console.error("Error deleting task: ", error); } };
    const dueTasks = tasks.filter(t => !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);
    return ( <div className="mt-6 border-t border-glass-border pt-6"> <div className="flex justify-between items-center mb-3"> <h4 className="text-lg font-bold text-text-primary">Tasks</h4> <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">Add Task</button> </div> {isModalOpen && <AddTaskModal clientId={clientId} projectId={projectId} onClose={() => setIsModalOpen(false)} onTaskAdded={fetchTasks} />} {isLoading ? <LoadingSpinner /> : ( <div className="space-y-4"> <div> <h5 className="text-md font-semibold text-text-secondary mb-2">Due ({dueTasks.length})</h5> <div className="space-y-2">{dueTasks.map(task => (<div key={task.id} className="p-3 bg-matte-black/30 rounded-lg flex items-center justify-between"> <div className="flex items-center gap-3"> <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTaskCompletion(task.id, task.isCompleted)} className="h-5 w-5 rounded bg-transparent border-glass-border text-primary focus:ring-primary" /> <span>{task.name}</span> </div> <button onClick={() => handleDeleteTask(task.id)} className="text-text-secondary hover:text-red-500 text-xs">Delete</button> </div>))}</div> </div> <div> <h5 className="text-md font-semibold text-text-secondary mb-2">Completed ({completedTasks.length})</h5> <div className="space-y-2">{completedTasks.map(task => (<div key={task.id} className="p-3 bg-matte-black/50 rounded-lg flex items-center justify-between"> <div className="flex items-center gap-3"> <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTaskCompletion(task.id, task.isCompleted)} className="h-5 w-5 rounded bg-transparent border-glass-border text-primary focus:ring-primary" /> <span className="line-through text-text-secondary">{task.name}</span> </div> <button onClick={() => handleDeleteTask(task.id)} className="text-text-secondary hover:text-red-500 text-xs">Delete</button> </div>))}</div> </div> </div> )} </div> );
};

// --- NOTES & FILES (omitted for brevity) ---
const NotesSection = ({ clientId, projectId, initialNotes }) => { /* ... */ };
const FilesSection = ({ clientId, projectId }) => { /* ... */ };

// --- MAIN COMPONENT ---
const ProjectDetailPage = () => {
    const { clientId, projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
    const [invoiceMessage, setInvoiceMessage] = useState('');

    const fetchProject = async () => {
        setIsLoading(true);
        const docRef = doc(db, 'clients', clientId, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setProject({ id: docSnap.id, ...docSnap.data() });
        } else {
            setError('No such project found!');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (clientId && projectId) fetchProject();
    }, [clientId, projectId]);

    const handleCreateInvoice = async () => {
        setIsInvoiceLoading(true);
        setInvoiceMessage('');
        try {
            await addDoc(collection(db, 'invoices'), {
                clientId: clientId,
                projectId: projectId,
                projectName: project.name,
                amount: project.totalCost || 0,
                status: 'unpaid',
                createdAt: serverTimestamp(),
                dueDate: project.dueDate || null,
            });
            setInvoiceMessage('Invoice created successfully!');
        } catch (error) {
            console.error("Error creating invoice:", error);
            setInvoiceMessage('Failed to create invoice.');
        } finally {
            setIsInvoiceLoading(false);
            setTimeout(() => setInvoiceMessage(''), 3000);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!project) return null;

    return (
        <div>
            <button onClick={() => navigate(`/client/${clientId}`)} className="text-sm text-primary hover:underline mb-2">&larr; Back to Client</button>
            <h2 className="text-3xl font-bold text-text-primary mb-2">{project.name}</h2>
            <p className="text-lg text-text-secondary mb-6">Total Cost: ${(project.totalCost || 0).toLocaleString()}</p>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Project Workspace</h3>
                <TasksSection clientId={clientId} projectId={projectId} />
                <NotesSection clientId={clientId} projectId={projectId} initialNotes={project.notes} />
                <FilesSection clientId={clientId} projectId={projectId} />
                <div className="mt-6 border-t border-glass-border pt-6">
                    <AuthButton onClick={handleCreateInvoice} isLoading={isInvoiceLoading}>
                        Create Invoice
                    </AuthButton>
                    {invoiceMessage && <p className="text-sm text-green-400 mt-2">{invoiceMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;
