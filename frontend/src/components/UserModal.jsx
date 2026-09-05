import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import ConfirmModal from './ConfirmModal';

export default function UserModal({ isOpen, onClose, userToEdit, onSave, onReset }) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'Admin' });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setFormData({
                    name: userToEdit.username || '',
                    email: userToEdit.email || '',
                    phone: userToEdit.phone || '',
                    role: userToEdit.role || 'Admin'
                });
            } else {
                setFormData({ name: '', email: '', phone: '', role: 'Admin' });
                handleGeneratePassword();
            }
        }
    }, [isOpen, userToEdit]);

    const handleGeneratePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
        let autoPassword = "";
        for (let i = 0; i < 8; i++) {
            autoPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(autoPassword);
        return autoPassword;
    };

    // ฟังก์ชันกลางสำหรับส่งอีเมล
    const sendPasswordEmail = async (email, name, password) => {
        try {
            await emailjs.send(
                'service_yjerojo',
                'template_ks5jtn8',
                { to_name: name, to_email: email, password: password },
                'ag3jmEIjlbgo494P3'
            );
            return true;
        } catch (error) {
            console.error('Email failed...', error);
            return false;
        }
    };

    const handleSave = async () => {
        // 🔴 บังคับว่าก่อน @gmail.com ต้องมีอย่างน้อย 6 ตัวอักษรขึ้นไป (ป้องกันอีเมลสั้นเกินไปหรืออีเมลหลอก)
        const strictGmailRegex = /^[a-zA-Z0-9._%+-]{6,}@gmail\.com$/;

        if (!strictGmailRegex.test(formData.email)) {
            toast.error('กรุณากรอกอีเมลให้ถูกต้อง (ชื่ออีเมลต้องมีอย่างน้อย 6 ตัวอักษร และเป็น @gmail.com)');
            return;
        }

        const isEditing = !!userToEdit;

        // 2. ถ้าเป็นการเพิ่มผู้ใช้ใหม่ ให้ทดสอบส่งอีเมลก่อนบันทึกจริง
        if (!isEditing) {
            const toastId = toast.loading('กำลังตรวจสอบอีเมลและส่งรหัสผ่าน...');

            const success = await sendPasswordEmail(formData.email, formData.name, newPassword);

            toast.dismiss(toastId);

            if (!success) {
                toast.error('อีเมลนี้ไม่มีอยู่จริง หรือไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบใหม่อีกครั้ง');
                return; // หยุดการทำงาน ไม่สร้าง User
            }
        }

        // 3. เตรียมข้อมูล payload สำหรับส่งไปบันทึก
        const payload = {
            username: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            ...(isEditing ? {} : { password: newPassword })
        };

        const finalPlayload = isEditing ? { ...payload, id_users: userToEdit.id_users } : payload;

        // 4. บันทึกข้อมูลลงฐานข้อมูล
        onSave(finalPlayload, isEditing);
    };

    // ฟังก์ชันรีเซ็ตรหัสผ่านใหม่
    const handleResetPassword = async () => {
        const toastId = toast.loading('กำลังสุ่มรหัสผ่านและส่งอีเมล...');
        const resetPasswordStr = Math.random().toString(36).slice(-8);

        // 🔴 แก้ไขตรงนี้จาก userToEdit.name เป็น userToEdit.username
        const success = await sendPasswordEmail(userToEdit.email, userToEdit.username, resetPasswordStr);

        toast.dismiss(toastId);

        if (success) {
            try {
                const response = await fetch(`http://localhost:5000/users/${userToEdit.id_users}/reset-password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newPassword: resetPasswordStr }),
                });

                if (!response.ok) throw new Error('ไม่สามารถบันท็กรหัสผ่านลงฐานข้อมูลได้');

                toast.success('รีเซ็ตรหัสผ่านและส่งอีเมลสำเร็จ!');
                onClose();
            } catch (error) {
                toast.error('ส่งอีเมลสำเร็จ แต่บันทึกลงฐานข้อมูลไม่สำเร็จ');
            }
        } else {
            toast.error('ส่งอีเมลล้มเหลว กรุณาลองใหม่');
        }
    };
    
    if (!isOpen) return null;

    const isEditing = !!userToEdit;
    const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#188BFE] focus:border-transparent outline-none transition-all";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่'}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                    </div>

                    <div className="p-6 space-y-5">
                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">ชื่อ - นามสกุล</label><input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">อีเมล</label>
                            <input
                                type="text"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                onBlur={(e) => {
                                    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(e.target.value)) {
                                        toast.error('อีเมลต้องเป็น @gmail.com เท่านั้น');
                                    }
                                }}
                                className={inputClass}
                            /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">เบอร์โทร</label>
                            <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} /></div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">ตำแหน่ง</label>
                            <div className="flex items-center gap-4">
                                {['Project director', 'Interior', 'Pricing'].map(role => (
                                    <label
                                        key={role}
                                        className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all"
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role}
                                            checked={formData.role === role}
                                            onChange={() => setFormData({ ...formData, role })}
                                            className="accent-[#188BFE] w-4 h-4"
                                        />
                                        <span className={`text-sm font-medium ${formData.role === role ? 'text-[#188BFE]' : 'text-gray-700'}`}>
                                            {role}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="pt-3 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2">จัดการรหัสผ่าน</label>
                                <button type="button" onClick={handleResetPassword} className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#188BFE] text-[#188BFE] font-bold rounded-lg hover:bg-blue-50 transition-all">
                                    รีเซ็ตรหัสผ่านและส่งอีเมลแจ้งผู้ใช้
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-700 font-medium">ระบบจะส่งรหัสผ่านไปยังอีเมลของผู้ใช้งาน</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
                        {isEditing ? <button onClick={() => setIsConfirmOpen(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon /></button> : <div />}
                        <div className="flex space-x-3">
                            <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-[#188BFE] text-white rounded-lg font-bold hover:bg-blue-600">บันทึกข้อมูล</button>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={async () => {
                    try {
                        const response = await fetch(`http://localhost:5000/users/${userToEdit.id_users}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            throw new Error('ไม่สามารถลบผู้ใช้งานได้');
                        }

                        toast.success('ลบผู้ใช้งานเรียบร้อย!');
                        setIsConfirmOpen(false);
                        onClose();
                        window.location.reload();

                    } catch (error) {
                        toast.error(error.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
                    }
                }}
                title="ยืนยันการลบ"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน ${userToEdit?.username} นี้? การกระทำนี้ไม่สามารถย้อนกลับได้`}
            />
        </>
    );
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);