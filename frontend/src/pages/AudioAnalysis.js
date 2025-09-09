import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAudio } from '../context/AudioContext';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  BarChart3, 
  Upload, 
  Play, 
  Pause, 
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AnalysisContainer = styled.div`
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

const UploadArea = styled.div`
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
  
  &:hover {
    border-color: #4f46e5;
    background: rgba(79, 70, 229, 0.1);
  }
`;

const UploadIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(79, 70, 229, 0.2);
  border-radius: 50%;
  margin: 0 auto 1rem;
  color: #4f46e5;
`;

const UploadText = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const UploadSubtext = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
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

const AnalysisResults = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`;

const ResultValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.color || 'white'};
`;

const ChartContainer = styled.div`
  height: 300px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 1rem 0;
`;

const RecommendationsList = styled.div`
  margin-top: 1rem;
`;

const RecommendationItem = styled.div`
  background: ${props => 
    props.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' :
    props.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' :
    'rgba(34, 197, 94, 0.2)'
  };
  border: 1px solid ${props => 
    props.priority === 'high' ? 'rgba(239, 68, 68, 0.3)' :
    props.priority === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
    'rgba(34, 197, 94, 0.3)'
  };
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const RecommendationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => 
    props.priority === 'high' ? '#ef4444' :
    props.priority === 'medium' ? '#f59e0b' :
    '#22c55e'
  };
  color: white;
  flex-shrink: 0;
`;

const RecommendationContent = styled.div`
  flex: 1;
`;

const RecommendationTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: white;
`;

const RecommendationMessage = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
`;

const RecommendationAction = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

function AudioAnalysis() {
  const { 
    isConnected, 
    isAnalyzing, 
    analysisResults,
    startAnalysis,
    stopAnalysis,
    resetAudioState
  } = useAudio();
  
  const { sendAudioData } = useWebSocket();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisType, setAnalysisType] = useState('full_acoustic');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      toast.success(`File uploaded: ${file.name}`);
    }
  };

  const handleStartAnalysis = async () => {
    if (!isConnected) {
      toast.error('Not connected to server');
      return;
    }

    setIsProcessing(true);
    startAnalysis();
    
    try {
      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Analysis completed');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopAnalysis = () => {
    stopAnalysis();
    setIsProcessing(false);
    toast.success('Analysis stopped');
  };

  const handleReset = () => {
    resetAudioState();
    setUploadedFile(null);
    setIsProcessing(false);
    toast.success('Analysis reset');
  };

  const handleDownloadResults = () => {
    if (analysisResults) {
      const dataStr = JSON.stringify(analysisResults, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `analysis_results_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Results downloaded');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return 'white';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle size={16} />;
      case 'medium': return <AlertCircle size={16} />;
      case 'low': return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <AnalysisContainer>
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Analysis</CardTitle>
          <CardIcon>
            <BarChart3 size={24} />
          </CardIcon>
        </CardHeader>

        <UploadArea onClick={() => document.getElementById('file-upload').click()}>
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <UploadIcon>
            <Upload size={32} />
          </UploadIcon>
          <UploadText>
            {uploadedFile ? uploadedFile.name : 'Click to upload audio file'}
          </UploadText>
          <UploadSubtext>
            Supports WAV, MP3, FLAC, AAC, OGG, M4A
          </UploadSubtext>
        </UploadArea>

        <ControlButton
          active={isAnalyzing}
          onClick={isAnalyzing ? handleStopAnalysis : handleStartAnalysis}
          disabled={!isConnected || isProcessing}
        >
          {isAnalyzing ? <Pause size={20} /> : <Play size={20} />}
          {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
        </ControlButton>

        <ControlButton
          onClick={handleReset}
          disabled={!isConnected}
        >
          <RotateCcw size={20} />
          Reset Analysis
        </ControlButton>

        {analysisResults && (
          <ControlButton
            onClick={handleDownloadResults}
          >
            <Download size={20} />
            Download Results
          </ControlButton>
        )}
      </Card>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardIcon>
            <BarChart3 size={24} />
          </CardIcon>
        </CardHeader>

        {analysisResults ? (
          <AnalysisResults>
            <ResultItem>
              <ResultLabel>Frequency Response</ResultLabel>
              <ResultValue color="#4f46e5">Analyzed</ResultValue>
            </ResultItem>
            <ResultItem>
              <ResultLabel>Resonance Frequencies</ResultLabel>
              <ResultValue color="#4f46e5">
                {analysisResults.acoustic_profile?.resonance_frequencies?.length || 0} detected
              </ResultValue>
            </ResultItem>
            <ResultItem>
              <ResultLabel>Reverb Time</ResultLabel>
              <ResultValue color="#4f46e5">
                {analysisResults.acoustic_profile?.reverb_time?.toFixed(2) || '0.00'}s
              </ResultValue>
            </ResultItem>
            <ResultItem>
              <ResultLabel>Clarity Index</ResultLabel>
              <ResultValue color="#4f46e5">
                {analysisResults.acoustic_profile?.clarity_index?.toFixed(2) || '0.00'}
              </ResultValue>
            </ResultItem>
            <ResultItem>
              <ResultLabel>Stereo Width</ResultLabel>
              <ResultValue color="#4f46e5">
                {(analysisResults.acoustic_profile?.stereo_width * 100 || 0).toFixed(0)}%
              </ResultValue>
            </ResultItem>
            <ResultItem>
              <ResultLabel>Phase Coherence</ResultLabel>
              <ResultValue color="#4f46e5">
                {(analysisResults.acoustic_profile?.phase_coherence * 100 || 0).toFixed(0)}%
              </ResultValue>
            </ResultItem>
          </AnalysisResults>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '2rem' }}>
            No analysis results available
          </div>
        )}

        <ChartContainer>
          {analysisResults ? (
            <div>Frequency response chart would appear here</div>
          ) : (
            <div>Start analysis to see frequency response chart</div>
          )}
        </ChartContainer>
      </Card>

      {/* Recommendations */}
      {analysisResults?.recommendations && (
        <Card style={{ gridColumn: 'span 2' }}>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardIcon>
              <AlertCircle size={24} />
            </CardIcon>
          </CardHeader>
          <RecommendationsList>
            {analysisResults.recommendations.map((rec, index) => (
              <RecommendationItem key={index} priority={rec.priority}>
                <RecommendationIcon priority={rec.priority}>
                  {getPriorityIcon(rec.priority)}
                </RecommendationIcon>
                <RecommendationContent>
                  <RecommendationTitle>
                    {rec.type.replace('_', ' ').toUpperCase()}
                  </RecommendationTitle>
                  <RecommendationMessage>
                    {rec.message}
                  </RecommendationMessage>
                  <RecommendationAction>
                    Action: {rec.action.replace('_', ' ')}
                  </RecommendationAction>
                </RecommendationContent>
              </RecommendationItem>
            ))}
          </RecommendationsList>
        </Card>
      )}
    </AnalysisContainer>
  );
}

export default AudioAnalysis;
