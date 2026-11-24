'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LiveMapWrapper from '@/components/LiveMapWrapper';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const AccountModal = dynamic(() => import('@/components/AccountModal'), { ssr: false });
const AdminCMS = dynamic(() => import('@/components/AdminCMS'), { ssr: false });

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('profile');
  const [prefilledSuggestion, setPrefilledSuggestion] = useState(null);
  const [showCmsPanel, setShowCmsPanel] = useState(false);

  const openAccountModal = (tab = 'profile', prefill = null) => {
    setPrefilledSuggestion(prefill);
    setAccountModalTab(tab);
    setShowAccountModal(true);
  };

  // Read stored session on client boot
  useEffect(() => {
    const storedUser = localStorage.getItem('operator_session');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.email === 'workwithavip@gmail.com' && parsedUser.role !== 'admin') {
          parsedUser.role = 'admin';
          localStorage.setItem('operator_session', JSON.stringify(parsedUser));
        }
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAuthSuccess = (user) => {
    const userObj = { ...user };
    if (userObj.email === 'workwithavip@gmail.com' && userObj.role !== 'admin') {
      userObj.role = 'admin';
    }
    setCurrentUser(userObj);
    localStorage.setItem('operator_session', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('operator_session');
  };

  return (
    <main className="dashboard dashboard-fullbleed" style={{ height: '100vh', width: '100vw', padding: 0, overflow: 'hidden' }}>
      {/* SIGINT Map (Directly rendered fullscreen) */}
      <LiveMapWrapper 
        currentUser={currentUser}
        handleLogout={handleLogout}
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        handleAuthSuccess={handleAuthSuccess}
        onAvatarClick={openAccountModal}
        onOpenCms={() => setShowCmsPanel(true)}
      />

      {/* Access Control HUD Overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={handleAuthSuccess} 
        />
      )}

      {/* Operator Account Settings Overlay */}
      {showAccountModal && (
        <AccountModal 
          onClose={() => setShowAccountModal(false)} 
          currentUser={currentUser}
          onAuthSuccess={handleAuthSuccess}
          handleLogout={handleLogout}
          initialTab={accountModalTab}
          prefilledSuggestion={prefilledSuggestion}
          onOpenAuth={() => { setShowAccountModal(false); setShowAuthModal(true); }}
        />
      )}

      {/* Admin CMS Panel Overlay */}
      {showCmsPanel && currentUser?.role === 'admin' && (
        <AdminCMS
          currentUser={currentUser}
          onClose={() => setShowCmsPanel(false)}
        />
      )}
    </main>
  );
}
