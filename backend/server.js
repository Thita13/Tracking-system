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
                // 🔴 บันทึก id_users ลงในไฟล์เริ่มต้นตอนสร้างโปรเจกต์ด้วย
                const insertFileSql = 'INSERT INTO files (file_name, file_path, version, id_task, id_users) VALUES (?, ?, 1, ?, ?)';
                db.query(insertFileSql, [req.file.originalname, req.file.path, newTaskId, parseInt(id_users)], (fileErr) => {
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

// 🔴 1. แก้ไข API อัปโหลดไฟล์ ให้รับค่า userId และบันทึกลง Database
app.post('/tasks/:id/files', upload.single('file'), (req, res) => {
    const taskId = req.params.id;
    const userId = req.body.userId || null; // <--- เพิ่มบรรทัดนี้เพื่อรับค่าจากหน้าเว็บ

    if (!req.file) {
        return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
    }

    const fileName = req.file.originalname;
    const fileNameStored = req.file.filename;
    const filePathToStore = 'uploads/' + fileNameStored;

    const versionSql = `SELECT COALESCE(MAX(version), 0) + 1 AS nextVersion FROM files WHERE id_task = ?`;

    db.query(versionSql, [taskId], (err, versionResults) => {
        if (err) return res.status(500).json({ error: err.message });

        const nextVersion = versionResults[0].nextVersion;

        // <--- เพิ่ม id_users เข้าไปในคำสั่ง INSERT --->
        const insertSql = 'INSERT INTO files (file_name, file_path, id_task, version, id_users) VALUES (?, ?, ?, ?, ?)';

        db.query(insertSql, [fileName, filePathToStore, taskId, nextVersion, userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({
                message: 'File uploaded successfully',
                fileId: results.insertId,
                fileUrl: `http://localhost:5000/${filePathToStore}`
            });
        });
    });
});

// 🔴 2. แก้ไข API ดึงไฟล์ ให้ดึง id_users ออกมาด้วย
app.get('/tasks/:id/files', (req, res) => {
    const taskId = req.params.id;
    // <--- เพิ่ม id_users ลงในคำสั่ง SELECT --->
    const sql = 'SELECT id_files, file_name, file_path, version, created_at, id_users FROM files WHERE id_task = ? ORDER BY version ASC';
    db.query(sql, [taskId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results || []);
    });
});

// 3. API ลบไฟล์ (อันนี้โครงสร้างเดิมของคุณใช้ได้ดีอยู่แล้วครับ)
app.delete('/tasks/:taskId/files/:fileId', (req, res) => {
    const { taskId, fileId } = req.params;

    const selectSql = 'SELECT file_path FROM files WHERE id_files = ? AND id_task = ?';
    db.query(selectSql, [fileId, taskId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'ไม่พบไฟล์' });

        const filePath = results[0].file_path;
        const deleteSql = 'DELETE FROM files WHERE id_files = ?';

        db.query(deleteSql, [fileId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            if (filePath) {
                const fileName = filePath.split(/[\\/]/).pop();
                const absolutePath = path.join(__dirname, 'uploads', fileName);
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                }
            }
            res.json({ message: 'ลบไฟล์สำเร็จ' });
        });
    });
});

