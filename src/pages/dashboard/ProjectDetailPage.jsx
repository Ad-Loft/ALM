import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { InputField, AuthButton, TextAreaField } from '../../components/ui/AuthComponents';

const TaskDetailModal = ({ task, clientId, projectId, onClose, onUpdate }) => {
    const [editingTask, setEditingTask] = useState(task);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        const commentsCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks', task.id, 'comments');
        const q = query(commentsCol, orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [clientId, projectId, task.id]);

    const handleUpdate = async (field, value) => {
        const taskRef = doc(db, 'clients', clientId, 'projects', projectId, 'tasks', task.id);
        await updateDoc(taskRef, { [field]: value });
        onUpdate();
    };

    const handleStatusChange = (newStatus) => {
        setEditingTask(prev => ({ ...prev, status: newStatus }));
        handleUpdate('status', newStatus);
    };

    const handleSubtaskChange = async (index, completed) => {
        const newSubtasks = [...(editingTask.subtasks || [])];
        newSubtasks[index].completed = completed;
        await handleUpdate('subtasks', newSubtasks);
        setEditingTask(prev => ({...prev, subtasks: newSubtasks}));
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        const text = e.target.elements.subtask.value.trim();
        if (!text) return;
        const newSubtasks = [...(editingTask.subtasks || []), { text, completed: false }];
        await handleUpdate('subtasks', newSubtasks);
        setEditingTask(prev => ({...prev, subtasks: newSubtasks}));
        e.target.reset();
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const commentsCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks', task.id, 'comments');
        await addDoc(commentsCol, {
            text: newComment,
            createdAt: serverTimestamp(),
            authorName: "User"
        });
        setNewComment("");
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-glass-bg-solid w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl shadow-glass border border-glass-border m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-glass-border flex-shrink-0 flex justify-between items-center">
                    {isEditingName ? (
                        <input type="text" value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} onBlur={() => { handleUpdate('name', editingTask.name); setIsEditingName(false); }} autoFocus className="text-xl font-bold text-text-primary bg-transparent w-full border-b-2 border-primary focus:outline-none"/>
                    ) : (
                        <h3 className="text-xl font-bold text-text-primary" onClick={() => setIsEditingName(true)}>{editingTask.name}</h3>
                    )}
                    <select
                        value={editingTask.status || 'todo'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="bg-matte-black/50 border border-glass-border rounded-md px-3 py-1 text-text-primary focus:ring-primary focus:border-primary"
                    >
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div className="p-4 overflow-y-auto flex-grow">
                    <div className="mb-4">
                        <h4 className="font-semibold text-text-secondary mb-2">Description</h4>
                        {isEditingDesc ? (
                            <TextAreaField value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})} onBlur={() => { handleUpdate('description', editingTask.description); setIsEditingDesc(false); }} autoFocus rows="4" />
                        ) : (
                            <p onClick={() => setIsEditingDesc(true)} className="text-text-secondary whitespace-pre-wrap min-h-[50px]">{editingTask.description || 'Click to add a description...'}</p>
                        )}
                    </div>
                    <div className="mb-4">
                        <h4 className="font-semibold text-text-secondary mb-2">Checklist</h4>
                        {editingTask.subtasks?.map((sub, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="checkbox" checked={sub.completed} onChange={e => handleSubtaskChange(index, e.target.checked)} className="h-4 w-4 rounded bg-transparent border-glass-border text-primary focus:ring-primary"/>
                                <span className={sub.completed ? 'line-through text-text-secondary' : ''}>{sub.text}</span>
                            </div>
                        ))}
                        <form onSubmit={handleAddSubtask} className="mt-2">
                            <input name="subtask" placeholder="+ Add an item" className="w-full bg-transparent p-1 rounded-md text-text-secondary placeholder-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </form>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary mb-2">Comments</h4>
                        <div className="space-y-3">
                            {comments.map(comment => (
                                <div key={comment.id} className="text-sm">
                                    <span className="font-bold text-text-primary">{comment.authorName}</span>
                                    <p className="bg-matte-black/30 p-2 rounded-md mt-1">{comment.text}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddComment} className="mt-4">
                            <TextAreaField value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." rows="2"/>
                            <AuthButton type="submit" className="mt-2">Comment</AuthButton>
                        </form>
                    </div>
                </div>
                 <button onClick={onClose} className="absolute top-3 right-3 text-text-secondary hover:text-white">&times;</button>
            </div>
        </div>
    );
};

