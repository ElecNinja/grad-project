import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../apis/axios';
import { baseUrl } from '../apis/apiEndpoints';

// Thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${baseUrl}/api/chat/conversations`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${baseUrl}/api/chat/messages/${conversationId}`);
      return { conversationId, messages: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, body, fileUrl, fileName, fileType }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${baseUrl}/api/chat/message`, {
        conversationId,
        body,
        fileUrl,
        fileName,
        fileType,
      });
      return { conversationId, message: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.put(`${baseUrl}/api/chat/read/${conversationId}`);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getOrCreateConversation = createAsyncThunk(
  'chat/getOrCreateConversation',
  async (peerId, { rejectWithValue }) => {
    try {
      const response = await api.post(`${baseUrl}/api/chat/conversation`, { peerId });
      return response.data.conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  loading: false,
  error: null,
  isOpen: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
      state.messages = [];
    },
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    openChat: (state) => {
      state.isOpen = true;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    addNewMessage: (state, action) => {
      const message = action.payload;
      // Avoid duplicates
      if (state.messages.some(m => m.id === message.id)) return;
      // Add to messages if this is the active conversation
      if (state.activeConversationId === message.conversation_id) {
        state.messages.push(message);
      }
      // Update last message preview in conversations list
      const conv = state.conversations.find(c => c.conversationId === message.conversation_id);
      if (conv) {
        conv.lastMessage = { body: message.body, created_at: message.created_at, sender_id: message.sender_id };
      }
    },
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const conv = state.conversations.find(c => c.conversationId === conversationId);
      if (conv) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    },
    updateUnreadCount: (state, action) => {
      const { conversationId, unreadCount } = action.payload;
      const conv = state.conversations.find(c => c.conversationId === conversationId);
      if (conv) conv.unreadCount = unreadCount;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearChatState: (state) => {
      state.conversations = [];
      state.activeConversationId = null;
      state.messages = [];
      state.isOpen = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
  builder
    .addCase(fetchConversations.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchConversations.fulfilled, (state, action) => {
      state.loading = false;
      state.conversations = action.payload;
    })
    .addCase(fetchConversations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase(fetchMessages.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchMessages.fulfilled, (state, action) => {
      state.loading = false;
      // Merge messages without duplicates
      const existingIds = new Set(state.messages.map(m => m.id));
      const newMessages = action.payload.messages.filter(m => !existingIds.has(m.id));
      state.messages = [...state.messages, ...newMessages];
    })
    .addCase(fetchMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase(sendMessage.fulfilled, (state, action) => {
      const { conversationId, message } = action.payload;
      if (state.activeConversationId === conversationId) {
        // Avoid duplicates
        if (!state.messages.some(m => m.id === message.id)) {
          state.messages.push(message);
        }
      }
      // Update last message in conversations list
      const conv = state.conversations.find(c => c.conversationId === conversationId);
      if (conv) {
        conv.lastMessage = { body: message.body, created_at: message.created_at, sender_id: message.sender_id };
      }
    })
    .addCase(markAsRead.fulfilled, (state, action) => {
      const conversationId = action.payload;
      const conv = state.conversations.find(c => c.conversationId === conversationId);
      if (conv) {
        conv.unreadCount = 0;
      }
    });
},
});

export const {
  setActiveConversation,
  toggleChat,
  openChat,
  closeChat,
  addNewMessage,
  incrementUnreadCount,
  updateUnreadCount,
  clearMessages,
  clearChatState,
} = chatSlice.actions;

export default chatSlice.reducer;