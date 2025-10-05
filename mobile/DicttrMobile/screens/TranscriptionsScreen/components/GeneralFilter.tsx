import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TranscriptionFilters } from '../types';
import { FilterStyles } from './FilterStyles';

interface GeneralFilterProps {
  filters: TranscriptionFilters;
  selectedSubject: string;
  showFavorites: boolean;
  isCalendarFilterActive: boolean;
  showDatePicker: boolean;
  onSubjectSelect: (subject: string) => void;
  onToggleFavorites: () => void;
  onToggleCalendar: () => void;
  onToggleSortOrder: () => void;
  sortOrder: 'asc' | 'desc';
}

const GeneralFilter: React.FC<GeneralFilterProps> = ({
  filters,
  selectedSubject,
  showFavorites,
  isCalendarFilterActive,
  showDatePicker,
  onSubjectSelect,
  onToggleFavorites,
  onToggleCalendar,
  onToggleSortOrder,
  sortOrder
}) => {
  return (
    <View style={styles.filterRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContent}
      >
        {/* Botón de filtros generales */}
        <TouchableOpacity
          style={styles.filterIconContainer}
          onPress={onToggleSortOrder}
        >
          <Ionicons
            name="funnel-outline"
            size={18}
            color="#3ba3a4"
          />
        </TouchableOpacity>

        {/* Filtros básicos - sin lista de asuntos */}
        <TouchableOpacity
          style={[styles.filterButton, selectedSubject === 'all' && styles.filterButtonActive]}
          onPress={() => onSubjectSelect('all')}
        >
          <Text style={[styles.filterText, selectedSubject === 'all' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, showFavorites && styles.filterButtonActive]}
          onPress={onToggleFavorites}
        >
          <Ionicons
            name={showFavorites ? "star" : "star-outline"}
            size={14}
            color={showFavorites ? "#333" : "#666"}
          />
          <Text style={[styles.filterText, showFavorites && styles.filterTextActive]}>
            Favoritas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, isCalendarFilterActive && styles.filterButtonActive]}
          onPress={onToggleCalendar}
        >
          <Ionicons
            name={isCalendarFilterActive ? "calendar" : "calendar-outline"}
            size={14}
            color={isCalendarFilterActive ? "#333" : "#666"}
          />
          <Text style={[styles.filterText, isCalendarFilterActive && styles.filterTextActive]}>
            Calendario
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = FilterStyles;

export default GeneralFilter;
