import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Activity, 
  Volume2, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const CardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(79, 70, 229, 0.2);
  border-radius: 12px;
  color: #4f46e5;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const StatusItem = styled.div`
  text-align: center;
`;

const StatusValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.color || 'white'};
  margin-bottom: 0.25rem;
`;

const StatusLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
`;

const ControlButton = styled.button`
  background: ${props => props.active ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? '#4f46e5' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  
  &:hover {
    background: ${props => props.active ? '#4338ca' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const RealTimeChart = styled.div`
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
`;

const EQVisualizer = styled.div`
  display: flex;
  align-items: end;
  gap: 2px;
  height: 100px;
  margin: 1rem 0;
`;

const EQBar = styled.div`
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 2px 2px 0 0;
  height: ${props => Math.max(10, props.height)}px;
  min-height: 10px;
  transition: height 0.3s ease;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
`;

const InfoValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 0.25rem;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

function Dashboard() {
  const { 
    isConnected, 
    isAnalyzing, 
    isProcessing,
    realTimeData,
    eqGains,
    frequencyBands,
    startAnalysis,
    stopAnalysis,
    resetAudioState
  } = useAudio();
  
  const { 
    ping, 
    getStatus, 
    toggleAnalysis, 
    clearBuffer 
  } = useWebSocket();

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Get initial status
    getStatus();
    
    // Set up periodic status updates
    const statusInterval = setInterval(() => {
      getStatus();
    }, 5000);

    return () => clearInterval(statusInterval);
  }, [getStatus]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAnalysis();
      toast.success('Audio analysis stopped');
    } else {
      setIsPlaying(true);
      startAnalysis();
      toast.success('Audio analysis started');
    }
  };

  const handleReset = () => {
    resetAudioState();
    clearBuffer();
    setIsPlaying(false);
    toast.success('Audio state reset');
  };

  const handleToggleAnalysis = () => {
    toggleAnalysis();
    toast.success('Analysis toggled');
  };

  return (
    <DashboardContainer>
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardIcon>
            <Activity size={24} />
          </CardIcon>
        </CardHeader>
        <StatusGrid>
          <StatusItem>
            <StatusValue color={isConnected ? '#4ade80' : '#ef4444'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </StatusValue>
            <StatusLabel>Server Status</StatusLabel>
          </StatusItem>
          <StatusItem>
            <StatusValue color={isAnalyzing ? '#4ade80' : '#6b7280'}>
              {isAnalyzing ? 'Active' : 'Inactive'}
            </StatusValue>
            <StatusLabel>Analysis</StatusLabel>
          </StatusItem>
        </StatusGrid>
      </Card>

      {/* Audio Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Controls</CardTitle>
          <CardIcon>
            <Volume2 size={24} />
          </CardIcon>
        </CardHeader>
        <ButtonGrid>
          <ControlButton
            active={isPlaying}
            onClick={handlePlayPause}
            disabled={!isConnected}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? 'Stop Analysis' : 'Start Analysis'}
          </ControlButton>
          
          <ControlButton
            onClick={handleToggleAnalysis}
            disabled={!isConnected}
          >
            <BarChart3 size={20} />
            Toggle Analysis
          </ControlButton>
          
          <ControlButton
            onClick={handleReset}
            disabled={!isConnected}
          >
            <RotateCcw size={20} />
            Reset
          </ControlButton>
        </ButtonGrid>
      </Card>

      {/* Real-time Audio Visualization */}
      <Card style={{ gridColumn: 'span 2' }}>
        <CardHeader>
          <CardTitle>Real-time Audio Visualization</CardTitle>
          <CardIcon>
            <BarChart3 size={24} />
          </CardIcon>
        </CardHeader>
        <RealTimeChart>
          {isAnalyzing ? (
            <div>Audio visualization would appear here</div>
          ) : (
            <div>Start analysis to see real-time visualization</div>
          )}
        </RealTimeChart>
      </Card>

      {/* EQ Visualizer */}
      <Card>
        <CardHeader>
          <CardTitle>EQ Visualizer</CardTitle>
          <CardIcon>
            <Settings size={24} />
          </CardIcon>
        </CardHeader>
        <EQVisualizer>
          {eqGains.map((gain, index) => (
            <EQBar
              key={index}
              height={Math.max(10, (gain + 12) * 3.33)} // Scale to 0-80px range
            />
          ))}
        </EQVisualizer>
      </Card>

      {/* Audio Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Metrics</CardTitle>
          <CardIcon>
            <BarChart3 size={24} />
          </CardIcon>
        </CardHeader>
        <InfoGrid>
          <InfoItem>
            <InfoValue>{(realTimeData.stereoWidth * 100).toFixed(0)}%</InfoValue>
            <InfoLabel>Stereo Width</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{(realTimeData.centerImageStrength * 100).toFixed(0)}%</InfoValue>
            <InfoLabel>Center Image</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{realTimeData.noiseFloor.toFixed(1)} dB</InfoValue>
            <InfoLabel>Noise Floor</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{realTimeData.dynamicRange.toFixed(1)} dB</InfoValue>
            <InfoLabel>Dynamic Range</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{realTimeData.thd.toFixed(2)}%</InfoValue>
            <InfoLabel>THD</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{realTimeData.imd.toFixed(2)}%</InfoValue>
            <InfoLabel>IMD</InfoLabel>
          </InfoItem>
        </InfoGrid>
      </Card>
    </DashboardContainer>
  );
}

export default Dashboard;
