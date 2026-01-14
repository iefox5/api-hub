// projects/hub/code/supabase/functions/mock/index.ts
// Mock API Edge Function - returns mock data based on task_id and scenario

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mock-scenario',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get task ID from URL path: /mock/{task_id}
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const taskId = pathParts[pathParts.length - 1]

    if (!taskId || taskId === 'mock') {
      return new Response(
        JSON.stringify({ error: 'Task ID required', usage: '/mock/{task_id}' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get scenario from header (default: success)
    const scenario = req.headers.get('x-mock-scenario') || 'success'

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch mock response
    const { data, error } = await supabase
      .from('mock_responses')
      .select('status_code, response_data')
      .eq('task_id', taskId)
      .eq('scenario', scenario)
      .single()

    if (error || !data) {
      // Try to get available scenarios
      const { data: scenarios } = await supabase
        .from('mock_responses')
        .select('scenario')
        .eq('task_id', taskId)

      return new Response(
        JSON.stringify({
          error: 'Mock response not found',
          task_id: taskId,
          requested_scenario: scenario,
          available_scenarios: scenarios?.map(s => s.scenario) || [],
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return mock response
    return new Response(
      JSON.stringify(data.response_data),
      {
        status: data.status_code,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Mock-Response': 'true',
          'X-Mock-Scenario': scenario,
        },
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
