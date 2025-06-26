import React from 'react';
import { ReflectoBotProgress } from '../types';

interface GoalGetterPageProps {
  progress: ReflectoBotProgress;
  onCollectBadge: () => void;
}

function GoalGetterPage({ progress, onCollectBadge }: GoalGetterPageProps) {
  return (
    <div className="next-challenge-content">
      <div className="next-challenge-header">
        <h1 className="next-challenge-title text-center lg:text-left">Congratulations!</h1>
      </div>

      <div className="challenge-card">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <div className="challenge-content w-full lg:max-w-[400px]">
            <h2 className="challenge-card-title">You're a Goal Getter!</h2>
            
            <p className="challenge-card-description">
              You've earned the Goal Getter badge for completing your first 5 challenges!
              Your determination and focus are truly impressive.
            </p>

            <div className="challenge-progress-indicator">
              <span className="challenge-progress-text">5 Challenges Complete!</span>
            </div>

            <div className="challenge-buttons-container flex justify-center lg:justify-start mt-4">
              <button 
                className="start-challenge-button px-4 py-1 text-base lg:px-8 lg:py-3 lg:text-xl"
                onClick={onCollectBadge}
              >
                Collect Your Badge
              </button>
            </div>
          </div>
          
          {/* Badge - hidden on mobile, visible on desktop */}
          <img 
            src="/badges/GoalGetter.png"
            alt="Goal Getter Badge"
            className="challenge-badge hidden lg:block lg:ml-8"
          />
        </div>
      </div>

      <p className="challenge-helper-text text-center lg:text-left">
        You're officially a Goal Getter! Keep up the amazing work!
      </p>
    </div>
  );
}

export default GoalGetterPage;