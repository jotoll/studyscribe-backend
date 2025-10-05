import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../types';
import { FilterStyles } from './FilterStyles';

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
  onTagLongPress: (tagId: string, event: any) => void;
  onTagPressOut: (tagId: string) => void;
  onClearTagFilters: () => void;
  onOpenTagManager: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTags,
  onTagSelect,
  onTagLongPress,
  onTagPressOut,
  onClearTagFilters,
  onOpenTagManager
}) => {
  return (
    <View style={styles.filterRow}>
      <View style={styles.filterHeader}>
        <TouchableOpacity
          style={styles.filterIconContainer}
          onPress={onOpenTagManager}
        >
          <Ionicons name="pricetag-outline" size={18} color="#3ba3a4" />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          {/* Filtros de etiquetas */}
          <TouchableOpacity
            style={[styles.filterButton, selectedTags.length === 0 && styles.filterButtonActive]}
            onPress={onClearTagFilters}
          >
            <Ionicons name="pricetag-outline" size={14} color={selectedTags.length === 0 ? "#333" : "#666"} />
            <Text style={[styles.filterText, selectedTags.length === 0 && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          {tags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.filterButton,
                { backgroundColor: tag.color + '20' },
                selectedTags.includes(tag.id) && styles.filterButtonActive
              ]}
              onPress={() => onTagSelect(tag.id)}
              onLongPress={(event) => onTagLongPress(tag.id, event)}
              onPressOut={() => onTagPressOut(tag.id)}
              delayLongPress={500}
              delayPressIn={0}
            >
              <Ionicons
                name="pricetag-outline"
                size={12}
                color={tag.color}
              />
              <Text style={[
                styles.filterText,
                selectedTags.includes(tag.id) && styles.filterTextActive,
                { color: tag.color }
              ]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = FilterStyles;

export default TagFilter;
