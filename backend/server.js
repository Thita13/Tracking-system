const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'project_tracking_files',
        resource_type: 'auto'
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// Upload folder
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(
    '/uploads',
    express.static(uploadDir)
);

// Home
app.get('/', (req, res) => {
    res.send('Backend Running');
});

// Test Database
app.get('/test-db', (req, res) => {

    const sql = 'SELECT * FROM users';

    db.query(sql, (err, results) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);
    });
});

// Create User
app.post('/users', (req, res) => {

    const {
        username,
        phone,
        email,
        role,
        password
    } = req.body;

    const checkEmailSql = `
        SELECT id_users
        FROM users
        WHERE email = ?
        AND is_active = 1
    `;

    db.query(
        checkEmailSql,
        [email],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message:
                        'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'
                });
            }

            const hashedPassword =
                bcrypt.hashSync(password, 10);

            const sql = `
                INSERT INTO users
                (
                    username,
                    phone,
                    email,
                    role,
                    password
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    username,
                    phone,
                    email,
                    role,
                    hashedPassword
                ],
                (err, insertResults) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        message: 'User created',
                        userId: insertResults.insertId
                    });
                }
            );
        }
    );
});


// Get Active Users
app.get('/users', (req, res) => {

    const sql = `
        SELECT
            id_users,
            username,
            phone,
            email,
            role,
            created_at,
            updated_at
        FROM users
        WHERE is_active = 1
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);
    });
});


// Get User
app.get('/users/:id', (req, res) => {

    const id = req.params.id;

    const sql = `
        SELECT
            id_users,
            username,
            phone,
            email,
            role,
            created_at,
            updated_at
        FROM users
        WHERE id_users = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(results[0]);
    });
});


// Update User
app.put('/users/:id', (req, res) => {

    const id = req.params.id;

    const {
        username,
        phone,
        email,
        role,
        password
    } = req.body;

    const checkEmailSql = `
        SELECT id_users
        FROM users
        WHERE email = ?
        AND id_users != ?
        AND is_active = 1
    `;

    db.query(
        checkEmailSql,
        [email, id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message:
                        'อีเมลนี้มีผู้ใช้งานรายอื่นใช้แล้ว กรุณาใช้อีเมลอื่น'
                });
            }

            let sql;
            let params;

            if (password && password.length > 0) {

                const hashedPassword =
                    bcrypt.hashSync(password, 10);

                sql = `
                    UPDATE users
                    SET
                        username = ?,
                        phone = ?,
                        email = ?,
                        role = ?,
                        password = ?
                    WHERE id_users = ?
                `;

                params = [
                    username,
                    phone,
                    email,
                    role,
                    hashedPassword,
                    id
                ];

            } else {

                sql = `
                    UPDATE users
                    SET
                        username = ?,
                        phone = ?,
                        email = ?,
                        role = ?
                    WHERE id_users = ?
                `;

                params = [
                    username,
                    phone,
                    email,
                    role,
                    id
                ];
            }

            db.query(
                sql,
                params,
                (updateErr, updateResults) => {

                    if (updateErr) {
                        return res.status(500).json({
                            error: updateErr.message
                        });
                    }

                    if (
                        updateResults.affectedRows === 0
                    ) {
                        return res.status(404).json({
                            message:
                                'User not found'
                        });
                    }

                    res.json({
                        message:
                            'User updated successfully'
                    });
                }
            );
        }
    );
});


// Delete / Disable User
app.delete('/users/:id', (req, res) => {

    const id = req.params.id;

    db.query(
        'UPDATE tasks SET assign_to = NULL WHERE assign_to = ?',
        [id],
        err => {

            if (err) {
                console.error(
                    'Clear assign_to error:',
                    err
                );
            }

            const sql = `
                UPDATE users
                SET is_active = 0
                WHERE id_users = ?
            `;

            db.query(
                sql,
                [id],
                (err, results) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (
                        results.affectedRows === 0
                    ) {
                        return res.status(404).json({
                            message:
                                'User not found'
                        });
                    }

                    res.json({
                        message:
                            'User deleted successfully'
                    });
                }
            );
        }
    );
});


// Change Password
app.put('/users/:id/change-password', (req, res) => {

    const userId = req.params.id;

    const {
        oldPassword,
        newPassword
    } = req.body;

    const sqlSelect = `
        SELECT password
        FROM users
        WHERE id_users = ?
    `;

    db.query(
        sqlSelect,
        [userId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            const isMatch =
                bcrypt.compareSync(
                    oldPassword,
                    results[0].password
                );

            if (!isMatch) {
                return res.status(401).json({
                    message:
                        'รหัสผ่านเดิมไม่ถูกต้อง'
                });
            }

            const hashedNewPassword =
                bcrypt.hashSync(
                    newPassword,
                    10
                );

            const sqlUpdate = `
                UPDATE users
                SET password = ?
                WHERE id_users = ?
            `;

            db.query(
                sqlUpdate,
                [
                    hashedNewPassword,
                    userId
                ],
                updateErr => {

                    if (updateErr) {
                        return res.status(500).json({
                            error:
                                updateErr.message
                        });
                    }

                    res.json({
                        message:
                            'เปลี่ยนรหัสผ่านสำเร็จ'
                    });
                }
            );
        }
    );
});


// Reset Password
app.put('/users/:id/reset-password', (req, res) => {

    const userId = req.params.id;

    const {
        newPassword
    } = req.body;

    const hashedNewPassword =
        bcrypt.hashSync(
            newPassword,
            10
        );

    const sql = `
        UPDATE users
        SET password = ?
        WHERE id_users = ?
    `;

    db.query(
        sql,
        [
            hashedNewPassword,
            userId
        ],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (
                results.affectedRows === 0
            ) {
                return res.status(404).json({
                    message:
                        'User not found'
                });
            }

            res.json({
                message:
                    'รีเซ็ตรหัสผ่านสำเร็จ'
            });
        }
    );
});


// Login
app.post('/login', (req, res) => {

    const {
        email,
        password
    } = req.body;

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
        AND is_active = 1
    `;

    db.query(
        sql,
        [email],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message:
                        'ไม่พบผู้ใช้งาน หรือบัญชีนี้ถูกระงับ'
                });
            }

            const user = results[0];

            const isMatch =
                bcrypt.compareSync(
                    password,
                    user.password
                );

            if (!isMatch) {
                return res.status(401).json({
                    message:
                        'Invalid password'
                });
            }

            res.json({
                message: 'Login success',
                user: {
                    id: user.id_users,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }
    );
});


