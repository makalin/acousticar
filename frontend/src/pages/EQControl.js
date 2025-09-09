import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  Upload,
  Download,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EQContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
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

const EQVisualizer = styled.div`
  display: flex;
  align-items: end;
  gap: 2px;
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const EQBar = styled.div`
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 2px 2px 0 0;
  height: ${props => Math.max(10, (props.gain + 12) * 3.33)}px;
  min-height: 10px;
  transition: height 0.3s ease;
  position: relative;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to top, #4338ca, #6d28d9);
  }
`;

const EQBarLabel = styled.div`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.6);
  writing-mode: vertical-rl;
  text-orientation: mixed;
`;

const EQBarValue = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.625rem;
  color: white;
  font-weight: 600;
`;

const EQSlider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  width: 100%;
  
  &:hover {
    opacity: 1;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

const EQSliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const EQSliderLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

const EQSliderValue = styled.div`
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
  text-align: center;
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

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const PresetButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: #4f46e5;
    border-color: #4f46e5;
  }
`;

const EQGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const EQBandContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const EQBandLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

const EQBandValue = styled.div`
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
  text-align: center;
`;

const EQBandSlider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  transform: rotate(-90deg);
  
  &:hover {
    opacity: 1;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
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

function EQControl() {
  const { 
    isConnected, 
    eqGains, 
    frequencyBands,
    updateEQGains,
    setEQProfile,
    userPreferences
  } = useAudio();
  
  const { enableEQ, disableEQ } = useWebSocket();

  const [isEQEnabled, setIsEQEnabled] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [eqProfile, setEqProfile] = useState(null);

  const presets = {
    flat: new Array(31).fill(0),
    rock: [2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0],
    classical: new Array(31).fill(0),
    jazz: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    electronic: [3, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1],
    pop: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  const handleEQGainChange = (index, value) => {
    const newGains = [...eqGains];
    newGains[index] = parseFloat(value);
    updateEQGains(newGains);
  };

  const handlePresetChange = (presetName) => {
    setSelectedPreset(presetName);
    if (presetName !== 'custom') {
      updateEQGains(presets[presetName]);
    }
  };

  const handleResetEQ = () => {
    updateEQGains(new Array(31).fill(0));
    setSelectedPreset('flat');
    toast.success('EQ reset to flat');
  };

  const handleSaveProfile = () => {
    const profile = {
      name: `Custom_${new Date().toISOString().split('T')[0]}`,
      frequency_bands: frequencyBands,
      gains: eqGains,
      q_factors: new Array(31).fill(1.0),
      filter_types: new Array(31).fill('peaking'),
      user_preferences: userPreferences,
      acoustic_compensation: {}
    };
    
    setEqProfile(profile);
    toast.success('EQ profile saved');
  };

  const handleToggleEQ = () => {
    if (isEQEnabled) {
      disableEQ();
      setIsEQEnabled(false);
      toast.success('EQ disabled');
    } else {
      const profile = {
        name: `EQ_${new Date().toISOString().split('T')[0]}`,
        frequency_bands: frequencyBands,
        gains: eqGains,
        q_factors: new Array(31).fill(1.0),
        filter_types: new Array(31).fill('peaking'),
        user_preferences: userPreferences,
        acoustic_compensation: {}
      };
      
      enableEQ(profile);
      setIsEQEnabled(true);
      toast.success('EQ enabled');
    }
  };

  const formatFrequency = (freq) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`;
    }
    return freq.toString();
  };

  const getMaxGain = () => Math.max(...eqGains);
  const getMinGain = () => Math.min(...eqGains);
  const getAverageGain = () => eqGains.reduce((a, b) => a + b, 0) / eqGains.length;

  return (
    <EQContainer>
      {/* EQ Visualizer */}
      <Card>
        <CardHeader>
          <CardTitle>EQ Visualizer</CardTitle>
          <CardIcon>
            <Sliders size={24} />
          </CardIcon>
        </CardHeader>

        <EQVisualizer>
          {eqGains.map((gain, index) => (
            <EQBar key={index} gain={gain}>
              <EQBarValue>{gain.toFixed(1)}</EQBarValue>
              <EQBarLabel>{formatFrequency(frequencyBands[index])}</EQBarLabel>
            </EQBar>
          ))}
        </EQVisualizer>

        <PresetGrid>
          {Object.keys(presets).map((preset) => (
            <PresetButton
              key={preset}
              className={selectedPreset === preset ? 'active' : ''}
              onClick={() => handlePresetChange(preset)}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </PresetButton>
          ))}
        </PresetGrid>

        <ControlButton
          active={isEQEnabled}
          onClick={handleToggleEQ}
          disabled={!isConnected}
        >
          {isEQEnabled ? <Pause size={20} /> : <Play size={20} />}
          {isEQEnabled ? 'Disable EQ' : 'Enable EQ'}
        </ControlButton>

        <ControlButton
          onClick={handleSaveProfile}
          disabled={!isConnected}
        >
          <Save size={20} />
          Save Profile
        </ControlButton>

        <ControlButton
          onClick={handleResetEQ}
          disabled={!isConnected}
        >
          <RotateCcw size={20} />
          Reset EQ
        </ControlButton>
      </Card>

      {/* EQ Controls */}
      <Card>
        <CardHeader>
          <CardTitle>EQ Controls</CardTitle>
          <CardIcon>
            <Sliders size={24} />
          </CardIcon>
        </CardHeader>

        <EQGrid>
          {eqGains.map((gain, index) => (
            <EQBandContainer key={index}>
              <EQBandLabel>{formatFrequency(frequencyBands[index])}</EQBandLabel>
              <EQBandSlider
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={gain}
                onChange={(e) => handleEQGainChange(index, e.target.value)}
              />
              <EQBandValue>{gain.toFixed(1)}</EQBandValue>
            </EQBandContainer>
          ))}
        </EQGrid>

        <InfoGrid>
          <InfoItem>
            <InfoValue>{getMaxGain().toFixed(1)}</InfoValue>
            <InfoLabel>Max Gain</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{getMinGain().toFixed(1)}</InfoValue>
            <InfoLabel>Min Gain</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{getAverageGain().toFixed(1)}</InfoValue>
            <InfoLabel>Avg Gain</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{eqGains.filter(g => g !== 0).length}</InfoValue>
            <InfoLabel>Active Bands</InfoLabel>
          </InfoItem>
        </InfoGrid>
      </Card>
    </EQContainer>
  );
}

export default EQControl;
