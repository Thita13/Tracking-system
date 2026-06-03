import { getStatusColor } from '../utils/helpers';

// Component นี้จะรับ Props เข้ามา 5 ตัว เพื่อให้ยืดหยุ่นในการใช้งาน
function ProjectTable({ projects, isLoading, error, renderActionButtons, systemRole }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
        <thead>
          <tr className="bg-[#E5E7EB] text-gray-700 text-sm">
            <th className="py-4 px-5 font-bold rounded-l-lg w-[5%]">ID</th>
            <th className="py-4 px-5 font-bold w-[25%]">โครงการ</th>
            <th className="py-4 px-5 font-bold w-[20%]">ชื่อลูกค้า</th>
            <th className="py-4 px-5 font-bold w-[15%]">วันที่สร้าง</th>
            <th className="py-4 px-5 font-bold w-[15%]">แผนกปัจจุบัน</th>
            <th className="py-4 px-5 font-bold w-[16%]">สถานะ</th>
            <th className="py-4 px-5 font-bold rounded-r-lg text-center w-[13%]"></th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {isLoading ? (
            <tr>
              <td colSpan="6" className="py-16 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <div className="w-8 h-8 border-4 border-[#188BFE] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span className="font-semibold">กำลังโหลดข้อมูล...</span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="6" className="py-10 text-center text-red-500 font-medium bg-red-50 rounded-xl">
                ⚠️ {error}
              </td>
            </tr>
          ) : projects && projects.length > 0 ? (
            projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-5 font-semibold text-gray-700">{project.id}</td>
                <td className="py-4 px-5 font-bold text-gray-800">{project.name}</td>
                <td className="py-4 px-5 text-gray-700">{project.customer}</td>
                <td className="py-4 px-5 text-gray-700">{project.createdDate}</td>

                <td className="py-4 px-5 text-gray-700">
                  <div className="flex flex-col">
                    {project.status === 'COMPLETED' || project.status === 'CANCELLED' ? (
                      // ถ้างานเสร็จหรือยกเลิก ให้คืนค่าเป็น null เพื่อไม่ให้แสดงอะไรเลยในช่องนี้
                      null
                    ) : (
                      // ถ้างานยังทำอยู่ ให้แสดงแผนกปกติ
                      <span className="font-medium text-sm">
                        {project.assignedTo?.department || '-'}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-4 px-5">
                  {project.status && (
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase inline-block ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  )}
                </td>

                <td className="py-4 px-5 text-right whitespace-nowrap">
                  {/* ถ้ารับฟังก์ชันสร้างปุ่มมา ก็ให้เรียกใช้งาน (สำหรับหน้า Projects) */}
                  {renderActionButtons && renderActionButtons(project, systemRole)}

                  <button className="bg-[#FEF08A] hover:bg-[#FDE047] text-gray-800 px-5 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm inline-block ml-2">
                    รายละเอียด
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-10 text-center text-gray-500 font-medium">
                ไม่พบข้อมูลโครงการ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProjectTable;