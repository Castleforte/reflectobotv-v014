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
    const { messages, temperature = 0.7, max_tokens = 120 }: RequestBody = await req.json()

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
    
    // Generate a mood-focused response
    const response = generateMoodResponse(userMessage);

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
    console.error('Error in mood-completion function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateMoodResponse(userMessage: string): string {
  const responses = [
    "Thank you for sharing how you're feeling today. Your emotions are important and I'm here to listen.",
    "I appreciate you taking the time to check in with yourself. How does it feel to notice your emotions?",
    "Thanks for being honest about your feelings. It takes courage to pay attention to how we feel inside.",
    "I'm glad you're taking care of your emotional well-being. What do you think might help you feel even better?",
    "Your feelings matter, and I'm here to support you. Is there anything else you'd like to share about how you're feeling?",
    "It's wonderful that you're checking in with yourself. How does it feel to take this moment for your emotions?",
    "I notice you're being really thoughtful about your feelings. That's such an important skill!",
    "Thank you for trusting me with how you're feeling. Your emotional awareness is really impressive.",
    "I'm proud of you for taking time to understand your emotions. What have you learned about yourself today?",
    "Your willingness to explore your feelings shows real emotional intelligence. How are you taking care of yourself?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}