import html2canvas from 'html2canvas';

export const generatePdf = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  // Ensure we're at the top of the page for consistent rendering
  window.scrollTo(0, 0);
  
  // Debug: Log element content to verify it's not empty
  console.log('PDF Generation Debug:');
  console.log('Element exists:', !!element);
  console.log('Element has content:', element.innerText.length > 0);
  console.log('Element dimensions:', {
    width: element.offsetWidth,
    height: element.offsetHeight,
    scrollHeight: element.scrollHeight
  });
  console.log('First 100 chars of content:', element.innerText.substring(0, 100));
  
  // Force a reflow to ensure layout is calculated
  element.offsetHeight;
  
  // Wait for any pending renders
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
  
  // Additional delay to ensure complete rendering
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const options = {
    scale: 2,
    useCORS: true,
    letterRendering: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: true,
    width: element.scrollWidth,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  };

  try {
    console.log('Starting canvas generation with options:', options);
    const canvas = await html2canvas(element, options);
    console.log('Canvas generation completed successfully');
    console.log('Canvas dimensions:', { width: canvas.width, height: canvas.height });
    return canvas;
  } catch (error) {
    console.error('Canvas generation failed:', error);
    throw error;
  }
};