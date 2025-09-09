import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download,
  Upload,
  User,
  Volume2,
  Sliders
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SettingsContainer = styled.div`
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

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: rgba(255, 255, 255, 0.15);
  }
  
  option {
    background: #1f2937;
    color: white;
  }
`;

const SliderContainer = styled.div`
  margin-bottom: 1rem;
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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #4f46e5;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
`;

const ControlButton = styled.button`
  background: ${props => props.primary ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.primary ? '#4f46e5' : 'rgba(255, 255, 255, 0.2)'};
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
    background: ${props => props.primary ? '#4338ca' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
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

const HiddenFileInput = styled.input`
  display: none;
`;

function ProfileSettings() {
  const { 
    isConnected, 
    userPreferences,
    updateUserPreferences,
    resetAudioState
  } = useAudio();
  
  const { setPreferences } = useWebSocket();

  const [preferences, setPreferencesState] = useState({
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
  });

  const [profileName, setProfileName] = useState('My Profile');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setPreferencesState(userPreferences);
  }, [userPreferences]);

  const handlePreferenceChange = (key, value) => {
    setPreferencesState(prev => ({
      ...prev,
      [key]: value
    }));
    setIsDirty(true);
  };

  const handleSavePreferences = () => {
    updateUserPreferences(preferences);
    setPreferences(preferences);
    setIsDirty(false);
    toast.success('Preferences saved');
  };

  const handleResetPreferences = () => {
    const defaultPreferences = {
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
    };
    
    setPreferencesState(defaultPreferences);
    setIsDirty(true);
    toast.success('Preferences reset to defaults');
  };

  const handleExportProfile = () => {
    const profileData = {
      name: profileName,
      preferences: preferences,
      exported_at: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `acousticar_profile_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Profile exported');
  };

  const handleImportProfile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const profileData = JSON.parse(e.target.result);
          if (profileData.preferences) {
            setPreferencesState(profileData.preferences);
            if (profileData.name) {
              setProfileName(profileData.name);
            }
            setIsDirty(true);
            toast.success('Profile imported');
          } else {
            toast.error('Invalid profile file');
          }
        } catch (error) {
          toast.error('Error reading profile file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetAll = () => {
    resetAudioState();
    handleResetPreferences();
    setProfileName('My Profile');
    setIsDirty(false);
    toast.success('All settings reset');
  };

  return (
    <SettingsContainer>
      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardIcon>
            <User size={24} />
          </CardIcon>
        </CardHeader>

        <FormGroup>
          <Label>Profile Name</Label>
          <Input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter profile name"
          />
        </FormGroup>

        <FormGroup>
          <Label>Music Genre</Label>
          <Select
            value={preferences.music_genre}
            onChange={(e) => handlePreferenceChange('music_genre', e.target.value)}
          >
            <option value="general">General</option>
            <option value="rock">Rock</option>
            <option value="classical">Classical</option>
            <option value="jazz">Jazz</option>
            <option value="electronic">Electronic</option>
            <option value="pop">Pop</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Listening Environment</Label>
          <Select
            value={preferences.listening_environment}
            onChange={(e) => handlePreferenceChange('listening_environment', e.target.value)}
          >
            <option value="car">Car</option>
            <option value="home">Home</option>
            <option value="studio">Studio</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Speaker Count</Label>
          <Select
            value={preferences.speaker_count}
            onChange={(e) => handlePreferenceChange('speaker_count', parseInt(e.target.value))}
          >
            <option value={2}>2 (Stereo)</option>
            <option value={4}>4 (Quad)</option>
            <option value={6}>6 (5.1)</option>
            <option value={8}>8 (7.1)</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Cabin Size</Label>
          <Select
            value={preferences.cabin_size}
            onChange={(e) => handlePreferenceChange('cabin_size', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </Select>
        </FormGroup>

        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={preferences.subwoofer_present}
            onChange={(e) => handlePreferenceChange('subwoofer_present', e.target.checked)}
          />
          <CheckboxLabel>Subwoofer Present</CheckboxLabel>
        </CheckboxContainer>

        <FormGroup>
          <Label>Amplifier Power (Watts)</Label>
          <Input
            type="number"
            value={preferences.amplifier_power}
            onChange={(e) => handlePreferenceChange('amplifier_power', parseInt(e.target.value))}
            min="10"
            max="1000"
          />
        </FormGroup>
      </Card>

      {/* Audio Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Preferences</CardTitle>
          <CardIcon>
            <Volume2 size={24} />
          </CardIcon>
        </CardHeader>

        <SliderContainer>
          <SliderLabel>
            <SliderName>Bass Preference</SliderName>
            <SliderValue>{(preferences.bass_preference * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={preferences.bass_preference}
            onChange={(e) => handlePreferenceChange('bass_preference', parseFloat(e.target.value))}
          />
        </SliderContainer>

        <SliderContainer>
          <SliderLabel>
            <SliderName>Treble Preference</SliderName>
            <SliderValue>{(preferences.treble_preference * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={preferences.treble_preference}
            onChange={(e) => handlePreferenceChange('treble_preference', parseFloat(e.target.value))}
          />
        </SliderContainer>

        <SliderContainer>
          <SliderLabel>
            <SliderName>Vocal Clarity</SliderName>
            <SliderValue>{(preferences.vocal_clarity * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={preferences.vocal_clarity}
            onChange={(e) => handlePreferenceChange('vocal_clarity', parseFloat(e.target.value))}
          />
        </SliderContainer>

        <SliderContainer>
          <SliderLabel>
            <SliderName>Soundstage Width</SliderName>
            <SliderValue>{(preferences.soundstage_width * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={preferences.soundstage_width}
            onChange={(e) => handlePreferenceChange('soundstage_width', parseFloat(e.target.value))}
          />
        </SliderContainer>

        <SliderContainer>
          <SliderLabel>
            <SliderName>Height Preference</SliderName>
            <SliderValue>{(preferences.height_preference * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={preferences.height_preference}
            onChange={(e) => handlePreferenceChange('height_preference', parseFloat(e.target.value))}
          />
        </SliderContainer>

        <SliderContainer>
          <SliderLabel>
            <SliderName>Depth Preference</SliderName>
            <SliderValue>{(preferences.depth_preference * 100).toFixed(0)}%</SliderValue>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={preferences.depth_preference}
            onChange={(e) => handlePreferenceChange('depth_preference', parseFloat(e.target.value))}
          />
        </SliderContainer>
      </Card>

      {/* Profile Management */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
          <CardIcon>
            <Settings size={24} />
          </CardIcon>
        </CardHeader>

        <ControlButton
          primary
          onClick={handleSavePreferences}
          disabled={!isConnected || !isDirty}
        >
          <Save size={20} />
          Save Preferences
        </ControlButton>

        <ControlButton
          onClick={handleResetPreferences}
          disabled={!isConnected}
        >
          <RotateCcw size={20} />
          Reset to Defaults
        </ControlButton>

        <ButtonGrid>
          <ControlButton
            onClick={handleExportProfile}
            disabled={!isConnected}
          >
            <Download size={20} />
            Export
          </ControlButton>

          <ControlButton
            onClick={() => document.getElementById('import-profile').click()}
            disabled={!isConnected}
          >
            <Upload size={20} />
            Import
          </ControlButton>
        </ButtonGrid>

        <HiddenFileInput
          id="import-profile"
          type="file"
          accept=".json"
          onChange={handleImportProfile}
        />

        <ControlButton
          onClick={handleResetAll}
          disabled={!isConnected}
        >
          <RotateCcw size={20} />
          Reset All Settings
        </ControlButton>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardIcon>
            <Sliders size={24} />
          </CardIcon>
        </CardHeader>

        <InfoGrid>
          <InfoItem>
            <InfoValue>{isConnected ? 'Connected' : 'Disconnected'}</InfoValue>
            <InfoLabel>Server Status</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>v1.0.0</InfoValue>
            <InfoLabel>App Version</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{preferences.speaker_count}</InfoValue>
            <InfoLabel>Speakers</InfoLabel>
          </InfoItem>
          <InfoItem>
            <InfoValue>{preferences.amplifier_power}W</InfoValue>
            <InfoLabel>Amplifier</InfoLabel>
          </InfoItem>
        </InfoGrid>
      </Card>
    </SettingsContainer>
  );
}

export default ProfileSettings;
