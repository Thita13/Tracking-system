import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const userId = user.id || user.id_users; 
        const response = await fetch(`http://localhost:5000/users/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          console.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-xl text-gray-500 font-semibold animate-pulse">กำลังโหลดข้อมูล...</div>
        </div>
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-xl text-red-500 font-semibold bg-red-50 px-6 py-4 rounded-2xl">
            ไม่พบข้อมูลผู้ใช้งาน
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-6 mb-10 px-4 w-full">

        {/* การ์ดโปรไฟล์หลัก */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-200 p-8 md:p-12">
          
          <h2 className="text-[26px] font-bold text-gray-900 mb-8 text-center">
            โปรไฟล์ของฉัน
          </h2>

          <div className="flex flex-col items-center justify-center gap-8">
            
            {/* 🔴 1. ปรับขนาดรูปให้เล็กลง (เปลี่ยนจาก 52 เป็น 32) */}
            <div className="shrink-0">
              <div className="w-35 h-35 rounded-full bg-blue-100 text-[#188BFE] flex items-center justify-center text-5xl font-bold shadow-sm border-4 border-[#188BFE] -mt-3">
                {profileData.username?.charAt(0).toUpperCase()}
              </div>
            </div>

            <hr className="w-full border-t border-gray-200" />

            {/* 🔴 2. ขยายกล่องข้อความให้เต็มพื้นที่ (ใช้ w-full อย่างเดียว เพื่อให้กางออกเต็มกรอบการ์ด) */}
            <div className="w-full flex flex-col gap-5">
              
              {/* 1. ชื่อผู้ใช้งาน */}
              <div className="p-5 bg-[#FCFBF4] rounded-2xl border border-gray-200">
                <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide mb-1">ชื่อผู้ใช้งาน</p>
                <p className="text-gray-900 font-semibold text-lg">{profileData.username}</p>
              </div>

              {/* 2. ตำแหน่ง */}
              <div className="p-5 bg-[#FCFBF4] rounded-2xl border border-gray-200">
                <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide mb-1">ตำแหน่ง (Role)</p>
                <p className="text-gray-900 font-semibold text-lg uppercase">{profileData.role}</p>
              </div>

              {/* 3. อีเมล */}
              <div className="p-5 bg-[#FCFBF4] rounded-2xl border border-gray-200">
                <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide mb-1">อีเมล</p>
                <p className="text-gray-900 font-semibold text-lg">{profileData.email}</p>
              </div>

              {/* 4. เบอร์โทรศัพท์ */}
              <div className="p-5 bg-[#FCFBF4] rounded-2xl border border-gray-200">
                <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide mb-1">เบอร์โทรศัพท์</p>
                <p className="text-gray-900 font-semibold text-lg">{profileData.phone || 'ไม่ได้ระบุเบอร์โทรศัพท์'}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;