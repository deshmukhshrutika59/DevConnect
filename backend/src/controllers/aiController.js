import axios from 'axios';
import FormData from 'form-data';

// Point to your Python Backend
const PYTHON_SERVICE_URL = "http://localhost:8000/api/ai/chat";

export const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    const file = req.file; // From multer
    const userId = req.user._id.toString(); // From auth middleware

    if (!message && !file) {
      return res.status(400).json({ success: false, message: "Message or file required" });
    }

    // Prepare data for Python Service
    const formData = new FormData();
    formData.append('message', message || "Analyze this file");
    formData.append('userId', userId);

    if (file) {
      // Append the file buffer with filename
      formData.append('file', file.buffer, file.originalname);
    }

    // Call Python Service
    const response = await axios.post(PYTHON_SERVICE_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    return res.json({
      success: true,
      reply: response.data.reply
    });

  } catch (err) {
    console.error("AI Bridge Error:", err.message);
    return res.status(500).json({ 
        success: false, 
        message: "AI service unavailable. Is the Python backend running?" 
    });
  }
};