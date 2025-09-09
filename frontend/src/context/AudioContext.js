import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const AudioContext = createContext();

const initialState = {
  isConnected: false,
  isAnalyzing: false,
  isProcessing: false,
  audioData: null,
  analysisResults: null,
  eqProfile: null,
  soundstageProfile: null,
  userPreferences: {
    bass_preference: 0.0,
    treble_preference: 0.0,
    vocal_clarity: 0.0,
    soundstage_width: 0.5,
    height_preference: 0.5,
    depth_preference: 0.5,
    music_genre: 'general',
    listening_environment: 'car',
    speaker_count: 2,
    subwoofer_present: false,
    amplifier_power: 50,
    cabin_size: 'medium'
  },
  frequencyBands: [
    20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
    630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
    10000, 12500, 16000, 20000
  ],
  eqGains: new Array(31).fill(0),
  realTimeData: {
    frequencyResponse: [],
    stereoWidth: 0.5,
    centerImageStrength: 0.5,
    depthPerception: 0.5,
    heightPerception: 0.5,
    noiseFloor: -60,
    dynamicRange: 0,
    thd: 0,
    imd: 0
  }
};

function audioReducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload
      };
    
    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload
      };
    
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };
    
    case 'SET_AUDIO_DATA':
      return {
        ...state,
        audioData: action.payload
      };
    
    case 'SET_ANALYSIS_RESULTS':
      return {
        ...state,
        analysisResults: action.payload
      };
    
    case 'SET_EQ_PROFILE':
      return {
        ...state,
        eqProfile: action.payload
      };
    
    case 'SET_SOUNDSTAGE_PROFILE':
      return {
        ...state,
        soundstageProfile: action.payload
      };
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };
    
    case 'UPDATE_EQ_GAINS':
      return {
        ...state,
        eqGains: action.payload
      };
    
    case 'UPDATE_REAL_TIME_DATA':
      return {
        ...state,
        realTimeData: {
          ...state.realTimeData,
          ...action.payload
        }
      };
    
    case 'RESET_AUDIO_STATE':
      return {
        ...state,
        audioData: null,
        analysisResults: null,
        isAnalyzing: false,
        isProcessing: false
      };
    
    default:
      return state;
  }
}

export function AudioContextProvider({ children }) {
  const [state, dispatch] = useReducer(audioReducer, initialState);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws/audio-stream');
        
        ws.onopen = () => {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
          toast.success('Connected to audio server');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
          toast.error('Disconnected from audio server');
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast.error('WebSocket connection error');
        };
        
        return ws;
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        toast.error('Failed to connect to audio server');
      }
    };

    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'analysis_result':
        dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: data.data });
        dispatch({ type: 'UPDATE_REAL_TIME_DATA', payload: data.data.acoustic_profile });
        break;
      
      case 'processed_audio':
        // Handle processed audio data
        break;
      
      case 'optimized_audio':
        // Handle optimized audio data
        break;
      
      case 'error':
        toast.error(data.message);
        break;
      
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  const sendAudioData = (audioData) => {
    // This would send audio data to the WebSocket
    // Implementation depends on how audio is captured
  };

  const startAnalysis = () => {
    dispatch({ type: 'SET_ANALYZING', payload: true });
  };

  const stopAnalysis = () => {
    dispatch({ type: 'SET_ANALYZING', payload: false });
  };

  const updateUserPreferences = (preferences) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
  };

  const updateEQGains = (gains) => {
    dispatch({ type: 'UPDATE_EQ_GAINS', payload: gains });
  };

  const setEQProfile = (profile) => {
    dispatch({ type: 'SET_EQ_PROFILE', payload: profile });
  };

  const setSoundstageProfile = (profile) => {
    dispatch({ type: 'SET_SOUNDSTAGE_PROFILE', payload: profile });
  };

  const resetAudioState = () => {
    dispatch({ type: 'RESET_AUDIO_STATE' });
  };

  const value = {
    ...state,
    sendAudioData,
    startAnalysis,
    stopAnalysis,
    updateUserPreferences,
    updateEQGains,
    setEQProfile,
    setSoundstageProfile,
    resetAudioState
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioContextProvider');
  }
  return context;
}
