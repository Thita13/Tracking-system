import { useState , useEffect } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import UserModal from '../components/UserModal'; // นำเข้า Component ที่เราเพิ่งสร้าง

function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/users');
        if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // เปิด Modal เพิ่มผู้ใช้ (ส่งค่า null ไปบอกว่าเป็นโหมดเพิ่ม)
  const handleAddUserClick = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // เปิด Modal แก้ไขผู้ใช้ (ส่งค่า user ไปบอกว่าเป็นโหมดแก้ไข)
  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // รับข้อมูลกลับมาจาก UserModal
  const handleSaveUser =  async (payload, isEditing) => {
    try {
        const url = isEditing 
        ? `http://localhost:5000/users/${editingUser.id_users}`
        : 'http://localhost:5000/users';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('ไม่สามารถบันทึกข้อมูลผู้ใช้งานได้');
        }
        toast.success(isEditing ? 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อย!' : 'เพิ่มผู้ใช้งานใหม่เรียบร้อย!');
        fetchUsers(); // รีเฟรชข้อมูลผู้ใช้งานหลังบันทึก
        setIsModalOpen(false); // ปิด Modal หลังบันทึก

        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้งาน');
        }
  };

  // --- ส่วนฟังก์ชันสำหรับ Reset Password ---
  const handleGenerateResetPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let autoPassword = "";
    for (let i = 0; i < 8; i++) {
      autoPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetNewPassword(autoPassword);
  };

  const handleSaveResetPassword = async () => {
    if (!editingUser) return;
    try{
        const response = await fetch(`http://localhost:5000/users/${editingUser.id_users}/reset-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: editingUser.username,
            email: editingUser.email,
            phone: editingUser.phone,
            role: editingUser.role,
            newPassword: resetNewPassword
          }),
        });
        if (!response.ok) throw new Error('ไม่สามารถรีเซ็ตรหัสผ่านได้');
        toast.success('รีเซ็ตรหัสผ่านเรียบร้อย!');
        setIsResetModalOpen(false);
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      
          
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px]">

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">ผู้ใช้งาน</h2>
          <button
            onClick={handleAddUserClick}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-800 font-bold transition-all"
          >
            <span className="text-xl leading-none pb-0.5">+</span>
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E5E7EB] text-gray-900">
                <th className="py-4 px-6 font-bold rounded-l-lg w-1/5">ชื่อ</th>
                <th className="py-4 px-6 font-bold w-1/5">อีเมล</th>
                <th className="py-4 px-6 font-bold w-1/5">เบอร์โทร</th>
                <th className="py-4 px-6 font-bold w-1/5">ตำแหน่ง</th>
                <th className="py-4 px-6 font-bold w-1/5">วันที่สร้าง</th>
                <th className="py-4 px-6 font-bold rounded-r-lg w-[120px] text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id_users} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-gray-900 font-medium">{user.username}</td>
                  <td className="py-4 px-6 text-gray-800">{user.email}</td>
                  <td className="py-4 px-6 text-gray-800">{user.phone}</td>
                  <td className="py-4 px-6 text-gray-900">{user.role}</td>
                  <td className="py-4 px-6 text-gray-800">{new Date(user.created_at).toLocaleDateString('th-TH')}</td>
                  <td className="py-4 px-6 text-center">

                    {/* ปุ่มแก้ไข (เรียก UserModal) */}
                    <button
                      onClick={() => handleEditClick(user)}
                      title="แก้ไขข้อมูล"
                      className="text-[#3B82F6] hover:text-blue-700 transition-colors p-1 mr-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📍 เรียกใช้ Component UserModal ที่แยกไว้ */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={editingUser}
        onSave={handleSaveUser}
        onReset={(user) => {
          setEditingUser(user);
          setIsModalOpen(false);       // ปิดหน้าแก้ไขก่อน
          handleGenerateResetPassword(); // สุ่มรหัส
          setIsResetModalOpen(true);    // เปิดหน้าต่างรีเซ็ต
        }}
      />

    </Layout>
  );
}

export default Users;