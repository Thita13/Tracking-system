import { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

function CreateProject() {
  const { user } = useContext(AuthContext);

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
    // ตรวจสอบว่าถ้า name เป็น 'task_type' ต้องไปอัปเดต formData.projectType
    if (name === 'task_type') {
       setFormData((prev) => ({ ...prev, projectType: value }));
    } else {
       setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
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
        id_task: result.taskId, // ใช้ ID จากงานที่เพิ่งสร้าง
       id_users: formData.assignedInterior, // ID ของ Interior ที่เลือก
        department: 'Interior'
      })
    });

      toast.success('สร้างงานใหม่และมอบหมายสำเร็จ!');
      window.location.reload();
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
            <textarea name="details" value={formData.details} onChange={handleChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"></textarea>
          </div>

          {/* อัปโหลดไฟล์ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">เพิ่มไฟล์</label>
            <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded-lg" />
          </div>

          {/* มอบหมายงาน */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">มอบหมายงานให้ Interior Design</label>
            <select name="assignedInterior" value={formData.assignedInterior} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white">
              <option value="">เลือกพนักงาน Interior</option>
              {interiorStaff.map((staff) => (
                <option key={staff.id_users} value={staff.id_users}>{staff.username}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 mt-1 pt-6 ">
            <button type="button" onClick={() => window.location.reload()} className="flex-1 bg-gray-300 py-3 rounded-lg font-bold">ยกเลิก</button>
            <button type="button" onClick={handleSubmit} className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold">บันทึก</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CreateProject;