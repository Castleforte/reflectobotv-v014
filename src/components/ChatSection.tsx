import React, { useState, useEffect } from 'react';
import { chatPrompts, promptStarters } from '../prompts';
import { ConversationTurn } from '../types';
import { loadProgress, updateProgress } from '../utils/progressManager';
import { apiClient, OpenAIMessage } from '../utils/apiClient';
import { playAudioFromText, stopAudio } from '../utils/audioPlayer';

// Helper function to randomly choose between empathy and celebrate left
const getRandomEmpathyOrCelebrateLeft = (empathyPose: string, celebratePoses: string[]) => {
  return Math.random() < 0.5 ? empathyPose : celebratePoses[0];
};

interface ChatSectionProps {
  onClose: () => void;
  chatMessages: ConversationTurn[];
  setChatMessages: React.Dispatch<React.SetStateAction<ConversationTurn[]>>;
  onShowChatHistory: () => void;
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

function ChatSection({ 
  onClose, 
  chatMessages, 
  setChatMessages, 
  onShowChatHistory, 
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
}: ChatSectionProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isRefreshDisabled, setIsRefreshDisabled] = useState<boolean>(false);
  const [isTypingPoseSet, setIsTypingPoseSet] = useState<boolean>(false);
  
  // New state for API management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string>('');

  // Load chat messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('reflectobot-chat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages)) {
          setChatMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error loading chat messages from localStorage:', error);
      }
    }
  }, [setChatMessages]);

  // Save chat messages to localStorage whenever chatMessages updates
  useEffect(() => {
    localStorage.setItem('reflectobot-chat-messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      stopAudio(setIsRobotSpeaking);
    };
  }, [setIsRobotSpeaking]);

  const handleRefreshPrompt = () => {
    if (isRefreshDisabled) return;

    // Cycle to the next prompt in the array
    setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % chatPrompts.length);
    
    // Enable cooldown
    setIsRefreshDisabled(true);
    
    // Re-enable button after 2 seconds
    setTimeout(() => {
      setIsRefreshDisabled(false);
    }, 2000);

    // Track engagement for Focus Finder
    onEngagement();
  };

  const handlePromptClick = () => {
    // Find the matching starter for the current prompt
    const currentPrompt = chatPrompts[currentPromptIndex];
    const matchingStarter = promptStarters.find(item => item.prompt === currentPrompt);
    
    if (matchingStarter) {
      setChatInputText(matchingStarter.starter);
      
      // Set typing pose when prompt is clicked and text is added
      if (!isTypingPoseSet) {
        setRobotPose(getRandomEmpathyOrCelebrateLeft(robotEmpathyPose, robotCelebratePoses));
        setIsTypingPoseSet(true);
      }
    }

    // Track engagement for Focus Finder
    onEngagement();
  };

  const handleChatHistory = () => {
    onShowChatHistory();
  };

  const isPositiveMessage = (message: string): boolean => {
    const positiveWords = [
      'happy', 'good', 'great', 'awesome', 'amazing', 'wonderful', 'fantastic', 
      'love', 'excited', 'grateful', 'thankful', 'blessed', 'proud', 'confident',
      'hopeful', 'optimistic', 'positive', 'cheerful', 'joyful', 'peaceful',
      'calm', 'relaxed', 'content', 'satisfied', 'accomplished', 'successful'
    ];
    
    const lowerMessage = message.toLowerCase();
    return positiveWords.some(word => lowerMessage.includes(word));
  };

  const buildConversationHistory = (currentMessage: string): OpenAIMessage[] => {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are Reflekto, a friendly, playful robot buddy who helps kids talk about their thoughts and feelings. You speak in a warm, encouraging tone, using fun and simple language. Ask helpful questions, be curious and supportive. You\'re like a big sibling who\'s also a robot!'
      }
    ];

    // Add previous conversation history
    chatMessages.forEach(turn => {
      messages.push({
        role: 'user',
        content: turn.userMessage
      });
      messages.push({
        role: 'assistant',
        content: turn.botResponse
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  };

  const retrySendMessage = async () => {
    if (!lastFailedMessage) return;
    
    setError(null);
    setShowRetryButton(false);
    await sendMessageToGPT(lastFailedMessage);
  };

  const sendMessageToGPT = async (userMessage: string) => {
    setIsLoading(true);
    setError(null);
    setShowRetryButton(false);
    setRobotPose(robotEmpathyPose); // Set thinking pose
    setRobotSpeech("Let me think about that...");

    // Stop any currently playing audio
    stopAudio(setIsRobotSpeaking);

    try {
      const messages = buildConversationHistory(userMessage);
      const botResponse = await apiClient.getChatCompletion(messages);
      
      const now = new Date();
      const timestamp = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create a single conversation turn
      const conversationTurn: ConversationTurn = {
        id: Date.now().toString(),
        promptText: chatPrompts[currentPromptIndex],
        userMessage: userMessage,
        botResponse: botResponse,
        timestamp: timestamp
      };

      // Add the conversation turn to chat history
      setChatMessages(prevMessages => [...prevMessages, conversationTurn]);
      
      // Show GPT response in speech bubble
      setRobotSpeech(botResponse);
      
      // Play the bot response as audio with the selected robot's voice
      playAudioFromText(botResponse, setRobotPose, robotSpeakingPoses, robotIdlePose, setIsRobotSpeaking, selectedRobotId);
      
      // Clear input and reset typing pose
      setChatInputText('');
      setIsTypingPoseSet(false);
      setLastFailedMessage('');

      // Return robot to idle after showing response
      setTimeout(() => {
        setRobotPose(robotIdlePose);
      }, 3000);

    } catch (error) {
      console.error('API Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      setShowRetryButton(true);
      setLastFailedMessage(userMessage);
      
      setRobotSpeech("Oops! I'm having trouble thinking right now. Can you try again?");
      
      // Return robot to idle after error
      setTimeout(() => {
        setRobotPose(robotIdlePose);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = chatInputText.trim();
    if (!trimmedMessage || isLoading) return;

    // Track engagement for Focus Finder
    onEngagement();

    // Load current progress and update it
    const currentProgress = loadProgress();
    const wordCount = trimmedMessage.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`💬 Chat message sent: "${trimmedMessage}"`);
    console.log(`📊 Word count: ${wordCount}`);
    console.log(`🔍 Contains "because": ${trimmedMessage.toLowerCase().includes('because')}`);
    console.log(`🔍 Contains "I realized": ${trimmedMessage.toLowerCase().includes('i realized')}`);
    
    // Prepare progress updates
    let progressUpdates: any = {
      chatMessageCount: currentProgress.chatMessageCount + 1
    };

    // Check for long message (15+ words)
    if (wordCount >= 15) {
      progressUpdates.hasLongMessageSent = true;
      console.log('✅ Long message detected (15+ words)');
    }

    // Check for "because" keyword for Brave Voice badge
    if (trimmedMessage.toLowerCase().includes('because')) {
      console.log('✅ "Because" keyword detected - setting brave voice flag');
      progressUpdates.hasBraveVoiceMessage = true;
    }
    
    // Check for "I realized" keyword for Truth Spotter badge
    if (trimmedMessage.toLowerCase().includes('i realized')) {
      console.log('✅ "I realized" phrase detected - setting truth spotter flag');
      progressUpdates.hasTruthSpotterMessage = true;
    }

    // Check for positive message and Stay Positive challenge
    if (isPositiveMessage(trimmedMessage)) {
      // Check if Stay Positive challenge is active
      if (currentProgress.challengeActive && currentProgress.currentChallengeIndex === 11) { // stay_positive is at index 11
        progressUpdates.stayPositiveMessageCount = currentProgress.stayPositiveMessageCount + 1;
        
        // If this is a long positive message (15+ words), mark it
        if (wordCount >= 15) {
          progressUpdates.hasLongPositiveMessage = true;
          console.log('✅ Long positive message detected');
        }
      }
    }

    // Update progress with all changes
    updateProgress(progressUpdates);

    // Track badge progress
    onBadgeEarned('reflecto_rookie'); // Track message for Reflecto Rookie
    
    // Check for specific badge conditions
    if (wordCount >= 15) {
      console.log('🏆 Triggering deep_thinker badge (15+ words)');
      onBadgeEarned('deep_thinker'); // 15+ words badge
    }
    
    // Check for "because" keyword for Brave Voice badge
    if (trimmedMessage.toLowerCase().includes('because')) {
      console.log('🏆 Triggering brave_voice badge (contains "because")');
      onBadgeEarned('brave_voice'); // Contains "because" badge
    }
    
    if (trimmedMessage.toLowerCase().includes('i realized')) {
      console.log('🏆 Triggering truth_spotter badge (contains "I realized")');
      onBadgeEarned('truth_spotter'); // Contains "I realized" badge
    }

    // Check for Stay Positive badge
    if (isPositiveMessage(trimmedMessage) && currentProgress.challengeActive && currentProgress.currentChallengeIndex === 11) {
      console.log('🏆 Triggering stay_positive badge (positive message)');
      onBadgeEarned('stay_positive');
    }

    // Send message to GPT
    await sendMessageToGPT(trimmedMessage);
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
        handleSendMessage();
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInputText(e.target.value);
    
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
    <div className="chat-section">
      <div className="chat-content">
        <div className="chat-header">
          <h1 className="chat-title">What's On Your Mind?</h1>
          <div className="chat-buttons">
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
            <button className="settings-button chat-action-button" onClick={handleChatHistory}>
              <img src="/Chat-History_Icon.png" alt="Chat History" className="button-icon" />
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold leading-none">Chat</span>
                <span className="text-2xl font-bold leading-none">History</span>
              </div>
            </button>
          </div>
        </div>

        <div className="prompt-display" onClick={handlePromptClick}>
          {chatPrompts[currentPromptIndex]}
        </div>

        {/* Error message display */}
        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
            {showRetryButton && (
              <button 
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                onClick={retrySendMessage}
                disabled={isLoading}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        <div className="chat-input-container">
          <textarea
            className="chat-textarea"
            value={chatInputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Choose an option above or just type what's on your mind here – I'm listening."
            disabled={isLoading}
          />
          
          <button 
            className={`settings-button settings-button-lg chat-send-button ${(isLoading && !isRobotSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={isRobotSpeaking ? handleStopTalking : handleSendMessage}
            disabled={(isLoading && !isRobotSpeaking) || (!isRobotSpeaking && !chatInputText.trim())}
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

export default ChatSection;