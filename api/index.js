const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, '../data/posts.json');

// Функция чтения данных
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ topics: [] }, null, 2));
            return { topics: [] };
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения данных:', error);
        return { topics: [] };
    }
}

// Функция сохранения данных
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return false;
    }
}

// ================================================================
//  API ЭНДПОИНТЫ
// ================================================================

// GET — получить все темы
app.get('/api/topics', (req, res) => {
    const data = readData();
    res.json(data.topics || []);
});

// POST — создать новую тему
app.post('/api/topics', (req, res) => {
    const { title, category, author, date, posts } = req.body;
    
    if (!title || !author || !posts) {
        return res.status(400).json({ error: 'Не хватает данных' });
    }

    const data = readData();
    const newId = data.topics.length > 0 ? Math.max(...data.topics.map(t => t.id)) + 1 : 1;
    
    const newTopic = {
        id: newId,
        title,
        category: category || 'general',
        author,
        date: date || new Date().toLocaleString('ru-RU'),
        posts: posts || []
    };

    data.topics.unshift(newTopic);
    
    if (saveData(data)) {
        res.status(201).json(newTopic);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// PUT — обновить тему (добавить пост)
app.put('/api/topics/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { posts } = req.body;

    const data = readData();
    const topicIndex = data.topics.findIndex(t => t.id === id);

    if (topicIndex === -1) {
        return res.status(404).json({ error: 'Тема не найдена' });
    }

    if (posts) {
        data.topics[topicIndex].posts = posts;
    }

    if (saveData(data)) {
        res.json(data.topics[topicIndex]);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// DELETE — удалить тему
app.delete('/api/topics/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const data = readData();
    const filtered = data.topics.filter(t => t.id !== id);

    if (filtered.length === data.topics.length) {
        return res.status(404).json({ error: 'Тема не найдена' });
    }

    data.topics = filtered;

    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// DELETE — удалить все темы (админ)
app.delete('/api/topics', (req, res) => {
    const data = readData();
    data.topics = [];
    
    if (saveData(data)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// ================================================================
//  ЗАПУСК
// ================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📁 Данные хранятся в: ${DATA_FILE}`);
});

module.exports = app;