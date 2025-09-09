import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AudioAnalysis from './pages/AudioAnalysis';
import EQControl from './pages/EQControl';
import SoundstageControl from './pages/SoundstageControl';
import ProfileSettings from './pages/ProfileSettings';
import RealTimeMonitor from './pages/RealTimeMonitor';

// Context
import { AudioContextProvider } from './context/AudioContext';
import { WebSocketProvider } from './context/WebSocketContext';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 250px;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  return (
    <AudioContextProvider>
      <WebSocketProvider>
        <Router>
          <AppContainer>
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
            
            <MainContent>
              <Header onToggleSidebar={toggleSidebar} />
              
              <ContentArea>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analysis" element={<AudioAnalysis />} />
                  <Route path="/eq" element={<EQControl />} />
                  <Route path="/soundstage" element={<SoundstageControl />} />
                  <Route path="/realtime" element={<RealTimeMonitor />} />
                  <Route path="/settings" element={<ProfileSettings />} />
                </Routes>
              </ContentArea>
            </MainContent>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AppContainer>
        </Router>
      </WebSocketProvider>
    </AudioContextProvider>
  );
}

export default App;
