const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file directly to avoid shell environment caching issues
let supabaseUrl, supabaseKey;

try {
  const envPath = path.join(__dirname, '..', '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_KEY=(.+)/);

  supabaseUrl = urlMatch ? urlMatch[1].trim() : process.env.SUPABASE_URL;
  supabaseKey = keyMatch ? keyMatch[1].trim() : process.env.SUPABASE_SERVICE_KEY;

  console.log('✅ Loaded Supabase credentials directly from .env file');
  console.log('Key role:', JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64').toString()).role);
} catch (error) {
  console.warn('⚠️  Error reading .env file, falling back to process.env:', error.message);
  supabaseUrl = process.env.SUPABASE_URL;
  supabaseKey = process.env.SUPABASE_SERVICE_KEY;
}

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

  // Search transcriptions with filters and pagination
  async searchTranscriptions({ userId, search, subject, favorite, tags, sortBy = 'created_at', sortOrder = 'desc', limit = 20, offset = 0 }) {
    if (!supabase) {
      return { data: [], error: new Error('Supabase not configured') };
    }

    let query = supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId);

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`title.ilike.${searchTerm},original_text.ilike.${searchTerm},enhanced_text.ilike.${searchTerm}`);
    }

    // Apply subject filter
    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    // Apply favorite filter
    if (favorite === 'true') {
      query = query.eq('is_favorite', true);
    } else if (favorite === 'false') {
      query = query.eq('is_favorite', false);
    }

    // Apply tags filter
    if (tags && tags.length > 0) {
      // Primero obtener los IDs de transcripciones que tienen las etiquetas especificadas
      const { data: taggedTranscriptions, error: tagError } = await supabase
        .from('transcription_tags')
        .select('transcription_id')
        .in('tag_id', tags);

      if (tagError) {
        console.error('Error obteniendo transcripciones con etiquetas:', tagError);
        return { data: [], error: tagError };
      }

      // Extraer los IDs únicos de transcripciones
      const transcriptionIds = [...new Set(taggedTranscriptions.map(item => item.transcription_id))];
      
      if (transcriptionIds.length > 0) {
        query = query.in('id', transcriptionIds);
      } else {
        // Si no hay transcripciones con esas etiquetas, devolver array vacío
        return { data: [], error: null };
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    return { data, error };
  },

  // Count transcriptions with filters
  async countTranscriptions({ userId, search, subject, favorite, tags }) {
    if (!supabase) {
      return { count: 0, error: new Error('Supabase not configured') };
    }

    let query = supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Apply search filter
    if (search && search.trim()) {
      query = query.textSearch('search_vector', search.trim(), {
        type: 'websearch',
        config: 'spanish'
      });
    }

    // Apply subject filter
    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    // Apply favorite filter
    if (favorite === 'true') {
      query = query.eq('is_favorite', true);
    } else if (favorite === 'false') {
      query = query.eq('is_favorite', false);
    }

    // Apply tags filter
    if (tags && tags.length > 0) {
      // Primero obtener los IDs de transcripciones que tienen las etiquetas especificadas
      const { data: taggedTranscriptions, error: tagError } = await supabase
        .from('transcription_tags')
        .select('transcription_id')
        .in('tag_id', tags);

      if (tagError) {
        console.error('Error obteniendo transcripciones con etiquetas:', tagError);
        return { count: 0, error: tagError };
      }

      // Extraer los IDs únicos de transcripciones
      const transcriptionIds = [...new Set(taggedTranscriptions.map(item => item.transcription_id))];
      
      if (transcriptionIds.length > 0) {
        query = query.in('id', transcriptionIds);
      } else {
        // Si no hay transcripciones con esas etiquetas, devolver 0
        return { count: 0, error: null };
      }
    }

    const { count, error } = await query;

    return { count, error };
  },

  // Get available filters for user transcriptions
  async getTranscriptionFilters(userId) {
    if (!supabase) {
      return { 
        subjects: [], 
        error: new Error('Supabase not configured') 
      };
    }

    // Get distinct subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('transcriptions')
      .select('subject')
      .eq('user_id', userId)
      .not('subject', 'is', null)
      .order('subject');

    const subjects = [...new Set(subjectsData?.map(item => item.subject).filter(Boolean) || [])];

    // Get favorite count
    const { count: favoriteCount, error: favoriteError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_favorite', true);

    return {
      subjects,
      favoriteCount: favoriteCount || 0,
      error: subjectsError || favoriteError
    };
  },

  // Get dates with transcriptions for calendar view
  async getTranscriptionDates(userId) {
    if (!supabase) {
      return { dates: [], error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { dates: [], error };
    }

    // Extract unique dates (YYYY-MM-DD format)
    const dates = [...new Set(data?.map(item => {
      const date = new Date(item.created_at);
      return date.toISOString().split('T')[0];
    }) || [])];

    return { dates, error: null };
  }
};