// Get Users By Role
app.get('/users/by-role/:role', (req, res) => {

    const { role } = req.params;

    const sql = `
        SELECT
            id_users,
            username,
            role
        FROM users
        WHERE role = ?
        AND is_active = 1
    `;

    db.query(
        sql,
        [role],
        (err, results) => {

            if (err) {
                console.error(
                    'Database Error:',
                    err
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results || []);
        }
    );
});

// Create Task
app.post(
    '/tasks',
    upload.single('file'),
    (req, res) => {

        const {
            task_name,
            task_type,
            customer_name,
            customer_phone,
            description,
            status,
            id_users,
            assigned_to
        } = req.body;

        const sql = `
            INSERT INTO tasks
            (
                task_name,
                task_type,
                customer_name,
                customer_phone,
                description,
                status,
                id_users,
                assign_to,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        db.query(
            sql,
            [
                task_name,
                task_type,
                customer_name,
                customer_phone,
                description,
                status || 'NEW',
                parseInt(id_users),
                assigned_to
                    ? parseInt(assigned_to)
                    : null
            ],
            (err, results) => {

                if (err) {
                    console.error(
                        'SQL ERROR:',
                        err
                    );

                    return res.status(500).json({
                        message:
                            'Database Error',
                        details:
                            err.message
                    });
                }

                const newTaskId =
                    results.insertId;

                const getCreatorRoleSql = `
                    SELECT role
                    FROM users
                    WHERE id_users = ?
                `;

                db.query(
                    getCreatorRoleSql,
                    [parseInt(id_users)],
                    (roleErr, roleResults) => {

                        if (roleErr) {
                            return res.status(500).json({
                                error:
                                    roleErr.message
                            });
                        }

                        const creatorRole =
                            roleResults.length > 0
                                ? roleResults[0].role
                                : 'System';

                        const trackingSql = `
                            INSERT INTO tracking
                            (
                                status,
                                id_task,
                                id_users,
                                department,
                                action_at
                            )
                            VALUES (?, ?, ?, ?, NOW())
                        `;

                        db.query(
                            trackingSql,
                            [
                                'CREATE_TASK',
                                newTaskId,
                                parseInt(id_users),
                                creatorRole
                            ],
                            trackErr => {

                                if (trackErr) {
                                    console.error(
                                        'Tracking Error:',
                                        trackErr
                                    );
                                }

                                if (req.file) {

                                    const insertFileSql = `
                                        INSERT INTO files
                                        (
                                            file_name,
                                            file_path,
                                            version,
                                            id_task,
                                            id_users
                                        )
                                        VALUES (?, ?, 1, ?, ?)
                                    `;

                                    db.query(
                                        insertFileSql,
                                        [
                                            req.file.originalname,
                                            req.file.path,
                                            newTaskId,
                                            parseInt(id_users)
                                        ],
                                        fileErr => {

                                            if (fileErr) {
                                                return res.status(500).json({
                                                    message:
                                                        'บันทึกงานสำเร็จ แต่บันทึกไฟล์ไม่สำเร็จ'
                                                });
                                            }

                                            res.status(201).json({
                                                message:
                                                    'สร้างงานและบันทึกไฟล์สำเร็จ',
                                                taskId:
                                                    newTaskId
                                            });
                                        }
                                    );

                                } else {

                                    res.status(201).json({
                                        message:
                                            'สร้างงานสำเร็จ',
                                        taskId:
                                            newTaskId
                                    });
                                }
                            }
                        );
                    }
                );
            }
        );
    }
);


// My Tasks
app.get(
    '/tasks/my-tasks/:userId',
    (req, res) => {

        const userId =
            req.params.userId;

        const sql = `
            SELECT
                t.*,
                tr.department
            FROM tasks t
            JOIN tracking tr
                ON t.id_task = tr.id_task
            WHERE tr.id_users = ?
            AND tr.action_at = (
                SELECT MAX(action_at)
                FROM tracking
                WHERE id_task = t.id_task
            )
            ORDER BY t.created_at DESC
        `;

        db.query(
            sql,
            [userId],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.json(results);
            }
        );
    }
);


// Get All Tasks
app.get('/tasks', (req, res) => {

    const sql = `
        SELECT
            tasks.id_task,
            tasks.task_name,
            tasks.task_type,
            tasks.customer_name,
            tasks.customer_phone,
            tasks.description,
            tasks.created_at,
            tasks.status,
            tasks.accepted_at,
            tasks.assign_to,
            users.username AS created_by
        FROM tasks
        JOIN users
            ON tasks.id_users = users.id_users
        ORDER BY tasks.id_task ASC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(results);
        }
    );
});


