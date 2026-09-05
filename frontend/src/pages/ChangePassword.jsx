import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔴 State สำหรับควบคุมการเปิด-ปิดตาของแต่ละช่อง
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);

    try {
      const userId = user?.id || user?.id_users;
      const response = await fetch(`http://localhost:5000/users/${userId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        }),
      });

      if (response.ok) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'รหัสผ่านเดิมไม่ถูกต้อง หรือเกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout hideSidebar={true}>
      <div className="max-w-4xl mx-auto mt-6 mb-10 px-4 w-full">
        
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-200 overflow-hidden">
          
          <form onSubmit={handleSubmit}>
            <div className="p-8 md:p-12">
              <h2 className="text-[24px] font-bold text-gray-900 mb-10">
                เปลี่ยนรหัสผ่าน
              </h2>

              <div className="flex flex-col items-center justify-center">
                <div className="w-full max-w-lg flex flex-col gap-6">
                  
                  {/* รหัสผ่านเดิม */}
                  <div>
                    <label className="block text-[14px] font-bold text-gray-700 mb-2">
                      รหัสผ่านเดิม
                    </label>
                    <div className="relative">
                      <input 
                        type={showOldPassword ? "text" : "password"}
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-5 py-3 pr-12 border border-gray-400 rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-gray-800 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* รหัสผ่านใหม่ */}
                  <div>
                    <label className="block text-[14px] font-bold text-gray-700 mb-2">
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-5 py-3 pr-12 border border-gray-400 rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-gray-800 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* ยืนยันรหัสผ่านใหม่ */}
                  <div>
                    <label className="block text-[14px] font-bold text-gray-700 mb-2">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-5 py-3 pr-12 border border-gray-400 rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-gray-800 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* เส้นคั่น */}
            <hr className="w-full border-t border-gray-200" />

            {/* ส่วนปุ่มกดด้านล่าง */}
            <div className="bg-gray-50/50 px-8 py-5 flex justify-end gap-4 items-center">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold bg-white hover:bg-gray-50 transition-colors shadow-sm text-[15px]"
              >
                ยกเลิก
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-lg text-white font-bold transition-colors shadow-sm text-[15px] ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#4068FF] hover:bg-blue-600'
                }`}
              >
                {isLoading ? 'กำลังประมวลผล...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </Layout>
  );
}

export default ChangePassword;