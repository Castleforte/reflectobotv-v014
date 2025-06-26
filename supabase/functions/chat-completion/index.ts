import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 150 }: RequestBody = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Generate a therapeutic response based on the user's message
    const response = generateTherapeuticResponse(userMessage);

    return new Response(
      JSON.stringify({ 
        message: response,
        usage: {
          prompt_tokens: userMessage.length,
          completion_tokens: response.length,
          total_tokens: userMessage.length + response.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in chat-completion function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateTherapeuticResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Emotional validation responses
  if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('excited')) {
    const responses = [
      "I'm so glad to hear you're feeling positive! What's making you feel this way?",
      "That's wonderful! It sounds like something really good is happening for you. Tell me more!",
      "Your happiness is contagious! What's been the best part of your day?",
      "I love hearing when you're feeling good! What do you think is helping you feel this way?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('upset') || lowerMessage.includes('worried') || lowerMessage.includes('anxious')) {
    const responses = [
      "I can hear that you're going through something difficult. It's okay to feel this way. What do you think might help?",
      "Thank you for sharing these feelings with me. It takes courage to talk about difficult emotions. How can I support you?",
      "I'm here to listen. Sometimes just talking about what's bothering us can help. What's on your mind?",
      "Your feelings are completely valid. What do you think would make you feel a little bit better right now?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('frustrated')) {
    const responses = [
      "It sounds like something really frustrated you. Anger can be a sign that something important to you was affected. What happened?",
      "I can hear the frustration in your words. It's okay to feel angry sometimes. What do you think triggered these feelings?",
      "Thank you for sharing your anger with me. What do you think might help you feel calmer?",
      "Anger is a normal emotion, and it sounds like you have good reasons for feeling this way. Tell me more about what's bothering you."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Topic-specific responses
  if (lowerMessage.includes('school') || lowerMessage.includes('homework') || lowerMessage.includes('teacher')) {
    const responses = [
      "School can bring up lots of different feelings! What's been on your mind about it?",
      "School is such a big part of your life. How are things going there for you?",
      "I'd love to hear more about what's happening at school. What's been the most challenging part?",
      "School can be both exciting and stressful. What's your experience been like lately?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('friend') || lowerMessage.includes('friends')) {
    const responses = [
      "Friendships are so important! Tell me more about what's happening with your friends.",
      "Friends can make such a difference in how we feel. What's going on with your friendships?",
      "I'd love to hear about your friends. Are things going well, or is something bothering you?",
      "Friendship can be wonderful and sometimes complicated. How are you feeling about your friendships right now?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('family') || lowerMessage.includes('mom') || lowerMessage.includes('dad') || lowerMessage.includes('parent')) {
    const responses = [
      "Family relationships can be really important and sometimes complex. What's going on with your family?",
      "I'd like to hear more about what's happening with your family. How are things at home?",
      "Family can be a source of support and sometimes stress. How are you feeling about your family situation?",
      "Thank you for sharing about your family. What's been on your mind about them lately?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // General supportive responses
  const generalResponses = [
    "That's really interesting! Tell me more about how that makes you feel.",
    "I can hear that this is important to you. What do you think about it?",
    "Thanks for sharing that with me! What would you like to explore about this?",
    "That sounds like something worth thinking about. How does it affect you?",
    "I appreciate you opening up about this. What's the most important part for you?",
    "That's a thoughtful thing to share. What do you think might help?",
    "I can see you've been thinking about this. What matters most to you here?",
    "Thanks for trusting me with your thoughts. How are you feeling about all this?",
    "I'm here to listen and support you. What else would you like to talk about?",
    "Your thoughts and feelings matter to me. What's been on your mind lately?"
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}