// Get Task By ID
app.get('/tasks/:id', (req, res) => {

    const taskId =
        req.params.id;

    const sql = `
        SELECT
            t.*,
            u1.username AS created_by,
            u1.role AS created_by_role,
            u2.username AS assigned_to_name,
            u2.role AS assigned_to_role
        FROM tasks t
        JOIN users u1
            ON t.id_users = u1.id_users
        LEFT JOIN users u2
            ON t.assign_to = u2.id_users
        WHERE t.id_task = ?
    `;

    db.query(
        sql,
        [taskId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message:
                        'Task not found'
                });
            }

            res.json(results[0]);
        }
    );
});


// Update Task
app.put('/tasks/:id', (req, res) => {

    const id =
        req.params.id;

    const {
        task_name,
        task_type,
        customer_name,
        customer_phone,
        description,
        status,
        id_users
    } = req.body;

    const sql = `
        UPDATE tasks
        SET
            task_name = ?,
            task_type = ?,
            customer_name = ?,
            customer_phone = ?,
            description = ?,
            status = ?,
            id_users = ?
        WHERE id_task = ?
    `;

    db.query(
        sql,
        [
            task_name,
            task_type,
            customer_name,
            customer_phone,
            description,
            status,
            id_users,
            id
        ],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (
                results.affectedRows === 0
            ) {
                return res.status(404).json({
                    message:
                        'Task not found'
                });
            }

            res.json({
                message:
                    'Task updated successfully'
            });
        }
    );
});


// Delete Task
app.delete('/tasks/:id', (req, res) => {

    const id =
        req.params.id;

    const sql =
        'DELETE FROM tasks WHERE id_task = ?';

    db.query(
        sql,
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (
                results.affectedRows === 0
            ) {
                return res.status(404).json({
                    message:
                        'Task not found'
                });
            }

            res.json({
                message:
                    'Task deleted'
            });
        }
    );
});

