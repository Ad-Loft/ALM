import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from './Icons';

// Note: AuthCard and AuthHeader remain the same as they are custom styled components.
export const AuthCard = ({ children }) => (
    <div className="bg-glass-light backdrop-blur-lg border border-glass-border-light rounded-xl p-8 shadow-xl">
        {children}
    </div>
);

export const AuthHeader = ({ title, subtitle }) => (
    <div className="mb-8 text-center">
        <img className="mx-auto h-12 w-auto" src="https://adlandingpro.com/blog/wp-content/uploads/2025/06/Ad-Loft-Google-Ads.png" alt="Ad Loft Logo" />
        <h2 className="mt-6 text-3xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
);

// Refactored InputField to use Shadcn's Label and Input
export const InputField = ({ id, label, className, ...props }) => (
    <div className={`grid w-full max-w-sm items-center gap-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
);

// Refactored TextAreaField to use Shadcn's Label and Textarea
export const TextAreaField = ({ id, label, className, ...props }) => (
    <div className={`grid w-full gap-1.5 ${className}`}>
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} {...props} />
    </div>
);

// AuthButton already uses the new Shadcn Button component
export const AuthButton = ({ isLoading, children, ...props }) => (
    <Button type="submit" disabled={isLoading} className="w-full" {...props}>
        {isLoading && <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />}
        {children}
    </Button>
);