// Task Action Handler (จัดการเปลี่ยนสถานะ มอบหมายงาน และบันทึก Tracking)
app.post('/tasks/:id/action', (req, res) => {
    const taskId = req.params.id;
    const { action, dept, memberId, userId, role } = req.body;

    let updateTaskSql = '';
    let updateParams = [];
    let trackingStatus = action; // ใช้ action ที่ส่งมาจากหน้าบ้านเป็น status หลัก
    let departmentName = dept || role || 'System';

    // 1. กำหนดสถานะงาน (tasks.status) ตาม Action ที่ส่งเข้ามา
    if (action === 'ASSIGN') {
        updateTaskSql = 'UPDATE tasks SET assign_to = ?, status = ? WHERE id_task = ?';
        updateParams = [memberId || null, 'INTERIOR', taskId];
        trackingStatus = 'SEND_TO_INTERIOR';
        departmentName = 'Interior';

    } else if (action === 'START_WORK') {
        // สำหรับ Interior กดเริ่มงาน
        updateTaskSql = 'UPDATE tasks SET assign_to = ?, status = ? WHERE id_task = ?';
        updateParams = [userId, 'INTERIOR', taskId];
        trackingStatus = 'START_INTERIOR'; // ตรงกับ ENUM ใน DB
        departmentName = 'Interior';

    } else if (action === 'CLAIM_PRICING') {
        // สำหรับ Pricing กดรับงาน
        updateTaskSql = 'UPDATE tasks SET assign_to = ?, status = ? WHERE id_task = ?';
        updateParams = [userId, 'PRICING', taskId];
        trackingStatus = 'START_PRICING'; // ตรงกับ ENUM ใน DB
        departmentName = 'Pricing';

    } else if (action === 'SEND_TO_PROJECTDIRECTOR' || action === 'SUBMIT_WORK') {
        // ใช้ร่วมกันทั้ง Interior และ Pricing เมื่อส่งงานกลับหาผู้บริหาร
        updateTaskSql = 'UPDATE tasks SET status = ? WHERE id_task = ?';
        updateParams = ['WAITING_CONFIRM', taskId];
        trackingStatus = 'SEND_TO_PROJECTDIRECTOR';
        departmentName = role; // บันทึกตามแผนกที่กดส่ง

    } else if (action === 'NEXT_STEP') {
        // รับค่า memberId และ dept จาก extraData หรือ req.body
        const { memberId, dept } = req.body;

        // ตรวจสอบว่าถ้ามีการเลือกพนักงาน (ส่ง memberId มาด้วย) แปลว่ากำลังส่งต่อไปยังขั้นตอน 3D
        if (memberId && memberId !== "") {
            updateTaskSql = 'UPDATE tasks SET assign_to = ?, status = ? WHERE id_task = ?';
            updateParams = [memberId, 'DESIGN_3D', taskId]; // เปลี่ยนสถานะเป็น DESIGN_3D ถูกต้อง
            trackingStatus = 'SEND_TO_3D';
            departmentName = dept || 'Interior';
        } else {
            // กรณีปกติ (ส่งจาก Interior ไป Pricing ขั้นตอนที่ 3)
            updateTaskSql = 'UPDATE tasks SET assign_to = NULL, status = ? WHERE id_task = ?';
            updateParams = ['PRICING', taskId];
            trackingStatus = 'SEND_TO_PRICING';
            departmentName = 'Pricing';
        }

    } else if (action === 'START_3D_WORK') {
        updateTaskSql = 'UPDATE tasks SET assign_to = ?, status = ? WHERE id_task = ?';
        updateParams = [userId, 'DESIGN_3D', taskId];
        trackingStatus = 'START_3D'; // บันทึกว่าเริ่มงาน 3D แล้ว (เพื่อให้หน้าบ้านเปลี่ยนเป็นสีฟ้า)
        departmentName = 'Interior';

    } else if (action === 'SUBMIT_3D_WORK') {
        updateTaskSql = 'UPDATE tasks SET status = ? WHERE id_task = ?';
        updateParams = ['COMPLETED', taskId]; // เปลี่ยนสถานะงานหลักเป็นจบโครงการ
        trackingStatus = 'COMPLETE'; // ใช้คำว่า COMPLETE ที่ฐานข้อมูลรู้จักอยู่แล้ว
        departmentName = 'Interior';

    } else if (action === 'REVISE') {
        const rollbackStatus = dept || 'INTERIOR';

        updateTaskSql = 'UPDATE tasks SET status = ? WHERE id_task = ?';
        updateParams = [rollbackStatus, taskId]; // จะถูกเปลี่ยนเป็น INTERIOR, PRICING หรือ DESIGN_3D
        trackingStatus = 'REQUEST_REVISION';

    } else if (action === 'COMPLETE') {
        updateTaskSql = 'UPDATE tasks SET status = ? WHERE id_task = ?';
        updateParams = ['COMPLETED', taskId];
        trackingStatus = 'COMPLETE';

    } else {
        updateTaskSql = 'UPDATE tasks SET status = ? WHERE id_task = ?';
        updateParams = [action, taskId];
    }

    // 2. อัปเดตตาราง tasks
    db.query(updateTaskSql, updateParams, (err, result) => {
        if (err) {
            console.error("Error updating task:", err);
            return res.status(500).json({ error: err.message });
        }

        // 3. บันทึกประวัติลงตาราง tracking (ถ้า trackingStatus เป็น null ให้ข้ามการบันทึกชั่วคราว)
        if (!trackingStatus) {
            return res.json({ message: 'Action executed successfully' });
        }

        const trackingSql = 'INSERT INTO tracking (status, id_task, id_users, department, action_at) VALUES (?, ?, ?, ?, NOW())';
        db.query(trackingSql, [trackingStatus, taskId, userId, departmentName], (trackErr) => {
            if (trackErr) {
                console.error("Error inserting tracking:", trackErr);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Action executed successfully' });
        });
    });
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});

// Get notifications (tasks assigned to user)
app.get('/tasks/notifications/:userId/:role', (req, res) => {
    const { userId, role } = req.params;
    const normalizedRole = role ? role.toLowerCase().trim() : '';

    let sql = '';
    let params = [];

    // 1. ผู้บริหาร (Admin / Project Director)
    if (normalizedRole === 'admin' || normalizedRole === 'project director' || normalizedRole === 'project_director') {
        sql = `
            SELECT t.id_task, t.task_name, t.task_type, t.status, tr.status AS tracking_status, tr.action_at AS created_at 
            FROM tasks t
            JOIN tracking tr ON t.id_task = tr.id_task
            WHERE (
                (t.status = 'WAITING_CONFIRM' AND tr.status IN ('SEND_TO_PROJECTDIRECTOR', 'SUBMIT_WORK', 'SUBMIT_3D_WORK', 'PENDING_REVIEW')) OR
                (t.status = 'COMPLETED' AND tr.status = 'COMPLETE')
            )
            ORDER BY tr.action_at DESC
        `;
        params = [];

        // 2. แผนก Interior
    } else if (normalizedRole === 'interior') {
        sql = `
            SELECT t.id_task, t.task_name, t.task_type, t.status, tr.status AS tracking_status, tr.action_at AS created_at 
            FROM tasks t
            JOIN tracking tr ON t.id_task = tr.id_task
            WHERE t.assign_to = ? 
            AND (
                (
                    -- 🔴 ประวัติออกแบบรอบแรก (จะคงอยู่ตลอดไป ยกเว้นจะถูกส่งไป 3D ถึงจะโดนซ่อน)
                    tr.status IN ('SEND_TO_INTERIOR', 'REQUEST_REVISION')
                    AND tr.action_at >= COALESCE((SELECT MAX(action_at) FROM tracking WHERE id_task = t.id_task AND status = 'SEND_TO_INTERIOR'), '2000-01-01')
                    AND NOT EXISTS (SELECT 1 FROM tracking WHERE id_task = t.id_task AND status = 'SEND_TO_3D')
                ) 
                OR 
                (
                    -- 🔴 ประวัติรอบ 3D (จะคงอยู่ตลอดไปเช่นกัน)
                    tr.status IN ('SEND_TO_3D', 'REQUEST_REVISION')
                    AND tr.action_at >= COALESCE((SELECT MAX(action_at) FROM tracking WHERE id_task = t.id_task AND status = 'SEND_TO_3D'), '2000-01-01')
                )
            )
            ORDER BY tr.action_at DESC
        `;
        params = [userId];

        // 3. แผนกอื่นๆ เช่น Pricing
    } else {
        sql = `
            SELECT t.id_task, t.task_name, t.task_type, t.status, tr.status AS tracking_status, tr.action_at AS created_at 
            FROM tasks t
            JOIN tracking tr ON t.id_task = tr.id_task
            -- 🔴 ลบเงื่อนไขล็อกสถานะ PRICING ออกแล้ว ทำให้ประวัติยังอยู่แม้โครงการปิด (COMPLETED)
            WHERE (t.assign_to = ? OR (t.status = 'PRICING' AND t.assign_to IS NULL))
            AND tr.status IN ('SEND_TO_PRICING', 'REQUEST_REVISION')
            AND LOWER(tr.department) = 'pricing'
            AND tr.action_at >= COALESCE((SELECT MAX(action_at) FROM tracking WHERE id_task = t.id_task AND status = 'SEND_TO_PRICING'), '2000-01-01')
            ORDER BY tr.action_at DESC
        `;
        params = [userId];
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results || []);
    });
});


app.get('/users/by-role/:role', (req, res) => {
    const { role } = req.params;

    // ใช้รูปแบบ Callback ให้ตรงกับจุดอื่นๆ ในโปรเจกต์ของคุณ
    // และเปลี่ยน id_user / name ให้ตรงกับโครงสร้างตาราง users จริงๆ (id_users, username)
    const sql = 'SELECT id_users, username, role FROM users WHERE role = ?';

    db.query(sql, [role], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results || []);
    });
});