// Create Tracking
app.post('/tracking', (req, res) => {

    const {
        status,
        id_task,
        id_users,
        department
    } = req.body;

    const sql = `
        INSERT INTO tracking
        (
            status,
            id_task,
            id_users,
            department
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            status,
            id_task,
            id_users,
            department
        ],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message:
                    'Tracking created',
                trackingId:
                    results.insertId
            });
        }
    );
});


// Get Tracking
app.get(
    '/tasks/:id/tracking',
    (req, res) => {

        const taskId =
            req.params.id;

        const sql = `
            SELECT
                tracking.id_tracking,
                tracking.status,
                tracking.action_at,
                users.username AS action_by,
                tracking.department
            FROM tracking
            JOIN users
                ON tracking.id_users = users.id_users
            WHERE tracking.id_task = ?
            ORDER BY tracking.action_at ASC
        `;

        db.query(
            sql,
            [taskId],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.json(results);
            }
        );
    }
);

// TASK ACTION
app.post(
    '/tasks/:id/action',
    (req, res) => {

        const taskId =
            req.params.id;

        const {
            action,
            dept,
            memberId,
            userId,
            role
        } = req.body;

        let updateTaskSql = '';
        let updateParams = [];

        let trackingStatus = action;

        let departmentName =
            dept || role || 'System';
        // Admin ใช้แค่ ASSIGN แต่ทุกครั้งที่ ASSIGN จะต้องบันทึก Tracking
        // accepted_at = NULL เพื่อให้ผู้รับต้องกด "รับงาน" ใหม่
        if (
            action === 'ASSIGN' &&
            role === 'Admin'
        ) {

            // Admin → Project Director
            if (
                dept === 'Project Director'
            ) {

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        assign_to = NULL,
                        status = 'WAITING_CONFIRM',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    taskId
                ];

                trackingStatus =
                    'SEND_TO_PROJECTDIRECTOR';

                departmentName =
                    'Admin';
            }

            // Admin → Interior
            else if (
                dept === 'Interior'
            ) {

                if (!memberId) {

                    return res.status(400).json({
                        error:
                            'กรุณาเลือกผู้รับผิดชอบ Interior'
                    });
                }

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        assign_to = ?,
                        status = 'INTERIOR',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    memberId,
                    taskId
                ];

                trackingStatus =
                    'SEND_TO_INTERIOR';

                departmentName =
                    'Admin';
            }

            // Admin → Pricing
            else if (
                dept === 'Pricing'
            ) {

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        assign_to = NULL,
                        status = 'PRICING',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    taskId
                ];

                trackingStatus =
                    'SEND_TO_PRICING';

                departmentName =
                    'Admin';
            }

            // Admin → Interior 3D
            else if (
                dept === 'Interior 3D'
            ) {

                if (!memberId) {

                    return res.status(400).json({
                        error:
                            'กรุณาเลือกผู้รับผิดชอบ Interior 3D'
                    });
                }

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        assign_to = ?,
                        status = 'DESIGN_3D',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    memberId,
                    taskId
                ];

                trackingStatus =
                    'SEND_TO_3D';

                departmentName =
                    'Admin';
            }

            // Admin → เสร็จสิ้นโครงการ
            else if (
                dept === 'COMPLETED'
            ) {

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        status = 'COMPLETED',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    taskId
                ];

                trackingStatus =
                    'COMPLETE';

                departmentName =
                    'Admin';
            }

            else {

                return res.status(400).json({
                    error:
                        'ไม่พบแผนกหรือขั้นตอนที่เลือก'
                });
            }
        }

        // NORMAL USER ASSIGN
        else if (
            action === 'ASSIGN'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET
                    assign_to = ?,
                    status = 'INTERIOR',
                    accepted_at = NULL
                WHERE id_task = ?
            `;

            updateParams = [
                memberId || null,
                taskId
            ];

            trackingStatus =
                'SEND_TO_INTERIOR';

            departmentName =
                'Interior';
        }

        // INTERIOR ACCEPT
        else if (
            action === 'START_WORK'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET
                    assign_to = ?,
                    status = 'INTERIOR',
                    accepted_at = NOW()
                WHERE id_task = ?
            `;

            updateParams = [
                userId,
                taskId
            ];

            trackingStatus =
                'START_INTERIOR';

            departmentName =
                'Interior';
        }

        // PRICING ACCEPT
        else if (
            action === 'CLAIM_PRICING'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET
                    assign_to = ?,
                    status = 'PRICING',
                    accepted_at = NOW()
                WHERE id_task = ?
            `;

            updateParams = [
                userId,
                taskId
            ];

            trackingStatus =
                'START_PRICING';

            departmentName =
                'Pricing';
        }

        // SUBMIT WORK
        else if (
            action === 'SEND_TO_PROJECTDIRECTOR' ||
            action === 'SUBMIT_WORK'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET status = 'WAITING_CONFIRM'
                WHERE id_task = ?
            `;

            updateParams = [
                taskId
            ];

            trackingStatus =
                'SEND_TO_PROJECTDIRECTOR';

            departmentName =
                role;
        }

        // Project Director ส่งต่อไป 3D หรือ Pricing
        else if (
            action === 'NEXT_STEP'
        ) {

            if (
                memberId &&
                memberId !== ''
            ) {

                // ส่งไป 3D

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        assign_to = ?,
                        status = 'DESIGN_3D',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    memberId,
                    taskId
                ];

                trackingStatus =
                    'SEND_TO_3D';

                departmentName =
                    dept || 'Interior';

            } else {

                // ส่งไป Pricing

                updateTaskSql = `
                    UPDATE tasks
                    SET
                        assign_to = NULL,
                        status = 'PRICING',
                        accepted_at = NULL
                    WHERE id_task = ?
                `;

                updateParams = [
                    taskId
                ];

                trackingStatus =
                    'SEND_TO_PRICING';

                departmentName =
                    'Pricing';
            }
        }

        // 3D ACCEPT
        else if (
            action === 'START_3D_WORK'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET
                    assign_to = ?,
                    status = 'DESIGN_3D',
                    accepted_at = NOW()
                WHERE id_task = ?
            `;

            updateParams = [
                userId,
                taskId
            ];

            trackingStatus =
                'START_3D';

            departmentName =
                'Interior';
        }

        // 3D SUBMIT / COMPLETE
        else if (
            action === 'SUBMIT_3D_WORK'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET status = 'COMPLETED'
                WHERE id_task = ?
            `;

            updateParams = [
                taskId
            ];

            trackingStatus =
                'COMPLETE';

            departmentName =
                'Interior';
        }

        // PROJECT DIRECTOR → REVISION
        else if (
            action === 'REVISE'
        ) {

            const rollbackStatus =
                dept || 'INTERIOR';

            updateTaskSql = `
                UPDATE tasks
                SET
                    status = ?,
                    accepted_at = NULL
                WHERE id_task = ?
            `;

            updateParams = [
                rollbackStatus,
                taskId
            ];

            trackingStatus =
                'REQUEST_REVISION';

            if (
                rollbackStatus === 'INTERIOR'
            ) {

                departmentName =
                    'Interior';

            } else if (
                rollbackStatus === 'PRICING'
            ) {

                departmentName =
                    'Pricing';

            } else if (
                rollbackStatus === 'DESIGN_3D'
            ) {

                departmentName =
                    'Interior 3D';
            }
        }

        // COMPLETE
        else if (
            action === 'COMPLETE'
        ) {

            updateTaskSql = `
                UPDATE tasks
                SET status = 'COMPLETED'
                WHERE id_task = ?
            `;

            updateParams = [
                taskId
            ];

            trackingStatus =
                'COMPLETE';
        }

        // DEFAULT
        else {

            updateTaskSql = `
                UPDATE tasks
                SET status = ?
                WHERE id_task = ?
            `;

            updateParams = [
                action,
                taskId
            ];
        }

        // UPDATE TASK
        db.query(
            updateTaskSql,
            updateParams,
            (err, result) => {

                if (err) {

                    console.error(
                        'Error updating task:',
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                // INSERT TRACKING
                if (!trackingStatus) {

                    return res.json({
                        message:
                            'Action executed successfully'
                    });
                }

                const trackingSql = `
                    INSERT INTO tracking
                    (
                        status,
                        id_task,
                        id_users,
                        department,
                        action_at
                    )
                    VALUES (?, ?, ?, ?, NOW())
                `;

                db.query(
                    trackingSql,
                    [
                        trackingStatus,
                        taskId,
                        userId,
                        departmentName
                    ],
                    trackErr => {

                        if (trackErr) {

                            console.error(
                                'Error inserting tracking:',
                                trackErr
                            );

                            return res.status(500).json({
                                error:
                                    trackErr.message
                            });
                        }

                        res.json({
                            message:
                                'Action executed successfully'
                        });
                    }
                );
            }
        );
    }
);

// Add Comment
app.post(
    '/tasks/:id/comments',
    (req, res) => {

        const taskId =
            req.params.id;

        const {
            comment,
            created_at,
            id_users
        } = req.body;

        const findTrackingSql = `
            SELECT id_tracking
            FROM tracking
            WHERE id_task = ?
            AND id_users = ?
            ORDER BY action_at DESC
            LIMIT 1
        `;

        db.query(
            findTrackingSql,
            [
                taskId,
                id_users
            ],
            (trackErr, trackResults) => {

                if (trackErr) {
                    return res.status(500).json({
                        error:
                            trackErr.message
                    });
                }

                let idTracking;

                if (
                    trackResults.length > 0
                ) {

                    idTracking =
                        trackResults[0]
                            .id_tracking;

                    executeInsertComment(
                        idTracking
                    );

                } else {

                    const createTrackingSql = `
                        INSERT INTO tracking
                        (
                            status,
                            id_task,
                            id_users,
                            department,
                            action_at
                        )
                        VALUES (?, ?, ?, ?, NOW())
                    `;

                    db.query(
                        createTrackingSql,
                        [
                            'COMMENT_ACTION',
                            taskId,
                            id_users,
                            'Project Director'
                        ],
                        (insErr, insRes) => {

                            if (insErr) {
                                return res.status(500).json({
                                    error:
                                        insErr.message
                                });
                            }

                            executeInsertComment(
                                insRes.insertId
                            );
                        }
                    );
                }


                function executeInsertComment(
                    trackingId
                ) {

                    const insertSql = `
                        INSERT INTO comments
                        (
                            comment,
                            created_at,
                            id_users,
                            id_task,
                            id_tracking
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    db.query(
                        insertSql,
                        [
                            comment,
                            created_at,
                            id_users,
                            taskId,
                            trackingId
                        ],
                        (err, results) => {

                            if (err) {
                                return res.status(500).json({
                                    error:
                                        err.message
                                });
                            }

                            res.status(201).json({
                                message:
                                    'Comment added',
                                commentId:
                                    results.insertId
                            });
                        }
                    );
                }
            }
        );
    }
);


