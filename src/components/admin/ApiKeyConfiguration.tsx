
import React from 'react';
import ApiKeyInput from '../ApiKeyInput';
import OpenAIApiKey2Input from '../OpenAIApiKey2Input';
import VectorApiKeyInput from '../VectorApiKeyInput';

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
      <h3 className="font-medium text-gray-800">API Key Configuratie</h3>
      <ApiKeyInput
        value={apiKey}
        onChange={onApiKeyChange}
        onSave={onApiKeySave}
      />
      <OpenAIApiKey2Input
        value={openAiKey2}
        onChange={setOpenAiKey2}
        onSave={handleOpenAiKey2Save}
      />
      <VectorApiKeyInput
        value={vectorApiKey}
        onChange={setVectorApiKey}
        onSave={handleVectorApiKeySave}
      />
    </div>
  );
};

export default ApiKeyConfiguration;
