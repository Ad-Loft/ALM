import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { InputField, TextAreaField, AuthButton } from '../../components/ui/AuthComponents';
import { UploadIcon } from '../../components/ui/Icons';

const CreateClientPage = ({ user }) => {
    const location = useLocation();
    const leadData = location.state?.leadData;

    const initialFormData = {
        companyName: '',
        fullName: '',
        email: '',
        phone: '',
        estimatedRevenue: '',
        projectDescription: '',
        clientNotes: '',
        isMonthly: false,
        monthlyAmount: '',
        paymentDueDate: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (leadData) {
            setFormData(prevData => ({
                ...prevData,
                companyName: leadData.company_name || '',
                fullName: leadData.name || '',
                email: leadData.email || '',
                phone: leadData.phone || '',
                projectDescription: leadData.message || '',
            }));
        }
    }, [leadData]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const clientData = {
                userId: user.uid,
                createdAt: serverTimestamp(),
                companyName: formData.companyName,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                estimatedRevenue: parseFloat(formData.estimatedRevenue) || 0,
                projectDescription: formData.projectDescription,
                clientNotes: formData.clientNotes,
                isMonthly: formData.isMonthly,
            };

            if (formData.isMonthly) {
                clientData.monthlyAmount = parseFloat(formData.monthlyAmount) || 0;
                clientData.paymentDueDate = parseInt(formData.paymentDueDate, 10) || null;
            }

            await addDoc(collection(db, 'clients'), clientData);

            setSuccess('Client created successfully!');
            setFormData(initialFormData);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
            setTimeout(() => { setSuccess(''); setError(''); }, 5000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-text-primary">Create New Client</h2>
                <p className="text-base text-text-secondary mt-1">
                    {leadData ? "Editing details for a new client converted from a lead." : "Fill out the details below to add a new client to your roster."}
                </p>
            </div>
            <div className="bg-glass-bg backdrop-blur-xl rounded-2xl shadow-glass border border-glass-border p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="companyName" label="Company Name" placeholder="e.g., Starlight Bakery" className="md:col-span-2" value={formData.companyName} onChange={handleChange} required/>
                    <InputField id="fullName" label="Contact Full Name" placeholder="e.g., Jane Doe" value={formData.fullName} onChange={handleChange} required/>
                    <InputField id="email" type="email" label="Contact Email" placeholder="e.g., jane.doe@example.com" value={formData.email} onChange={handleChange} required/>
                    <InputField id="phone" type="tel" label="Contact Phone" placeholder="e.g., (555) 123-4567" value={formData.phone} onChange={handleChange} />
                    <InputField id="estimatedRevenue" type="number" label="Estimated Revenue ($)" placeholder="e.g., 5000" value={formData.estimatedRevenue} onChange={handleChange} />

                    <div className="md:col-span-2 border-t border-glass-border pt-6">
                        <div className="relative flex items-start">
                            <div className="flex h-6 items-center"><input id="isMonthly" type="checkbox" className="h-4 w-4 rounded border-gray-300 bg-transparent text-primary focus:ring-primary" checked={formData.isMonthly} onChange={handleChange} /></div>
                            <div className="ml-3 text-sm leading-6"><label htmlFor="isMonthly" className="font-medium text-text-primary">Is this a monthly retainer client?</label></div>
                        </div>
                    </div>

                    {formData.isMonthly && (
                        <>
                            <InputField id="monthlyAmount" type="number" label="Monthly Amount ($)" placeholder="e.g., 1500" value={formData.monthlyAmount} onChange={handleChange} required />
                            <InputField id="paymentDueDate" type="number" label="Payment Due Date (Day of Month)" placeholder="e.g., 15" min="1" max="31" value={formData.paymentDueDate} onChange={handleChange} required />
                        </>
                    )}

                    <TextAreaField id="projectDescription" label="Project Description" rows="4" className="md:col-span-2" value={formData.projectDescription} onChange={handleChange} />
                    <TextAreaField id="clientNotes" label="Internal Client Notes" rows="4" className="md:col-span-2" value={formData.clientNotes} onChange={handleChange} />

                    <div className="md:col-span-2"><label className="block text-sm font-medium text-text-secondary mb-2">Shared Files</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-glass-border border-dashed rounded-md"><div className="space-y-1 text-center"><UploadIcon /><div className="flex text-sm text-text-secondary"><label htmlFor="file-upload" className="relative cursor-pointer bg-primary/20 rounded-md font-medium text-primary-hover hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-glass-bg focus-within:ring-primary px-1"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-text-secondary/70">PNG, JPG, PDF up to 10MB</p></div></div></div>

                    {error && <p className="md:col-span-2 text-sm text-red-500 text-center">{error}</p>}
                    {success && <p className="md:col-span-2 text-sm text-green-400 text-center">{success}</p>}

                    <div className="md:col-span-2 text-right">
                         <AuthButton type="submit" isLoading={isLoading}>Create Client</AuthButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClientPage;
