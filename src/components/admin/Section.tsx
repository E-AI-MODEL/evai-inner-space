import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'symbolic' | 'neural' | 'audit';
}

export const Section: React.FC<SectionProps> = ({ 
  title, 
  subtitle, 
  className, 
  children,
  variant = 'symbolic'
}) => {
  const variantStyles = {
    symbolic: 'border-green-500/20 bg-green-500/5',
    neural: 'border-blue-500/20 bg-blue-500/5',
    audit: 'border-slate-500/20 bg-slate-500/5'
  };

  return (
    <Card className={cn('mb-6', variantStyles[variant], className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
