import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  createChapter,
  getAllChapters,
  getChapter,
  updateChapter,
  deleteChapter,
  getAvailableSubjects,
  publishChapter,
  getAvailablePublishSections
} from '../../../api/chapters';

// Async thunks
export const createChapterAsync = createAsyncThunk(
  'chapters/createChapter',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createChapter(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllChaptersAsync = createAsyncThunk(
  'chapters/getAllChapters',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAllChapters(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getChapterAsync = createAsyncThunk(
  'chapters/getChapter',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getChapter(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateChapterAsync = createAsyncThunk(
  'chapters/updateChapter',
  async ({ id, formData: data }, { rejectWithValue }) => {
    try {
      const response = await updateChapter(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteChapterAsync = createAsyncThunk(
  'chapters/deleteChapter',
  async (id, { rejectWithValue }) => {
    try {
      await deleteChapter(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAvailableSubjectsAsync = createAsyncThunk(
  'chapters/getAvailableSubjects',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAvailableSubjects(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const publishChapterAsync = createAsyncThunk(
  'chapters/publishChapter',
  async ({ chapterId, data }, { rejectWithValue }) => {
    try {
      const response = await publishChapter(chapterId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAvailablePublishSectionsAsync = createAsyncThunk(
  'chapters/getAvailablePublishSections',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAvailablePublishSections(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  chapters: [],
  currentChapter: null,
  availableSubjects: [],
  loading: false,
  error: null,
  success: false,
  total: 0,
  currentPage: 1,
  totalPages: 1
};

const chaptersSlice = createSlice({
  name: 'chapters',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    clearCurrentChapter: (state) => {
      state.currentChapter = null;
    },
    setCurrentChapter: (state, action) => {
      state.currentChapter = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create chapter
      .addCase(createChapterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChapterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.chapters.unshift(action.payload.data);
      })
      .addCase(createChapterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get all chapters
      .addCase(getAllChaptersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllChaptersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.chapters = action.payload.data;
        state.total = action.payload.total;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getAllChaptersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get single chapter
      .addCase(getChapterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChapterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChapter = action.payload.data;
      })
      .addCase(getChapterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update chapter
      .addCase(updateChapterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateChapterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentChapter = action.payload.data;
        const index = state.chapters.findIndex(chapter => chapter._id === action.payload.data._id);
        if (index !== -1) {
          state.chapters[index] = action.payload.data;
        }
      })
      .addCase(updateChapterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete chapter
      .addCase(deleteChapterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChapterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.chapters = state.chapters.filter(chapter => chapter._id !== action.payload);
        if (state.currentChapter && state.currentChapter._id === action.payload) {
          state.currentChapter = null;
        }
      })
      .addCase(deleteChapterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove document
      // Get available subjects
      .addCase(getAvailableSubjectsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailableSubjectsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSubjects = action.payload.data.subjects;
      })
      .addCase(getAvailableSubjectsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Publish chapter
      .addCase(publishChapterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(publishChapterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update chapter with publish count if needed
        if (action.payload.data?.publishedChapters) {
          // Optionally update the chapter in the list
        }
      })
      .addCase(publishChapterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get available publish sections
      .addCase(getAvailablePublishSectionsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailablePublishSectionsAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Store available sections in state if needed
      })
      .addCase(getAvailablePublishSectionsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccess, clearCurrentChapter, setCurrentChapter } = chaptersSlice.actions;
export default chaptersSlice.reducer;
