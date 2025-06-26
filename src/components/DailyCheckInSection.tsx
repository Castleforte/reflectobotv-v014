import React, { useState, useEffect } from 'react';
import { moodData, moodResponses, sentenceStarters } from '../moodData';
import { MoodEntry } from '../types';
import { updateProgress, loadProgress } from '../utils/progressManager';
import { apiClient, OpenAIMessage } from '../utils/apiClient';
import { playAudioFromText, stopAudio } from '../utils/audioPlayer';

// Helper function to randomly choose between empathy and celebrate left
const getRandomEmpathyOrCelebrateLeft = (empathyPose: string, celebratePoses: string[]) => {
  return Math.random() < 0.5 ? empathyPose : celebratePoses[0];
};

interface DailyCheckInSectionProps {
  onClose: () => void;
  setRobotSpeech: React.Dispatch<React.SetStateAction<string>>;
  setRobotPose: React.Dispatch<React.SetStateAction<string>>;
  moodHistory: MoodEntry[];
  setMoodHistory: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  onShowMoodHistory: () => void;
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

function DailyCheckInSection({ 
  onClose, 
  setRobotSpeech, 
  setRobotPose, 
  moodHistory, 
  setMoodHistory, 
  onShowMoodHistory, 
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
}: DailyCheckInSectionProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [checkInText, setCheckInText] = useState<string>('');
  const [hasUserTyped, setHasUserTyped] = useState<boolean>(false);
  const [isTypingPoseSet, setIsTypingPoseSet] = useState<boolean>(false);
  
  // New state for API management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  const [lastFailedEntry, setLastFailedEntry] = useState<{mood: string | null, text: string} | null>(null);

  // Load mood history from localStorage on component mount
  useEffect(() => {
    const savedMoodHistory = localStorage.getItem('reflectobot-mood-history');
    if (savedMoodHistory) {
      try {
        const parsedHistory = JSON.parse(savedMoodHistory);
        if (Array.isArray(parsedHistory)) {
          // Handle legacy mood entries that don't have botResponse
          const updatedHistory = parsedHistory.map(entry => ({
            ...entry,
            botResponse: entry.botResponse || "Thanks for sharing! Let's talk more about that..."
          }));
          setMoodHistory(updatedHistory);
        }
      } catch (error) {
        console.error('Error loading mood history from localStorage:', error);
      }
    }
  }, [setMoodHistory]);

  // Save mood history to localStorage whenever moodHistory updates
  useEffect(() => {
    localStorage.setItem('reflectobot-mood-history', JSON.stringify(moodHistory));
  }, [moodHistory]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      stopAudio(setIsRobotSpeaking);
    };
  }, [setIsRobotSpeaking]);

  const handleMoodSelect = (moodName: string) => {
    setSelectedMood(moodName);
    
    // Stop any currently playing audio before setting new speech
    stopAudio(setIsRobotSpeaking);
    
    setRobotSpeech(moodResponses[moodName]);
    
    // Set robot pose based on mood selection
    if (moodName === 'happy' || moodName === 'cool' || moodName === 'love') {
      setRobotPose(robotCelebratePoses[1] || robotCelebratePoses[0]);
    } else {
      setRobotPose(robotEmpathyPose);
    }
    
    // Only auto-fill if user hasn't typed anything yet
    if (!hasUserTyped) {
      setCheckInText(sentenceStarters[moodName]);
      // Set typing pose when text is auto-filled
      if (!isTypingPoseSet) {
        setRobotPose(getRandomEmpathyOrCelebrateLeft(robotEmpathyPose, robotCelebratePoses));
        setIsTypingPoseSet(true);
      }
    }

    // Track engagement for Focus Finder
    onEngagement();

    // Return robot to idle after showing appropriate response
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 2000);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCheckInText(e.target.value);
    setHasUserTyped(true);

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

  const buildMoodConversationHistory = (moodName: string, checkInText: string): OpenAIMessage[] => {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are Reflekto, a caring and cheerful robot friend who helps kids check in on their feelings. You use kind, positive language and make kids feel safe and supported. Keep it simple and warm, like a robot who gives great hugs.'
      }
    ];

    // Add previous mood history for context (last 3 entries)
    const recentHistory = moodHistory.slice(-3);
    recentHistory.forEach(entry => {
      messages.push({
        role: 'user',
        content: `I was feeling ${entry.moodName}: ${entry.checkInText}`
      });
      messages.push({
        role: 'assistant',
        content: entry.botResponse || 'Thank you for sharing how you were feeling. Your emotions are important and I\'m here to listen.'
      });
    });

    // Add current mood check-in
    messages.push({
      role: 'user',
      content: `I'm feeling ${moodName}: ${checkInText}`
    });

    return messages;
  };

  const retryCheckIn = async () => {
    if (!lastFailedEntry) return;
    
    setError(null);
    setShowRetryButton(false);
    await sendCheckInToGPT(lastFailedEntry.mood, lastFailedEntry.text);
  };

  const sendCheckInToGPT = async (moodName: string | null, checkInText: string) => {
    setIsLoading(true);
    setError(null);
    setShowRetryButton(false);
    setRobotPose(robotEmpathyPose);
    setRobotSpeech("Thank you for sharing. Let me think about that...");

    // Stop any currently playing audio
    stopAudio(setIsRobotSpeaking);

    try {
      const messages = buildMoodConversationHistory(moodName || 'neutral', checkInText);
      const botResponse = await apiClient.getMoodCompletion(messages);
      
      const now = new Date();
      const timestamp = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newEntry: MoodEntry = {
        moodName: moodName || 'neutral',
        checkInText: checkInText.trim() || 'No additional notes',
        botResponse: botResponse,
        timestamp: timestamp
      };

      // Add the new entry to mood history
      setMoodHistory(prevHistory => [...prevHistory, newEntry]);

      // Show GPT response in speech bubble
      setRobotSpeech(botResponse);
      
      // Play the bot response as audio with the selected robot's voice
      playAudioFromText(botResponse, setRobotPose, robotSpeakingPoses, robotIdlePose, setIsRobotSpeaking, selectedRobotId);
      
      // Reset form and typing pose
      setSelectedMood(null);
      setCheckInText('');
      setHasUserTyped(false);
      setIsTypingPoseSet(false);
      setLastFailedEntry(null);

      // Return robot to idle after showing response
      setTimeout(() => {
        setRobotPose(robotIdlePose);
      }, 4000);

    } catch (error) {
      console.error('API Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      setShowRetryButton(true);
      setLastFailedEntry({ mood: moodName, text: checkInText });
      
      setRobotSpeech("Oops! I'm having trouble processing your feelings right now. Can you try again?");
      
      // Return robot to idle after error
      setTimeout(() => {
        setRobotPose(robotIdlePose);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCheckIn = async () => {
    if ((!selectedMood && !checkInText.trim()) || isLoading) return;

    // Track engagement for Focus Finder
    onEngagement();

    // Check word count for Mood Mapper badge
    const trimmedText = checkInText.trim();
    const wordCount = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`📝 Mood check-in submitted: "${trimmedText}"`);
    console.log(`📊 Word count: ${wordCount}`);

    // Update progress for mood_mapper badge IMMEDIATELY after submission
    const currentProgress = loadProgress();
    console.log('🧠 Mood Check-In Count BEFORE:', currentProgress.moodCheckInCount);
    
    updateProgress({ 
      moodCheckInCount: currentProgress.moodCheckInCount + 1 
    });
    
    const updatedProgress = loadProgress();
    console.log('🧠 Mood Check-In Count AFTER:', updatedProgress.moodCheckInCount);
    console.log('🟢 Mood Mapper badge earned?', updatedProgress.badges['mood_mapper']);

    // Check for mood_mapper badge if word count is 25+
    if (wordCount >= 25) {
      console.log('✅ Mood Mapper condition met (25+ words)');
      onBadgeEarned('mood_mapper');
    }

    // Check for specific mood badges
    if (selectedMood === 'happy') {
      // For Stay Positive badge, check if the message is 15+ words about happiness
      if (wordCount >= 15) {
        // Update progress for stay_positive badge
        updateProgress({ 
          stayPositiveMessageCount: updatedProgress.stayPositiveMessageCount + 1,
          hasLongPositiveMessage: true
        });
        onBadgeEarned('stay_positive');
      }
    }
    
    if (selectedMood === 'love') {
      // For Kind Heart badge, check if the message contains love-related content and is 25+ words
      
      // Check if the message contains love-related keywords
      const loveKeywords = ['love', 'adore', 'cherish', 'treasure', 'appreciate', 'care', 'heart', 'affection', 'dear', 'precious'];
      const containsLoveContent = loveKeywords.some(keyword => 
        trimmedText.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (containsLoveContent && wordCount >= 25) {
        // Update progress with the word count
        updateProgress({ 
          kindHeartWordCount: Math.max(updatedProgress.kindHeartWordCount, wordCount)
        });
        
        onBadgeEarned('kind_heart'); // Love emoji + 25+ words about love
      }
    }

    // Send to GPT for intelligent response
    await sendCheckInToGPT(selectedMood, trimmedText || 'No additional notes');
  };

  const handleStopTalking = () => {
    stopAudio(setIsRobotSpeaking);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isRobotSpeaking) {
        handleStopTalking();
      } else {
        handleSendCheckIn();
      }
    }
  };

  const handleMoodHistory = () => {
    onShowMoodHistory();
  };

  const getEmojiImage = (mood: any) => {
    // Show color image if selected or hovered
    if (selectedMood === mood.name || hoveredMood === mood.name) {
      return mood.colorImage;
    }
    return mood.blueImage;
  };

  return (
    <div className="daily-checkin-section">
      <div className="daily-checkin-content">
        <div className="daily-checkin-header">
          <h1 className="daily-checkin-title">How Do You Feel Today?</h1>
          <div className="daily-checkin-buttons">
            <button 
              className="settings-button chat-action-button"
              onClick={handleMoodHistory}
            >
              <img src="/Mood-icon.png" alt="Mood History" className="button-icon" />
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold leading-none">Mood</span>
                <span className="text-2xl font-bold leading-none">History</span>
              </div>
            </button>
          </div>
        </div>

        <div className="emoji-grid">
          {moodData.map((mood) => (
            <button
              key={mood.name}
              className={`emoji-button ${selectedMood === mood.name ? 'emoji-selected' : ''}`}
              onClick={() => handleMoodSelect(mood.name)}
              onMouseEnter={() => setHoveredMood(mood.name)}
              onMouseLeave={() => setHoveredMood(null)}
              aria-label={`Select ${mood.name} mood`}
            >
              <img 
                src={getEmojiImage(mood)}
                alt={mood.name}
                className="emoji-image"
              />
            </button>
          ))}
        </div>

        {/* Error message display */}
        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
            {showRetryButton && (
              <button 
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                onClick={retryCheckIn}
                disabled={isLoading}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        <div className="daily-checkin-input-container">
          <textarea
            className="daily-checkin-textarea"
            value={checkInText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Choose an emoji or write how you're feeling here..."
            disabled={isLoading}
          />
          
          <button 
            className={`settings-button settings-button-lg daily-checkin-send-button ${(isLoading && !isRobotSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={isRobotSpeaking ? handleStopTalking : handleSendCheckIn}
            disabled={(isLoading && !isRobotSpeaking)}
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

export default DailyCheckInSection;