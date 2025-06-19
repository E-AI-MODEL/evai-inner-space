
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Zap } from 'lucide-react';

interface VectorApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

const VectorApiKeyInput: React.FC<VectorApiKeyInputProps> = ({
  value,
  onChange,
  onSave,
}) => {
  const [showKey, setShowKey] = React.useState(false);

  return (
    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <Label htmlFor="vector-api-key" className="flex items-center gap-2 text-blue-800 font-medium">
        <Zap size={16} className="text-blue-600" />
        API Key 3 - Vector Embeddings
      </Label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="vector-api-key"
            type={showKey ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="sk-... (OpenAI API Key voor embeddings)"
            className="pr-10 bg-white"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
        <Button onClick={onSave} size="default" className="bg-blue-600 hover:bg-blue-700">
          Opslaan
        </Button>
      </div>
      
      <div className="bg-white/60 rounded-md p-3 text-xs text-blue-700 space-y-2">
        <p className="font-medium flex items-center gap-1">
          <span className="text-blue-600">🧠</span>
          Text-embedding-3-small model voor vector embeddings
        </p>
        <div className="grid grid-cols-1 gap-1 text-blue-600">
          <span>• Converteert tekst naar numerieke vectoren</span>
          <span>• Essentieel voor hybride neurosymbolische beslissingen</span>
          <span>• Kan dezelfde zijn als API Key 1</span>
          <span>• Alleen nodig voor embedding operaties</span>
        </div>
      </div>
    </div>
  );
};

export default VectorApiKeyInput;
