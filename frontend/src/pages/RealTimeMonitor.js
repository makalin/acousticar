import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  BarChart3,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MonitorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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
  margin-bottom: 1.5rem;
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
  margin-bottom: 0.5rem;
  
  &:hover {
    background: ${props => props.active ? '#4338ca' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VisualizerContainer = styled.div`
  height: 300px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
`;

const AudioBar = styled.div`
  position: absolute;
  bottom: 0;
  left: ${props => props.left}%;
  width: ${props => props.width}%;
  height: ${props => props.height}px;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 2px 2px 0 0;
  transition: height 0.1s ease;
`;

const FrequencyResponseChart = styled.div`
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetricItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  border: 1px solid ${props => props.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.active ? '#22c55e' : '#ef4444'};
`;

const DataTable = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const DataLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`;

const DataValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
`;

const LogContainer = styled.div`
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
`;

const LogEntry = styled.div`
  margin-bottom: 0.25rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const LogTimestamp = styled.span`
  color: rgba(255, 255, 255, 0.5);
  margin-right: 0.5rem;
`;

const LogMessage = styled.span`
  color: rgba(255, 255, 255, 0.8);
`;

function RealTimeMonitor() {
  const { 
    isConnected, 
    isAnalyzing, 
    realTimeData,
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

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const [logEntries, setLogEntries] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const audioDataRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isMonitoring) {
      startVisualization();
    } else {
      stopVisualization();
    }
    
    return () => stopVisualization();
  }, [isMonitoring]);

  useEffect(() => {
    // Add log entry when real-time data updates
    if (realTimeData && Object.keys(realTimeData).length > 0) {
      addLogEntry('Real-time data updated');
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [realTimeData]);

  const startVisualization = () => {
    const animate = () => {
      // Generate random audio data for visualization
      const newData = Array.from({ length: 32 }, () => Math.random() * 100);
      audioDataRef.current = newData;
      setAudioData([...newData]);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newEntry = { timestamp, message };
    
    setLogEntries(prev => {
      const updated = [...prev, newEntry];
      // Keep only last 50 entries
      return updated.slice(-50);
    });
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    startAnalysis();
    addLogEntry('Real-time monitoring started');
    toast.success('Real-time monitoring started');
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    stopAnalysis();
    addLogEntry('Real-time monitoring stopped');
    toast.success('Real-time monitoring stopped');
  };

  const handleReset = () => {
    resetAudioState();
    clearBuffer();
    setIsMonitoring(false);
    setAudioData([]);
    setLogEntries([]);
    addLogEntry('Monitor reset');
    toast.success('Monitor reset');
  };

  const handlePing = () => {
    ping();
    addLogEntry('Ping sent to server');
  };

  const handleGetStatus = () => {
    getStatus();
    addLogEntry('Status request sent');
  };

  const handleToggleAnalysis = () => {
    toggleAnalysis();
    addLogEntry('Analysis toggled');
  };

  const renderAudioVisualization = () => {
    if (audioData.length === 0) {
      return <div>No audio data available</div>;
    }

    return audioData.map((value, index) => (
      <AudioBar
        key={index}
        left={(index / audioData.length) * 100}
        width={100 / audioData.length}
        height={value}
      />
    ));
  };

  return (
    <MonitorContainer>
      {/* Real-time Audio Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Audio Monitor</CardTitle>
          <CardIcon>
            <Activity size={24} />
          </CardIcon>
        </CardHeader>

        <StatusIndicator active={isMonitoring}>
          <Activity size={16} />
          <StatusText active={isMonitoring}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </StatusText>
        </StatusIndicator>

        <ControlButton
          active={isMonitoring}
          onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
          disabled={!isConnected}
        >
          {isMonitoring ? <Pause size={20} /> : <Play size={20} />}
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </ControlButton>

        <ControlButton
          onClick={handleReset}
          disabled={!isConnected}
        >
          <RotateCcw size={20} />
          Reset Monitor
        </ControlButton>

        <VisualizerContainer>
          {isMonitoring ? renderAudioVisualization() : (
            <div>Start monitoring to see real-time audio visualization</div>
          )}
        </VisualizerContainer>

        <MetricsGrid>
          <MetricItem>
            <MetricValue>{(realTimeData.stereoWidth * 100).toFixed(0)}%</MetricValue>
            <MetricLabel>Stereo Width</MetricLabel>
          </MetricItem>
          <MetricItem>
            <MetricValue>{(realTimeData.centerImageStrength * 100).toFixed(0)}%</MetricValue>
            <MetricLabel>Center Image</MetricLabel>
          </MetricItem>
          <MetricItem>
            <MetricValue>{(realTimeData.depthPerception * 100).toFixed(0)}%</MetricValue>
            <MetricLabel>Depth</MetricLabel>
          </MetricItem>
          <MetricItem>
            <MetricValue>{(realTimeData.heightPerception * 100).toFixed(0)}%</MetricValue>
            <MetricLabel>Height</MetricLabel>
          </MetricItem>
        </MetricsGrid>
      </Card>

      {/* Frequency Response Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Frequency Response</CardTitle>
          <CardIcon>
            <BarChart3 size={24} />
          </CardIcon>
        </CardHeader>

        <FrequencyResponseChart>
          {isMonitoring ? (
            <div>Frequency response chart would appear here</div>
          ) : (
            <div>Start monitoring to see frequency response</div>
          )}
        </FrequencyResponseChart>

        <DataTable>
          <DataRow>
            <DataLabel>Noise Floor</DataLabel>
            <DataValue>{realTimeData.noiseFloor.toFixed(1)} dB</DataValue>
          </DataRow>
          <DataRow>
            <DataLabel>Dynamic Range</DataLabel>
            <DataValue>{realTimeData.dynamicRange.toFixed(1)} dB</DataValue>
          </DataRow>
          <DataRow>
            <DataLabel>THD</DataLabel>
            <DataValue>{realTimeData.thd.toFixed(2)}%</DataValue>
          </DataRow>
          <DataRow>
            <DataLabel>IMD</DataLabel>
            <DataValue>{realTimeData.imd.toFixed(2)}%</DataValue>
          </DataRow>
          <DataRow>
            <DataLabel>Last Update</DataLabel>
            <DataValue>{lastUpdate || 'Never'}</DataValue>
          </DataRow>
        </DataTable>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
          <CardIcon>
            <Settings size={24} />
          </CardIcon>
        </CardHeader>

        <ControlButton
          onClick={handlePing}
          disabled={!isConnected}
        >
          <Activity size={20} />
          Ping Server
        </ControlButton>

        <ControlButton
          onClick={handleGetStatus}
          disabled={!isConnected}
        >
          <BarChart3 size={20} />
          Get Status
        </ControlButton>

        <ControlButton
          onClick={handleToggleAnalysis}
          disabled={!isConnected}
        >
          <Volume2 size={20} />
          Toggle Analysis
        </ControlButton>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardIcon>
            <Activity size={24} />
          </CardIcon>
        </CardHeader>

        <LogContainer>
          {logEntries.length === 0 ? (
            <div>No activity logged</div>
          ) : (
            logEntries.map((entry, index) => (
              <LogEntry key={index}>
                <LogTimestamp>[{entry.timestamp}]</LogTimestamp>
                <LogMessage>{entry.message}</LogMessage>
              </LogEntry>
            ))
          )}
        </LogContainer>
      </Card>
    </MonitorContainer>
  );
}

export default RealTimeMonitor;
