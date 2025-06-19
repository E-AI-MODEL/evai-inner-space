
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
        API Key 3 - Vector Embeddings (text-embedding-3-small)
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
      <div className="space-y-2 text-xs text-blue-700">
        <p className="font-medium">
          🧠 Deze API key wordt exclusief gebruikt voor vector embeddings met het text-embedding-3-small model.
        </p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Converteert tekst naar numerieke vectoren voor similarity matching</li>
          <li>Essentieel voor hybride neurosymbolische beslissingen</li>
          <li>Kan dezelfde zijn als API Key 1, maar apart configureren helpt met kostenbeheer</li>
          <li>Alleen nodig voor embedding operaties, niet voor chat/completions</li>
        </ul>
      </div>
    </div>
  );
};

export default VectorApiKeyInput;
