import React, { useState, useEffect } from 'react';
import { whatIfPrompts } from '../whatIfPrompts';
import { updateProgress, loadProgress } from '../utils/progressManager';
import { apiClient, OpenAIMessage } from '../utils/apiClient';
import { playAudioFromText, stopAudio, isAudioPlaying } from '../utils/audioPlayer';

// Helper function to randomly choose between empathy and celebrate left
const getRandomEmpathyOrCelebrateLeft = (empathyPose: string, celebratePoses: string[]) => {
  return Math.random() < 0.5 ? empathyPose : celebratePoses[0];
};

interface WhatIfSectionProps {
  onClose: () => void;
  setRobotSpeech: React.Dispatch<React.SetStateAction<string>>;
  setRobotPose: React.Dispatch<React.SetStateAction<string>>;
  onBadgeEarned: (badgeId: string) => void;
  onEngagement: () => void;
  stopAudio: () => void;
  robotIdlePose: string;
  robotEmpathyPose: string;
  robotCelebratePoses: string[];
  robotSpeakingPoses: string[];
  isRobotSpeaking: boolean;
  setIsRobotSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRobotId: string;
}

interface WhatIfResponse {
  prompt: string;
  response: string;
  timestamp: string;
}

function WhatIfSection({ 
  onClose, 
  setRobotSpeech, 
  setRobotPose, 
  onBadgeEarned, 
  onEngagement, 
  stopAudio: stopAudioProp,
  robotIdlePose,
  robotEmpathyPose,
  robotCelebratePoses,
  robotSpeakingPoses,
  isRobotSpeaking,
  setIsRobotSpeaking,
  selectedRobotId
}: WhatIfSectionProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState<boolean>(false);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [whatIfText, setWhatIfText] = useState<string>('');
  const [isTypingPoseSet, setIsTypingPoseSet] = useState<boolean>(false);
  const [whatIfHistory, setWhatIfHistory] = useState<WhatIfResponse[]>([]);
  
  // New state for API management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  const [lastFailedResponse, setLastFailedResponse] = useState<string>('');

  // Load What If history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('reflectobot-whatif-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setWhatIfHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error loading What If history from localStorage:', error);
      }
    }
  }, []);

  // Save What If history to localStorage whenever it updates
  useEffect(() => {
    localStorage.setItem('reflectobot-whatif-history', JSON.stringify(whatIfHistory));
  }, [whatIfHistory]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      stopAudio(setIsRobotSpeaking);
    };
  }, [setIsRobotSpeaking]);

  const handleRefreshPrompt = () => {
    if (isRefreshDisabled) return;

    // Cycle to the next prompt in the array
    setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % whatIfPrompts.length);
    
    // Enable cooldown
    setIsRefreshDisabled(true);
    
    // Re-enable button after 2 seconds
    setTimeout(() => {
      setIsRefreshDisabled(false);
    }, 2000);

    // Track engagement for Focus Finder
    onEngagement();

    // Track viewing prompts (separate from answering)
    const currentProgress = loadProgress();
    updateProgress({ 
      whatIfPromptViews: currentProgress.whatIfPromptViews + 1 
    });
  };

  const handleReadItToMe = async () => {
    // Stop any currently playing audio first
    stopAudio(setIsRobotSpeaking);
    
    if (isReading) {
      // If currently reading, stop
      setIsReading(false);
      setRobotPose(robotIdlePose);
      setRobotSpeech("Time to let your imagination soar! I've got some wild What If questions that'll get your creative wheels turning. Ready to think outside the box?");
      return;
    }
    
    // Start reading
    setIsReading(true);
    setRobotPose(robotCelebratePoses[0]);
    setRobotSpeech("Listen up! I'm reading your What If prompt out loud. Let your imagination run wild!");

    // Track engagement for Focus Finder
    onEngagement();

    // Update progress for boost_buddy badge
    const currentProgress = loadProgress();
    updateProgress({ 
      readItToMeUsed: currentProgress.readItToMeUsed + 1 
    });

    // Track badge progress for using Read It to Me
    onBadgeEarned('boost_buddy');

    try {
      // Play the current prompt as audio with the selected robot's voice
      await playAudioFromText(whatIfPrompts[currentPromptIndex], setRobotPose, robotSpeakingPoses, robotIdlePose, setIsRobotSpeaking, selectedRobotId);
      
      // Set reading to false when audio finishes
      setIsReading(false);
      setRobotPose(robotIdlePose);
      setRobotSpeech("What do you think? Let your creativity flow!");
    } catch (error) {
      console.error('Error playing audio:', error);
      // Fallback: simulate reading duration
      setTimeout(() => {
        setIsReading(false);
        setRobotPose(robotIdlePose);
        setRobotSpeech("What do you think? Let your creativity flow!");
      }, 3000);
    }
  };

  const buildWhatIfConversationHistory = (prompt: string, response: string): OpenAIMessage[] => {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are Reflekto, an imaginative, playful robot who loves asking kids fun \'What if...?\' questions to spark creativity. You\'re silly, curious, and full of fun ideas — like a robot storyteller and best friend rolled into one!'
      }
    ];

    // Add previous What If history for context (last 2 entries)
    const recentHistory = whatIfHistory.slice(-2);
    recentHistory.forEach(entry => {
      messages.push({
        role: 'user',
        content: `What if prompt: "${entry.prompt}" My answer: ${entry.response}`
      });
      messages.push({
        role: 'assistant',
        content: `What an amazing and creative answer! Your imagination is incredible!`
      });
    });

    // Add current What If response
    messages.push({
      role: 'user',
      content: `What if prompt: "${prompt}" My answer: ${response}`
    });

    return messages;
  };

  const retryResponse = async () => {
    if (!lastFailedResponse) return;
    
    setError(null);
    setShowRetryButton(false);
    await sendResponseToGPT(lastFailedResponse);
  };

  const sendResponseToGPT = async (userResponse: string) => {
    setIsLoading(true);
    setError(null);
    setShowRetryButton(false);
    setRobotPose(robotEmpathyPose);
    setRobotSpeech("Wow! Let me think about your creative answer...");

    // Stop any currently playing audio
    stopAudio(setIsRobotSpeaking);

    try {
      const currentPrompt = whatIfPrompts[currentPromptIndex];
      const messages = buildWhatIfConversationHistory(currentPrompt, userResponse);
      const botResponse = await apiClient.getWhatIfCompletion(messages);
      
      const now = new Date();
      const timestamp = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Save the What If response to history
      const newWhatIfEntry: WhatIfResponse = {
        prompt: currentPrompt,
        response: userResponse,
        timestamp: timestamp
      };

      setWhatIfHistory(prevHistory => [...prevHistory, newWhatIfEntry]);

      // Show GPT response in speech bubble
      setRobotSpeech(botResponse);
      
      // Play the bot response as audio with the selected robot's voice
      playAudioFromText(botResponse, setRobotPose, robotSpeakingPoses, robotIdlePose, setIsRobotSpeaking, selectedRobotId);
      
      // Clear the input and reset typing pose
      setWhatIfText('');
      setIsTypingPoseSet(false);
      setLastFailedResponse('');

      // Return robot to idle after showing response
      setTimeout(() => {
        setRobotPose(robotIdlePose);
      }, 4000);

    } catch (error) {
      console.error('API Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      setShowRetryButton(true);
      setLastFailedResponse(userResponse);
      
      setRobotSpeech("Oops! I'm having trouble processing your creative answer right now. Can you try again?");
      
      // Return robot to idle after error
      setTimeout(() => {
        setRobotPose(robotIdlePose);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResponse = async () => {
    const trimmedText = whatIfText.trim();
    if (!trimmedText || isLoading) return;

    // Update progress to track answered prompts
    const currentProgress = loadProgress();
    updateProgress({ 
      whatIfPromptsAnswered: currentProgress.whatIfPromptsAnswered + 1 
    });

    // Track engagement for Focus Finder
    onEngagement();

    // Track badge progress for answering What If prompts
    onBadgeEarned('what_if_explorer');
    
    // Send to GPT for intelligent response
    await sendResponseToGPT(trimmedText);
  };

  const handleStopTalking = () => {
    stopAudio(setIsRobotSpeaking);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default new line behavior
      if (isRobotSpeaking) {
        handleStopTalking();
      } else {
        handleSendResponse();
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWhatIfText(e.target.value);
    
    // Handle sticky typing pose
    if (e.target.value.length > 0 && !isTypingPoseSet) {
      // Set random pose when user starts typing
      setRobotPose(getRandomEmpathyOrCelebrateLeft(robotEmpathyPose, robotCelebratePoses));
      setIsTypingPoseSet(true);
    } else if (e.target.value.length === 0 && isTypingPoseSet) {
      // Return to idle when input is cleared
      setRobotPose(robotIdlePose);
      setIsTypingPoseSet(false);
    }
    
    // Track engagement for Focus Finder
    onEngagement();
  };

  return (
    <div className="what-if-section">
      <div className="what-if-content">
        <div className="what-if-header">
          <h1 className="what-if-title">Today's What If...?</h1>
          <div className="what-if-buttons">
            <button 
              className={`settings-button chat-action-button ${isRefreshDisabled ? 'disabled' : ''}`}
              onClick={handleRefreshPrompt}
              disabled={isRefreshDisabled}
            >
              <img src="/Refresh_Icon.png" alt="Prompt Refresh" className="button-icon" />
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold leading-none">Prompt</span>
                <span className="text-2xl font-bold leading-none">Refresh</span>
              </div>
            </button>
            <button 
              className={`settings-button chat-action-button ${isReading ? 'reading-active' : ''}`}
              onClick={handleReadItToMe}
              disabled={isLoading}
            >
              <img src="/Speaker-icon.png" alt="Read It to Me" className="button-icon" />
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold leading-none">
                  {isReading ? 'Stop' : 'Read It'}
                </span>
                <span className="text-2xl font-bold leading-none">
                  {isReading ? 'Reading' : 'to Me'}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className={`what-if-prompt-display ${isReading ? 'reading-animation' : ''}`}>
          {whatIfPrompts[currentPromptIndex]}
        </div>

        {/* Error message display */}
        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
            {showRetryButton && (
              <button 
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                onClick={retryResponse}
                disabled={isLoading}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        <div className="what-if-input-container">
          <textarea
            className="what-if-textarea"
            value={whatIfText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Let your imagination run wild! Write your creative answer here..."
            disabled={isLoading}
          />
          
          <button 
            className={`settings-button settings-button-lg what-if-send-button ${(isLoading && !isRobotSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={isRobotSpeaking ? handleStopTalking : handleSendResponse}
            disabled={(isLoading && !isRobotSpeaking) || (!isRobotSpeaking && !whatIfText.trim())}
          >
            {isRobotSpeaking ? (
              'Stop Talking'
            ) : isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Thinking...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhatIfSection;