import React, { useRef } from 'react';
import { Challenge, ReflectoBotProgress } from '../types';
import { exportProgress, importProgress } from '../utils/progressManager';

interface NextChallengePageProps {
  challenge: Challenge;
  onStartChallenge: () => void;
  onMyBadges: () => void;
  progress: ReflectoBotProgress;
}

function NextChallengePage({ 
  challenge, 
  onStartChallenge, 
  onMyBadges, 
  progress
}: NextChallengePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remainingBadges = 18 - progress.badgeCount;
  const isActive = progress.challengeActive;

  const handleSaveProgress = () => {
    exportProgress();
  };

  const handleLoadProgress = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importProgress(file);
      } catch (error) {
        console.error('Error importing progress:', error);
        alert('Error loading progress file. Please check the file and try again.');
      }
    }
  };

  return (
    <div className="next-challenge-content">
      <div className="next-challenge-header">
        <h1 className="next-challenge-title">
          {isActive ? 'Current Challenge' : 'Next Challenge'}
        </h1>
        <button 
          className="my-badges-button"
          onClick={onMyBadges}
        >
          <img src="/My_Badges_Button_Icon.png" alt="My Badges" className="button-icon w-12 h-12 lg:w-auto lg:h-auto" />
          <span className="font-bold leading-none text-3xl lg:text-base">My Badges</span>
        </button>
      </div>

      <div className="challenge-card">
        {/* Challenge content - centered on mobile, side-by-side on desktop */}
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <div className="challenge-content w-full lg:max-w-[400px]">
            <h2 className="challenge-card-title lg:text-4xl lg:leading-tight lg:whitespace-nowrap">{challenge.title}</h2>
            
            <p className="challenge-card-description">
              {challenge.description}
            </p>

            <div className="challenge-progress-indicator">
              <span className="challenge-progress-text">Just {remainingBadges} More To Go</span>
            </div>

            <div className="challenge-buttons-container flex justify-center lg:justify-start mt-4">
              {isActive ? (
                <div className="challenge-started-indicator">
                  Challenge Started — Good Luck!
                </div>
              ) : (
                <button 
                  className="start-challenge-button px-4 py-1 text-base lg:px-7 lg:py-3 lg:text-xl"
                  style={{ width: '85%' }}
                  onClick={onStartChallenge}
                >
                  Start Challenge
                </button>
              )}
            </div>
          </div>
          
          {/* Badge - hidden on mobile, visible on desktop */}
          <img 
            src={`/badges/${challenge.badgeId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}.png`}
            alt={`${challenge.title} Badge`}
            className="challenge-badge hidden lg:block lg:ml-8"
          />
        </div>
      </div>

      <p className="challenge-helper-text text-center lg:text-left">
        Your badges save automatically. You can also save or load progress from the Settings page.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default NextChallengePage;