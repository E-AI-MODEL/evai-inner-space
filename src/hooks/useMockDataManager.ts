
import { useState, useEffect } from 'react';
import { mockApiKeys, mockSeeds, mockConversations, getRandomMockApiKey } from '@/data/mockData';

export function useMockDataManager() {
  const [mockMode, setMockMode] = useState(() => {
    return localStorage.getItem('evai-mock-mode') === 'true';
  });

  const [activeMockKeys, setActiveMockKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('evai-mock-mode', mockMode.toString());
    
    if (mockMode) {
      // Activeer mock keys als mock mode aan staat
      const mockKeys = {
        openai: getRandomMockApiKey('openai'),
        google: getRandomMockApiKey('google'),
        anthropic: getRandomMockApiKey('anthropic'),
        vector: getRandomMockApiKey('vector')
      };
      setActiveMockKeys(mockKeys);
      
      // Sla mock keys op in localStorage voor testing
      Object.entries(mockKeys).forEach(([provider, key]) => {
        localStorage.setItem(`mock-${provider}-key`, key);
      });
    } else {
      // Verwijder mock keys als mock mode uit staat
      setActiveMockKeys({});
      Object.keys(mockApiKeys).forEach(provider => {
        localStorage.removeItem(`mock-${provider}-key`);
      });
    }
  }, [mockMode]);

  const toggleMockMode = () => {
    setMockMode(!mockMode);
  };

  const getMockApiKey = (provider: keyof typeof mockApiKeys) => {
    return activeMockKeys[provider] || getRandomMockApiKey(provider);
  };

  const isMockKey = (key: string) => {
    return key.includes('demo') || key.includes('test') || key.includes('mock') || key.includes('dev');
  };

  const getMockConversation = (index: number = 0) => {
    return mockConversations[index] || mockConversations[0];
  };

  const getMockSeeds = () => {
    return mockSeeds;
  };

  const simulateApiCall = async (provider: string, delay: number = 500) => {
    // Simuleer API call met delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (mockMode) {
      return {
        success: true,
        data: {
          provider,
          response: `Mock response from ${provider}`,
          timestamp: new Date().toISOString()
        },
        mock: true
      };
    }
    
    throw new Error('Mock mode is disabled');
  };

  const getSystemStatus = () => {
    return {
      mockMode,
      activeMockKeys: Object.keys(activeMockKeys),
      totalMockKeys: Object.keys(mockApiKeys).length,
      mockConversations: mockConversations.length,
      mockSeeds: mockSeeds.length
    };
  };

  return {
    mockMode,
    toggleMockMode,
    activeMockKeys,
    getMockApiKey,
    isMockKey,
    getMockConversation,
    getMockSeeds,
    simulateApiCall,
    getSystemStatus
  };
}
