import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

function CreateProject() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const MAX_FILES = 7;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB ต่อไฟล์

  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    customerName: '',
    customerPhone: '',
    assignedInterior: '',
    details: '',
    files: []
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

  const ALLOWED_EXTENSIONS = [
    '.cad', '.dwg', '.dxf', '.pdf',
    '.jpg', '.jpeg', '.png', '.doc'
  ];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    const existingFiles = formData.files || [];
    const combinedFiles = [...existingFiles, ...selectedFiles];

    // ตรวจจำนวนไฟล์
    if (combinedFiles.length > MAX_FILES) {
      toast.error('แนบไฟล์ได้สูงสุด 7 ไฟล์');
      e.target.value = '';
      return;
    }

    // ตรวจนามสกุลไฟล์
    const invalidFile = selectedFiles.find((file) => {
      const dotIndex = file.name.lastIndexOf('.');
      const extension = dotIndex >= 0
        ? file.name.slice(dotIndex).toLowerCase()
        : '';

      return !ALLOWED_EXTENSIONS.includes(extension);
    });

    if (invalidFile) {
      toast.error(`ไม่รองรับไฟล์ ${invalidFile.name}`);
      e.target.value = '';
      return;
    }

    // ตรวจขนาดต่อไฟล์
    if (combinedFiles.some(file => file.size > MAX_FILE_SIZE)) {
      toast.error('แต่ละไฟล์ต้องมีขนาดไม่เกิน 50 MB');
      e.target.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      files: combinedFiles
    }));

    // เลือกไฟล์เดิมซ้ำได้
    e.target.value = '';
  };

  const handleSubmit = async () => {
    // 1. ตรวจสอบว่ากรอกข้อมูลสำคัญครบหรือไม่
    if (
        !formData.projectName.trim() || 
        !formData.projectType || 
        !formData.customerName.trim() || 
        !formData.assignedInterior
    ) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน!');
      return;
    }

    // 2. ตรวจสอบเบอร์โทรศัพท์ (กฎเดียวกับหน้าเพิ่มผู้ใช้)
    const phoneRegex = /^0\d{8,9}$/;
    if (!formData.customerPhone || !phoneRegex.test(formData.customerPhone)) {
        toast.error('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลักเท่านั้น)');
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

    formData.files.forEach((file) => {
      data.append('files', file);
    });

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
          id_users: user.id, 
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
            <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อโครงการหรือสถานที่ <span className="text-red-500">*</span></label>
            <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} placeholder="กรอกชื่องาน" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* ประเภทโครงการ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทโครงการ <span className="text-red-500">*</span></label>
            <div className="flex gap-6">
              {[{ value: 'home', label: 'บ้าน' }, { value: 'condo', label: 'คอนโด' }].map((type) => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="task_type" value={type.value} checked={formData.projectType === type.value} onChange={handleChange} className="w-4 h-4" />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ชื่อลูกค้า */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อลูกค้า <span className="text-red-500">*</span></label>
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
            <label className="block text-sm font-bold text-gray-700 mb-2">เบอร์โทรติดต่อ <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="customerPhone"
              maxLength={10} // บังคับพิมพ์ไม่เกิน 10 ตัว
              value={formData.customerPhone}
              onChange={(e) => {
                // กรองให้รับเฉพาะตัวเลขเท่านั้น
                const numericValue = e.target.value.replace(/\D/g, '');
                if (numericValue.length <= 10) {
                    setFormData((prev) => ({ ...prev, customerPhone: numericValue }));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียดงาน</label>
            <textarea name="details" value={formData.details} onChange={handleChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          {/* ส่วนแนบไฟล์โครงการ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              แนบไฟล์โครงการ (ถ้ามี)
            </label>

            <p className="text-sm text-gray-500 mb-2">
              รองรับ .cad, .dwg, .dxf, .pdf, .jpg, .jpeg, .png, .doc
            </p>

            <p className="text-sm text-gray-500 mb-2">
              เลือกได้สูงสุด 7 ไฟล์ ขนาดไม่เกิน 50 MB ต่อไฟล์
            </p>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors shadow-sm">
                Add file

                <input
                  type="file"
                  multiple
                  accept=".cad,.dwg,.dxf,.pdf,.jpg,.jpeg,.png,.doc"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* รายการไฟล์ */}
            {formData.files.length > 0 && (
              <div className="mt-4 space-y-3">
                {formData.files.map((file, index) => {
                  const extension = file.name
                    .split('.')
                    .pop()
                    .toLowerCase();

                  const isPdf = extension === 'pdf';
                  const isImage = [
                    'jpg', 'jpeg', 'png'
                  ].includes(extension);
                  return (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3
                      w-full p-3 sm:px-5 sm:py-3
                      bg-white border border-gray-200
                      rounded-lg shadow-sm
                      hover:border-gray-300 transition"
                  >
                    {/* ชื่อไฟล์และขนาด */}
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          const fileUrl = URL.createObjectURL(file);
                          const newWindow = window.open(fileUrl, '_blank');

                          if (!newWindow) {
                            URL.revokeObjectURL(fileUrl);
                            toast.error('เบราว์เซอร์บล็อกหน้าต่างเปิดไฟล์ กรุณาอนุญาต Pop-ups');
                            return;
                          }

                          newWindow.addEventListener('load', () => {
                            URL.revokeObjectURL(fileUrl);
                          }, { once: true });
                        }}
                        className="text-sm font-semibold text-gray-800
                          hover:text-blue-600 hover:underline
                          text-left break-all"
                        title="คลิกเพื่อเปิดไฟล์"
                      >
                        {file.name}
                      </button>

                      <span className="text-sm text-gray-400 ml-2">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>

                    {/* ปุ่มลบไฟล์ */}
                    <button
                      type="button"
                      aria-label={`ลบไฟล์ ${file.name}`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          files: prev.files.filter(
                            (_, i) => i !== index
                          )
                        }));
                      }}
                      className="flex-shrink-0 p-1
                      text-gray-400 hover:text-red-500
                        transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* มอบหมายงาน */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">มอบหมายงานให้ Interior Design <span className="text-red-500">*</span></label>
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