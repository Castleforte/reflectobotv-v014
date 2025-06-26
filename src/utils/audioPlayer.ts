import { robotVoiceMap } from '../robotData';

let currentAudio: HTMLAudioElement | null = null;
let currentMediaSource: MediaSource | null = null;
let currentSourceBuffer: SourceBuffer | null = null;
let isStreamingActive = false;
let robotAnimationInterval: NodeJS.Timeout | null = null;
let robotAnimationDelayTimeout: NodeJS.Timeout | null = null;

export const playAudioFromText = async (
  text: string,
  setRobotPose?: (pose: string) => void,
  speakingPoses?: string[],
  idlePose?: string,
  setIsRobotSpeaking?: (speaking: boolean) => void,
  selectedRobotId?: string
): Promise<void> => {
  try {
    // Stop any currently playing audio
    stopAudio(setIsRobotSpeaking);

    console.log('🔊 Generating audio for text:', text.substring(0, 50) + '...');
    console.log('🤖 Using robot:', selectedRobotId);

    // Set robot speaking state
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(true);
    }

    // Start robot speaking animation with 1-second delay if parameters provided
    if (setRobotPose && speakingPoses && idlePose) {
      robotAnimationDelayTimeout = setTimeout(() => {
        startRobotSpeakingAnimation(setRobotPose, speakingPoses, idlePose);
      }, 1000);
    }

    // Get the voice ID for the selected robot, fallback to default if not found
    const voiceId = selectedRobotId ? robotVoiceMap[selectedRobotId] : robotVoiceMap['reflekto'];
    console.log('🎤 Using voice ID:', voiceId);

    // Call the ElevenLabs Edge Function with the selected voice ID
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text,
        voice_id: voiceId
      }),
    });

    // Handle 404 specifically - audio service unavailable
    if (response.status === 404) {
      console.warn('⚠️ Audio service unavailable: ElevenLabs Edge Function not found (404). The audio feature may not be properly deployed.');
      // Stop robot animation and reset speaking state
      stopAudioPlayerAnimations(setRobotPose, idlePose);
      if (setIsRobotSpeaking) {
        setIsRobotSpeaking(false);
      }
      return; // Gracefully exit without throwing an error
    }

    if (!response.ok || !response.body) {
      throw new Error(`Audio generation failed with status ${response.status} or no body.`);
    }

    // Check if the response is JSON (error response) instead of audio
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Parse the JSON error response
      const errorData = await response.json();
      const errorMessage = errorData.error || errorData.message || 'Unknown error from audio service';
      throw new Error(`Audio generation failed: ${errorMessage}`);
    }

    // Check if MediaSource is supported for streaming
    if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg')) {
      await playStreamingAudio(response, setRobotPose, idlePose, setIsRobotSpeaking);
    } else {
      // Fallback to blob method for unsupported browsers
      await playBlobAudio(response, setRobotPose, idlePose, setIsRobotSpeaking);
    }

  } catch (error) {
    console.error('Error playing audio from text:', error);
    // Stop robot animation on error
    stopAudioPlayerAnimations(setRobotPose, idlePose);
    // Reset speaking state on error
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(false);
    }
    // Silently fail - don't disrupt the user experience if voice fails
  }
};

const startRobotSpeakingAnimation = (
  setRobotPose: (pose: string) => void,
  speakingPoses: string[],
  idlePose: string
): void => {
  console.log('🤖 Starting robot speaking animation');
  
  // Set initial speaking pose
  const randomPose = speakingPoses[Math.floor(Math.random() * speakingPoses.length)];
  setRobotPose(randomPose);

  // Start animation interval - change pose every 200ms for fast mouth movement
  robotAnimationInterval = setInterval(() => {
    const randomPose = speakingPoses[Math.floor(Math.random() * speakingPoses.length)];
    setRobotPose(randomPose);
    console.log('🤖 Robot pose changed to:', randomPose.split('/').pop());
  }, 200); // Change pose every 200ms for rapid mouth movement
};

const stopAudioPlayerAnimations = (
  setRobotPose?: (pose: string) => void,
  idlePose?: string
): void => {
  console.log('🤖 Stopping audio player animations');
  
  // Clear animation delay timeout
  if (robotAnimationDelayTimeout) {
    clearTimeout(robotAnimationDelayTimeout);
    robotAnimationDelayTimeout = null;
  }
  
  // Clear animation interval
  if (robotAnimationInterval) {
    clearInterval(robotAnimationInterval);
    robotAnimationInterval = null;
  }

  // Return robot to idle pose if parameters provided
  if (setRobotPose && idlePose) {
    setRobotPose(idlePose);
  }
};

