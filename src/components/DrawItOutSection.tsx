import React, { useState, useRef, useEffect } from 'react';
import DrawingPreviewModal from './DrawingPreviewModal';
import { updateProgress, loadProgress } from '../utils/progressManager';

// Helper function to randomly choose between celebrate left and celebrate right
const getRandomCelebratePose = (celebratePoses: string[]) => {
  return celebratePoses[Math.floor(Math.random() * celebratePoses.length)];
};

interface DrawItOutSectionProps {
  onClose: () => void;
  setRobotSpeech: React.Dispatch<React.SetStateAction<string>>;
  setRobotPose: React.Dispatch<React.SetStateAction<string>>;
  onBadgeEarned: (badgeId: string) => void;
  onEngagement: () => void;
  robotIdlePose: string;
  robotEmpathyPose: string;
  robotCelebratePoses: string[];
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  size: number;
  points: Point[];
}

const colors = [
  '#000000', // Black
  '#FFFFFF', // White
  '#ff3333', // Red
  '#ff66cc', // Pink
  '#FFEA00', // Bright Yellow (moved from end)
  '#ff9933', // Orange
  '#3366ff', // Blue
  '#00ffff', // Cyan
  '#9966ff', // Purple
  '#99ff33'  // Green
];

const brushSizes = [2, 4, 8]; // Small, Medium, Large

