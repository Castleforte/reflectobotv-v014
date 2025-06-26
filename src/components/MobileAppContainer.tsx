import React from 'react';
import MobileNavButtons from './MobileNavButtons';
import SettingsSection from './SettingsSection';
import ChatSection from './ChatSection';
import DailyCheckInSection from './DailyCheckInSection';
import WhatIfSection from './WhatIfSection';
import DrawItOutSection from './DrawItOutSection';
import ChallengesSection from './ChallengesSection';
import ChallengeCompletePage from './ChallengeCompletePage';
import GoalGetterPage from './GoalGetterPage';
import SuperStarPage from './SuperStarPage';
import MyBotSection from './MyBotSection';
import GrownUpAccessModal from './GrownUpAccessModal';
import ChatHistoryModal from './ChatHistoryModal';
import MoodHistoryModal from './MoodHistoryModal';
import { ConversationTurn, MoodEntry, ReflectoBotProgress } from '../types';
import { RobotCharacter } from '../robotData';

interface MobileAppContainerProps {
  currentScreen: 'welcome' | 'settings' | 'chat' | 'daily-checkin' | 'what-if' | 'draw-it-out' | 'challenges' | 'challenge-complete' | 'goal-getter' | 'super-star' | 'my-bot';
  challengesSubScreen: 'next-challenge' | 'my-badges';
  showGrownUpModal: boolean;
  showChatHistoryModal: boolean;
  showMoodHistoryModal: boolean;
  chatMessages: ConversationTurn[];
  moodHistory: MoodEntry[];
  progress: ReflectoBotProgress;
  newlyEarnedBadge: string | null;
  selectedRobotId: string;
  robotCharacterData: RobotCharacter;
  robotSpeech: string;
  robotPose: string;
  imagesLoaded: boolean;
  isRobotSpeaking: boolean;
  ROBOT_IDLE: string;
  ROBOT_BLINK: string;
  ROBOT_EMPATHY: string;
  ROBOT_CELEBRATE_LEFT: string;
  ROBOT_CELEBRATE_RIGHT: string;
  ROBOT_CELEBRATE_BOTH: string;
  ROBOT_TALK: string;
  ROBOT_THUMBS_UP: string;
  ROBOT_SPEAKING_POSES: string[];
  CHALLENGE_START_SPEECHES: string[];
  BADGE_AWARD_SPEECHES: string[];
  handleLogoClick: () => void;
  handleNavButtonClick: (screen: 'welcome' | 'settings' | 'chat' | 'daily-checkin' | 'what-if' | 'draw-it-out' | 'challenges' | 'my-bot') => void;
  handleNextChallengeFromApp: () => void;
  handleMyBadgesFromApp: () => void;
  handleGoalGetterCollect: () => void;
  handleSuperStarCollect: () => void;
  handleSectionClose: (sectionName: string) => void;
  setShowGrownUpModal: React.Dispatch<React.SetStateAction<boolean>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ConversationTurn[]>>;
  setMoodHistory: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  setShowChatHistoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMoodHistoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  setRobotSpeech: React.Dispatch<React.SetStateAction<string>>;
  setRobotPose: React.Dispatch<React.SetStateAction<string>>;
  setIsRobotSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  onBadgeEarned: (badgeId: string) => void;
  onEngagement: () => void;
  stopAudio: () => void;
  handleSelectRobot: (robotId: string) => Promise<void>;
  handleModalClose: (modalType: 'chat' | 'mood') => void;
  playAudioFromText: (text: string) => Promise<void>;
}

function MobileAppContainer({
  currentScreen,
  challengesSubScreen,
  showGrownUpModal,
  showChatHistoryModal,
  showMoodHistoryModal,
  chatMessages,
  moodHistory,
  progress,
  newlyEarnedBadge,
  selectedRobotId,
  robotCharacterData,
  robotSpeech,
  robotPose,
  imagesLoaded,
  isRobotSpeaking,
  ROBOT_IDLE,
  ROBOT_BLINK,
  ROBOT_EMPATHY,
  ROBOT_CELEBRATE_LEFT,
  ROBOT_CELEBRATE_RIGHT,
  ROBOT_CELEBRATE_BOTH,
  ROBOT_TALK,
  ROBOT_THUMBS_UP,
  ROBOT_SPEAKING_POSES,
  CHALLENGE_START_SPEECHES,
  BADGE_AWARD_SPEECHES,
  handleLogoClick,
  handleNavButtonClick,
  handleNextChallengeFromApp,
  handleMyBadgesFromApp,
  handleGoalGetterCollect,
  handleSuperStarCollect,
  handleSectionClose,
  setShowGrownUpModal,
  setChatMessages,
  setMoodHistory,
  setShowChatHistoryModal,
  setShowMoodHistoryModal,
  setRobotSpeech,
  setRobotPose,
  setIsRobotSpeaking,
  onBadgeEarned,
  onEngagement,
  stopAudio,
  handleSelectRobot,
  handleModalClose,
  playAudioFromText
}: MobileAppContainerProps) {
  return (
    <div className="outer-container">
      <div className="app-wrapper">
        <div className="top-sections-container">
          {/* Mobile Logo */}
          <div className="flex justify-center items-center py-4 lg:hidden">
            <button 
              onClick={handleLogoClick}
              className="logo-button relative z-50"
            >
              <img 
                src="/ReflectoBot_Logo_lrg_cutout_8bit.png"
                alt="ReflectoBot Logo"
                className="w-4/5 h-auto"
              />
            </button>
          </div>

          {/* Robot and Speech Section */}
          <div className="robot-section">
            <div className="robot-frame-container">
              <img 
                src="/Robot_window_bubble copy.png"
                alt="Speech Bubble Frame" 
                className="frame-background"
              />
              <div className="speech-bubble">
                <p className="speech-text">
                  {robotSpeech}
                </p>
              </div>
              {/* Show loading state or robot image based on loading status */}
              {!imagesLoaded ? (
                <div 
                  className="robot-character flex items-center justify-center"
                  style={{
                    transform: 'translateX(-50%) scale(1.3)',
                    transformOrigin: 'bottom center',
                    position: 'absolute',
                    left: '50%',
                    bottom: '10px',
                    width: '200px',
                    height: '200px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    border: '2px dashed rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                    Loading...
                  </span>
                </div>
              ) : (
                <img 
                  src={robotPose}
                  alt="Robot Character" 
                  className="robot-character"
                  style={{
                    transform: 'translateX(-50%) scale(1.3)',
                    transformOrigin: 'bottom center',
                    position: 'absolute',
                    left: '50%',
                    bottom: '10px'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        {currentScreen === 'settings' ? (
          <SettingsSection 
            onClose={() => handleSectionClose('settings')} 
            onShowGrownUpModal={() => setShowGrownUpModal(true)}
          />
        ) : currentScreen === 'chat' ? (
          <ChatSection 
            onClose={() => handleSectionClose('chat')}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            onShowChatHistory={() => setShowChatHistoryModal(true)}
            setRobotSpeech={setRobotSpeech}
            setRobotPose={imagesLoaded ? setRobotPose : () => {}}
            onBadgeEarned={onBadgeEarned}
            onEngagement={onEngagement}
            stopAudio={stopAudio}
            robotIdlePose={ROBOT_IDLE}
            robotEmpathyPose={ROBOT_EMPATHY}
            robotCelebratePoses={[ROBOT_CELEBRATE_LEFT, ROBOT_CELEBRATE_RIGHT]}
            robotSpeakingPoses={ROBOT_SPEAKING_POSES}
            isRobotSpeaking={isRobotSpeaking}
            setIsRobotSpeaking={setIsRobotSpeaking}
            selectedRobotId={selectedRobotId}
          />
        ) : currentScreen === 'daily-checkin' ? (
          <DailyCheckInSection 
            onClose={() => handleSectionClose('daily-checkin')}
            setRobotSpeech={setRobotSpeech}
            setRobotPose={imagesLoaded ? setRobotPose : () => {}}
            moodHistory={moodHistory}
            setMoodHistory={setMoodHistory}
            onShowMoodHistory={() => setShowMoodHistoryModal(true)}
            onBadgeEarned={onBadgeEarned}
            onEngagement={onEngagement}
            stopAudio={stopAudio}
            robotIdlePose={ROBOT_IDLE}
            robotEmpathyPose={ROBOT_EMPATHY}
            robotCelebratePoses={[ROBOT_CELEBRATE_LEFT, ROBOT_CELEBRATE_RIGHT]}
            robotSpeakingPoses={ROBOT_SPEAKING_POSES}
            isRobotSpeaking={isRobotSpeaking}
            setIsRobotSpeaking={setIsRobotSpeaking}
            selectedRobotId={selectedRobotId}
          />
        ) : currentScreen === 'what-if' ? (
          <WhatIfSection 
            onClose={() => handleSectionClose('what-if')}
            setRobotSpeech={setRobotSpeech}
            setRobotPose={imagesLoaded ? setRobotPose : () => {}}
            onBadgeEarned={onBadgeEarned}
            onEngagement={onEngagement}
            stopAudio={stopAudio}
            robotIdlePose={ROBOT_IDLE}
            robotEmpathyPose={ROBOT_EMPATHY}
            robotCelebratePoses={[ROBOT_CELEBRATE_LEFT, ROBOT_CELEBRATE_RIGHT]}
            robotSpeakingPoses={ROBOT_SPEAKING_POSES}
            isRobotSpeaking={isRobotSpeaking}
            setIsRobotSpeaking={setIsRobotSpeaking}
            selectedRobotId={selectedRobotId}
          />
        ) : currentScreen === 'draw-it-out' ? (
          <DrawItOutSection 
            onClose={() => handleSectionClose('draw-it-out')}
            setRobotSpeech={setRobotSpeech}
            setRobotPose={imagesLoaded ? setRobotPose : () => {}}
            onBadgeEarned={onBadgeEarned}
            onEngagement={onEngagement}
            robotIdlePose={ROBOT_IDLE}
            robotEmpathyPose={ROBOT_EMPATHY}
            robotCelebratePoses={[ROBOT_CELEBRATE_LEFT, ROBOT_CELEBRATE_RIGHT]}
          />
        ) : currentScreen === 'challenges' ? (
          <ChallengesSection 
            onClose={() => handleSectionClose('challenges')}
            setRobotSpeech={setRobotSpeech}
            initialSubScreen={challengesSubScreen}
            playAudioFromText={playAudioFromText}
            challengeStartSpeeches={CHALLENGE_START_SPEECHES}
          />
        ) : currentScreen === 'my-bot' ? (
          <MyBotSection
            onClose={() => handleSectionClose('my-bot')}
            selectedRobotId={selectedRobotId}
            onSelectRobot={handleSelectRobot}
            isRobotSpeaking={isRobotSpeaking}
            setIsRobotSpeaking={setIsRobotSpeaking}
          />
        ) : currentScreen === 'challenge-complete' && newlyEarnedBadge ? (
          <ChallengeCompletePage
            badgeId={newlyEarnedBadge}
            progress={progress}
            onNextChallenge={handleNextChallengeFromApp}
            onMyBadges={handleMyBadgesFromApp}
          />
        ) : currentScreen === 'goal-getter' ? (
          <GoalGetterPage
            progress={progress}
            onCollectBadge={handleGoalGetterCollect}
          />
        ) : currentScreen === 'super-star' ? (
          <SuperStarPage
            progress={progress}
            onCollectBadge={handleSuperStarCollect}
          />
        ) : (
          <div className="info-section">
            <div className="info-content">
              <h1 className="welcome-title">
                Welcome to ReflectoBot!
              </h1>
              <p className="welcome-subtitle">
                <span className="font-black">R</span>eflecting{' '}
                <span className="font-black">E</span>motions{' '}
                <span className="font-black">F</span>or{' '}
                <span className="font-black">L</span>earning,{' '}
                <span className="font-black">E</span>mpathy,{' '}
                <span className="font-black">C</span>reativity,{' '}
                <span className="font-black">T</span>hought &{' '}
                <span className="font-black">O</span>ptimism
              </p>
              <p className="text-2xl font-semibold mb-6 text-white tracking-wide md:text-3xl md:mb-8">Here's what you can do:</p>
              <ul className="features-list">
                <li className="feature-item">
                  <img src="/Chat-icon.png" alt="Chat" className="feature-icon" />
                  Chat with Reflekto anytime
                </li>
                <li className="feature-item">
                  <img src="/Mood-icon.png" alt="Daily Check-In" className="feature-icon" />
                  Check-In and share how you feel
                </li>
                <li className="feature-item">
                  <img src="/Pencil-icon.png" alt="What If...?" className="feature-icon" />
                  Answer fun What If...? questions
                </li>
                <li className="feature-item">
                  <img src="/Palette-icon.png" alt="Draw It Out" className="feature-icon" />
                  Draw It Out and express your emotions
                </li>
                <li className="feature-item">
                  <img src="/Trophy-icon.png" alt="Challenges" className="feature-icon" />
                  Complete Challenges to earn cool badges
                </li>
                <li className="feature-item">
                  <img src="/Robot-icon.png" alt="My Bot" className="feature-icon" />
                  Pick your favorite Bot Buddy to join your journey
                </li>
                <li className="feature-item">
                  <img src="/Save-icon.png" alt="Save" className="feature-icon" />
                  Save your session and return anytime!
                </li>
              </ul>
              <div className="settings-hint">
                <span className="text-[#a4f61e]">Want to save or change things? Tap the logo anytime for settings!</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Buttons */}
        <MobileNavButtons onNavButtonClick={handleNavButtonClick} currentScreen={currentScreen} />
      </div>

      {/* Modals */}
      {showGrownUpModal && (
        <GrownUpAccessModal 
          onClose={() => setShowGrownUpModal(false)} 
          onBadgeEarned={onBadgeEarned}
        />
      )}

      {showChatHistoryModal && (
        <ChatHistoryModal 
          onClose={() => handleModalClose('chat')} 
          chatHistory={chatMessages}
          onBadgeEarned={onBadgeEarned}
        />
      )}

      {showMoodHistoryModal && (
        <MoodHistoryModal 
          onClose={() => handleModalClose('mood')} 
          moodHistory={moodHistory}
          onBadgeEarned={onBadgeEarned}
        />
      )}
    </div>
  );
}

export default MobileAppContainer;