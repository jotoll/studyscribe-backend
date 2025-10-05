import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  showModalEditor: boolean;
  modalContent: any;
  modalPath: string;
  modalElement: any;
  openModalEditor: (content: any, path?: string, element?: any) => void;
  closeModalEditor: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [showModalEditor, setShowModalEditor] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [modalPath, setModalPath] = useState<string>('');
  const [modalElement, setModalElement] = useState<any>(null);

  const openModalEditor = (content: any, path: string = '', element: any = null) => {
    console.log('openModalEditor llamado con:', { path, element });
    setModalContent(content);
    setModalPath(path);
    setModalElement(element);
    setShowModalEditor(true);
  };

  const closeModalEditor = () => {
    setShowModalEditor(false);
    setModalContent(null);
    setModalPath('');
    setModalElement(null);
  };

  const value = {
    showModalEditor,
    modalContent,
    modalPath,
    modalElement,
    openModalEditor,
    closeModalEditor
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};