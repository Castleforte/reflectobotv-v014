import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { moodData } from '../moodData';
import { MoodEntry } from '../types';
import { updateProgress, loadProgress, trackMoodHistoryVisit } from '../utils/progressManager';

interface MoodHistoryModalProps {
  onClose: () => void;
  moodHistory: MoodEntry[];
  onBadgeEarned: (badgeId: string) => void;
}

function MoodHistoryModal({ onClose, moodHistory, onBadgeEarned }: MoodHistoryModalProps) {
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Track Mood History visit when modal opens
  useEffect(() => {
    console.log('📖 Mood History modal opened - tracking visit');
    trackMoodHistoryVisit();
    
    // Check if Good Listener badge should be triggered
    onBadgeEarned('good_listener');
  }, [onBadgeEarned]);

  const handleDownloadHistory = async () => {
    if (pdfContentRef.current) {
      try {
        console.log('Starting mood history PDF download...');
        
        // Make the PDF content visible but positioned off-screen
        pdfContentRef.current.style.display = 'block';
        pdfContentRef.current.style.position = 'fixed';
        pdfContentRef.current.style.top = '0';
        pdfContentRef.current.style.left = '-9999px';
        pdfContentRef.current.style.width = '210mm'; // A4 width
        pdfContentRef.current.style.backgroundColor = '#ffffff';
        pdfContentRef.current.style.zIndex = '-1';
        
        // Force layout calculation
        pdfContentRef.current.offsetHeight;
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Debug the content
        console.log('PDF content length:', pdfContentRef.current.innerText.length);
        console.log('PDF content dimensions:', {
          width: pdfContentRef.current.offsetWidth,
          height: pdfContentRef.current.offsetHeight
        });
        
        // Optional: force scroll to top
        window.scrollTo(0, 0);
        
        // Generate canvas using html2canvas
        const canvas = await html2canvas(pdfContentRef.current, {
          useCORS: true,
          scale: 2,
          backgroundColor: '#ffffff',
          logging: true,
          width: pdfContentRef.current.scrollWidth,
          height: pdfContentRef.current.scrollHeight
        });
        
        console.log('Canvas generated:', { width: canvas.width, height: canvas.height });
        
        // Create PDF using jsPDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Add image to PDF with proper scaling
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('reflectobot-mood-history.pdf');
        
        console.log('📝 Mood PDF exported successfully');
        
        // Immediately update the export count
        const progress = loadProgress();
        updateProgress({ pdfExportCount: progress.pdfExportCount + 1 });
        
        console.log('📈 Export count incremented:', progress.pdfExportCount + 1);
        
        // Immediately check for Great Job badge
        onBadgeEarned('great_job');
        
        // Track mood history download for mood_mapper badge (additional trigger)
        onBadgeEarned('mood_mapper');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('There was an error generating the PDF. Please try again.');
      } finally {
        // Always hide the PDF content again
        if (pdfContentRef.current) {
          pdfContentRef.current.style.display = 'none';
        }
      }
    }
  };

  const handleClearHistory = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearHistory = () => {
    // Clear mood history from localStorage
    localStorage.removeItem('reflectobot-mood-history');
    
    // Show confirmation message
    alert('Mood history has been cleared successfully!');
    
    // Close confirmation modal and main modal
    setShowClearConfirmation(false);
    onClose();
  };

  const cancelClearHistory = () => {
    setShowClearConfirmation(false);
  };

  const getMoodIcon = (moodName: string) => {
    const mood = moodData.find(m => m.name === moodName);
    return mood ? mood.colorImage : '/Mood-Emojis_0001s_0007_happy-color.png';
  };

  const getMoodEmoji = (moodName: string) => {
    const mood = moodData.find(m => m.name === moodName);
    return mood ? mood.emoji : '😊';
  };

  return (
    <div className="grown-up-modal-overlay" onClick={onClose}>
      <div className="grown-up-modal-container">
        <div className="grown-up-modal-content" onClick={e => e.stopPropagation()}>
          <button 
            className="absolute top-5 right-5 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 lg:w-12 lg:h-12 grown-up-modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={22} strokeWidth={4} />
          </button>

          <div className="grown-up-modal-header">
            <img src="/Mood-icon.png" alt="Mood" className="grown-up-modal-icon" />
            <h1 className="grown-up-modal-title">Mood History</h1>
          </div>

          <h2 className="grown-up-modal-subtitle">Your Daily Check-Ins</h2>

          <div className="grown-up-modal-body">
            <p className="grown-up-modal-intro">
              Here are all your daily mood check-ins with ReflectoBot. 
              Each entry shows how you were feeling and what you shared during that moment.
            </p>

            <div className="grown-up-modal-section">
              <h3 className="grown-up-modal-section-title">Your Mood Journey:</h3>
              <div className="mood-history-text-box">
                {moodHistory.length > 0 ? (
                  moodHistory.map((entry, index) => (
                    <div key={index} className="mood-history-entry">
                      <div className="mood-history-header">
                        <img 
                          src={getMoodIcon(entry.moodName)}
                          alt={entry.moodName}
                          className="mood-history-icon"
                        />
                        <div className="mood-history-meta">
                          <span className="mood-history-number">{index + 1}.</span>
                          <span className="mood-history-mood">{entry.moodName.charAt(0).toUpperCase() + entry.moodName.slice(1)}</span>
                          <span className="mood-history-timestamp">{entry.timestamp}</span>
                        </div>
                      </div>
                      <div className="mood-history-content">
                        <div className="mb-2">
                          <span className="chat-history-message-sender user">You:</span>
                          <span className="chat-history-message-text"> {entry.checkInText}</span>
                        </div>
                        {entry.botResponse && (
                          <div className="mb-2">
                            <span className="chat-history-message-sender bot">ReflectoBot:</span>
                            <span className="chat-history-message-text"> {entry.botResponse}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="mood-history-empty">No mood check-ins yet. Start your daily check-in to see your mood journey here!</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button 
                className="grown-up-modal-download-button"
                onClick={handleDownloadHistory}
              >
                Download Mood History
              </button>
              
              <button 
                className="grown-up-modal-download-button"
                onClick={handleClearHistory}
                style={{ 
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                  e.currentTarget.style.borderColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.borderColor = '#dc2626';
                }}
              >
                Clear Mood History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirmation && (
        <div className="grown-up-modal-overlay" onClick={cancelClearHistory}>
          <div className="grown-up-modal-container">
            <div className="grown-up-modal-content" onClick={e => e.stopPropagation()}>
              <div className="grown-up-modal-header">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#dc2626" className="grown-up-modal-icon">
                  <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                </svg>
                <h1 className="grown-up-modal-title">Clear Mood History?</h1>
              </div>

              <div className="grown-up-modal-body">
                <p className="grown-up-modal-intro text-center text-xl mb-8">
                  Are you sure you want to clear all your mood check-ins? This will permanently delete your mood history and cannot be undone.
                </p>

                <div className="flex justify-center gap-4">
                  <button 
                    className="modal-button"
                    onClick={cancelClearHistory}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-button danger"
                    onClick={confirmClearHistory}
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Content - Properly structured for PDF generation */}
      <div ref={pdfContentRef} style={{ display: 'none' }}>
        <div style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '12px', 
          lineHeight: '1.6', 
          color: '#000000',
          padding: '20px',
          backgroundColor: '#ffffff',
          width: '100%',
          minHeight: '100vh'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#333' }}>
              💜 ReflectoBot Mood History
            </h1>
            <h2 style={{ fontSize: '18px', fontWeight: 'normal', margin: '0 0 15px 0', color: '#666' }}>
              Your Daily Check-Ins
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
              <p style={{ margin: '5px 0' }}>This is your personal mood journey with ReflectoBot!</p>
              <p style={{ margin: '5px 0' }}>Each check-in shows how you were feeling and what you shared in that moment.</p>
              <p style={{ margin: '5px 0' }}>Reflecting on your moods can help you understand yourself better, notice patterns, and celebrate your growth — one emoji at a time! 😄</p>
              <p style={{ margin: '15px 0 5px 0', fontWeight: 'bold' }}>Let's take a look at what you've been feeling lately...</p>
            </div>
          </div>

          <div>
            {moodHistory.length > 0 ? (
              moodHistory.map((entry, index) => (
                <div key={index} style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '10px',
                      borderBottom: '1px solid #dee2e6',
                      paddingBottom: '10px'
                    }}>
                      <span style={{ fontSize: '24px', marginRight: '10px' }}>
                        {getMoodEmoji(entry.moodName)}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
                          #{index + 1} - {entry.moodName.charAt(0).toUpperCase() + entry.moodName.slice(1)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6c757d' }}>
                          {entry.timestamp}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                        👤 You
                      </div>
                      <div style={{ marginLeft: '20px' }}>
                        {entry.checkInText}
                      </div>
                    </div>
                    
                    {entry.botResponse && (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                          🤖 ReflectoBot
                        </div>
                        <div style={{ marginLeft: '20px' }}>
                          {entry.botResponse}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#6c757d' }}>
                No mood check-ins yet. Start your daily check-in!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodHistoryModal;