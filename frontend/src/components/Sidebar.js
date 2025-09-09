import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Home, 
  BarChart3, 
  Sliders, 
  Volume2, 
  Activity, 
  Settings,
  X
} from 'lucide-react';

const SidebarContainer = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 250px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease-in-out;
  z-index: 200;
  
  @media (min-width: 769px) {
    transform: translateX(0);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 150;
  display: ${props => props.isOpen ? 'block' : 'none'};
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
`;

const CloseButton = styled.button`
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

const Navigation = styled.nav`
  padding: 1rem 0;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin: 0.25rem 0;
`;

const NavLink = styled.button`
  width: 100%;
  background: none;
  border: none;
  color: ${props => props.active ? '#4f46e5' : 'rgba(255, 255, 255, 0.8)'};
  padding: 0.75rem 1.5rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  ${props => props.active && `
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #4f46e5;
    }
  `}
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const SidebarFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  text-align: center;
`;

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard'
  },
  {
    id: 'analysis',
    label: 'Audio Analysis',
    icon: BarChart3,
    path: '/analysis'
  },
  {
    id: 'eq',
    label: 'EQ Control',
    icon: Sliders,
    path: '/eq'
  },
  {
    id: 'soundstage',
    label: 'Soundstage',
    icon: Volume2,
    path: '/soundstage'
  },
  {
    id: 'realtime',
    label: 'Real-time Monitor',
    icon: Activity,
    path: '/realtime'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
];

function Sidebar({ isOpen, onClose, onPageChange, currentPage }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (item) => {
    navigate(item.path);
    onPageChange(item.id);
    onClose();
  };

  return (
    <>
      <Overlay isOpen={isOpen} onClick={onClose} />
      <SidebarContainer isOpen={isOpen}>
        <SidebarHeader>
          <Logo>
            <Volume2 size={24} />
            AcoustiCar
          </Logo>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </SidebarHeader>
        
        <Navigation>
          <NavList>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || currentPage === item.id;
              
              return (
                <NavItem key={item.id}>
                  <NavLink
                    active={isActive}
                    onClick={() => handleNavClick(item)}
                  >
                    <NavIcon>
                      <Icon size={20} />
                    </NavIcon>
                    {item.label}
                  </NavLink>
                </NavItem>
              );
            })}
          </NavList>
        </Navigation>
        
        <SidebarFooter>
          AcoustiCar v1.0.0
          <br />
          AI-Powered Audio Optimization
        </SidebarFooter>
      </SidebarContainer>
    </>
  );
}

export default Sidebar;
