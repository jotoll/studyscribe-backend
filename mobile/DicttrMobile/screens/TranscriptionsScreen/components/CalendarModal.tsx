import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  datesWithTranscriptions: string[];
  selectedDays: string[];
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  onDaySelect: (dateString: string) => void;
  onApplyFilter: () => void;
  isCalendarFilterActive: boolean;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  datesWithTranscriptions,
  selectedDays,
  currentMonth,
  onMonthChange,
  onDaySelect,
  onApplyFilter,
  isCalendarFilterActive
}) => {
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={index} style={styles.calendarDay} />;
          }

          const dateString = formatDateString(year, month, day);
          const hasTranscription = datesWithTranscriptions.includes(dateString);
          const isSelected = selectedDays.includes(dateString);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                hasTranscription && styles.calendarDayWithTranscription,
                isSelected && styles.calendarDaySelected
              ]}
              onPress={() => onDaySelect(dateString)}
            >
              <Text style={[
                styles.calendarDayText,
                hasTranscription && styles.calendarDayTextWithTranscription,
                isSelected && styles.calendarDayTextSelected
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar días</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Header del calendario con navegación */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              >
                <Ionicons name="chevron-back" size={20} color="#4A00E0" />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={20} color="#4A00E0" />
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View style={styles.weekDays}>
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
                <Text key={index} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Grid del calendario */}
            {renderCalendar()}

            {/* Leyenda */}
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, styles.legendColorTranscription]} />
                <Text style={styles.legendText}>Días con transcripciones</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonApply]}
              onPress={onApplyFilter}
            >
              <Text style={styles.modalButtonTextApply}>
                {isCalendarFilterActive ? 'Actualizar' : 'Aplicar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    position: 'absolute' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%' as any,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden' as 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#fafafa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#333',
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  modalContent: {
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center' as 'center',
    fontSize: 12,
    fontWeight: '500' as '500',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    justifyContent: 'space-between' as 'space-between',
    marginBottom: 16,
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  calendarDayWithTranscription: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  calendarDaySelected: {
    backgroundColor: '#666',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextWithTranscription: {
    color: '#666',
    fontWeight: '600' as '600',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '600' as '600',
  },
  calendarLegend: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendColorTranscription: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonApply: {
    backgroundColor: '#3ba3a4',
  },
  modalButtonTextCancel: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#666',
  },
  modalButtonTextApply: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: 'white',
  },
};

export default CalendarModal;