
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key } from 'lucide-react';

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
    <div className="space-y-2">
      <Label htmlFor="vector-api-key" className="flex items-center gap-2">
        <Key size={16} />
        Vector/Embedding API Key (Voor Neurale Zoekfunctie)
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="vector-api-key"
            type={showKey ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="sk-... (OpenAI Embedding API Key)"
            className="pr-10"
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
        <Button onClick={onSave} size="default">
          Opslaan
        </Button>
      </div>
      <p className="text-xs text-gray-600">
        Deze key wordt gebruikt voor vector embeddings en similarity search in het hybride neurosymbolische model.
        Meestal dezelfde als OpenAI API Key 1, maar kan apart worden geconfigureerd voor kostenbeheer.
      </p>
    </div>
  );
};

export default VectorApiKeyInput;
