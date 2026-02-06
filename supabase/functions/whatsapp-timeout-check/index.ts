import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find assignments that have timed out
    const { data: timedOut, error: fetchError } = await supabase
      .from("whatsapp_assignments")
      .select("*")
      .eq("status", "assigned")
      .is("responded_at", null)
      .lt("timeout_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!timedOut || timedOut.length === 0) {
      return new Response(
        JSON.stringify({ message: "No timed out assignments", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;

    for (const assignment of timedOut) {
      try {
        // Mark assignment as timed out
        await supabase
          .from("whatsapp_assignments")
          .update({ status: "timeout", updated_at: new Date().toISOString() })
          .eq("id", assignment.id);

        // Try to find the next available admin using the existing function
        const { data: nextAdmin } = await supabase
          .rpc("find_least_busy_admin");

        if (nextAdmin) {
          // Create new assignment for the next admin
          const timeoutSeconds = assignment.timeout_seconds || 300;
          const timeoutAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();

          await supabase.from("whatsapp_assignments").insert({
            conversation_id: assignment.conversation_id,
            admin_id: nextAdmin,
            status: "assigned",
            timeout_seconds: timeoutSeconds,
            timeout_at: timeoutAt,
            transferred_from: assignment.admin_id,
            notes: "Auto-assigned after timeout",
          });

          // Update conversation assignment status
          await supabase
            .from("whatsapp_conversations")
            .update({ assignment_status: "reassigned" })
            .eq("id", assignment.conversation_id);
        } else {
          // No available admin, mark conversation as escalated
          await supabase
            .from("whatsapp_conversations")
            .update({ assignment_status: "escalated" })
            .eq("id", assignment.conversation_id);
        }

        processed++;
      } catch (e) {
        console.error(`Error processing assignment ${assignment.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ message: "Timeout check complete", processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