// Get Comments
app.get(
    '/tasks/:id/comments',
    (req, res) => {

        const taskId =
            req.params.id;

        const sql = `
            SELECT
                comments.id_comment,
                comments.comment,
                comments.created_at,
                users.username AS commented_by,
                users.role AS commented_by_role
            FROM comments
            JOIN users
                ON comments.id_users =
                   users.id_users
            WHERE comments.id_task = ?
            ORDER BY comments.created_at ASC
        `;

        db.query(
            sql,
            [taskId],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                res.json(results);
            }
        );
    }
);

// Upload File
app.post(
    '/tasks/:id/files',
    upload.single('file'),
    (req, res) => {

        const taskId =
            req.params.id;

        const userId =
            req.body.userId || null;

        if (!req.file) {
            return res.status(400).json({
                error:
                    'ไม่พบไฟล์ที่อัปโหลด'
            });
        }

        const fileName =
            req.file.originalname;

        const fileUrl =
            req.file.path;

        const versionSql = `
            SELECT
                COALESCE(MAX(version), 0) + 1
                AS nextVersion
            FROM files
            WHERE id_task = ?
        `;

        db.query(
            versionSql,
            [taskId],
            (err, versionResults) => {

                if (err) {
                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                const nextVersion =
                    versionResults[0]
                        .nextVersion;

                const insertSql = `
                    INSERT INTO files
                    (
                        file_name,
                        file_path,
                        id_task,
                        version,
                        id_users
                    )
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    insertSql,
                    [
                        fileName,
                        fileUrl,
                        taskId,
                        nextVersion,
                        userId
                    ],
                    (err, results) => {

                        if (err) {
                            return res.status(500).json({
                                error:
                                    err.message
                            });
                        }

                        res.status(201).json({
                            message:
                                'File uploaded successfully',
                            fileId:
                                results.insertId,
                            fileUrl:
                                fileUrl
                        });
                    }
                );
            }
        );
    }
);

// Get Files
app.get(
    '/tasks/:id/files',
    (req, res) => {

        const taskId =
            req.params.id;

        const sql = `
            SELECT
                f.id_files,
                f.file_name,
                f.file_path,
                f.version,
                f.created_at,
                f.id_users,
                u.role AS uploaded_by_role,
                u.username AS uploaded_by_name
            FROM files f
            LEFT JOIN users u
                ON f.id_users = u.id_users
            WHERE f.id_task = ?
            ORDER BY f.version ASC
        `;

        db.query(
            sql,
            [taskId],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                res.json(
                    results || []
                );
            }
        );
    }
);

// Delete File
app.delete(
    '/tasks/:taskId/files/:fileId',
    (req, res) => {

        const {
            taskId,
            fileId
        } = req.params;

        const selectSql = `
            SELECT file_path
            FROM files
            WHERE id_files = ?
            AND id_task = ?
        `;

        db.query(
            selectSql,
            [
                fileId,
                taskId
            ],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                if (
                    results.length === 0
                ) {
                    return res.status(404).json({
                        error:
                            'ไม่พบไฟล์'
                    });
                }

                const deleteSql = `
                    DELETE FROM files
                    WHERE id_files = ?
                `;

                db.query(
                    deleteSql,
                    [fileId],
                    err => {

                        if (err) {
                            return res.status(500).json({
                                error:
                                    err.message
                            });
                        }

                        res.json({
                            message:
                                'ลบไฟล์สำเร็จ'
                        });
                    }
                );
            }
        );
    }
);

// NOTIFICATIONS
app.get(
    '/tasks/notifications/:userId/:role',
    (req, res) => {

        const {
            userId,
            role
        } = req.params;

        const normalizedRole =
            role
                ? role.toLowerCase().trim()
                : '';

        let sql = '';
        let params = [];

        // ADMIN / PROJECT DIRECTOR
        if (
            normalizedRole === 'admin' ||
            normalizedRole === 'project director' ||
            normalizedRole === 'project_director'
        ) {

            sql = `
                SELECT
                    t.id_task,
                    t.task_name,
                    t.task_type,
                    t.status,
                    tr.status AS tracking_status,
                    tr.action_at AS created_at,
                    u.username AS action_by,
                    u.role AS action_by_role,
                    t.task_type AS detail
                FROM tasks t
                JOIN tracking tr
                    ON t.id_task = tr.id_task
                LEFT JOIN users u
                    ON tr.id_users = u.id_users
                WHERE
                    (
                        (
                            t.status = 'WAITING_CONFIRM'
                            AND tr.status IN (
                                'SEND_TO_PROJECTDIRECTOR',
                                'SUBMIT_WORK',
                                'SUBMIT_3D_WORK',
                                'PENDING_REVIEW'
                            )
                        )
                        OR
                        (
                            t.status = 'COMPLETED'
                            AND tr.status = 'COMPLETE'
                        )
                    )

                UNION

                SELECT
                    t.id_task,
                    t.task_name,
                    t.task_type,
                    t.status,
                    'NEW_COMMENT' AS tracking_status,
                    c.created_at,
                    u.username AS action_by,
                    u.role AS action_by_role,
                    c.comment AS detail
                FROM comments c
                JOIN tasks t
                    ON c.id_task = t.id_task
                JOIN users u
                    ON c.id_users = u.id_users
                WHERE c.id_comment IN (
                    SELECT MAX(id_comment)
                    FROM comments
                    WHERE id_users != ?
                    GROUP BY id_task
                )

                ORDER BY created_at DESC
            `;

            params = [
                userId
            ];
        }

        // INTERIOR
        else if (
            normalizedRole === 'interior'
        ) {

            sql = `
                SELECT
                    t.id_task,
                    t.task_name,
                    t.task_type,
                    t.status,
                    tr.status AS tracking_status,
                    tr.action_at AS created_at,
                    u.username AS action_by,
                    u.role AS action_by_role,
                    t.task_type AS detail
                FROM tasks t
                JOIN tracking tr
                    ON t.id_task = tr.id_task
                LEFT JOIN users u
                    ON tr.id_users = u.id_users
                WHERE
                    t.assign_to = ?
                    AND
                    (
                        (
                            tr.status IN (
                                'SEND_TO_INTERIOR',
                                'REQUEST_REVISION'
                            )
                            AND tr.action_at >= COALESCE(
                                (
                                    SELECT MAX(action_at)
                                    FROM tracking
                                    WHERE id_task = t.id_task
                                    AND status = 'SEND_TO_INTERIOR'
                                ),
                                '2000-01-01'
                            )
                            AND NOT EXISTS (
                                SELECT 1
                                FROM tracking
                                WHERE id_task = t.id_task
                                AND status = 'SEND_TO_3D'
                            )
                        )
                        OR
                        (
                            tr.status IN (
                                'SEND_TO_3D',
                                'REQUEST_REVISION'
                            )
                            AND tr.action_at >= COALESCE(
                                (
                                    SELECT MAX(action_at)
                                    FROM tracking
                                    WHERE id_task = t.id_task
                                    AND status = 'SEND_TO_3D'
                                ),
                                '2000-01-01'
                            )
                        )
                    )

                UNION

                SELECT
                    t.id_task,
                    t.task_name,
                    t.task_type,
                    t.status,
                    'NEW_COMMENT' AS tracking_status,
                    c.created_at,
                    u.username AS action_by,
                    u.role AS action_by_role,
                    c.comment AS detail
                FROM comments c
                JOIN tasks t
                    ON c.id_task = t.id_task
                JOIN users u
                    ON c.id_users = u.id_users
                WHERE
                    c.id_comment IN (
                        SELECT MAX(id_comment)
                        FROM comments
                        WHERE id_users != ?
                        GROUP BY id_task
                    )
                    AND t.assign_to = ?
                    AND c.created_at >= COALESCE(
                        (
                            SELECT MAX(action_at)
                            FROM tracking
                            WHERE id_task = t.id_task
                            AND status IN (
                                'SEND_TO_INTERIOR',
                                'SEND_TO_3D'
                            )
                        ),
                        '2000-01-01'
                    )

                ORDER BY created_at DESC
            `;

            params = [
                userId,
                userId,
                userId
            ];
        }

        // PRICING
        else {

            sql = `
                SELECT
                    t.id_task,
                    t.task_name,
                    t.task_type,
                    t.status,
                    tr.status AS tracking_status,
                    tr.action_at AS created_at,
                    u.username AS action_by,
                    u.role AS action_by_role,
                    t.task_type AS detail
                FROM tasks t
                JOIN tracking tr
                    ON t.id_task = tr.id_task
                LEFT JOIN users u
                    ON tr.id_users = u.id_users
                WHERE
                    (
                        t.assign_to = ?
                        OR (
                            t.status = 'PRICING'
                            AND t.assign_to IS NULL
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM tracking tr_sub
                            WHERE tr_sub.id_task = t.id_task
                            AND tr_sub.id_users = ?
                        )
                    )
                    AND tr.status IN (
                        'SEND_TO_PRICING',
                        'REQUEST_REVISION'
                    )
                    AND LOWER(tr.department) = 'pricing'
                    AND tr.action_at >= COALESCE(
                        (
                            SELECT MAX(action_at)
                            FROM tracking
                            WHERE id_task = t.id_task
                            AND status = 'SEND_TO_PRICING'
                        ),
                        '2000-01-01'
                    )

                UNION

                SELECT
                    t.id_task,
                    t.task_name,
                    t.task_type,
                    t.status,
                    'NEW_COMMENT' AS tracking_status,
                    c.created_at,
                    u.username AS action_by,
                    u.role AS action_by_role,
                    c.comment AS detail
                FROM comments c
                JOIN tasks t
                    ON c.id_task = t.id_task
                JOIN users u
                    ON c.id_users = u.id_users
                WHERE
                    c.id_comment IN (
                        SELECT MAX(id_comment)
                        FROM comments
                        WHERE id_users != ?
                        GROUP BY id_task
                    )
                    AND (
                        t.assign_to = ?
                        OR EXISTS (
                            SELECT 1
                            FROM tracking tr_sub
                            WHERE tr_sub.id_task = t.id_task
                            AND tr_sub.id_users = ?
                        )
                    )
                    AND c.created_at >= COALESCE(
                        (
                            SELECT MAX(action_at)
                            FROM tracking
                            WHERE id_task = t.id_task
                            AND status = 'SEND_TO_PRICING'
                        ),
                        '2000-01-01'
                    )

                ORDER BY created_at DESC
            `;

            params = [
                userId,
                userId,
                userId,
                userId,
                userId
            ];
        }


        db.query(
            sql,
            params,
            (err, results) => {

                if (err) {

                    console.error(
                        'Error fetching notifications:',
                        err
                    );

                    return res.status(500).json({
                        error:
                            err.message
                    });
                }

                res.json(
                    results || []
                );
            }
        );
    }
);

// START SERVER
app.listen(
    5000,
    () => {
        console.log(
            'Server running on port 5000'
        );
    }
);