import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db } from '../../firebase/config';
import { LoadingSpinner } from '../../components/ui/Icons';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';

const UpdatesTab = ({ client, project }) => {
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUpdates = async () => {
    setIsLoading(true);
    try {
      const updatesQuery = query(
        collection(db, 'clients', client.id, 'projects', project.id, 'updates'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(updatesQuery);
      setUpdates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [client.id, project.id]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUpdate.trim() && !file) return;
    setIsSubmitting(true);

    let fileUrl = null;
    let fileName = null;

    try {
      if (file) {
        fileName = file.name;
        const storage = getStorage();
        const storageRef = ref(storage, `projects/${project.id}/updates/${Date.now()}_${fileName}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        fileUrl = await getDownloadURL(uploadTask.ref);
      }

      await addDoc(collection(db, 'clients', client.id, 'projects', project.id, 'updates'), {
        text: newUpdate,
        createdAt: serverTimestamp(),
        author: "Jules", // Placeholder for user name
        fileName: fileName,
        fileUrl: fileUrl,
      });

      setNewUpdate('');
      setFile(null);
      // Clear the file input visually (this is a bit of a hack)
      if (document.getElementById('update-file-input')) {
        document.getElementById('update-file-input').value = "";
      }
      fetchUpdates(); // Re-fetch updates after posting
    } catch (error) {
      console.error("Error posting update:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-6">
        <Textarea
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          placeholder="Post a new status update..."
          className="mb-2"
          rows={4}
        />
        <div className="flex justify-between items-center mt-2">
            <Input
                id="update-file-input"
                type="file"
                onChange={handleFileChange}
                className="max-w-xs text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner className="h-4 w-4" /> : 'Post Update'}
            </Button>
        </div>
      </form>

      <div className="space-y-6">
        {updates.map(update => (
          <div key={update.id} className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-4 shadow-lg">
            <p className="text-foreground whitespace-pre-wrap">{update.text}</p>
            {update.fileUrl && (
                <div className="mt-3">
                    <a href={update.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        View Attachment: {update.fileName}
                    </a>
                </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Posted by {update.author} on {update.createdAt ? new Date(update.createdAt.toDate()).toLocaleString() : '...'}
            </p>
          </div>
        ))}
        {updates.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No status updates yet.</p>
        )}
      </div>
    </div>
  );
};

export default UpdatesTab;
