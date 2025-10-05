import { StyleSheet } from 'react-native';

export const FilterStyles = StyleSheet.create({
  // Estilos unificados para las filas de filtros
  filterRow: {
    backgroundColor: 'white',
    paddingVertical: 6, // Reducido de 8px
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  
  // Estilos para el encabezado de filtros (FolderFilter y TagFilter)
  filterHeader: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingVertical: 4, // Reducido de 8px
    paddingHorizontal: 12, // Reducido de 16px
  },
  
  // Estilos para el scroll view
  filterScrollView: {
    backgroundColor: 'white',
  },
  
  // Estilos para el contenido del scroll
  filterContent: {
    paddingHorizontal: 12, // Reducido de 16px
    gap: 6, // Reducido de 8px
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  
  // Estilos para el contenedor de iconos
  filterIconContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 6, // Reducido de 8px
    marginRight: 10, // Reducido de 12px
    padding: 5, // Reducido de 6px
    borderRadius: 5, // Reducido de 6px
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#3ba3a4',
  },

  // Estilos para el icono de carpeta (como en MainScreen)
  folderIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 4,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  
  // Estilos para los botones de filtro
  filterButton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingHorizontal: 8, // Reducido de 10px
    paddingVertical: 4, // Reducido de 6px
    borderRadius: 14, // Reducido de 16px
    backgroundColor: '#f0f2f5',
    gap: 3, // Reducido de 4px
    minHeight: 28, // Altura mínima reducida
  },
  
  filterButtonActive: {
    backgroundColor: '#e0e0e0',
  },
  
  // Estilos para el texto de los filtros
  filterText: {
    fontSize: 11, // Reducido de 12px
    fontWeight: '500',
    color: '#666',
  },
  
  filterTextActive: {
    color: '#333',
  },
  
  // Estilos específicos para GeneralFilter (sin encabezado)
  generalFilterRow: {
    backgroundColor: 'white',
    paddingVertical: 6, // Reducido de 8px
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  
  generalFilterScrollView: {
    backgroundColor: 'white',
  },
  
  generalFilterContent: {
    paddingHorizontal: 12, // Reducido de 16px
    gap: 6, // Reducido de 8px
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
});
