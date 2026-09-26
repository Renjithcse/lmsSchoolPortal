import { create } from "zustand";

export const userStore = create((set) => ({
  user: null,
  updateuser: (user) => set((state) => ({ user: user })),
}))