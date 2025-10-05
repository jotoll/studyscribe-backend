import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { transcriptionManagementAPI } from '../../../services/api';
import { TranscriptionFilters, Tag } from '../types';

export const useFilters = () => {
  const [filters, setFilters] = useState<TranscriptionFilters>({ subjects: [], favoriteCount: 0 });
  const [datesWithTranscriptions, setDatesWithTranscriptions] = useState<string[]>([]);

  const loadFilters = async () => {
    try {
      const response = await transcriptionManagementAPI.getFilters();
      if (response.success) {
        setFilters(response.data);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadTranscriptionDates = async () => {
    try {
      console.log('Loading transcription dates...');
      const response = await transcriptionManagementAPI.getTranscriptionDates();
      console.log('Transcription dates response:', response);
      if (response.success && response.data && response.data.dates) {
        console.log('Setting dates with transcriptions:', response.data.dates);
        setDatesWithTranscriptions(response.data.dates);
      } else {
        console.log('No success in transcription dates response or no dates');
        setDatesWithTranscriptions([]);
      }
    } catch (error) {
      console.error('Error loading transcription dates:', error);
      setDatesWithTranscriptions([]);
    }
  };

  return {
    filters,
    datesWithTranscriptions,
    loadFilters,
    loadTranscriptionDates
  };
};