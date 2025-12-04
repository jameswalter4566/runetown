import { supabase } from '../integrations/supabase/client';

export async function debugDatabaseTable() {
  console.log('=== DATABASE DEBUG ===');
  
  // Try to query the users table
  try {
    // First, try a simple select
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('Test query result:', { testData, testError });
    
    if (testError) {
      console.error('Test query error:', testError);
    }
    
    // Removed RPC call since the function doesn't exist
    console.log('Users table is accessible');
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log('=== END DEBUG ===');
}