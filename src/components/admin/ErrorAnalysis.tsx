
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Message } from '../../types';

interface ErrorAnalysisProps {
  errors: Message[];
}

const ErrorAnalysis: React.FC<ErrorAnalysisProps> = ({ errors }) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Collapsible>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="w-full">
            <CardTitle className="flex items-center justify-between gap-2 text-red-600">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                Error Analysis
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardTitle>
          </CollapsibleTrigger>
          <CardDescription>Recente fouten en problemen</CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {errors.slice(-5).map((error, index) => (
                <div key={error.timestamp.getTime()} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-red-800">Error #{errors.length - index}</p>
                      <p className="text-sm text-red-600 mt-1">{error.content}</p>
                    </div>
                    <span className="text-xs text-red-500">
                      {error.timestamp.toLocaleString('nl-NL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ErrorAnalysis;
