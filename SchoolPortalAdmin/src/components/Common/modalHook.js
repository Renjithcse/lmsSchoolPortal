import { useState } from 'react';

const useModal = () => {
  const [modal, setModal] = useState({
    editModal: false,
    addModal: false,
    viewModal: false,
    deleteModal: false,
    logModal: false,
  });

  const openModal = (modalName) => {
    if (modalName in modal) {
      setModal((prevModal) => ({
        ...prevModal,
        [modalName]: true,
      }));
    } else {
      console.error(`Modal ${modalName} does not exist.`);
    }
  };

  const closeModal = (modalName) => {
    if (modalName in modal) {
      setModal((prevModal) => ({
        ...prevModal,
        [modalName]: false,
      }));
    } else {
      console.error(`Modal ${modalName} does not exist.`);
    }
  };

  return {
    modal,
    openModal,
    closeModal,
  };
};

export default useModal;
