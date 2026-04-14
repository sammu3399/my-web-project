
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://nhfzhnmopnvandpugvkr.supabase.co";
const supabaseKey = "sb_publishable_g96CwRBlO-h4uHvhSAm_5Q_80UiY5QR";
const _supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Supabase connection...");
    
    // Test profiles query
    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Profiles query error:", error);
    } else {
        console.log("Profiles data sample:", data);
    }
    
    // Test tasks query
    const { data: tasks, error: tasksError } = await _supabase
        .from('tasks')
        .select('*')
        .limit(1);
        
    if (tasksError) {
        console.error("Tasks query error:", tasksError);
    } else {
        console.log("Tasks data sample:", tasks);
    }
}

test();
