const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Using local storage fallback.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

module.exports = {
  supabase,
  
  // Helper functions for common operations
  async insertTranscription(transcriptionData) {
    if (!supabase) {
      console.warn('Supabase not configured, using local storage');
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .insert(transcriptionData)
      .select();

    return { data, error };
  },

  async getTranscriptionById(id) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async getUserTranscriptions(userId, limit = 50, offset = 0) {
    if (!supabase) {
      return { data: [], error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  },

  async insertDocumentV2(documentData) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('documents_v2')
      .insert(documentData)
      .select();

    return { data, error };
  },

  async getDocumentV2ById(id) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('documents_v2')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async updateDocumentV2(id, updates) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('documents_v2')
      .update(updates)
      .eq('id', id)
      .select();

    return { data, error };
  },

  // Usage tracking
  async trackUsage(userId, metrics) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('usage_metrics')
      .upsert({
        user_id: userId,
        date: today,
        ...metrics
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      });

    return { data, error };
  },

  // Check user usage limits
  async checkUserLimits(userId) {
    if (!supabase) {
      return { canProcess: true, limits: null };
    }

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    // Get user subscription status
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const subscriptionStatus = userData?.subscription_status || 'free';

    // Get monthly usage
    const { data: monthlyUsage } = await supabase
      .from('usage_metrics')
      .select('transcription_count, audio_minutes')
      .eq('user_id', userId)
      .gte('date', monthStartStr)
      .order('date', { ascending: true });

    const totalUsage = monthlyUsage?.reduce((acc, day) => ({
      transcription_count: acc.transcription_count + (day.transcription_count || 0),
      audio_minutes: acc.audio_minutes + (day.audio_minutes || 0)
    }), { transcription_count: 0, audio_minutes: 0 }) || { transcription_count: 0, audio_minutes: 0 };

    // Define limits based on subscription
    const limits = {
      free: { transcriptions: 5, audioMinutes: 30 },
      active: { transcriptions: Infinity, audioMinutes: subscriptionStatus === 'pro' ? 300 : 1200 } // 5h pro, 20h enterprise
    };

    const userLimits = limits[subscriptionStatus] || limits.free;

    const canProcess = 
      totalUsage.transcription_count < userLimits.transcriptions &&
      totalUsage.audio_minutes < userLimits.audioMinutes;

    return {
      canProcess,
      limits: {
        current: totalUsage,
        max: userLimits,
        subscription: subscriptionStatus
      }
    };
  }
};