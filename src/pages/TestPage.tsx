
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ChatbotTester from '../components/ChatbotTester';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Terug naar Chat
            </Button>
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chatbot Functionaliteit Test
          </h1>
          <p className="text-gray-600">
            Test alle systemen van de EvAI chatbot om te verifiëren dat alles correct werkt.
          </p>
        </div>
        
        <ChatbotTester />
      </div>
    </div>
  );
};

export default TestPage;
