import React from 'react';
import { ReflectoBotProgress } from '../types';

interface SuperStarPageProps {
  progress: ReflectoBotProgress;
  onCollectBadge: () => void;
}

function SuperStarPage({ progress, onCollectBadge }: SuperStarPageProps) {
  return (
    <div className="next-challenge-content">
      <div className="next-challenge-header">
        <h1 className="next-challenge-title text-center lg:text-left">🎉 You're a Super Star!</h1>
      </div>

      <div className="challenge-card">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <div className="challenge-content w-full lg:max-w-[400px]">
            <h2 className="challenge-card-title">Incredible Achievement!</h2>
            
            <p className="challenge-card-description">
              You've completed every single challenge and earned all 17 badges! 
              That's absolutely amazing! ReflectoBot is so proud of you - you've shown incredible 
              dedication, creativity, and heart throughout this entire journey.
            </p>

            <div className="challenge-progress-indicator">
              <span className="challenge-progress-text">All 18 Badges Collected!</span>
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
            src="/badges/SuperStar.png"
            alt="Super Star Badge"
            className="challenge-badge hidden lg:block lg:ml-8"
          />
        </div>
      </div>

      <p className="challenge-helper-text text-center lg:text-left">
        You're officially a Super Star! What an amazing accomplishment!
      </p>
    </div>
  );
}

export default SuperStarPage;