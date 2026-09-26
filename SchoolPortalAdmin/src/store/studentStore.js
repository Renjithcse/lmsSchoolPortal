import { create } from "zustand";

export const studentStore = create((set) => ({
  academic: '',
  grade: '',
  gender: '',
  section: '',
  students: [],
  resetbuttonStore: false,

  // Method to update student information
  updateStudent: (studentsData) => set((state) => ({
    students: studentsData, // Store the students data
  })),

  // Method to update specific values (academic, grade, gender, section)
  updateDetails: (details) => set((state) => ({
    ...details, // Spread the new details into the current state
  })),

  // Method to reset state to its initial values
  resetState: () => set(() => ({
    academic: '',
    grade: '',
    gender: '',
    section: '',
    students: [],
    resetbuttonStore: false,
  })),
}));
