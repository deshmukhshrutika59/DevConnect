import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// This is a hook to easily get the authenticated axios instance
export const useApi = () => {
  const { api } = useContext(AuthContext);
  if (!api) {
    throw new Error("useApi must be used within an AuthProvider");
  }
  return api;
};

export const getConversations = async (api) => {
  try {
    const res = await api.get('/chat/conversations');
    return res.data;
  } catch (err) {
    console.error('Error fetching conversations:', err);
    throw err;
  }
};

export const getConversationWithUser = async (api, userId) => {
    try {
        const res = await api.get(`/chat/conversations/${userId}`);
        return res.data;
    } catch (err) {
        console.error('Error fetching conversation:', err);
        throw err;
    }
};

export const getMessages = async (api, conversationId) => {
  try {
    const res = await api.get(`/chat/messages/${conversationId}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching messages:', err);
    throw err;
  }
};

export const getAllUsers = async (api) => {
    try {
        const res = await api.get('/users');
        return res.data;
    } catch (err) {
        console.error('Error fetching users:', err);
        throw err;
    }
};


// For sending messages with media via HTTP (fallback or initial message)
export const sendMessageWithMedia = async (api, formData) => {
    // formData should contain:
    // 'conversationId' (optional)
    // 'recipientId' (optional)
    // 'content' (optional)
    // 'media' (file object)
    try {
        const res = await api.post('/chat/send', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    } catch (err) {
        console.error('Error sending message with media:', err);
        throw err;
    }
};
