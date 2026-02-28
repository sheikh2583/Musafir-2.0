const express = require('express');
const router = express.Router();
const axios = require('axios');

// AI Chat Service URL (services/ai/api_server.py)
const PYTHON_API_URL = process.env.LANGCHAIN_API_URL || 'http://127.0.0.1:5001/chat';
const PYTHON_HEALTH_URL = PYTHON_API_URL.replace('/chat', '/health');

// Health check for the AI service
router.get('/health', async (req, res) => {
    try {
        const healthRes = await axios.get(PYTHON_HEALTH_URL, { timeout: 3000 });
        res.json({ success: true, ai_service: healthRes.data });
    } catch (err) {
        res.status(503).json({ success: false, error: 'AI chat service is not running' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Forward to Python API
        try {
            const pythonResponse = await axios.post(PYTHON_API_URL, {
                query: message,
                history: history
            }, {
                timeout: 120000 // 2 min timeout for LLM generation
            });

            res.json({
                success: true,
                message: pythonResponse.data.response,
                sources: pythonResponse.data.sources
            });
        } catch (pyError) {
            console.error('Python API Error:', pyError.message);
            if (pyError.code === 'ECONNREFUSED') {
                return res.status(503).json({ error: 'Chat service is currently unavailable (Python server not running)' });
            }
            throw pyError;
        }

    } catch (error) {
        console.error('Chat Route Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            details: error.message
        });
    }
});

module.exports = router;
