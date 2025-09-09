import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activeConnections, setActiveConnections] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  
  const audioWsRef = useRef(null);
  const controlWsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectAudioWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/audio-stream');
      
      ws.onopen = () => {
        console.log('Audio WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          handleAudioMessage(data);
        } catch (error) {
          console.error('Error parsing audio WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('Audio WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        audioWsRef.current = null;
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect();
        } else {
          toast.error('Failed to reconnect to audio server');
        }
      };
      
      ws.onerror = (error) => {
        console.error('Audio WebSocket error:', error);
        toast.error('Audio WebSocket connection error');
      };
      
      audioWsRef.current = ws;
      return ws;
    } catch (error) {
      console.error('Error connecting audio WebSocket:', error);
      toast.error('Failed to connect to audio server');
    }
  };

  const connectControlWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/control');
      
      ws.onopen = () => {
        console.log('Control WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleControlMessage(data);
        } catch (error) {
          console.error('Error parsing control WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('Control WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        controlWsRef.current = null;
      };
      
      ws.onerror = (error) => {
        console.error('Control WebSocket error:', error);
        toast.error('Control WebSocket connection error');
      };
      
      controlWsRef.current = ws;
      return ws;
    } catch (error) {
      console.error('Error connecting control WebSocket:', error);
      toast.error('Failed to connect to control server');
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${reconnectAttempts.current})`);
      connectAudioWebSocket();
    }, delay);
  };

  const handleAudioMessage = (data) => {
    switch (data.type) {
      case 'analysis_result':
        // Handle analysis results
        break;
      case 'processed_audio':
        // Handle processed audio
        break;
      case 'optimized_audio':
        // Handle optimized audio
        break;
      case 'error':
        toast.error(data.message);
        break;
      default:
        console.log('Unknown audio message type:', data.type);
    }
  };

  const handleControlMessage = (data) => {
    switch (data.type) {
      case 'preferences_updated':
        toast.success('Preferences updated');
        break;
      case 'eq_enabled':
        toast.success('EQ enabled');
        break;
      case 'eq_disabled':
        toast.success('EQ disabled');
        break;
      case 'soundstage_enabled':
        toast.success('Soundstage optimization enabled');
        break;
      case 'soundstage_disabled':
        toast.success('Soundstage optimization disabled');
        break;
      case 'connection_info':
        setActiveConnections(data.data.active_connections);
        break;
      case 'error':
        toast.error(data.message);
        break;
      default:
        console.log('Unknown control message type:', data.type);
    }
  };

  const sendAudioData = (audioData) => {
    if (audioWsRef.current && audioWsRef.current.readyState === WebSocket.OPEN) {
      audioWsRef.current.send(JSON.stringify(audioData));
    } else {
      console.warn('Audio WebSocket not connected');
    }
  };

  const sendControlCommand = (command) => {
    if (controlWsRef.current && controlWsRef.current.readyState === WebSocket.OPEN) {
      controlWsRef.current.send(JSON.stringify(command));
    } else {
      console.warn('Control WebSocket not connected');
    }
  };

  const ping = () => {
    if (audioWsRef.current && audioWsRef.current.readyState === WebSocket.OPEN) {
      audioWsRef.current.send('ping');
    }
  };

  const getStatus = () => {
    if (audioWsRef.current && audioWsRef.current.readyState === WebSocket.OPEN) {
      audioWsRef.current.send('get_status');
    }
  };

  const toggleAnalysis = () => {
    if (audioWsRef.current && audioWsRef.current.readyState === WebSocket.OPEN) {
      audioWsRef.current.send('toggle_analysis');
    }
  };

  const clearBuffer = () => {
    if (audioWsRef.current && audioWsRef.current.readyState === WebSocket.OPEN) {
      audioWsRef.current.send('clear_buffer');
    }
  };

  const setPreferences = (preferences) => {
    sendControlCommand({
      type: 'set_preferences',
      preferences
    });
  };

  const enableEQ = (eqProfile) => {
    sendControlCommand({
      type: 'enable_eq',
      eq_profile: eqProfile
    });
  };

  const disableEQ = () => {
    sendControlCommand({
      type: 'disable_eq'
    });
  };

  const enableSoundstage = (soundstageProfile) => {
    sendControlCommand({
      type: 'enable_soundstage',
      soundstage_profile: soundstageProfile
    });
  };

  const disableSoundstage = () => {
    sendControlCommand({
      type: 'disable_soundstage'
    });
  };

  const getConnectionInfo = () => {
    sendControlCommand({
      type: 'get_connection_info'
    });
  };

  // Initialize connections
  useEffect(() => {
    connectAudioWebSocket();
    connectControlWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (audioWsRef.current) {
        audioWsRef.current.close();
      }
      if (controlWsRef.current) {
        controlWsRef.current.close();
      }
    };
  }, []);

  // Periodic ping to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (isConnected) {
        ping();
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  const value = {
    isConnected,
    connectionStatus,
    activeConnections,
    lastMessage,
    sendAudioData,
    sendControlCommand,
    ping,
    getStatus,
    toggleAnalysis,
    clearBuffer,
    setPreferences,
    enableEQ,
    disableEQ,
    enableSoundstage,
    disableSoundstage,
    getConnectionInfo
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
