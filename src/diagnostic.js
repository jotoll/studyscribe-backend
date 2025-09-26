// Diagnostic script to capture startup errors
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting comprehensive diagnostic...');

// Diagnostic function
async function runDiagnostic() {
  console.log('📊 Running server diagnostic checks...');
  
  try {
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- PORT:', process.env.PORT);
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
    console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('- DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    
    // Test Supabase connection
    console.log('\n🔄 Testing Supabase connection...');
    try {
      const { supabase } = require('./config/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('transcriptions').select('id').limit(1);
        if (error) {
          console.log('❌ Supabase connection failed:', error.message);
        } else {
          console.log('✅ Supabase connection successful');
        }
      } else {
        console.log('❌ Supabase client not initialized');
      }
    } catch (supabaseError) {
      console.log('❌ Supabase connection error:', supabaseError.message);
    }
    
    // Test Groq API
    console.log('\n🔄 Testing Groq API...');
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: "test" }],
        model: "llama-3.1-8b-instant",
        max_tokens: 1
      });
      console.log('✅ Groq API connection successful');
    } catch (groqError) {
      console.log('❌ Groq API error:', groqError.message);
    }
    
    // Test DeepSeek API
    console.log('\n🔄 Testing DeepSeek API...');
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });
      if (response.ok) {
        console.log('✅ DeepSeek API connection successful');
      } else {
        console.log('❌ DeepSeek API error:', response.status, response.statusText);
      }
    } catch (deepseekError) {
      console.log('❌ DeepSeek API error:', deepseekError.message);
    }
    
    console.log('\n✅ Diagnostic completed successfully');
    
  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

// Export for use in server startup
module.exports = { runDiagnostic };

// Run diagnostic if this file is executed directly
if (require.main === module) {
  runDiagnostic().then(() => {
    console.log('Diagnostic finished');
  }).catch(err => {
    console.error('Diagnostic error:', err);
  });
}
