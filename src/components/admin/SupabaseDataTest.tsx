import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const SupabaseDataTest: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const runTest = async () => {
    setResult('');
    try {
      const { data, error } = await supabase
        .from('emotion_seeds')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        setResult('error');
      } else {
        console.log('Supabase data:', data);
        setResult('success');
      }
    } catch (err) {
      console.error('Request failed:', err);
      setResult('error');
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardContent className="p-3 space-y-2">
        <Button size="sm" variant="outline" onClick={runTest}>
          Test Supabase
        </Button>
        {result && (
          <span className={`text-sm ${result === 'success' ? 'text-green-600' : 'text-red-600'}`}> 
            {result === 'success' ? 'OK' : 'Fout'}
          </span>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseDataTest;
