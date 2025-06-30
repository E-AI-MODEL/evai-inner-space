
import React from 'react';
import ApiKeyInput from '../shared/ApiKeyInput';

interface ApiKeyConfigurationProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onApiKeySave: () => void;
  openAiKey2: string;
  setOpenAiKey2: (key: string) => void;
  handleOpenAiKey2Save: () => void;
  vectorApiKey: string;
  setVectorApiKey: (key: string) => void;
  handleVectorApiKeySave: () => void;
}

const ApiKeyConfiguration: React.FC<ApiKeyConfigurationProps> = ({
  apiKey,
  onApiKeyChange,
  onApiKeySave,
  openAiKey2,
  setOpenAiKey2,
  handleOpenAiKey2Save,
  vectorApiKey,
  setVectorApiKey,
  handleVectorApiKeySave,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">API Configuration</h3>
      <ApiKeyInput
        label="OpenAI API Key (Primair)"
        placeholder="sk-..."
        storageKey="openai-api-key"
        value={apiKey}
        onChange={onApiKeyChange}
        onSave={onApiKeySave}
      />
      <ApiKeyInput
        label="OpenAI API Key (Secundair)"
        placeholder="sk-..."
        storageKey="openai-api-key-2"
        value={openAiKey2}
        onChange={setOpenAiKey2}
        onSave={handleOpenAiKey2Save}
      />
      <ApiKeyInput
        label="Vector API Key"
        placeholder="Optioneel"
        storageKey="vector-api-key"
        value={vectorApiKey}
        onChange={setVectorApiKey}
        onSave={handleVectorApiKeySave}
      />
    </div>
  );
};

export default ApiKeyConfiguration;
