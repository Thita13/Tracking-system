const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const bcrypt = require('bcryptjs');

const app = express();

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


app.get('/', (req, res) => {
    res.send('Backend Running');
});

// Test database connection
app.get('/test-db' ,(req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

// Create a new user
app.post('/users', (req, res) => {
    const { username,
        phone,
        email,
        role,
        password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = 'INSERT INTO users (username, phone, email, role, password) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [username,
        phone,
        email,
        role,
        hashedPassword], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User created', userId: results.insertId });
    });
});

//Get all users
app.get('/users', (req, res) => {
    const sql = 'SELECT id_users, username, phone, email, role, created_at, updated_at FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get user by ID
app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT id_users, username, phone, email, role, created_at, updated_at FROM users WHERE id_users = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(results[0]);
    });
});

// Update user by ID
app.put('/users/:id', (req, res) => {
    const id = req.params.id;
    const { username,
        phone,
        email,
        role,
        password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'UPDATE users SET username = ?, phone = ?, email = ?, role = ?, password = ? WHERE id_users = ?';
    db.query(sql, [username,
        phone,
        email,
        role,
        hashedPassword,
        id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

// Delete user by ID
app.delete('/users/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM users WHERE id_users = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted' });
    });
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = results[0];
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        res.json({ message: 'Login success', user: { id: user.id_users, username: user.username, email: user.email, role: user.role } });
    });
});

// Create task
app.post('/tasks', (req, res) => {
    const { task_name,
        task_type,
        customer_name,
        customer_phone,
        description,
        status,
        id_users } = req.body;
    const sql = 'INSERT INTO tasks (task_name, task_type, customer_name, customer_phone, description, status, id_users) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [task_name,
        task_type,
        customer_name,
        customer_phone,
        description,
        status,
        id_users], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Task created', taskId: results.insertId });
    });
});

// Get all tasks
app.get('/tasks', (req, res) => {
    const sql = 'SELECT tasks.id_task,tasks.task_name, tasks.task_type, tasks.customer_name, tasks.customer_phone, tasks.description, tasks.created_at, tasks.status, users.username AS created_by FROM tasks JOIN users ON tasks.id_users = users.id_users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get task by ID
app.get('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT tasks.id_task,tasks.task_name, tasks.task_type, tasks.customer_name, tasks.customer_phone, tasks.description, tasks.created_at, tasks.status, users.username AS created_by FROM tasks JOIN users ON tasks.id_users = users.id_users WHERE tasks.id_task = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }        if (results.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(results[0]);
    });
});

// Update task by ID
app.put('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const { task_name,
        task_type,
        customer_name,
        customer_phone,
        description,
        status,
        id_users } = req.body;
    const sql = 'UPDATE tasks SET task_name = ?, task_type = ?, customer_name = ?, customer_phone = ?, description = ?, status = ?, id_users = ? WHERE id_task = ?';
    db.query(sql, [task_name,
        task_type,
        customer_name,
        customer_phone,
        description,
        status,
        id_users,
        id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully' });
    });
});

// Delete task by ID
app.delete('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM tasks WHERE id_task = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted' });
    });
});

//Create tracking
app.post('/tracking', (req, res) => {
    const { status,
        id_task,
        id_users,
        department } = req.body;
    const sql = 'INSERT INTO tracking (status, id_task, id_users, department) VALUES (?, ?, ?, ?)';
    db.query(sql, [status,
        id_task,
        id_users,
        department], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Tracking created', trackingId: results.insertId });
    });
});

// Get tracking by task ID
app.get('/tasks/:id/tracking', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT tracking.id_tracking, tracking.status, tracking.action_at, users.username AS action_by, tracking.department FROM tracking JOIN users ON tracking.id_users = users.id_users WHERE tracking.id_task = ? ORDER BY tracking.action_at ASC';
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

//Comment on task
app.post('/tasks/:id/comments', (req, res) => {
    const taskId = req.params.id;
    const { comment,
        created_at,
        id_users,
        id_task,
        id_tracking } = req.body;
    const sql = 'INSERT INTO comments (comment, created_at, id_users, id_task, id_tracking) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [comment,
        created_at,
        id_users,
        id_task,
        id_tracking], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Comment added', commentId: results.insertId });
    });
});

// Get comments by task ID
app.get('/tasks/:id/comments', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT comments.id_comment, comments.comment, comments.created_at, users.username AS commented_by FROM comments JOIN users ON comments.id_users = users.id_users WHERE comments.id_task = ? ORDER BY comments.created_at ASC';
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

//file upload
app.post('/tasks/:id/files', upload.single('file'), (req, res) => {
    const taskId = req.params.id;
    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const versionSql = `SELECT COALESCE(MAX(version), 0) + 1 AS nextVersion FROM files WHERE id_task = ?`;
    db.query(versionSql, [taskId], (err, versionResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const nextVersion = versionResults[0].nextVersion;
        const insertSql = 'INSERT INTO files (file_name, file_path, id_task, version) VALUES (?, ?, ?, ?)';
        db.query(insertSql, [fileName, filePath, taskId, nextVersion], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'File uploaded successfully', fileId: results.insertId, version: nextVersion, fileUrl: `http://localhost:5000/${filePath}` });
        });
    });
});

// Get files by task ID
app.get('/tasks/:id/files', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT id_file, file_name, file_path, version, created_at FROM files WHERE id_task = ? ORDER BY version DESC';
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

//delete file by ID
app.delete('/files/:id', (req, res) => {
    const fileId = req.params.id;
    const sql = 'DELETE FROM files WHERE id_file = ?';
    db.query(sql, [fileId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.json({ message: 'File deleted' });
    });
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});