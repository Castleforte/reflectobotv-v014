import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ConversationTurn } from '../types';
import { updateProgress, loadProgress, trackChatHistoryVisit } from '../utils/progressManager';

interface ChatHistoryModalProps {
  onClose: () => void;
  chatHistory: ConversationTurn[];
  onBadgeEarned: (badgeId: string) => void;
}

function ChatHistoryModal({ onClose, chatHistory, onBadgeEarned }: ChatHistoryModalProps) {
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Track Chat History visit when modal opens
  useEffect(() => {
    console.log('📖 Chat History modal opened - tracking visit');
    trackChatHistoryVisit();
    
    // Check if Good Listener badge should be triggered
    onBadgeEarned('good_listener');
  }, [onBadgeEarned]);

  const handleDownloadHistory = async () => {
    if (pdfContentRef.current) {
      try {
        console.log('Starting chat history PDF download...');
        
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
        pdf.save('reflectobot-chat-history.pdf');
        
        console.log('📝 Chat PDF exported successfully');
        
        // Immediately update the export count
        const progress = loadProgress();
        updateProgress({ pdfExportCount: progress.pdfExportCount + 1 });
        
        console.log('📈 Export count incremented:', progress.pdfExportCount + 1);
        
        // Immediately check for Great Job badge
        onBadgeEarned('great_job');
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
    // Clear chat history from localStorage
    localStorage.removeItem('reflectobot-chat-messages');
    
    // Show confirmation message
    alert('Chat history has been cleared successfully!');
    
    // Close confirmation modal and main modal
    setShowClearConfirmation(false);
    onClose();
  };

  const cancelClearHistory = () => {
    setShowClearConfirmation(false);
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
            <img src="/Chat-icon.png" alt="Chat" className="grown-up-modal-icon" />
            <h1 className="grown-up-modal-title">Chat History</h1>
          </div>

          <h2 className="grown-up-modal-subtitle">Your Conversation</h2>

          <div className="grown-up-modal-body">
            <p className="grown-up-modal-intro">
              Here are all the messages you've shared with ReflectoBot during this session. 
              Your thoughts and feelings are important, and this is your space to reflect on them.
            </p>

            <div className="grown-up-modal-section">
              <h3 className="grown-up-modal-section-title">Your Messages:</h3>
              <div className="chat-history-text-box">
                {chatHistory.length > 0 ? (
                  chatHistory.map((turn, index) => (
                    <div key={turn.id} className="chat-history-message">
                      <span className="chat-history-message-number">{index + 1}.</span>
                      <div className="chat-history-message-content">
                        <div className="mb-2">
                          <span className="chat-history-message-sender bot">Prompt:</span>
                          <span className="chat-history-message-text"> {turn.promptText}</span>
                        </div>
                        <div className="mb-2">
                          <span className="chat-history-message-sender user">You:</span>
                          <span className="chat-history-message-text"> {turn.userMessage}</span>
                        </div>
                        <div className="mb-2">
                          <span className="chat-history-message-sender bot">ReflectoBot:</span>
                          <span className="chat-history-message-text"> {turn.botResponse}</span>
                        </div>
                        <span className="chat-history-message-timestamp">{turn.timestamp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="chat-history-empty">No messages yet. Start chatting with ReflectoBot to see your conversation history here!</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button 
                className="grown-up-modal-download-button"
                onClick={handleDownloadHistory}
              >
                Download Chat History
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
                Clear Chat History
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
                <h1 className="grown-up-modal-title">Clear Chat History?</h1>
              </div>

              <div className="grown-up-modal-body">
                <p className="grown-up-modal-intro text-center text-xl mb-8">
                  Are you sure you want to clear all your chat messages? This will permanently delete your conversation history and cannot be undone.
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
              💬 ReflectoBot Chat History
            </h1>
            <h2 style={{ fontSize: '18px', fontWeight: 'normal', margin: '0 0 15px 0', color: '#666' }}>
              Your Conversation Journal
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#555' }}>
              <p style={{ margin: '5px 0' }}>This document contains your conversations with ReflectoBot.</p>
              <p style={{ margin: '5px 0' }}>Think of it as your personal journal of thoughts, feelings, and insights.</p>
              <p style={{ margin: '5px 0' }}>You can look back anytime to see how you've grown, what's been on your mind, or even to remember a good piece of advice from your AI buddy.</p>
              <p style={{ margin: '15px 0 5px 0', fontWeight: 'bold' }}>Let's take a stroll down memory lane!</p>
            </div>
          </div>

          <div>
            {chatHistory.length > 0 ? (
              chatHistory.map((turn, index) => (
                <div key={turn.id} style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                        🤖 Prompt
                      </div>
                      <div style={{ marginLeft: '20px', fontStyle: 'italic' }}>
                        {turn.promptText}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '5px' }}>
                        {turn.timestamp}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                        👤 You
                      </div>
                      <div style={{ marginLeft: '20px' }}>
                        {turn.userMessage}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                        🤖 ReflectoBot
                      </div>
                      <div style={{ marginLeft: '20px' }}>
                        {turn.botResponse}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#6c757d' }}>
                No messages yet. Start chatting with ReflectoBot!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatHistoryModal;