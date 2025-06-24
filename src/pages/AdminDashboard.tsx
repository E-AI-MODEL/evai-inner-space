
import React, { useState, useEffect } from 'react';
import { Tabs } from '@/components/ui/tabs';
import CleanAdminHeader from '../components/admin/CleanAdminHeader';
import AdminTabsList from '../components/admin/AdminTabsList';
import AdminTabsContent from '../components/admin/AdminTabsContent';
import AdminAuth from '../components/admin/AdminAuth';
import ImprovedNeurosymbolicFlow from '../components/admin/ImprovedNeurosymbolicFlow';
import { useChatHistory } from '../hooks/useChatHistory';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import MobileUIFixes from '../components/MobileUIFixes';

const AdminDashboard = () => {
  const { messages } = useChatHistory();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated in this session
    const authStatus = sessionStorage.getItem('evai-admin-auth') === 'true';
    setIsAuthenticated(authStatus);
  }, []);

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

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('evai-admin-auth', 'true');
  };

  // Show authentication component if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <MobileUIFixes />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-inter">
        <CleanAdminHeader 
          onBackClick={handleBackClick}
          messageCount={messages.length}
          isMobile={isMobile}
        />

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
          <Tabs defaultValue="handleiding" className="w-full" orientation="horizontal">
            <div className="mb-4 sm:mb-6">
              <AdminTabsList hasRubricActivity={hasRubricActivity} />
            </div>

            <div className="space-y-6">
              <AdminTabsContent 
                hasRubricActivity={hasRubricActivity}
                messages={messages}
              />
              
              {/* Add improved neurosymbolic flow to system tab */}
              <div className="mt-8">
                <ImprovedNeurosymbolicFlow />
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
