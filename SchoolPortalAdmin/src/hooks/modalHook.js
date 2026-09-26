import { useState } from 'react';

const useModal = () => {
  const [modal, setModal] = useState({
    editModal: false,
    addModal: false,
    viewModal: false,
    deleteModal: false,
    logModal: false,
    remarksModal: false,
    viewStudentModal: false,
    issueModal: false,
    returnModal: false,
    copyModal: false,
  });

  const openModal = (modalName) => {
    // Map short names to full modal names
    const modalNameMap = {
      'add': 'addModal',
      'edit': 'editModal',
      'view': 'viewModal',
      'delete': 'deleteModal',
      'log': 'logModal',
      'remarks': 'remarksModal',
      'viewStudent': 'viewStudentModal',
      'issue': 'issueModal',
      'return': 'returnModal',
      'copy': 'copyModal'
    };

    const fullModalName = modalNameMap[modalName] || modalName;
    
    // Allow dynamic modal creation - if modal doesn't exist, create it
    setModal((prevModal) => ({
      ...prevModal,
      [fullModalName]: true,
    }));
  };

  const closeModal = (modalName) => {
    // Map short names to full modal names
    const modalNameMap = {
      'add': 'addModal',
      'edit': 'editModal',
      'view': 'viewModal',
      'delete': 'deleteModal',
      'log': 'logModal',
      'remarks': 'remarksModal',
      'viewStudent': 'viewStudentModal',
      'issue': 'issueModal',
      'return': 'returnModal',
      'copy': 'copyModal'
    };

    const fullModalName = modalNameMap[modalName] || modalName;
    
    // Allow dynamic modal closing
    setModal((prevModal) => ({
      ...prevModal,
      [fullModalName]: false,
    }));
  };

  return {
    modal,
    openModal,
    closeModal,
  };
};

export default useModal;