const createAudioError = (audioElement: HTMLAudioElement, context: string): Error => {
  let errorMessage = `Audio ${context} failed`;
  
  if (audioElement.error) {
    const mediaError = audioElement.error;
    const errorCodes = {
      1: 'MEDIA_ERR_ABORTED - The user aborted the audio',
      2: 'MEDIA_ERR_NETWORK - A network error occurred',
      3: 'MEDIA_ERR_DECODE - An error occurred while decoding the audio',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The audio format is not supported'
    };
    
    const codeDescription = errorCodes[mediaError.code as keyof typeof errorCodes] || `Unknown error code: ${mediaError.code}`;
    errorMessage = `Audio ${context} failed: ${codeDescription}`;
    
    if (mediaError.message) {
      errorMessage += ` - ${mediaError.message}`;
    }
  }
  
  return new Error(errorMessage);
};

const playStreamingAudio = async (
  response: Response, 
  setRobotPose?: (pose: string) => void,
  idlePose?: string,
  setIsRobotSpeaking?: (speaking: boolean) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const mediaSource = new MediaSource();
    currentMediaSource = mediaSource;
    const audioURL = URL.createObjectURL(mediaSource);
    currentAudio = new Audio(audioURL);
    isStreamingActive = true;

    // Set up event listeners for the Audio element
    currentAudio.onended = () => {
      cleanup();
      stopAudioPlayerAnimations(setRobotPose, idlePose);
      if (setIsRobotSpeaking) {
        setIsRobotSpeaking(false);
      }
      console.log('🔊 Audio playback ended');
      resolve();
    };

    currentAudio.onerror = () => {
      const error = createAudioError(currentAudio!, 'playback (streaming)');
      console.error('Audio playback error:', error);
      cleanup();
      stopAudioPlayerAnimations(setRobotPose, idlePose);
      if (setIsRobotSpeaking) {
        setIsRobotSpeaking(false);
      }
      reject(error);
    };

    const cleanup = () => {
      isStreamingActive = false;
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      currentAudio = null;
      currentMediaSource = null;
      currentSourceBuffer = null;
    };

    mediaSource.addEventListener('sourceopen', async () => {
      if (!isStreamingActive) {
        cleanup();
        return;
      }

      try {
        // Try different MIME types based on what ElevenLabs typically returns
        let mimeType = 'audio/mpeg'; // Default for MP3
        
        // Check the response content-type header
        const contentType = response.headers.get('content-type');
        if (contentType) {
          if (contentType.includes('webm')) {
            mimeType = 'audio/webm; codecs="opus"';
          } else if (contentType.includes('mp4')) {
            mimeType = 'audio/mp4; codecs="mp4a.40.2"';
          } else if (contentType.includes('mpeg') || contentType.includes('mp3')) {
            mimeType = 'audio/mpeg';
          }
        }

        // Verify the MIME type is supported
        if (!MediaSource.isTypeSupported(mimeType)) {
          console.warn(`MIME type ${mimeType} not supported, falling back to blob method`);
          cleanup();
          // Fall back to blob method
          const audioBlob = await response.blob();
          await playBlobAudioDirect(audioBlob, setRobotPose, idlePose, setIsRobotSpeaking);
          resolve();
          return;
        }

        const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        currentSourceBuffer = sourceBuffer;
        
        // Add error handler for SourceBuffer
        sourceBuffer.onerror = (error) => {
          console.error('SourceBuffer error:', error);
          if (mediaSource.readyState === 'open') {
            mediaSource.endOfStream('decode');
          }
          cleanup();
          stopAudioPlayerAnimations(setRobotPose, idlePose);
          if (setIsRobotSpeaking) {
            setIsRobotSpeaking(false);
          }
          reject(new Error('SourceBuffer error occurred during audio streaming'));
        };

        const reader = response.body!.getReader();
        let hasStartedPlaying = false;
        let chunks: Uint8Array[] = [];

        // Use async/await loop instead of recursive function
        const processStream = async () => {
          try {
            while (isStreamingActive) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('🔊 Stream reading completed');
                // Append any remaining chunks
                if (chunks.length > 0 && isStreamingActive) {
                  await appendChunks();
                }
                
                if (mediaSource.readyState === 'open') {
                  mediaSource.endOfStream();
                }
                break;
              }

              if (!isStreamingActive) {
                break;
              }

              // Collect chunks
              chunks.push(value);

              // Start playing after we have some data
              if (!hasStartedPlaying && chunks.length >= 2) {
                hasStartedPlaying = true;
                await appendChunks();
                
                try {
                  await currentAudio!.play();
                  console.log('🔊 Audio playback started (streaming)');
                } catch (playError) {
                  console.error('Error starting audio playback:', playError);
                }
              } else if (hasStartedPlaying && chunks.length >= 3) {
                // Append chunks periodically to keep the buffer filled
                await appendChunks();
              }
            }
          } catch (error) {
            console.error('Error processing stream:', error);
            if (mediaSource.readyState === 'open') {
              mediaSource.endOfStream('decode');
            }
            cleanup();
            stopAudioPlayerAnimations(setRobotPose, idlePose);
            if (setIsRobotSpeaking) {
              setIsRobotSpeaking(false);
            }
            reject(error);
          }
        };

        const appendChunks = async () => {
          if (!isStreamingActive || !currentSourceBuffer || chunks.length === 0) {
            return;
          }

          // Wait for source buffer to be ready
          while (currentSourceBuffer.updating && isStreamingActive) {
            await new Promise(resolve => {
              const handler = () => {
                currentSourceBuffer!.removeEventListener('updateend', handler);
                resolve(void 0);
              };
              currentSourceBuffer!.addEventListener('updateend', handler);
            });
          }

          if (!isStreamingActive || !currentSourceBuffer) {
            return;
          }

          try {
            // Combine chunks into a single buffer
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedBuffer = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
              combinedBuffer.set(chunk, offset);
              offset += chunk.length;
            }

            // Clear chunks array
            chunks = [];

            // Append to source buffer
            currentSourceBuffer.appendBuffer(combinedBuffer);
            
            // Wait for append to complete
            await new Promise(resolve => {
              const handler = () => {
                currentSourceBuffer!.removeEventListener('updateend', handler);
                resolve(void 0);
              };
              currentSourceBuffer!.addEventListener('updateend', handler);
            });

          } catch (error) {
            console.error('Error appending buffer:', error);
            if (mediaSource.readyState === 'open') {
              mediaSource.endOfStream('decode');
            }
          }
        };

        // Start processing the stream
        processStream();

      } catch (error) {
        console.error('MediaSource error during setup:', error);
        if (mediaSource.readyState === 'open') {
          mediaSource.endOfStream('decode');
        }
        cleanup();
        stopAudioPlayerAnimations(setRobotPose, idlePose);
        if (setIsRobotSpeaking) {
          setIsRobotSpeaking(false);
        }
        reject(error);
      }
    });

    mediaSource.addEventListener('sourceended', () => {
      console.log('🔊 MediaSource ended');
    });

    mediaSource.addEventListener('sourceclose', () => {
      console.log('🔊 MediaSource closed');
      cleanup();
    });

    mediaSource.addEventListener('error', (error) => {
      console.error('MediaSource error:', error);
      cleanup();
      stopAudioPlayerAnimations(setRobotPose, idlePose);
      if (setIsRobotSpeaking) {
        setIsRobotSpeaking(false);
      }
      reject(new Error('MediaSource error occurred during audio streaming'));
    });
  });
};

