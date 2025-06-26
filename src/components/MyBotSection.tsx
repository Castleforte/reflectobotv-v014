import React, { useState } from 'react';
import { allRobots } from '../robotData';
import { playExclusiveAudio, stopCurrentAudio, playHoverAudio, stopHoverAudio } from '../utils/audioManager';

interface MyBotSectionProps {
  onClose: () => void;
  selectedRobotId: string;
  onSelectRobot: (robotId: string) => void;
  isRobotSpeaking: boolean;
  setIsRobotSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
}

function MyBotSection({ onClose, selectedRobotId, onSelectRobot, isRobotSpeaking, setIsRobotSpeaking }: MyBotSectionProps) {
  const [hoveredRobotId, setHoveredRobotId] = useState<string | null>(null);

  const handleRobotSelect = (robotId: string) => {
    // Prevent selection if robot is currently speaking
    if (isRobotSpeaking) {
      return;
    }
    
    // Stop any hover audio when selecting a robot
    stopHoverAudio();
    onSelectRobot(robotId);
  };

  const handleMouseEnter = (robot: any) => {
    // Don't allow hover effects when robot is speaking
    if (isRobotSpeaking) {
      return;
    }
    
    setHoveredRobotId(robot.id);
    
    // Only play name audio if the main robot is NOT speaking
    if (robot.nameAudio) {
      playHoverAudio(robot.nameAudio);
    }
  };

  const handleMouseLeave = () => {
    // Don't clear hover state when robot is speaking to maintain visual consistency
    if (isRobotSpeaking) {
      return;
    }
    
    setHoveredRobotId(null);
    // Stop hover audio when mouse leaves
    stopHoverAudio();
  };

  return (
    <div className="info-section">
      <div className="info-content">
        {/* Header with title and subtitle - stacked on small screens, side-by-side on large */}
        <div className="flex flex-col items-center mb-4 px-4 sm:px-8 lg:flex-row lg:justify-between">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent leading-tight text-center">
            My Bot
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent tracking-wide text-center">
            Choose Your Bot Buddy
          </p>
        </div>

        {/* Inner rectangle under titles - expanded width on small screens */}
        <div
          className="rounded-2xl shadow-lg mx-1 sm:mx-2 lg:mx-4 min-h-[450px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[300px]"
          style={{
            backgroundColor: '#15192d',
          }}
        >
          <div className="h-full flex items-center justify-center p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 sm:gap-y-6 sm:gap-x-10 md:gap-y-2 md:gap-x-8 max-w-4xl mx-auto">
              {allRobots.map((robot) => (
                <div key={robot.id} className="flex flex-col items-center">
                  <button
                    onClick={() => handleRobotSelect(robot.id)}
                    onMouseEnter={() => handleMouseEnter(robot)}
                    onMouseLeave={handleMouseLeave}
                    disabled={isRobotSpeaking}
                    className={`transition-transform duration-200 p-2 ${
                      isRobotSpeaking 
                        ? (robot.id === selectedRobotId 
                            ? 'cursor-not-allowed' 
                            : 'opacity-50 cursor-not-allowed')
                        : 'hover:scale-105 cursor-pointer'
                    }`}
                  >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 flex items-center justify-center">
                      <img
                        src={
                          selectedRobotId === robot.id || hoveredRobotId === robot.id
                            ? robot.iconSelected
                            : robot.iconDefault
                        }
                        alt={robot.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyBotSection;