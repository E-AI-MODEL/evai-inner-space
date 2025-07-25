
// Mock data voor EvAI 2.0 - Alle test data gecentraliseerd in frontend
export const mockApiKeys = {
  openai: [
    'sk-demo-1234567890abcdef1234567890abcdef12345678',
    'sk-test-9876543210fedcba9876543210fedcba87654321',
    'sk-mock-abcdef1234567890abcdef1234567890abcdef12',
    'sk-dev-111111111111111111111111111111111111111'
  ],
  google: [
    'AIzaSyDemo1234567890abcdef1234567890abcdef',
    'AIzaSyTest9876543210fedcba9876543210fedcba87',
    'AIzaSyMock-abcdef1234567890abcdef1234567890ab',
    'AIzaSyDev-111111111111111111111111111111111'
  ],
  anthropic: [
    'sk-ant-demo123456789012345678901234567890123456',
    'sk-ant-test987654321098765432109876543210987654',
    'sk-ant-mock-abcdef1234567890abcdef1234567890ab',
    'sk-ant-dev-111111111111111111111111111111111'
  ],
  vector: [
    'vec-demo-1234-5678-9012-3456789012345678',
    'vec-test-9876-5432-1098-7654321098765432',
    'vec-mock-abcd-ef12-3456-7890abcdef123456',
    'vec-dev-1111-1111-1111-111111111111111'
  ]
};

export const mockEmotions = [
  'verdrietig', 'boos', 'angstig', 'blij', 'gefrustreerd', 
  'eenzaam', 'opgewonden', 'teleurgesteld', 'hoopvol', 'verward',
  'gestrest', 'kalm', 'zenuwachtig', 'trots', 'beschaamd'
];

export const mockConversations = [
  {
    id: 'conv-1',
    messages: [
      { role: 'user', content: 'Ik voel me heel verdrietig vandaag.' },
      { role: 'assistant', content: 'Ik begrijp dat je je verdrietig voelt. Wil je me vertellen wat er gebeurd is?' },
      { role: 'user', content: 'Mijn huisdier is vandaag overleden.' },
      { role: 'assistant', content: 'Het spijt me zo te horen dat je huisdier is overleden. Dat is een groot verlies.' }
    ],
    timestamp: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'conv-2',
    messages: [
      { role: 'user', content: 'Ik ben boos op mijn collega.' },
      { role: 'assistant', content: 'Wat heeft je collega gedaan waardoor je je boos voelt?' },
      { role: 'user', content: 'Hij heeft credits gekregen voor mijn werk.' },
      { role: 'assistant', content: 'Dat moet frustrerend zijn. Heb je al geprobeerd om dit te bespreken?' }
    ],
    timestamp: new Date('2024-01-14T14:15:00Z')
  },
  {
    id: 'conv-3',
    messages: [
      { role: 'user', content: 'Ik ben bang voor mijn presentatie morgen.' },
      { role: 'assistant', content: 'Presentatie-angst is heel normaal. Wat maakt je het meest zenuwachtig?' },
      { role: 'user', content: 'Wat als ik vergeet wat ik moet zeggen?' },
      { role: 'assistant', content: 'Het is begrijpelijk dat je je daar zorgen over maakt. Heb je al geoefend?' }
    ],
    timestamp: new Date('2024-01-13T09:45:00Z')
  }
];

export const mockSeeds = [
  {
    id: 'seed-1',
    emotion: 'verdrietig',
    type: 'validation',
    label: 'Valideren',
    triggers: ['verdrietig', 'droevig', 'down', 'somber'],
    response: { nl: 'Ik kan begrijpen dat je je verdrietig voelt. Het is oké om deze emotie te ervaren.' },
    context: { severity: 'medium', situation: 'therapy' },
    meta: { priority: 2, weight: 0.8, confidence: 0.9, ttl: 43200, usageCount: 15 }
  },
  {
    id: 'seed-2',
    emotion: 'boos',
    type: 'reflection',
    label: 'Reflectievraag',
    triggers: ['boos', 'woedend', 'geïrriteerd', 'kwaad'],
    response: { nl: 'Wat denk je dat de oorzaak is van je boosheid? Kunnen we dat samen onderzoeken?' },
    context: { severity: 'high', situation: 'therapy' },
    meta: { priority: 3, weight: 0.7, confidence: 0.85, ttl: 43200, usageCount: 8 }
  },
  {
    id: 'seed-3',
    emotion: 'angstig',
    type: 'suggestion',
    label: 'Suggestie',
    triggers: ['angstig', 'bang', 'zenuwachtig', 'bezorgd'],
    response: { nl: 'Probeer eens een paar diepe ademhalingen te nemen. Concentreer je op je ademhaling.' },
    context: { severity: 'medium', situation: 'therapy' },
    meta: { priority: 2, weight: 0.75, confidence: 0.8, ttl: 43200, usageCount: 12 }
  }
];

export const mockApiResponses = {
  openai: {
    success: {
      choices: [
        {
          message: {
            content: 'Ik begrijp dat je je zo voelt. Wil je me er meer over vertellen?'
          }
        }
      ],
      usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 }
    },
    error: {
      error: {
        message: 'Invalid API key provided',
        type: 'invalid_request_error',
        code: 'invalid_api_key'
      }
    }
  },
  google: {
    success: {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Dat klinkt als een moeilijke situatie. Hoe voel je je daarbij?' }
            ]
          }
        }
      ]
    },
    error: {
      error: {
        message: 'API key not valid',
        status: 'INVALID_ARGUMENT'
      }
    }
  }
};

export const mockAnalytics = {
  totalConversations: 1247,
  totalMessages: 5832,
  averageSessionDuration: 8.5,
  topEmotions: [
    { emotion: 'verdrietig', count: 245 },
    { emotion: 'angstig', count: 198 },
    { emotion: 'boos', count: 156 },
    { emotion: 'gefrustreerd', count: 134 },
    { emotion: 'eenzaam', count: 98 }
  ],
  apiUsage: {
    openai: { calls: 1890, tokens: 45678 },
    google: { calls: 567, tokens: 12345 },
    vector: { calls: 234, embeddings: 1234 }
  },
  systemHealth: {
    uptime: 99.8,
    responseTime: 245,
    errorRate: 0.2
  }
};

export const mockSystemStatus = {
  database: { status: 'healthy', responseTime: 45 },
  apis: {
    openai: { status: 'healthy', responseTime: 120 },
    google: { status: 'healthy', responseTime: 89 },
    vector: { status: 'healthy', responseTime: 67 }
  },
  memory: { usage: 67, available: 4096 },
  cpu: { usage: 23, cores: 4 }
};

// Helper functions voor mock data
export const getRandomMockApiKey = (provider: keyof typeof mockApiKeys) => {
  const keys = mockApiKeys[provider];
  return keys[Math.floor(Math.random() * keys.length)];
};

export const getRandomMockEmotion = () => {
  return mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
};

export const generateMockConversation = (emotionHint?: string) => {
  const emotion = emotionHint || getRandomMockEmotion();
  return {
    id: `conv-${Date.now()}`,
    messages: [
      { role: 'user', content: `Ik voel me ${emotion}.` },
      { role: 'assistant', content: `Ik begrijp dat je je ${emotion} voelt. Wil je me er meer over vertellen?` }
    ],
    timestamp: new Date()
  };
};