const playBlobAudio = async (
  response: Response,
  setRobotPose?: (pose: string) => void,
  idlePose?: string,
  setIsRobotSpeaking?: (speaking: boolean) => void
): Promise<void> => {
  // Fallback method: convert to blob and play
  const audioBlob = await response.blob();
  await playBlobAudioDirect(audioBlob, setRobotPose, idlePose, setIsRobotSpeaking);
};

const playBlobAudioDirect = async (
  audioBlob: Blob,
  setRobotPose?: (pose: string) => void,
  idlePose?: string,
  setIsRobotSpeaking?: (speaking: boolean) => void
): Promise<void> => {
  const audioURL = URL.createObjectURL(audioBlob);
  currentAudio = new Audio(audioURL);
  
  // Set up event listeners
  currentAudio.onended = () => {
    URL.revokeObjectURL(audioURL);
    currentAudio = null;
    stopAudioPlayerAnimations(setRobotPose, idlePose);
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(false);
    }
    console.log('🔊 Audio playback ended (blob method)');
  };
  
  currentAudio.onerror = () => {
    const error = createAudioError(currentAudio!, 'playback (blob method)');
    console.error('Audio playback error (blob method):', error);
    URL.revokeObjectURL(audioURL);
    currentAudio = null;
    stopAudioPlayerAnimations(setRobotPose, idlePose);
    if (setIsRobotSpeaking) {
      setIsRobotSpeaking(false);
    }
  };

  // Play the audio
  await currentAudio.play();
  console.log('🔊 Audio playback started (blob method)');
};

export const stopAudio = (setIsRobotSpeaking?: (speaking: boolean) => void): void => {
  isStreamingActive = false;
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    console.log('🔇 Audio stopped');
  }
  
  if (currentMediaSource) {
    try {
      if (currentMediaSource.readyState === 'open') {
        currentMediaSource.endOfStream('decode');
      }
    } catch (error) {
      console.warn('Error ending MediaSource:', error);
    }
    currentMediaSource = null;
  }
  
  currentSourceBuffer = null;
  
  // Stop robot animation when audio is stopped
  stopAudioPlayerAnimations();
  
  // Reset speaking state when audio is stopped
  if (setIsRobotSpeaking) {
    setIsRobotSpeaking(false);
  }
};

export const isAudioPlaying = (): boolean => {
  return currentAudio !== null && !currentAudio.paused;
};