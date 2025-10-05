import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transcription, Tag, Folder } from '../types';

interface TranscriptionCardProps {
  transcription: Transcription;
  folders: Folder[];
  transcriptionTags: { [key: string]: Tag[] };
  onPress: (transcriptionId: string) => void;
  onLongPress: (transcription: Transcription, event: any) => void;
  onPressOut: () => void;
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  transcription,
  folders,
  transcriptionTags,
  onPress,
  onLongPress,
  onPressOut
}) => {
  const folderInfo = transcription.folder_id ? folders.find(f => f.id === transcription.folder_id) : null;
  const tags = transcriptionTags[transcription.id] || [];

  return (
    <TouchableOpacity
      style={styles.transcriptionCard}
      onPress={() => onPress(transcription.id)}
      onLongPress={(event) => onLongPress(transcription, event)}
      onPressOut={onPressOut}
      delayLongPress={500}
    >
      {/* Fecha y carpeta en la parte superior */}
      <View style={styles.topInfoContainer}>
        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={12} color="#666" />
          <Text style={styles.dateText}>
            {new Date(transcription.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </Text>
        </View>

        {folderInfo && (
          <View style={[styles.folderInfoContainer, { backgroundColor: folderInfo.color + '20' || '#f0f2f5' }]}>
            <View style={[styles.folderIconContainer, { backgroundColor: folderInfo.color }]}>
              <Ionicons
                name={folderInfo.icon as any || "folder"}
                size={10}
                color="white"
              />
            </View>
            <Text
              style={styles.folderInfoText}
              numberOfLines={1}
            >
              {folderInfo.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          {transcription.is_favorite && (
            <Ionicons
              name="star"
              size={16}
              color="#FFD700"
              style={styles.favoriteIcon}
            />
          )}
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {transcription.title}
          </Text>
        </View>
      </View>

      {/* Asunto generado por IA - debajo del título */}
      {transcription.subject && transcription.subject !== 'general' && transcription.subject !== 'null' && (
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectText} numberOfLines={2} ellipsizeMode="tail">
            {transcription.subject}
          </Text>
        </View>
      )}

      {/* Mostrar etiquetas de la transcripción */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <View style={styles.tagsContent}>
            {tags.map((tag) => (
              <View
                key={tag.id}
                style={[styles.tagBadge, { backgroundColor: tag.color + '20' }]}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={10}
                  color={tag.color}
                  style={styles.tagIcon}
                />
                <Text style={[styles.tagText, { color: tag.color }]} numberOfLines={1}>
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {transcription.processing_status && transcription.processing_status !== 'completed' && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {transcription.processing_status === 'processing' ? 'Procesando...' : transcription.processing_status}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  transcriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  topInfoContainer: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  folderInfoContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 4,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  folderInfoText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500' as '500',
  },
  folderIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  cardHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'flex-start' as 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as '600',
    color: '#333',
    flex: 1,
  },
  favoriteIcon: {
    marginLeft: 4,
  },
  subjectContainer: {
    marginTop: 2,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  tagsContainer: {
    marginTop: 4,
  },
  tagsContent: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    gap: 6,
    paddingVertical: 4,
  },
  tagBadge: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    gap: 4,
  },
  tagIcon: {
    marginRight: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500' as '500',
    lineHeight: 14,
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as 'flex-start',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  statusText: {
    fontSize: 11,
    color: '#fa8c16',
    fontWeight: '500' as '500',
  },
};

export default TranscriptionCard;
