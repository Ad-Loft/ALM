import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LoadingSpinner, FileTextIcon } from '../../components/ui/Icons';

const FilesTab = ({ client, project }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      let aggregatedFiles = [];
      try {
        // Fetch files from status updates
        const updatesQuery = query(collection(db, 'clients', client.id, 'projects', project.id, 'updates'));
        const updatesSnapshot = await getDocs(updatesQuery);
        updatesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.fileUrl && data.fileName) {
            aggregatedFiles.push({
              name: data.fileName,
              url: data.fileUrl,
              source: 'Status Update',
              date: data.createdAt,
            });
          }
        });

        // Fetch files from tasks
        const tasksQuery = query(collection(db, 'clients', client.id, 'projects', project.id, 'tasks'));
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach(file => {
              aggregatedFiles.push({
                name: file.name,
                url: file.url,
                source: `Task: ${data.title}`,
                date: data.createdAt,
              });
            });
          }
        });

        // Sort files by date
        aggregatedFiles.sort((a, b) => b.date.toDate() - a.date.toDate());

        setFiles(aggregatedFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [client.id, project.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }

  return (
    <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-foreground mb-4">Project Files</h3>
      <div className="divide-y divide-glass-border-light">
        {files.length > 0 ? files.map((file, index) => (
          <div key={index} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <FileTextIcon className="h-6 w-6 text-primary" />
              <div>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary hover:underline">
                  {file.name}
                </a>
                <p className="text-sm text-muted-foreground">Added in: {file.source}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {file.date ? new Date(file.date.toDate()).toLocaleDateString() : ''}
            </p>
          </div>
        )) : (
          <p className="text-center text-muted-foreground py-8">No files have been uploaded to this project yet.</p>
        )}
      </div>
    </div>
  );
};

export default FilesTab;
