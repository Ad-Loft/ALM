import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { InputField, TextAreaField, AuthButton } from '../../components/ui/AuthComponents';
import { UploadIcon } from '../../components/ui/Icons';

const CreateClientPage = ({ user }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        fullName: '',
        email: '',
        phone: '',
        estimatedRevenue: '',
        projectDescription: '',
        clientNotes: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await addDoc(collection(db, 'clients'), {
                ...formData,
                userId: user.uid,
                createdAt: serverTimestamp()
            });
            setSuccess('Client created successfully!');
            // Reset form after successful submission
            setFormData({
                companyName: '',
                fullName: '',
                email: '',
                phone: '',
                estimatedRevenue: '',
                projectDescription: '',
                clientNotes: ''
            });
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
            // Message will disappear after 5 seconds
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-text-primary">Create New Client</h2>
                <p className="text-base text-text-secondary mt-1">Fill out the details below to add a new client to your roster.</p>
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="companyName" label="Company Name" placeholder="e.g., Starlight Bakery" className="md:col-span-2" value={formData.companyName} onChange={handleChange} />
                    <InputField id="fullName" label="Contact Full Name" placeholder="e.g., Jane Doe" value={formData.fullName} onChange={handleChange} />
                    <InputField id="email" type="email" label="Contact Email" placeholder="e.g., jane.doe@example.com" value={formData.email} onChange={handleChange} />
                    <InputField id="phone" type="tel" label="Contact Phone" placeholder="e.g., (555) 123-4567" value={formData.phone} onChange={handleChange} />
                    <InputField id="estimatedRevenue" type="number" label="Estimated Revenue ($)" placeholder="e.g., 5000" value={formData.estimatedRevenue} onChange={handleChange} />
                    <TextAreaField id="projectDescription" label="Project Description" rows="4" className="md:col-span-2" value={formData.projectDescription} onChange={handleChange} />
                    <TextAreaField id="clientNotes" label="Internal Client Notes" rows="4" className="md:col-span-2" value={formData.clientNotes} onChange={handleChange} />

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-2">Shared Files</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-glass-border border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadIcon />
                                <div className="flex text-sm text-text-secondary">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-primary/20 rounded-md font-medium text-primary-hover hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-glass-bg focus-within:ring-primary px-1">
                                        <span>Upload files</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-text-secondary/70">PNG, JPG, PDF up to 10MB</p>
                            </div>
                        </div>
                    </div>

                    {error && <p className="md:col-span-2 text-sm text-red-500 text-center">{error}</p>}
                    {success && <p className="md:col-span-2 text-sm text-green-400 text-center">{success}</p>}

                    <div className="md:col-span-2 text-right">
                         <AuthButton type="submit" isLoading={isLoading}>
                            Create Client
                        </AuthButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClientPage;
