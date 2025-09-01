import React from 'react';

// Using the new 'glass' theme for the card
export const AuthCard = ({ children }) => (
    <div className="bg-glass-bg backdrop-blur-xl shadow-glass border border-glass-border rounded-2xl py-8 px-4 sm:px-10 animate-fade-in">
        {children}
    </div>
);

// Updated text colors to use the new theme
export const AuthHeader = ({ title, subtitle }) => (
    <div className="mb-8 text-center">
        <img className="mx-auto h-12 w-auto" src="https://adlandingpro.com/blog/wp-content/uploads/2025/06/Ad-Loft-Google-Ads.png" alt="Ad Loft Logo" />
        <h2 className="mt-6 text-4xl font-extrabold text-text-primary">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>}
    </div>
);

// Updated input fields with the new theme
export const InputField = ({ id, label, className, ...props }) => (
    <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
        <input
            id={id}
            name={id}
            className="bg-matte-black/50 text-text-primary block w-full px-3 py-2 border border-glass-border rounded-md shadow-sm placeholder-text-secondary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            {...props}
        />
    </div>
);

// Updated text area fields with the new theme
export const TextAreaField = ({ id, label, className, ...props }) => (
     <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
        <textarea
            id={id}
            name={id}
            className="bg-matte-black/50 text-text-primary block w-full px-3 py-2 border border-glass-border rounded-md shadow-sm placeholder-text-secondary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            {...props}
        ></textarea>
    </div>
);

// Updated button to use the new primary color from the theme
export const AuthButton = ({ isLoading, children, ...props }) => (
    <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
        {...props}
    >
        {isLoading ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : children}
    </button>
);