const KanbanBoard = ({ clientId, projectId }) => {
    const [columns, setColumns] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasksAndSetColumns = async () => {
        setIsLoading(true);
        const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');
        const q = query(tasksCol, orderBy('createdAt', 'asc'));
        const taskSnapshot = await getDocs(q);
        const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const initialColumns = { 'todo': { name: 'To Do', items: [] }, 'inprogress': { name: 'In Progress', items: [] }, 'done': { name: 'Done', items: [] } };
        taskList.forEach(task => {
            const status = task.status || (task.isCompleted ? 'done' : 'todo');
            if (initialColumns[status]) initialColumns[status].items.push(task);
            else initialColumns['todo'].items.push(task);
        });
        setColumns(initialColumns);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTasksAndSetColumns();
    }, [clientId, projectId]);

    const handleAddTask = async (columnId, taskName) => {
        if (!taskName || !taskName.trim()) return;
        const tasksCol = collection(db, 'clients', clientId, 'projects', projectId, 'tasks');
        await addDoc(tasksCol, { name: taskName, description: '', status: columnId, createdAt: serverTimestamp() });
        fetchTasksAndSetColumns();
    };

    if (isLoading || !columns) return <div className="flex justify-center items-center py-8"><LoadingSpinner /></div>;

    return (
        <>
            <div className="flex gap-4 overflow-x-auto p-1">
                {Object.entries(columns).map(([columnId, column]) => (
                    <div key={columnId} className="w-80 flex-shrink-0">
                        <div className="bg-glass-bg/80 rounded-xl shadow-md">
                            <h3 className="p-4 text-lg font-bold text-text-primary border-b border-glass-border">{column.name} ({column.items.length})</h3>
                            <div className="p-2 min-h-[400px]">
                                {column.items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedTask(item)}
                                        className="p-3 mb-2 rounded-lg shadow-sm bg-matte-black/50 hover:bg-matte-black/80 hover:border-primary/50 border border-transparent cursor-pointer"
                                    >
                                        <p className="text-text-primary font-medium">{item.name}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 border-t border-glass-border">
                                <form onSubmit={e => { e.preventDefault(); handleAddTask(columnId, e.target.elements.taskName.value); e.target.reset(); }}>
                                    <input name="taskName" type="text" placeholder="+ Add a card" className="w-full bg-transparent p-2 rounded-md text-text-secondary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                                </form>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    clientId={clientId}
                    projectId={projectId}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={fetchTasksAndSetColumns}
                />
            )}
        </>
    );
};


// --- MAIN COMPONENT ---
const ProjectDetailPage = () => {
    const { clientId, projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'clients', clientId, 'projects', projectId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProject({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('No such project found!');
                }
            } catch (err) {
                console.error("Error fetching project data:", err);
                setError('Failed to fetch project data.');
            } finally {
                setIsLoading(false);
            }
        };
        if (clientId && projectId) fetchProject();
    }, [clientId, projectId]);

    if (isLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!project) return null;

    return (
        <div>
            <button onClick={() => navigate(`/client/${clientId}`)} className="text-sm text-primary hover:underline mb-4">&larr; Back to Client</button>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">{project.name}</h2>
                    <p className="text-base text-text-secondary mt-1">{project.description || 'This project has no description.'}</p>
                </div>
            </div>
            <KanbanBoard clientId={clientId} projectId={projectId} />
        </div>
    );
};

export default ProjectDetailPage;
