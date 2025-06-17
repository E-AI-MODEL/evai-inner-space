
import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import AdminHeader from '../components/admin/AdminHeader';
import AdminTabsList from '../components/admin/AdminTabsList';
import AdminTabsContent from '../components/admin/AdminTabsContent';
import { useChatHistory } from '../hooks/useChatHistory';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';

const AdminDashboard = () => {
  const { messages } = useChatHistory();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if rubrics are active (messages contain rubric-related content)
  const hasRubricActivity = messages.some(msg => 
    msg.content.toLowerCase().includes('emotionele regulatie') ||
    msg.content.toLowerCase().includes('coping') ||
    msg.content.toLowerCase().includes('zelfbewustzijn') ||
    msg.content.toLowerCase().includes('sociale verbinding') ||
    msg.content.toLowerCase().includes('betekenis')
  );

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-inter">
      <AdminHeader 
        onBackClick={handleBackClick}
        messageCount={messages.length}
        isMobile={isMobile}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue={hasRubricActivity ? "rubrics" : "seeds"} className="w-full" orientation="horizontal">
          <div className="mb-4 sm:mb-6">
            <AdminTabsList hasRubricActivity={hasRubricActivity} />
          </div>

          <AdminTabsContent 
            hasRubricActivity={hasRubricActivity}
            messages={messages}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
