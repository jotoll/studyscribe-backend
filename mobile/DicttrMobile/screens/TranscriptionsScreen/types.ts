import { Folder } from '../../services/api';

export { Folder };

export interface Transcription {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  processing_status?: string;
  folder_id?: string;
}

export interface TranscriptionFilters {
  subjects: string[];
  favoriteCount: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionTags {
  [key: string]: Tag[];
}

export interface FilterState {
  searchQuery: string;
  selectedSubject: string;
  showFavorites: boolean;
  selectedFolder: string | null;
  selectedTags: string[];
  sortOrder: 'asc' | 'desc';
  showDatePicker: boolean;
  isCalendarFilterActive: boolean;
  selectedDays: string[];
  currentMonth: Date;
}

export interface ModalState {
  showNewFolderModal: boolean;
  showMoveToFolderModal: boolean;
  showTagManager: boolean;
  showTagAssignment: boolean;
  showTranscriptionMenu: boolean;
  showFolderMenu: boolean;
  showTagMenu: boolean;
}

export interface LoadingState {
  loading: boolean;
  refreshing: boolean;
  isSearching: boolean;
  foldersLoading: boolean;
  tagsLoading: boolean;
  creatingFolder: boolean;
  creatingTag: boolean;
  movingTranscription: boolean;
  deletingFolder: boolean;
  deletingTag: boolean;
  managingTags: boolean;
}

export interface FolderCreationState {
  newFolderName: string;
  selectedIcon: string;
  selectedColor: string;
}

export interface TagCreationState {
  newTagName: string;
  selectedTagColor: string;
}

export interface MenuPosition {
  x: number;
  y: number;
}

export interface TranscriptionScreenProps {
  // Props que podrían necesitarse si este componente se vuelve reutilizable
}

export const pastelColors = [
  '#f0f2f5', // Gris azulado claro (default)
  '#ffd6e7', // Rosa pastel
  '#d4f1f9', // Azul pastel
  '#e2f0cb', // Verde pastel
  '#ffe4c2', // Naranja pastel
  '#e6d7f7', // Lila pastel
];

export const tagColors = [
  '#666666', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9A826', '#6C5CE7', '#00B894'
];

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${dateStr} ${timeStr}`;
};

export const getFolderInfo = (folders: Folder[], folderId?: string) => {
  return folderId ? folders.find(f => f.id === folderId) : null;
};