
export interface CollaborationStatus {
  api1: boolean;
  api2: boolean;
  vector: boolean;
}

export function useApiStatusManager() {
  const getApiConfiguration = () => {
    const openAiKey2 = localStorage.getItem('openai-api-key-2');
    const vectorApiKey = localStorage.getItem('vector-api-key');
    const isAutonomousEnabled = localStorage.getItem('evai-autonomous-mode') === 'true';
    
    return {
      hasOpenAI: true, // Passed as parameter to the hook
      hasOpenAi2: openAiKey2 && openAiKey2.trim().length > 0,
      hasVectorAPI: vectorApiKey && vectorApiKey.trim().length > 0,
      isAutonomousEnabled,
      openAiKey2,
      vectorApiKey
    };
  };

  const createCollaborationStatus = (hasOpenAI: boolean, hasOpenAi2: boolean, hasVectorAPI: boolean): CollaborationStatus => ({
    api1: hasOpenAI,
    api2: hasOpenAi2,
    vector: hasVectorAPI
  });

  const generateApiStatusText = (collaborationStatus: CollaborationStatus, availableApis: number) => {
    return `API-1:${collaborationStatus.api1 ? '✅' : '❌'} | API-2:${collaborationStatus.api2 ? '✅' : '❌'} | Vector:${collaborationStatus.vector ? '✅' : '❌'}`;
  };

  const generateCollaborationNote = (apiStatusText: string, availableApis: number) => {
    return `\n\n*[🤝 ENHANCED API STATUS: ${apiStatusText} | ${availableApis}/3 APIs active]*`;
  };

  const generateMissingApisNote = (collaborationStatus: CollaborationStatus) => {
    const missingApis = Object.entries(collaborationStatus)
      .filter(([_, available]) => !available)
      .map(([api]) => api.toUpperCase())
      .join(', ');
    
    return `\n\n*[⚠️ BEPERKTE FUNCTIONALITEIT: Ontbrekende APIs (${missingApis}) beperken de response kwaliteit. Voeg API keys toe voor volledige functionaliteit.]*`;
  };

  return {
    getApiConfiguration,
    createCollaborationStatus,
    generateApiStatusText,
    generateCollaborationNote,
    generateMissingApisNote
  };
}
