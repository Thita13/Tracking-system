const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const app = express();
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const multer = require('multer');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/', (req, res) => {
    res.send('Backend Running');
});

// Test database connection
app.get('/test-db', (req, res) => {
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
    const { username, phone, email, role, password } = req.body;

    const passwordToHash = password || newPassword; // ใช้รหัสผ่านใหม่ถ้ามี หรือใช้รหัสผ่านเดิมถ้าไม่มีการส่งม

    let sql;
    let params;

    if (password && password.length > 0) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        sql = 'UPDATE users SET username = ?, phone = ?, email = ?, role = ?, password = ? WHERE id_users = ?';
        params = [username, phone, email, role, hashedPassword, id];
    } else {
        sql = 'UPDATE users SET username = ?, phone = ?, email = ?, role = ? WHERE id_users = ?';
        params = [username, phone, email, role, id];
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        } // ปิด if(err) ตรงนี้

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    }); // ปิด db.query ตรงนี้
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
app.post('/tasks', upload.single('file'), (req, res) => {
    const {
        task_name, task_type, customer_name, customer_phone,
        description, status, id_users, assigned_to
    } = req.body;

    // SQL นี้ตรงกับชื่อคอลัมน์ใน DB ของคุณแล้ว (assign_to)
    const sql = `INSERT INTO tasks (
        task_name, task_type, customer_name, customer_phone, 
        description, status, id_users, assign_to, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    db.query(sql, [
        task_name,
        task_type,
        customer_name,
        customer_phone,
        description,
        status || 'NEW',
        parseInt(id_users),
        assigned_to ? parseInt(assigned_to) : null
    ], (err, results) => {
        if (err) {
            console.error("SQL ERROR:", err);
            return res.status(500).json({ message: "Database Error", details: err.message });
        }

        const newTaskId = results.insertId;

        // บันทึกประวัติลง tracking
        const trackingSql = 'INSERT INTO tracking (status, id_task, id_users, department, action_at) VALUES (?, ?, ?, ?, NOW())';
        db.query(trackingSql, ['CREATE_TASK', newTaskId, parseInt(id_users), 'Project Director'], (trackErr) => {
            if (trackErr) console.error("Tracking Error:", trackErr);

            if (req.file) {
                const insertFileSql = 'INSERT INTO files (file_name, file_path, version, id_task) VALUES (?, ?, 1, ?)';
                db.query(insertFileSql, [req.file.originalname, req.file.path, newTaskId], (fileErr) => {
                    if (fileErr) return res.status(500).json({ message: "บันทึกงานสำเร็จ แต่บันทึกไฟล์ไม่สำเร็จ" });
                    res.status(201).json({ message: 'สร้างงานและบันทึกไฟล์สำเร็จ', taskId: newTaskId });
                });
            } else {
                res.status(201).json({ message: 'สร้างงานสำเร็จ', taskId: newTaskId });
            }
        });
    });
});

//my task
app.get('/tasks/my-tasks/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log("Fetching tasks for user:", userId);
    const sql = `
        SELECT t.*, tr.department
        FROM tasks t
        JOIN tracking tr ON t.id_task = tr.id_task
        WHERE tr.id_users = ? 
        AND tr.action_at = (
            SELECT MAX(action_at) 
            FROM tracking 
            WHERE id_task = t.id_task
        )
        ORDER BY t.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        console.log("Results from DB:", results);
        if (err) {
            console.error("Error fetching interior tasks:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get all tasks
app.get('/tasks', (req, res) => {
    const sql = 'SELECT tasks.id_task,tasks.task_name, tasks.task_type, tasks.customer_name, tasks.customer_phone, tasks.description, tasks.created_at, tasks.status, users.username AS created_by FROM tasks JOIN users ON tasks.id_users = users.id_users ORDER BY tasks.id_task ASC';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


// Get task by ID
app.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = `
        SELECT t.*, 
               u1.username AS created_by, 
               u1.role AS created_by_role, 
               u2.username AS assigned_to_name,
               u2.role AS assigned_to_role
        FROM tasks t
        JOIN users u1 ON t.id_users = u1.id_users
        LEFT JOIN users u2 ON t.assign_to = u2.id_users
        WHERE t.id_task = ?`;
    
    db.query(sql, [taskId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Task not found' });
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
    const fileNameStored = req.file.filename; // ใช้ตัวนี้ครับ
    const filePathToStore = 'uploads/' + fileNameStored; // Path ที่จะเก็บใน DB

    const versionSql = `SELECT COALESCE(MAX(version), 0) + 1 AS nextVersion FROM files WHERE id_task = ?`;

    db.query(versionSql, [taskId], (err, versionResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const nextVersion = versionResults[0].nextVersion;
        const insertSql = 'INSERT INTO files (file_name, file_path, id_task, version) VALUES (?, ?, ?, ?)';

        db.query(insertSql, [fileName, filePathToStore, taskId, nextVersion], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // --- ย้าย res.status มาไว้ข้างใน callback นี้ เพื่อให้แน่ใจว่าบันทึก DB เสร็จแล้ว ---
            const publicUrl = `http://localhost:5000/${filePathToStore}`;

            res.status(201).json({
                message: 'File uploaded successfully',
                fileId: results.insertId,
                version: nextVersion,
                fileUrl: publicUrl
            });
        });
    });
});

// Get files by task ID
app.get('/tasks/:id/files', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT id_files, file_name, file_path, version, created_at FROM files WHERE id_task = ? ORDER BY version DESC';
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results || []);
    });
});

//delete file by ID
app.delete('/files/:id', (req, res) => {
    const fileId = req.params.id;
    const sql = 'DELETE FROM files WHERE id_files = ?';
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

// Get notifications (tasks assigned to user)
app.get('/tasks/notifications/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT t.id_task, t.task_name, t.status, t.created_at 
        FROM tasks t
        WHERE t.assign_to = ? AND t.status != 'COMPLETE'
        ORDER BY t.created_at DESC
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results || []);
    });
});