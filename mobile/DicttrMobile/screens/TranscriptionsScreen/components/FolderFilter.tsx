import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../types';
import { FilterStyles } from './FilterStyles';

interface FolderFilterProps {
  folders: Folder[];
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderLongPress: (folderId: string, event: any) => void;
  onFolderPressOut: (folderId: string) => void;
  onCreateNewFolder: () => void;
}

const FolderFilter: React.FC<FolderFilterProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onFolderLongPress,
  onFolderPressOut,
  onCreateNewFolder
}) => {
  return (
    <View style={styles.filterRow}>
      <View style={styles.filterHeader}>
        <TouchableOpacity
          style={styles.filterIconContainer}
          onPress={onCreateNewFolder}
        >
          <Ionicons name="folder-outline" size={18} color="#3ba3a4" />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          {/* Filtros de carpetas */}
          <TouchableOpacity
            style={[styles.filterButton, selectedFolder === null && styles.filterButtonActive]}
            onPress={() => onFolderSelect(null)}
          >
            <Ionicons name="folder-outline" size={14} color={selectedFolder === null ? "#333" : "#666"} />
            <Text style={[styles.filterText, selectedFolder === null && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          {folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.filterButton,
                { backgroundColor: folder.color + '20' },
                selectedFolder === folder.id && styles.filterButtonActive
              ]}
              onPress={() => onFolderSelect(folder.id)}
              onLongPress={(event) => onFolderLongPress(folder.id, event)}
              onPressOut={() => onFolderPressOut(folder.id)}
              delayLongPress={500}
              delayPressIn={0}
            >
              <View style={[styles.folderIconContainer, { backgroundColor: folder.color }]}>
                <Ionicons
                  name={folder.icon as any || "folder"}
                  size={12}
                  color="white"
                />
              </View>
              <Text style={[styles.filterText, selectedFolder === folder.id && styles.filterTextActive]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = FilterStyles;

export default FolderFilter;
