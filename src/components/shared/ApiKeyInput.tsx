
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key, Check, X } from 'lucide-react';

interface ApiKeyInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  storageKey: string;
  testConnection?: () => Promise<boolean>;
  description?: string;
  className?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSave,
  storageKey,
  testConnection,
  description,
  className = ''
}) => {
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    if (value.trim()) {
      localStorage.setItem(storageKey, value.trim());
      
      if (testConnection) {
        setIsTesting(true);
        try {
          const valid = await testConnection();
          setIsValid(valid);
        } catch (error) {
          setIsValid(false);
        } finally {
          setIsTesting(false);
        }
      }
      
      onSave?.();
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    onChange('');
    setIsValid(null);
  };

  const getStatusIcon = () => {
    if (isTesting) return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    if (isValid === true) return <Check className="w-4 h-4 text-green-600" />;
    if (isValid === false) return <X className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-gray-500" />
        <Label className="text-sm font-medium">{label}</Label>
        {getStatusIcon()}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        <Button onClick={handleSave} disabled={!value.trim() || isTesting}>
          {isTesting ? 'Test...' : 'Opslaan'}
        </Button>
        
        {value && (
          <Button variant="outline" onClick={handleClear}>
            Wissen
          </Button>
        )}
      </div>
      
      {isValid === false && (
        <p className="text-xs text-red-600">
          API key test gefaald. Controleer of de key correct is.
        </p>
      )}
      
      {isValid === true && (
        <p className="text-xs text-green-600">
          API key succesvol gevalideerd.
        </p>
      )}
    </div>
  );
};

export default ApiKeyInput;
