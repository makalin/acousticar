import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Volume2, 
  RotateCcw, 
  Save, 
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SoundstageContainer = styled.div`
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

const ControlSlider = styled.div`
  margin-bottom: 1.5rem;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const SliderName = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`;

const SliderValue = styled.div`
  font-size: 0.875rem;
  color: white;
  font-weight: 600;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  
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

const SoundstageVisualizer = styled.div`
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

const SoundstageElement = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  background: ${props => props.color || '#4f46e5'};
  border-radius: 50%;
  opacity: 0.8;
  transition: all 0.3s ease;
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

function SoundstageControl() {
  const { 
    isConnected, 
    userPreferences,
    updateUserPreferences,
    setSoundstageProfile
  } = useAudio();
  
  const { enableSoundstage, disableSoundstage } = useWebSocket();

  const [isSoundstageEnabled, setIsSoundstageEnabled] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [soundstageSettings, setSoundstageSettings] = useState({
    stereo_width: 0.5,
    center_image_strength: 0.5,
    depth_perception: 0.5,
    height_perception: 0.5,
    left_right_balance: 0.5,
    front_back_positioning: 0.5,
    spatial_coherence: 0.5
  });

  const presets = {
    narrow: {
      stereo_width: 0.3,
      center_image_strength: 0.8,
      depth_perception: 0.4,
      height_perception: 0.3,
      left_right_balance: 0.5,
      front_back_positioning: 0.6,
      spatial_coherence: 0.9
    },
    wide: {
      stereo_width: 0.8,
      center_image_strength: 0.4,
      depth_perception: 0.7,
      height_perception: 0.6,
      left_right_balance: 0.5,
      front_back_positioning: 0.4,
      spatial_coherence: 0.7
    },
    immersive: {
      stereo_width: 0.7,
      center_image_strength: 0.6,
      depth_perception: 0.8,
      height_perception: 0.7,
      left_right_balance: 0.5,
      front_back_positioning: 0.5,
      spatial_coherence: 0.8
    },
    focused: {
      stereo_width: 0.4,
      center_image_strength: 0.9,
      depth_perception: 0.5,
      height_perception: 0.4,
      left_right_balance: 0.5,
      front_back_positioning: 0.7,
      spatial_coherence: 0.95
    }
  };

  const handleSettingChange = (setting, value) => {
    const newSettings = {
      ...soundstageSettings,
      [setting]: parseFloat(value)
    };
    setSoundstageSettings(newSettings);
    setSelectedPreset('custom');
  };

  const handlePresetChange = (presetName) => {
    setSelectedPreset(presetName);
    if (presetName !== 'custom') {
      setSoundstageSettings(presets[presetName]);
    }
  };

  const handleResetSettings = () => {
    setSoundstageSettings({
      stereo_width: 0.5,
      center_image_strength: 0.5,
      depth_perception: 0.5,
      height_perception: 0.5,
      left_right_balance: 0.5,
      front_back_positioning: 0.5,
      spatial_coherence: 0.5
    });
    setSelectedPreset('flat');
    toast.success('Soundstage settings reset');
  };

  const handleSaveProfile = () => {
    const profile = {
      stereo_width: soundstageSettings.stereo_width,
      center_image_strength: soundstageSettings.center_image_strength,
      depth_perception: soundstageSettings.depth_perception,
      height_perception: soundstageSettings.height_perception,
      left_right_balance: soundstageSettings.left_right_balance,
      front_back_positioning: soundstageSettings.front_back_positioning,
      spatial_coherence: soundstageSettings.spatial_coherence,
      crosstalk_compensation: new Array(32).fill(0),
      hrtf_compensation: {
        left_ear_compensation: new Array(32).fill(0),
        right_ear_compensation: new Array(32).fill(0),
        spatial_enhancement: {
          width_factor: soundstageSettings.stereo_width,
          height_factor: soundstageSettings.height_perception,
          depth_factor: soundstageSettings.depth_perception
        }
      }
    };
    
    setSoundstageProfile(profile);
    toast.success('Soundstage profile saved');
  };

  const handleToggleSoundstage = () => {
    if (isSoundstageEnabled) {
      disableSoundstage();
      setIsSoundstageEnabled(false);
      toast.success('Soundstage optimization disabled');
    } else {
      const profile = {
        stereo_width: soundstageSettings.stereo_width,
        center_image_strength: soundstageSettings.center_image_strength,
        depth_perception: soundstageSettings.depth_perception,
        height_perception: soundstageSettings.height_perception,
        left_right_balance: soundstageSettings.left_right_balance,
        front_back_positioning: soundstageSettings.front_back_positioning,
        spatial_coherence: soundstageSettings.spatial_coherence,
        crosstalk_compensation: new Array(32).fill(0),
        hrtf_compensation: {
          left_ear_compensation: new Array(32).fill(0),
          right_ear_compensation: new Array(32).fill(0),
          spatial_enhancement: {
            width_factor: soundstageSettings.stereo_width,
            height_factor: soundstageSettings.height_perception,
            depth_factor: soundstageSettings.depth_perception
          }
        }
      };
      
      enableSoundstage(profile);
      setIsSoundstageEnabled(true);
      toast.success('Soundstage optimization enabled');
    }
  };

  const renderSoundstageVisualization = () => {
    const elements = [];
    
    // Center element
    elements.push(
      <SoundstageElement
        key="center"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#4f46e5',
          width: '30px',
          height: '30px'
        }}
      />
    );
    
    // Left and right elements based on stereo width
    const stereoWidth = soundstageSettings.stereo_width;
    const leftPos = 50 - (stereoWidth * 30);
    const rightPos = 50 + (stereoWidth * 30);
    
    elements.push(
      <SoundstageElement
        key="left"
        style={{
          left: `${leftPos}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#7c3aed',
          opacity: 0.7
        }}
      />
    );
    
    elements.push(
      <SoundstageElement
        key="right"
        style={{
          left: `${rightPos}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#7c3aed',
          opacity: 0.7
        }}
      />
    );
    
    // Depth elements
    const depth = soundstageSettings.depth_perception;
    const frontPos = 50 - (depth * 20);
    const backPos = 50 + (depth * 20);
    
    elements.push(
      <SoundstageElement
        key="front"
        style={{
          left: '50%',
          top: `${frontPos}%`,
          transform: 'translate(-50%, -50%)',
          background: '#22c55e',
          opacity: 0.6
        }}
      />
    );
    
    elements.push(
      <SoundstageElement
        key="back"
        style={{
          left: '50%',
          top: `${backPos}%`,
          transform: 'translate(-50%, -50%)',
          background: '#22c55e',
          opacity: 0.6
        }}
      />
    );
    
    return elements;
  };

  return (
    <SoundstageContainer>
      {/* Soundstage Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Soundstage Controls</CardTitle>
          <CardIcon>
            <Volume2 size={24} />
          </CardIcon>
        </CardHeader>

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

        <ControlSlider>
          <SliderLabel>
            <SliderName>Stereo Width</SliderName>
            <SliderValue>{(soundstageSettings.stereo_width * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.stereo_width}
            onChange={(e) => handleSettingChange('stereo_width', e.target.value)}
          />
        </ControlSlider>

        <ControlSlider>
          <SliderLabel>
            <SliderName>Center Image Strength</SliderName>
            <SliderValue>{(soundstageSettings.center_image_strength * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.center_image_strength}
            onChange={(e) => handleSettingChange('center_image_strength', e.target.value)}
          />
        </ControlSlider>

        <ControlSlider>
          <SliderLabel>
            <SliderName>Depth Perception</SliderName>
            <SliderValue>{(soundstageSettings.depth_perception * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.depth_perception}
            onChange={(e) => handleSettingChange('depth_perception', e.target.value)}
          />
        </ControlSlider>

        <ControlSlider>
          <SliderLabel>
            <SliderName>Height Perception</SliderName>
            <SliderValue>{(soundstageSettings.height_perception * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.height_perception}
            onChange={(e) => handleSettingChange('height_perception', e.target.value)}
          />
        </ControlSlider>

        <ControlSlider>
          <SliderLabel>
            <SliderName>Left-Right Balance</SliderName>
            <SliderValue>{(soundstageSettings.left_right_balance * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.left_right_balance}
            onChange={(e) => handleSettingChange('left_right_balance', e.target.value)}
          />
        </ControlSlider>

        <ControlSlider>
          <SliderLabel>
            <SliderName>Front-Back Positioning</SliderName>
            <SliderValue>{(soundstageSettings.front_back_positioning * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.front_back_positioning}
            onChange={(e) => handleSettingChange('front_back_positioning', e.target.value)}
          />
        </ControlSlider>

        <ControlSlider>
          <SliderLabel>
            <SliderName>Spatial Coherence</SliderName>
            <SliderValue>{(soundstageSettings.spatial_coherence * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundstageSettings.spatial_coherence}
            onChange={(e) => handleSettingChange('spatial_coherence', e.target.value)}
          />
        </ControlSlider>

        <ControlButton
          active={isSoundstageEnabled}
          onClick={handleToggleSoundstage}
          disabled={!isConnected}
        >
          {isSoundstageEnabled ? <Pause size={20} /> : <Play size={20} />}
          {isSoundstageEnabled ? 'Disable Soundstage' : 'Enable Soundstage'}
        </ControlButton>

        <ControlButton
          onClick={handleSaveProfile}
          disabled={!isConnected}
        >
          <Save size={20} />
          Save Profile
        </ControlButton>

        <ControlButton
          onClick={handleResetSettings}
          disabled={!isConnected}
        >
          <RotateCcw size={20} />
          Reset Settings
        </ControlButton>
      </Card>

      {/* Soundstage Visualizer */}
      <Card>
        <CardHeader>
          <CardTitle>Soundstage Visualizer</CardTitle>
          <CardIcon>
            <Settings size={24} />
          </CardIcon>
        </CardHeader>

        <SoundstageVisualizer>
          {renderSoundstageVisualization()}
        </SoundstageVisualizer>

        <InfoGrid>
          <InfoItem>
            <InfoValue>{(soundstageSettings.stereo_width * 100).toFixed(0)}%</InfoValue>
            <InfoLabel>Stereo Width</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{(soundstageSettings.center_image_strength * 100).toFixed(0)}%</InfoLabel>
            <InfoLabel>Center Image</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{(soundstageSettings.depth_perception * 100).toFixed(0)}%</InfoLabel>
            <InfoLabel>Depth</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{(soundstageSettings.height_perception * 100).toFixed(0)}%</InfoLabel>
            <InfoLabel>Height</InfoLabel>
          </InfoItem>
        </InfoGrid>
      </Card>
    </SoundstageContainer>
  );
}

export default SoundstageControl;
