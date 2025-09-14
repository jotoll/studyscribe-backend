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
  },

  // Transcription management functions
  async searchTranscriptions(filters = {}) {
    if (!supabase) {
      return { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
    }

    const {
      search,
      status,
      is_favorite,
      language,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('transcriptions')
      .select('*', { count: 'exact' });

    // Búsqueda de texto completo
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'spanish'
      });
    }

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (is_favorite !== undefined) {
      query = query.eq('is_favorite', is_favorite);
    }

    if (language) {
      query = query.eq('language', language);
    }

    // Ordenamiento
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error searching transcriptions:', error);
      throw error;
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    };
  },

  async countTranscriptions(filters = {}) {
    if (!supabase) {
      return 0;
    }

    const { status, is_favorite, language } = filters;

    let query = supabase
      .from('transcriptions')
      .select('id', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (is_favorite !== undefined) {
      query = query.eq('is_favorite', is_favorite);
    }

    if (language) {
      query = query.eq('language', language);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting transcriptions:', error);
      throw error;
    }

    return count;
  },

  async getTranscriptionFilters() {
    if (!supabase) {
      return { status: [], language: [] };
    }

    const { data: statusData, error: statusError } = await supabase
      .from('transcriptions')
      .select('status')
      .not('status', 'is', null);

    const { data: languageData, error: languageError } = await supabase
      .from('transcriptions')
      .select('language')
      .not('language', 'is', null);

    if (statusError || languageError) {
      console.error('Error fetching filter options:', statusError || languageError);
      throw statusError || languageError;
    }

    const statusOptions = [...new Set(statusData.map(item => item.status))];
    const languageOptions = [...new Set(languageData.map(item => item.language))];

    return {
      status: statusOptions,
      language: languageOptions
    };
  }
};