import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

function CreateProject() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    customerName: '',
    customerPhone: '',
    assignedInterior: '',
    details: '',
    file: null
  });

  const [interiorStaff, setInteriorStaff] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch('http://localhost:5000/users');
        if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลพนักงานได้');
        const allUsers = await response.json();
        setInteriorStaff(allUsers.filter(u => u.role?.toLowerCase() === 'interior'));
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลพนักงานได้');
      }
    };
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'task_type') {
      setFormData((prev) => ({ ...prev, projectType: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFormData((prev) => ({ ...prev, file: uploadedFile }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.projectType || !formData.assignedInterior) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน!');
      return;
    }

    const data = new FormData();
    data.append('task_name', formData.projectName);
    data.append('task_type', formData.projectType);
    data.append('customer_name', formData.customerName);
    data.append('customer_phone', formData.customerPhone);
    data.append('description', formData.details);
    data.append('status', 'NEW');
    data.append('id_users', user.id);
    data.append('assigned_to', formData.assignedInterior);

    if (formData.file) {
      data.append('file', formData.file);
    }

    try {
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'ไม่สามารถสร้างงานใหม่ได้');
      }

      await fetch('http://localhost:5000/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SEND_TO_INTERIOR',
          id_task: result.taskId,
          // 🔴 แก้ไข: ใช้ ID ของคนที่ล็อกอิน (Project Director) เป็นคนสั่งงาน
          id_users: user.id, 
          // 🔴 แก้ไข: ใช้แผนกของคนที่ล็อกอิน
          department: user.role || 'Project Director' 
        })
      });

      toast.success('สร้างงานใหม่และมอบหมายสำเร็จ!');
      navigate(`/projects/${result.taskId}`);

    } catch (error) {
      const errorMsg = error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
      console.error("รายละเอียด Error:", error);
      toast.error('ไม่สามารถบันทึกข้อมูลได้: ' + errorMsg);
    }
  };

  return (
    <Layout role={user?.role || 'admin'} userName={user?.username || 'User'}>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">สร้างงานใหม่</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <h3 className="text-lg font-bold">ข้อมูลงาน</h3>

          {/* ชื่อโครงการ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อโครงการหรือสถานที่</label>
            <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} placeholder="กรอกชื่องาน" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* ประเภทโครงการ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทโครงการ</label>
            <div className="flex gap-6">
              {['home', 'condo'].map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="task_type" value={type} checked={formData.projectType === type} onChange={handleChange} className="w-4 h-4" />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ชื่อลูกค้า */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อลูกค้า</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="กรอกชื่อลูกค้า"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* เบอร์โทรติดต่อ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">เบอร์โทรติดต่อ</label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              placeholder="หมายเลขโทรศัพท์"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียดงาน</label>
            <textarea name="details" value={formData.details} onChange={handleChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          {/* ส่วนแนบไฟล์ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">แนบไฟล์โครงการ (ถ้ามี)</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Add file
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {formData.file ? (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm max-w-md flex-1">
                  <span className="text-sm font-medium text-gray-700 truncate">{formData.file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">ยังไม่ได้เลือกไฟล์</span>
              )}
            </div>
          </div>

          {/* มอบหมายงาน */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">มอบหมายงานให้ Interior Design</label>
            <select name="assignedInterior" value={formData.assignedInterior} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">เลือกพนักงาน Interior</option>
              {interiorStaff.map((staff) => (
                <option key={staff.id_users} value={staff.id_users}>{staff.username}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 mt-1 pt-6 ">
            <button type="button" onClick={() => window.location.reload()} className="flex-1 bg-gray-300 py-3 rounded-lg font-bold hover:bg-gray-400 transition-colors">ยกเลิก</button>
            <button type="button" onClick={handleSubmit} className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">บันทึก</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CreateProject;