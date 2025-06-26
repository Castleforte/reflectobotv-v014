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
    const { messages, temperature = 0.8, max_tokens = 120 }: RequestBody = await req.json()

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
    
    // Generate an encouraging response for creative thinking
    const response = generateWhatIfResponse(userMessage);

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
    console.error('Error in whatif-completion function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateWhatIfResponse(userMessage: string): string {
  const responses = [
    "Wow! What an amazing and creative answer! Your imagination is incredible!",
    "That's such a fun and thoughtful response! I love how your mind works!",
    "What a fantastic idea! You have such a creative way of thinking about things!",
    "That's so imaginative! I never would have thought of that - you're really creative!",
    "What a cool answer! Your creativity always surprises me in the best way!",
    "That's such an interesting way to think about it! Your imagination is awesome!",
    "Wow, that's really creative! I love hearing your unique ideas and thoughts!",
    "What a wonderful answer! You have such a special way of seeing the world!",
    "Your imagination is so colorful and exciting! Tell me more about your idea!",
    "That's brilliant! I can tell you really thought about that in a creative way!",
    "What an original thought! Your creativity makes me smile!",
    "That's such a unique perspective! I love how you think outside the box!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}