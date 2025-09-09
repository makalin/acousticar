import React from 'react';
import styled from 'styled-components';
import { Menu, Volume2, Wifi, WifiOff } from 'lucide-react';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.875rem;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.connected ? '#4ade80' : '#ef4444'};
`;

const AudioStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.active ? '#4ade80' : '#6b7280'};
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.875rem;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(45deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

function Header({ onToggleSidebar, isConnected = true, isAudioActive = false, userName = "User" }) {
  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={onToggleSidebar}>
          <Menu size={24} />
        </MenuButton>
        <Logo>
          <Volume2 size={28} />
          AcoustiCar
        </Logo>
      </LeftSection>
      
      <RightSection>
        <StatusIndicator>
          <ConnectionStatus connected={isConnected}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </ConnectionStatus>
        </StatusIndicator>
        
        <AudioStatus active={isAudioActive}>
          <Volume2 size={16} />
          {isAudioActive ? 'Audio Active' : 'Audio Inactive'}
        </AudioStatus>
        
        <UserProfile>
          <Avatar>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <span>{userName}</span>
        </UserProfile>
      </RightSection>
    </HeaderContainer>
  );
}

export default Header;
