import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketDescription, category } = await req.json();
    
    if (!ticketDescription || !category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Searching for KB articles:', { category, ticketDescription });

    // Get relevant articles from the same category
    const { data: articles, error } = await supabase
      .from('knowledge_base')
      .select('id, title, content, video_url, views_count, helpful_count')
      .eq('status', 'published')
      .eq('category', category)
      .order('helpful_count', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }

    console.log('Found articles:', articles?.length || 0);

    // Simple keyword matching for relevance scoring
    const keywords = ticketDescription.toLowerCase().split(' ')
      .filter((word: string) => word.length > 3);

    const scoredArticles = articles?.map((article: any) => {
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      
      let relevanceScore = 0;
      keywords.forEach((keyword: string) => {
        if (titleLower.includes(keyword)) relevanceScore += 3;
        if (contentLower.includes(keyword)) relevanceScore += 1;
      });

      return {
        ...article,
        relevanceScore,
      };
    }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    console.log('Returning scored articles:', scoredArticles?.length || 0);

    return new Response(
      JSON.stringify({ 
        suggestions: scoredArticles || [],
        message: scoredArticles && scoredArticles.length > 0 
          ? 'Found relevant articles'
          : 'No matching articles found. Consider creating a new knowledge base article for this issue.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-kb-articles:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
