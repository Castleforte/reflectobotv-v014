let currentAudio: HTMLAudioElement | null = null;
let currentHoverAudio: HTMLAudioElement | null = null;
let greetingAnimationInterval: NodeJS.Timeout | null = null;

export const playExclusiveAudio = (
  src: string, 
  setIsRobotSpeaking?: (speaking: boolean) => void,
  setRobotPose?: (pose: string) => void,
  greetingPoses?: string[],
  idlePose?: string
) => {
  // Stop any hover audio when main robot speech starts
  stopHoverAudio();
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  
  currentAudio = new Audio(src);
  
  // Set robot speaking state when audio starts
  if (setIsRobotSpeaking) {
    setIsRobotSpeaking(true);
  }
  
  // Start greeting animation if poses are provided
  if (setRobotPose && greetingPoses && greetingPoses.length > 0) {
    startGreetingAnimation(setRobotPose, greetingPoses);
  }
  
  // Handle audio end
  currentAudio.onended = () => {
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(false);
    }
    stopGreetingAnimation(setRobotPose, idlePose);
    currentAudio = null;
  };
  
  // Handle audio error
  currentAudio.onerror = () => {
    console.warn('Failed to play audio:', src);
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(false);
    }
    stopGreetingAnimation(setRobotPose, idlePose);
    currentAudio = null;
  };
  
  currentAudio.play().catch(error => {
    console.warn('Failed to play audio:', error);
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(false);
    }
    stopGreetingAnimation(setRobotPose, idlePose);
    currentAudio = null;
  });
};

const startGreetingAnimation = (setRobotPose: (pose: string) => void, greetingPoses: string[]) => {
  console.log('🎭 Starting greeting animation with poses:', greetingPoses);
  
  let currentPoseIndex = 0;
  
  // Set initial pose
  setRobotPose(greetingPoses[currentPoseIndex]);
  
  // Start animation interval - cycle through poses every 500ms
  greetingAnimationInterval = setInterval(() => {
    currentPoseIndex = (currentPoseIndex + 1) % greetingPoses.length;
    setRobotPose(greetingPoses[currentPoseIndex]);
    console.log('🎭 Greeting pose changed to:', greetingPoses[currentPoseIndex].split('/').pop());
  }, 500);
};

const stopGreetingAnimation = (setRobotPose?: (pose: string) => void, idlePose?: string) => {
  console.log('🎭 Stopping greeting animation');
  
  if (greetingAnimationInterval) {
    clearInterval(greetingAnimationInterval);
    greetingAnimationInterval = null;
  }
  
  // Return robot to idle pose
  if (setRobotPose && idlePose) {
    setRobotPose(idlePose);
  }
};

export const stopCurrentAudio = (setIsRobotSpeaking?: (speaking: boolean) => void, setRobotPose?: (pose: string) => void, idlePose?: string) => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Stop greeting animation when audio is stopped
  stopGreetingAnimation(setRobotPose, idlePose);
  
  if (setIsRobotSpeaking) {
    setIsRobotSpeaking(false);
  }
};

export const playHoverAudio = (src: string) => {
  // Immediately stop any currently playing hover audio
  if (currentHoverAudio) {
    currentHoverAudio.pause();
    currentHoverAudio.currentTime = 0;
  }
  
  // Create and play new hover audio
  currentHoverAudio = new Audio(src);
  
  // Clean up when audio ends
  currentHoverAudio.onended = () => {
    currentHoverAudio = null;
  };
  
  // Clean up on error
  currentHoverAudio.onerror = () => {
    console.warn('Failed to play hover audio:', src);
    currentHoverAudio = null;
  };
  
  // Play immediately
  currentHoverAudio.play().catch(error => {
    console.warn('Failed to play hover audio:', error);
    currentHoverAudio = null;
  });
};

export const stopHoverAudio = () => {
  if (currentHoverAudio) {
    currentHoverAudio.pause();
    currentHoverAudio.currentTime = 0;
    currentHoverAudio = null;
  }
};