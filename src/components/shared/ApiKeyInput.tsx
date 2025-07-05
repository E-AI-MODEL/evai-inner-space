
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key, Check, X, TestTube } from 'lucide-react';
import { testOpenAIApiKey, testOpenAIChat } from '@/utils/apiKeyTester';

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
  const [testResults, setTestResults] = useState<string>('');

  const handleSave = async () => {
    if (value.trim()) {
      localStorage.setItem(storageKey, value.trim());
      onSave?.();
    }
  };

  const handleAdvancedTest = async () => {
    if (!value.trim()) {
      setTestResults('❌ Please enter an API key first');
      return;
    }

    setIsTesting(true);
    setTestResults('🧪 Testing API key...');
    
    try {
      // Test 1: Basic validation and model access
      console.log('🧪 Running basic API key validation...');
      const basicTest = await testOpenAIApiKey(value.trim());
      
      if (!basicTest.isValid) {
        setIsValid(false);
        setTestResults(`❌ Basic test failed: ${basicTest.error}`);
        return;
      }

      setTestResults(`✅ Basic test passed (${basicTest.responseTime}ms)\n🧪 Testing chat completion...`);

      // Test 2: Chat completion test
      console.log('🧪 Running chat completion test...');
      const chatTest = await testOpenAIChat(value.trim());
      
      if (!chatTest.isValid) {
        setIsValid(false);
        setTestResults(prev => `${prev}\n❌ Chat test failed: ${chatTest.error}`);
        return;
      }

      // All tests passed
      setIsValid(true);
      setTestResults(
        `✅ All tests passed!\n` +
        `📊 Response time: ${basicTest.responseTime}ms + ${chatTest.responseTime}ms\n` +
        `🤖 Model: ${chatTest.model}\n` +
        `💬 Test response: ${chatTest.details?.response || 'Success'}`
      );

      // Auto-save if tests pass
      localStorage.setItem(storageKey, value.trim());
      onSave?.();

    } catch (error) {
      console.error('🔴 Advanced test error:', error);
      setIsValid(false);
      setTestResults(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    onChange('');
    setIsValid(null);
    setTestResults('');
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
          Opslaan
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleAdvancedTest} 
          disabled={!value.trim() || isTesting}
          title="Advanced API key testing"
        >
          <TestTube className="h-4 w-4" />
        </Button>
        
        {value && (
          <Button variant="outline" onClick={handleClear}>
            Wissen
          </Button>
        )}
      </div>
      
      {testResults && (
        <div className={`text-xs p-3 rounded border ${
          isValid === true ? 'bg-green-50 border-green-200 text-green-800' :
          isValid === false ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <pre className="whitespace-pre-wrap font-mono">{testResults}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;
