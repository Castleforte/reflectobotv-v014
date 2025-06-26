/**
 * Utility for preloading images to ensure smooth transitions
 */

export interface PreloadResult {
  success: boolean;
  loadedImages: Map<string, HTMLImageElement>;
  failedImages: string[];
}

/**
 * Preloads an array of image paths and returns a promise that resolves when all images are loaded
 * @param imagePaths Array of image URLs to preload
 * @param timeout Optional timeout in milliseconds (default: 10000ms)
 * @returns Promise that resolves with preload results
 */
export const preloadImages = async (
  imagePaths: string[], 
  timeout: number = 10000
): Promise<PreloadResult> => {
  console.log(`🖼️ Starting preload for ${imagePaths.length} images`);
  
  const imageMap = new Map<string, HTMLImageElement>();
  const failedImages: string[] = [];
  
  try {
    // Create promises for all image loads
    const imagePromises = imagePaths.map((imagePath) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          imageMap.set(imagePath, img);
          console.log(`✅ Loaded: ${imagePath.split('/').pop()}`);
          resolve();
        };
        
        img.onerror = (error) => {
          console.error(`❌ Failed to load: ${imagePath}`, error);
          failedImages.push(imagePath);
          // Don't reject - we want to continue loading other images
          resolve();
        };
        
        // Set a timeout for each image
        setTimeout(() => {
          if (!imageMap.has(imagePath) && !failedImages.includes(imagePath)) {
            console.warn(`⏰ Timeout loading: ${imagePath}`);
            failedImages.push(imagePath);
            resolve();
          }
        }, timeout);
        
        img.src = imagePath;
      });
    });
    
    // Wait for all images to load (or fail/timeout)
    await Promise.all(imagePromises);
    
    const successCount = imageMap.size;
    const failureCount = failedImages.length;
    
    console.log(`🎉 Preload complete: ${successCount} loaded, ${failureCount} failed`);
    
    return {
      success: failureCount === 0,
      loadedImages: imageMap,
      failedImages
    };
    
  } catch (error) {
    console.error('❌ Error during image preloading:', error);
    return {
      success: false,
      loadedImages: imageMap,
      failedImages
    };
  }
};

/**
 * Preloads all images for a specific robot character
 * @param robotCharacter Robot character object with poses and greeting poses
 * @returns Promise that resolves with preload results
 */
export const preloadRobotImages = async (robotCharacter: any): Promise<PreloadResult> => {
  // Collect all image paths for the robot
  const imagePaths = [
    ...Object.values(robotCharacter.poses),
    ...(robotCharacter.greetingPoses || [])
  ] as string[];
  
  // Remove duplicates
  const uniqueImagePaths = [...new Set(imagePaths)];
  
  console.log(`🤖 Preloading ${uniqueImagePaths.length} images for robot: ${robotCharacter.name}`);
  
  return preloadImages(uniqueImagePaths);
};