function DrawItOutSection({ 
  onClose, 
  setRobotSpeech, 
  setRobotPose, 
  onBadgeEarned, 
  onEngagement,
  robotIdlePose,
  robotEmpathyPose,
  robotCelebratePoses
}: DrawItOutSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000'); // Default to black for light canvas
  const [currentTool, setCurrentTool] = useState<'brush' | 'eraser'>('brush');
  const [currentBrushSize, setCurrentBrushSize] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [showBrushSizeSelector, setShowBrushSizeSelector] = useState(false);
  const [showEraserSizeSelector, setShowEraserSizeSelector] = useState(false);
  const [showDrawingPreview, setShowDrawingPreview] = useState(false);
  const [savedDrawingDataUrl, setSavedDrawingDataUrl] = useState('');
  const [selectorTimeout, setSelectorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [usedColors, setUsedColors] = useState<Set<string>>(new Set());
  const [hasUsedUndoThisSession, setHasUsedUndoThisSession] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState('#e4e4e4'); // Light gray background
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);
  const [isDrawingPoseSet, setIsDrawingPoseSet] = useState(false);

  // Load saved drawing strokes on component mount - BEFORE canvas initialization
  useEffect(() => {
    const savedStrokes = localStorage.getItem('reflectobot-drawing-strokes');
    const savedBackground = localStorage.getItem('reflectobot-drawing-background');
    const savedUndoStack = localStorage.getItem('reflectobot-drawing-undo-stack');
    const savedUsedColors = localStorage.getItem('reflectobot-drawing-used-colors');
    
    console.log('🎨 Loading saved drawing data...');
    console.log('Saved strokes:', savedStrokes ? 'Found' : 'None');
    
    if (savedStrokes) {
      try {
        const parsedStrokes = JSON.parse(savedStrokes);
        if (Array.isArray(parsedStrokes) && parsedStrokes.length > 0) {
          console.log(`🎨 Restoring ${parsedStrokes.length} saved strokes`);
          setStrokes(parsedStrokes);
        }
      } catch (error) {
        console.error('Error loading saved drawing strokes:', error);
      }
    }

    if (savedBackground) {
      setCanvasBackground(savedBackground);
    } else {
      // Default to light gray if no saved background
      setCanvasBackground('#e4e4e4');
    }

    if (savedUndoStack) {
      try {
        const parsedUndoStack = JSON.parse(savedUndoStack);
        if (Array.isArray(parsedUndoStack)) {
          setUndoStack(parsedUndoStack);
        }
      } catch (error) {
        console.error('Error loading saved undo stack:', error);
      }
    }

    if (savedUsedColors) {
      try {
        const parsedUsedColors = JSON.parse(savedUsedColors);
        if (Array.isArray(parsedUsedColors)) {
          setUsedColors(new Set(parsedUsedColors));
        }
      } catch (error) {
        console.error('Error loading saved used colors:', error);
      }
    }
  }, []);

  // Save drawing state whenever it changes - but only after canvas is initialized
  useEffect(() => {
    if (isCanvasInitialized) {
      console.log(`💾 Saving ${strokes.length} strokes to localStorage`);
      localStorage.setItem('reflectobot-drawing-strokes', JSON.stringify(strokes));
      localStorage.setItem('reflectobot-drawing-background', canvasBackground);
      localStorage.setItem('reflectobot-drawing-undo-stack', JSON.stringify(undoStack));
      localStorage.setItem('reflectobot-drawing-used-colors', JSON.stringify(Array.from(usedColors)));
    }
  }, [strokes, canvasBackground, undoStack, usedColors, isCanvasInitialized]);

  // Initialize canvas and restore drawing - AFTER strokes are loaded
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('🎨 Initializing canvas...');

    // Set canvas size
    canvas.width = 700;
    canvas.height = 400;

    // Set initial canvas background
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mark canvas as initialized FIRST
    setIsCanvasInitialized(true);

    // THEN redraw saved strokes if any exist
    if (strokes.length > 0) {
      console.log(`🎨 Redrawing ${strokes.length} restored strokes`);
      redrawCanvas(strokes);
    } else {
      console.log('🎨 No saved strokes to restore');
    }
  }, [canvasBackground, strokes]); // Include strokes in dependency array

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    setIsDrawing(true);
    
    // Set random drawing pose when starting to draw
    if (!isDrawingPoseSet) {
      setRobotPose(getRandomCelebratePose(robotCelebratePoses));
      setIsDrawingPoseSet(true);
    }
    
    const point = getCanvasCoordinates(e);
    const newStroke: Stroke = {
      color: currentTool === 'eraser' ? canvasBackground : currentColor,
      size: currentBrushSize,
      points: [point]
    };
    
    setCurrentStroke(newStroke);

    // Track engagement for Focus Finder
    onEngagement();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !currentStroke) return;

    const point = getCanvasCoordinates(e);
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    };
    
    setCurrentStroke(updatedStroke);
    drawStroke(updatedStroke);

    // Track engagement for Focus Finder
    onEngagement();
  };

  const endDrawing = () => {
    if (!isDrawing || !currentStroke) return;
    
    setIsDrawing(false);
    
    // Return robot to idle when stopping drawing
    if (isDrawingPoseSet) {
      setRobotPose(robotIdlePose);
      setIsDrawingPoseSet(false);
    }
    
    // Save current state for undo
    setUndoStack(prev => [...prev, strokes]);
    setRedoStack([]); // Clear redo stack when new action is performed
    
    // Add completed stroke to strokes array
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  const drawStroke = (stroke: Stroke) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    ctx.stroke();
  };

  const redrawCanvas = (strokesArray: Stroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    console.log(`🎨 Redrawing canvas with ${strokesArray.length} strokes`);

    // Clear canvas and set background
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    strokesArray.forEach((stroke, index) => {
      if (stroke.points.length >= 2) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        
        ctx.stroke();
      }
    });
  };

  const handleClearCanvas = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearCanvas = () => {
    console.log('🗑️ Clearing canvas and removing saved state');
    
    // Clear all drawing data
    setStrokes([]);
    setCurrentStroke(null);
    setUndoStack([]);
    setRedoStack([]);
    setCanvasBackground('#e4e4e4'); // Reset to light gray
    setUsedColors(new Set());
    
    // Clear saved drawing from localStorage
    localStorage.removeItem('reflectobot-drawing-strokes');
    localStorage.removeItem('reflectobot-drawing-background');
    localStorage.removeItem('reflectobot-drawing-undo-stack');
    localStorage.removeItem('reflectobot-drawing-used-colors');
    
    // Clear canvas and set to light gray
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e4e4e4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Track engagement for Focus Finder
    onEngagement();
    
    setRobotSpeech("Fresh start! Your canvas is clean and ready for your next masterpiece!");
    setShowClearConfirmation(false);
  };

  const cancelClearCanvas = () => {
    setShowClearConfirmation(false);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    setRobotPose(robotEmpathyPose);
    
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, strokes]);
    setUndoStack(prev => prev.slice(0, -1));
    setStrokes(previousState);
    redrawCanvas(previousState);

    // Track that undo was used this session
    setHasUsedUndoThisSession(true);

    // Track engagement for Focus Finder
    onEngagement();

    // Update progress for bounce_back badge
    const currentProgress = loadProgress();
    updateProgress({ 
      undoCount: currentProgress.undoCount + 1 
    });

    // Check for bounce_back badge
    onBadgeEarned('bounce_back');

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 1000);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    setRobotPose(robotEmpathyPose);
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, strokes]);
    setRedoStack(prev => prev.slice(0, -1));
    setStrokes(nextState);
    redrawCanvas(nextState);

    // Track engagement for Focus Finder
    onEngagement();

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 1000);
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set robot to celebrate pose when saving
    setRobotPose(robotCelebratePoses[robotCelebratePoses.length - 1] || robotCelebratePoses[0]);

    // Capture canvas as data URL
    const dataUrl = canvas.toDataURL('image/png');
    setSavedDrawingDataUrl(dataUrl);
    setShowDrawingPreview(true);

    // Update robot speech
    setRobotSpeech("Amazing artwork! I love seeing your creativity come to life. Your drawing is ready to save!");

    // Track engagement for Focus Finder
    onEngagement();
  };

  const handleDownloadDrawing = () => {
    if (!savedDrawingDataUrl) return;

    // Create download link
    const link = document.createElement('a');
    link.download = 'my-reflectobot-drawing.png';
    link.href = savedDrawingDataUrl;
    link.click();

    // Close modal and update robot speech
    setShowDrawingPreview(false);
    setRobotSpeech("Perfect! Your drawing has been saved to your device. You're such a talented artist!");

    // Clear saved drawing from localStorage since it's now saved permanently
    console.log('🎨 Drawing saved permanently - clearing temporary state');
    localStorage.removeItem('reflectobot-drawing-strokes');
    localStorage.removeItem('reflectobot-drawing-background');
    localStorage.removeItem('reflectobot-drawing-undo-stack');
    localStorage.removeItem('reflectobot-drawing-used-colors');

    // Update progress with the actual colors used count
    const currentProgress = loadProgress();
    const colorsUsedCount = usedColors.size;
    
    console.log(`🎨 Drawing saved with ${colorsUsedCount} colors used:`, Array.from(usedColors));
    
    updateProgress({ 
      drawingsSaved: currentProgress.drawingsSaved + 1,
      colorsUsedInDrawing: Math.max(currentProgress.colorsUsedInDrawing, colorsUsedCount)
    });

    // Track drawing save for calm_creator badge
    onBadgeEarned('calm_creator');
    
    // Check for creative_spark badge if 5+ colors were used
    if (colorsUsedCount >= 5) {
      console.log(`🎨 Creative Spark: Used ${colorsUsedCount} colors, triggering badge check`);
      onBadgeEarned('creative_spark');
    }

    // Reset used colors for next drawing
    setUsedColors(new Set());

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 2000);
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    setCurrentTool('brush');
    setRobotPose(robotEmpathyPose);
    
    // Track colors used in current drawing - only add non-background colors
    if (color !== '#FFFFFF' && color !== canvasBackground) {
      console.log(`🎨 Color selected: ${color}`);
      setUsedColors(prev => {
        const newSet = new Set([...prev, color]);
        console.log(`🎨 Total colors used so far: ${newSet.size}`, Array.from(newSet));
        return newSet;
      });
    }

    // Track engagement for Focus Finder
    onEngagement();

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 1000);
  };

  const handleBrushTool = () => {
    setCurrentTool('brush');
    setRobotPose(robotEmpathyPose);
    
    // Toggle brush size selector
    if (showBrushSizeSelector) {
      setShowBrushSizeSelector(false);
    } else {
      setShowBrushSizeSelector(true);
      setShowEraserSizeSelector(false);
    }

    // Track engagement for Focus Finder
    onEngagement();

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 1000);
  };

  const handleEraserTool = () => {
    setCurrentTool('eraser');
    setRobotPose(robotEmpathyPose);
    
    // Toggle eraser size selector
    if (showEraserSizeSelector) {
      setShowEraserSizeSelector(false);
    } else {
      setShowEraserSizeSelector(true);
      setShowBrushSizeSelector(false);
    }

    // Track engagement for Focus Finder
    onEngagement();

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 1000);
  };

  const handleBrushSizeChange = (size: number) => {
    setCurrentBrushSize(size);
    setShowBrushSizeSelector(false);
    setShowEraserSizeSelector(false);
    setRobotPose(robotEmpathyPose);

    // Track engagement for Focus Finder
    onEngagement();

    // Return robot to idle after a short delay
    setTimeout(() => {
      setRobotPose(robotIdlePose);
    }, 1000);
  };

  const handleSelectorMouseLeave = () => {
    // Start a timer to hide the selector after 2 seconds
    const timeout = setTimeout(() => {
      setShowBrushSizeSelector(false);
      setShowEraserSizeSelector(false);
    }, 2000);
    setSelectorTimeout(timeout);
  };

  const handleSelectorMouseEnter = () => {
    // Clear the timeout if mouse re-enters
    if (selectorTimeout) {
      clearTimeout(selectorTimeout);
      setSelectorTimeout(null);
    }
  };

  return (
    <div className="draw-it-out-section">
      <div className="draw-it-out-content">
        <div className="draw-it-out-header">
          <h1 className="draw-it-out-title">Draw What You're Feeling</h1>
          <button 
            className="save-drawing-button"
            onClick={handleSaveDrawing}
          >
            <img src="/Save-icon.png" alt="Save" className="button-icon" />
            Save Drawing
          </button>
        </div>

        <div className="drawing-canvas-container">
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>

        <div className="drawing-controls flex flex-col items-center justify-center gap-4 p-2">
          {/* Color swatches and tools - stacked on small screens, inline on large screens */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
            {/* Color swatches */}
            <div className="color-swatches grid grid-cols-5 lg:flex lg:flex-wrap justify-center gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${currentColor === color && currentTool === 'brush' ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: color,
                    border: color === '#FFFFFF' ? '2px solid #ccc' : 'none'
                  }}
                  onClick={() => handleColorChange(color)}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>

            {/* Tool buttons */}
            <div className="tool-buttons flex justify-center gap-2">
              <div 
                className="tool-button-container"
                onMouseLeave={handleSelectorMouseLeave}
                onMouseEnter={handleSelectorMouseEnter}
              >
                <button
                  className={`tool-button ${currentTool === 'brush' ? 'active' : ''}`}
                  onClick={handleBrushTool}
                  aria-label="Brush tool"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/>
                  </svg>
                </button>
                {showBrushSizeSelector && (
                  <div className="brush-size-selector">
                    {brushSizes.map((size, index) => (
                      <button
                        key={size}
                        className={`brush-size-option ${currentBrushSize === size ? 'active' : ''}`}
                        onClick={() => handleBrushSizeChange(size)}
                        aria-label={`${index === 0 ? 'Small' : index === 1 ? 'Medium' : 'Large'} brush size`}
                      >
                        <div 
                          className="brush-size-circle"
                          style={{ 
                            width: `${8 + index * 4}px`, 
                            height: `${8 + index * 4}px` 
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div 
                className="tool-button-container"
                onMouseLeave={handleSelectorMouseLeave}
                onMouseEnter={handleSelectorMouseEnter}
              >
                <button
                  className={`tool-button ${currentTool === 'eraser' ? 'active' : ''}`}
                  onClick={handleEraserTool}
                  aria-label="Eraser tool"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36-3.54 3.36z"/>
                  </svg>
                </button>
                {showEraserSizeSelector && (
                  <div className="brush-size-selector">
                    {brushSizes.map((size, index) => (
                      <button
                        key={size}
                        className={`brush-size-option ${currentBrushSize === size ? 'active' : ''}`}
                        onClick={() => handleBrushSizeChange(size)}
                        aria-label={`${index === 0 ? 'Small' : index === 1 ? 'Medium' : 'Large'} eraser size`}
                      >
                        <div 
                          className="brush-size-circle"
                          style={{ 
                            width: `${8 + index * 4}px`, 
                            height: `${8 + index * 4}px` 
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                className="tool-button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                aria-label="Undo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
                </svg>
              </button>
              <button
                className="tool-button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                aria-label="Redo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
                </svg>
              </button>
              <button
                className="tool-button"
                onClick={handleClearCanvas}
                aria-label="Clear canvas"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="grown-up-modal-overlay" onClick={cancelClearCanvas}>
          <div className="grown-up-modal-container">
            <div className="grown-up-modal-content" onClick={e => e.stopPropagation()}>
              <div className="grown-up-modal-header">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#ff6b6b" className="grown-up-modal-icon">
                  <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                </svg>
                <h1 className="grown-up-modal-title">Clear Drawing?</h1>
              </div>

              <div className="grown-up-modal-body">
                <p className="grown-up-modal-intro text-center text-xl mb-8">
                  Are you sure you want to clear your drawing? This will erase everything on the canvas and can't be undone.
                </p>

                <div className="flex justify-center gap-4">
                  <button 
                    className="modal-button"
                    onClick={cancelClearCanvas}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-button danger"
                    onClick={confirmClearCanvas}
                  >
                    Clear Drawing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Preview Modal */}
      {showDrawingPreview && (
        <DrawingPreviewModal 
          onClose={() => setShowDrawingPreview(false)}
          drawingDataUrl={savedDrawingDataUrl}
          onDownload={handleDownloadDrawing}
        />
      )}
    </div>
  );
}

export default DrawItOutSection;