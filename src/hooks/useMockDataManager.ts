
import { useState, useEffect } from 'react';

export function useMockDataManager() {
  const [mockMode, setMockMode] = useState(false);
  const [activeMockKeys, setActiveMockKeys] = useState<Record<string, string>>({});

  // Mock mode is permanently disabled for production
  useEffect(() => {
    setMockMode(false);
    setActiveMockKeys({});
    
    // Remove any existing mock keys from localStorage
    localStorage.removeItem('evai-mock-mode');
    ['openai', 'google', 'anthropic', 'vector'].forEach(provider => {
      localStorage.removeItem(`mock-${provider}-key`);
    });
  }, []);

  const toggleMockMode = () => {
    // Mock mode is disabled in production
    console.log('Mock mode is disabled in production version');
  };

  const getMockApiKey = (provider: string) => {
    // Returns empty string in production - no mock keys
    return '';
  };

  const isMockKey = (key: string) => {
    // Check if key contains test/demo patterns
    return key.includes('demo') || key.includes('test') || key.includes('mock') || key.includes('dev');
  };

  const getMockConversation = () => {
    // Returns null in production - no mock conversations
    return null;
  };

  const getMockSeeds = () => {
    // Returns empty array in production - no mock seeds
    return [];
  };

  const simulateApiCall = async (provider: string, delay: number = 500) => {
    // No simulation in production - throw error
    throw new Error('Mock API calls are disabled in production. Please configure real API keys.');
  };

  const getSystemStatus = () => {
    return {
      mockMode: false,
      activeMockKeys: [],
      totalMockKeys: 0,
      mockConversations: 0,
      mockSeeds: 0,
      productionMode: true
    };
  };

  return {
    mockMode: false,
    toggleMockMode,
    activeMockKeys: {},
    getMockApiKey,
    isMockKey,
    getMockConversation,
    getMockSeeds,
    simulateApiCall,
    getSystemStatus
  };
}
