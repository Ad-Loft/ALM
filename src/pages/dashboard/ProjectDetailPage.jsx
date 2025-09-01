import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';

// --- ADD TASK MODAL ---
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
            await addDoc(tasksCol, {
                ...taskData,
                isCompleted: false,
                fileURL: fileURL,
                fileName: file ? file.name : '',
                createdAt: serverTimestamp()
            });

            onTaskAdded();
            onClose();
        } catch (error) {
            console.error("Error adding task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-glass-bg rounded-2xl shadow-glass border border-glass-border w-full max-w-lg m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-glass-border">
                        <h3 className="text-xl font-bold text-text-primary">Add New Task</h3>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                        <InputField id="name" label="Task Name" value={taskData.name} onChange={handleChange} required />
                        <TextAreaField id="description" label="Description" value={taskData.description} onChange={handleChange} rows="4" />
                        <InputField id="dueDate" type="date" label="Due Date" value={taskData.dueDate} onChange={handleChange} />
                        <InputField id="file" type="file" label="Attach File" onChange={handleFileChange} />
                    </div>
                    <div className="p-4 bg-matte-black/30 rounded-b-2xl flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="text-text-primary font-semibold py-2 px-4 rounded-lg">Cancel</button>
                        <AuthButton type="submit" isLoading={isSubmitting}>Add Task</AuthButton>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- TASKS COMPONENT ---
const TasksSection = ({ clientId, projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');

    const fetchTasks = async () => {
        setIsLoading(true);
        const q = query(tasksCol, orderBy('createdAt', 'desc'));
        const taskSnapshot = await getDocs(q);
        const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(taskList);
        setIsLoading(false);
    };

    useEffect(() => { fetchTasks(); }, [clientId, projectId]);

    const toggleTaskCompletion = async (taskId, currentStatus) => { /* ... */ };
    const handleDeleteTask = async (taskId) => { /* ... */ };

    const dueTasks = tasks.filter(t => !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-bold text-text-primary">Tasks</h4>
                <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">Add Task</button>
            </div>
            {isModalOpen && <AddTaskModal clientId={clientId} projectId={projectId} onClose={() => setIsModalOpen(false)} onTaskAdded={fetchTasks} />}

            {isLoading ? <LoadingSpinner /> : (
                <div className="space-y-4">
                    <div>
                        <h5 className="text-md font-semibold text-text-secondary mb-2">Due ({dueTasks.length})</h5>
                        {/* Task list UI */}
                    </div>
                    <div>
                        <h5 className="text-md font-semibold text-text-secondary mb-2">Completed ({completedTasks.length})</h5>
                        {/* Task list UI */}
                    </div>
                </div>
            )}
        </div>
    );
};

// ... Rest of the file is omitted for brevity but remains the same ...
// --- NOTES COMPONENT ---
const NotesSection = ({ clientId, projectId, initialNotes }) => {
    const [notes, setNotes] = useState(initialNotes || '');
    const [status, setStatus] = useState('idle');
    const handleSaveNotes = async () => { setStatus('saving'); const projectDoc = doc(db, 'clients', clientId, 'projects', projectId); try { await updateDoc(projectDoc, { notes: notes }); setStatus('saved'); setTimeout(() => setStatus('idle'), 2000); } catch (error) { console.error("Error saving notes: ", error); setStatus('idle'); } };
    return ( <div className="mt-6 border-t border-glass-border pt-6"> <h4 className="text-lg font-bold text-text-primary mb-3">Notes</h4> <TextAreaField id="project-notes" value={notes} onChange={e => setNotes(e.target.value)} rows="6" placeholder="Add any relevant notes for this project..." /> <div className="text-right mt-2"><button onClick={handleSaveNotes} disabled={status === 'saving'} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors disabled:bg-primary/50">{status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved!' : 'Save Notes'}</button></div> </div> );
};
// --- FILES COMPONENT ---
const FilesSection = ({ clientId, projectId }) => {
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const storage = getStorage();
    const filesCol = collection(db, 'clients', clientId, 'projects', projectId, 'files');
    const fetchFiles = async () => { setIsLoading(true); const fileSnapshot = await getDocs(filesCol); const fileList = fileSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setFiles(fileList); setIsLoading(false); };
    useEffect(() => { fetchFiles(); }, [clientId, projectId]);
    const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; handleUpload(file); };
    const handleUpload = (file) => { const storageRef = ref(storage, `projects/${projectId}/${file.name}`); const uploadTask = uploadBytesResumable(storageRef, file); setUploading(true); uploadTask.on('state_changed', (snapshot) => { const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100); setProgress(prog); }, (error) => console.error(error), () => { getDownloadURL(uploadTask.snapshot.ref).then(async (url) => { await addDoc(filesCol, { name: file.name, url: url, createdAt: serverTimestamp() }); setUploading(false); fetchFiles(); }); }); };
    const handleDeleteFile = async (file) => { const fileRef = ref(storage, `projects/${projectId}/${file.name}`); const docRef = doc(db, 'clients', clientId, 'projects', projectId, 'files', file.id); try { await deleteObject(fileRef); await deleteDoc(docRef); fetchFiles(); } catch (error) { console.error("Error deleting file: ", error); } };
    return ( <div className="mt-6 border-t border-glass-border pt-6"> <h4 className="text-lg font-bold text-text-primary mb-3">Files</h4> <div className="mb-4"> <label htmlFor="file-upload" className="cursor-pointer bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm"> Upload File </label> <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={uploading} /> </div> {uploading && <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>} <div className="space-y-2"> {files.map(file => ( <div key={file.id} className="p-3 bg-matte-black/30 rounded-lg flex items-center justify-between"> <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{file.name}</a> <button onClick={() => handleDeleteFile(file)} className="text-text-secondary hover:text-red-500 text-xs">Delete</button> </div> ))} </div> </div> );
};
// --- MAIN COMPONENT ---
const ProjectDetailPage = () => {
    const { clientId, projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => { const fetchProject = async () => { setIsLoading(true); const docRef = doc(db, 'clients', clientId, 'projects', projectId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setProject({ id: docSnap.id, ...docSnap.data() }); } else { setError('No such project found!'); } setIsLoading(false); }; if (clientId && projectId) fetchProject(); }, [clientId, projectId]);
    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!project) return null;
    return ( <div> <button onClick={() => navigate(`/client/${clientId}`)} className="text-sm text-primary hover:underline mb-2">&larr; Back to Client</button> <h2 className="text-3xl font-bold text-text-primary mb-2">{project.name}</h2> <p className="text-lg text-text-secondary mb-6"> Total Cost: ${(project.totalCost || 0).toLocaleString()} </p> <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6"> <h3 className="text-xl font-bold text-text-primary mb-4">Project Workspace</h3> <TasksSection clientId={clientId} projectId={projectId} /> <NotesSection clientId={clientId} projectId={projectId} initialNotes={project.notes} /> <FilesSection clientId={clientId} projectId={projectId} /> <div className="mt-6 border-t border-glass-border pt-6"> <button className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm"> Create Invoice </button> </div> </div> </div> );
};

export default ProjectDetailPage;
