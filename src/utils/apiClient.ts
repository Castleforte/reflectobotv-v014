interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ApiResponse {
  message: string;
  usage?: any;
}

interface ApiError {
  error: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  }

  private async makeRequest(endpoint: string, messages: OpenAIMessage[], options: {
    temperature?: number;
    max_tokens?: number;
  } = {}): Promise<string> {
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        }),
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }

        // Check if this is a 404 (function not found) and use fallback
        if (response.status === 404) {
          console.warn(`Edge function ${endpoint} not found (404), using fallback response`);
          return this.getFallbackResponse(endpoint, messages);
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API configuration.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 500) {
          throw new Error('Service is temporarily unavailable. Please try again later.');
        } else {
          throw new Error(errorMessage);
        }
      }

      const data: ApiResponse = await response.json();
      
      if (!data.message) {
        throw new Error('Invalid response format from API.');
      }

      return data.message;
    } catch (error) {
      // If the edge function is not deployed or accessible, provide a fallback response
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn(`Edge function ${endpoint} not available, using fallback response`);
        return this.getFallbackResponse(endpoint, messages);
      }
      
      // Re-throw other errors (like our custom 401, 429, 500 errors)
      throw error;
    }
  }

  private getFallbackResponse(endpoint: string, messages: OpenAIMessage[]): string {
    const userMessage = messages[messages.length - 1]?.content || '';
    
    switch (endpoint) {
      case 'chat-completion':
        return this.getChatFallback(userMessage);
      case 'mood-completion':
        return this.getMoodFallback(userMessage);
      case 'whatif-completion':
        return this.getWhatIfFallback(userMessage);
      default:
        return "Thanks for sharing! I'm here to listen and support you.";
    }
  }

  private getChatFallback(userMessage: string): string {
    const responses = [
      "That's really interesting! Tell me more about how that makes you feel.",
      "I can hear that this is important to you. What do you think about it?",
      "Thanks for sharing that with me! What would you like to explore about this?",
      "That sounds like something worth thinking about. How does it affect you?",
      "I appreciate you opening up about this. What's the most important part for you?",
      "That's a thoughtful thing to share. What do you think might help?",
      "I can see you've been thinking about this. What matters most to you here?",
      "Thanks for trusting me with your thoughts. How are you feeling about all this?"
    ];
    
    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
      return "I'm so glad to hear you're feeling positive! What's making you feel this way?";
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('upset') || lowerMessage.includes('worried')) {
      return "I can hear that you're going through something difficult. It's okay to feel this way. What do you think might help?";
    }
    
    if (lowerMessage.includes('school') || lowerMessage.includes('homework')) {
      return "School can bring up lots of different feelings! What's been on your mind about it?";
    }
    
    if (lowerMessage.includes('friend') || lowerMessage.includes('friends')) {
      return "Friendships are so important! Tell me more about what's happening with your friends.";
    }
    
    // Return a random response if no keywords match
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getMoodFallback(userMessage: string): string {
    const responses = [
      "Thank you for sharing how you're feeling today. Your emotions are important and I'm here to listen.",
      "I appreciate you taking the time to check in with yourself. How does it feel to notice your emotions?",
      "Thanks for being honest about your feelings. It takes courage to pay attention to how we feel inside.",
      "I'm glad you're taking care of your emotional well-being. What do you think might help you feel even better?",
      "Your feelings matter, and I'm here to support you. Is there anything else you'd like to share about how you're feeling?",
      "It's wonderful that you're checking in with yourself. How does it feel to take this moment for your emotions?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getWhatIfFallback(userMessage: string): string {
    const responses = [
      "Wow! What an amazing and creative answer! Your imagination is incredible!",
      "That's such a fun and thoughtful response! I love how your mind works!",
      "What a fantastic idea! You have such a creative way of thinking about things!",
      "That's so imaginative! I never would have thought of that - you're really creative!",
      "What a cool answer! Your creativity always surprises me in the best way!",
      "That's such an interesting way to think about it! Your imagination is awesome!",
      "Wow, that's really creative! I love hearing your unique ideas and thoughts!",
      "What a wonderful answer! You have such a special way of seeing the world!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async getChatCompletion(messages: OpenAIMessage[]): Promise<string> {
    return this.makeRequest('chat-completion', messages, {
      temperature: 0.7,
      max_tokens: 150,
    });
  }

  async getMoodCompletion(messages: OpenAIMessage[]): Promise<string> {
    return this.makeRequest('mood-completion', messages, {
      temperature: 0.7,
      max_tokens: 120,
    });
  }

  async getWhatIfCompletion(messages: OpenAIMessage[]): Promise<string> {
    return this.makeRequest('whatif-completion', messages, {
      temperature: 0.8,
      max_tokens: 120,
    });
  }
}

export const apiClient = new ApiClient();
export type { OpenAIMessage };