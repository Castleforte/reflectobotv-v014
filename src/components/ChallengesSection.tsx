import React, { useState, useEffect } from 'react';
import NextChallengePage from './NextChallengePage';
import ChallengeCompletePage from './ChallengeCompletePage';
import MyBadgesPage from './MyBadgesPage';
import { loadProgress, updateProgress } from '../utils/progressManager';
import { challengeDetails, badgeQueue } from '../badgeData';
import { ReflectoBotProgress } from '../types';

interface ChallengesSectionProps {
  onClose: () => void;
  setRobotSpeech: React.Dispatch<React.SetStateAction<string>>;
  initialSubScreen?: 'next-challenge' | 'my-badges';
  playAudioFromText: (text: string) => Promise<void>;
  challengeStartSpeeches: string[];
}

type ChallengeScreen = 'next-challenge' | 'challenge-complete' | 'my-badges';

function ChallengesSection({ 
  onClose, 
  setRobotSpeech, 
  initialSubScreen = 'next-challenge',
  playAudioFromText,
  challengeStartSpeeches
}: ChallengesSectionProps) {
  const [currentScreen, setCurrentScreen] = useState<ChallengeScreen>(initialSubScreen);
  const [progress, setProgress] = useState<ReflectoBotProgress>(loadProgress());
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<string | null>(null);

  // Listen for changes in initialSubScreen prop and update internal state
  useEffect(() => {
    setCurrentScreen(initialSubScreen);
  }, [initialSubScreen]);

  // Get the current challenge based on progress
  const getCurrentChallenge = () => {
    // Get the badge ID from the queue based on current index
    const currentBadgeId = badgeQueue[progress.currentChallengeIndex];
    if (!currentBadgeId) return null; // All challenges completed
    
    // Find the challenge details for this badge
    return challengeDetails.find(challenge => challenge.badgeId === currentBadgeId);
  };

  const currentChallenge = getCurrentChallenge();

  const handleStartChallenge = () => {
    if (!currentChallenge) return;
    
    // Activate the challenge - stay on the same page
    const updatedProgress = updateProgress({
      challengeActive: true
    });
    setProgress(updatedProgress);
    
    // Update robot speech based on challenge and play audio
    let speech: string;
    switch (currentChallenge.badgeId) {
      case 'calm_creator':
        speech = "Time to get creative! Head to Draw It Out and create a beautiful drawing that shows how you're feeling.";
        break;
      case 'mood_mapper':
        speech = "Time to explore your emotions! Head to Daily Check-In and track how you're feeling today.";
        break;
      case 'creative_spark':
        speech = "Let's get creative! Go to Draw It Out and use lots of colors to express yourself.";
        break;
      case 'deep_thinker':
        speech = "Time for some deep thinking! Go to Chat and share what's really on your mind.";
        break;
      case 'what_if_explorer':
        speech = "Ready to explore your imagination? Check out the What If section and let your creativity soar!";
        break;
      case 'brave_voice':
        speech = "Time to be brave and share your feelings! Use the word 'because' to explain how you're feeling.";
        break;
      case 'boost_buddy':
        speech = "Let's try something fun! Go to What If and use the 'Read It to Me' button to hear a prompt out loud.";
        break;
      case 'reflecto_rookie':
        speech = "Ready to start chatting? Go to Chat and share your thoughts with me. Remember, I need at least 2 messages from you!";
        break;
      case 'focus_finder':
        speech = "Time to focus! Pick any section (Chat, Daily Check-In, What If, or Draw It Out) and stay there for at least 90 seconds while being active. No switching allowed!";
        break;
      case 'stay_positive':
        speech = "Let's spread some positivity! Go to Chat and share at least 15 words about what makes you happy.";
        break;
      default:
        // Use a random encouraging message from the challenge start speeches
        speech = challengeStartSpeeches[Math.floor(Math.random() * challengeStartSpeeches.length)];
        break;
    }
    
    setRobotSpeech(speech);
    playAudioFromText(speech);
  };

  const handleNextChallenge = () => {
    setCurrentScreen('next-challenge');
    setNewlyEarnedBadge(null);
    setRobotSpeech("Ready for a new challenge? Put on your thinking cap and give this one a try!");
  };

  const handleMyBadges = () => {
    setCurrentScreen('my-badges');
    setRobotSpeech(`Wow! You've already earned ${progress.badgeCount} badges! Just ${18 - progress.badgeCount} more to unlock the full set. Keep going!`);
  };

  const handleBackToNextChallenge = () => {
    setCurrentScreen('next-challenge');
    setRobotSpeech("Ready for a new challenge? Put on your thinking cap and give this one a try!");
  };

  // If all challenges are completed, show completion message
  if (!currentChallenge) {
    return (
      <div className="challenges-section">
        <div className="next-challenge-content">
          <div className="next-challenge-header">
            <h1 className="next-challenge-title text-center lg:text-left">All Challenges Complete!</h1>
            <button 
              className="my-badges-button"
              onClick={handleMyBadges}
            >
              <img src="/My_Badges_Button_Icon.png" alt="My Badges" className="button-icon" />
              <span className="font-bold leading-none">My Badges</span>
            </button>
          </div>
          
          <div className="challenge-card">
            <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
              <div className="challenge-content w-full lg:max-w-[400px]">
                <h2 className="challenge-card-title">Congratulations!</h2>
                <p className="challenge-card-description">
                  You've completed all available challenges! You're a true ReflectoBot champion.
                  Keep exploring and growing with your AI buddy!
                </p>
                <div className="challenge-buttons-container flex justify-center lg:justify-start mt-4">
                  <button 
                    className="start-challenge-button px-4 py-1 text-base lg:px-8 lg:py-3 lg:text-xl"
                    onClick={handleMyBadges}
                  >
                    View All Badges
                  </button>
                </div>
              </div>
              {/* Badge - hidden on mobile, visible on desktop */}
              <img 
                src="/badges/SuperStar.png" 
                alt="Super Star Badge"
                className="challenge-badge hidden lg:block lg:ml-8"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="challenges-section">
      {/* Regular next challenge page */}
      {currentScreen === 'next-challenge' && (
        <NextChallengePage
          challenge={currentChallenge}
          onStartChallenge={handleStartChallenge}
          onMyBadges={handleMyBadges}
          progress={progress}
        />
      )}
      
      {currentScreen === 'challenge-complete' && newlyEarnedBadge && (
        <ChallengeCompletePage
          badgeId={newlyEarnedBadge}
          progress={progress}
          onNextChallenge={handleNextChallenge}
          onMyBadges={handleMyBadges}
        />
      )}
      
      {currentScreen === 'my-badges' && (
        <MyBadgesPage
          progress={progress}
          onNextChallenge={handleBackToNextChallenge}
        />
      )}
    </div>
  );
}

export default ChallengesSection;