import { createContext, useState, useEffect, useContext } from 'react';

// 1. สร้าง Context
const ProjectContext = createContext();

// 2. สร้าง Provider
export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 📍 ปรับโครงสร้างข้อมูลใหม่เป็น Assignment-Based
        const mockData = [
          { 
            id: 9, 
            name: 'Bangkok Boulevard Rama 2', 
            customer: 'ชลนิกา ประทุมมณี', 
            createdDate: '28/04/2569', 
            status: 'NEW', 
            type: 'บ้าน', 
            assignedTo: { name: 'เจโน่ ลี', department: 'Interior' } 
          },
          { 
            id: 8, 
            name: 'The Stage Taopoon-Interchange', 
            customer: 'ชิดชนก บริสุทธิ์', 
            createdDate: '20/04/2569', 
            status: 'DESIGNING', 
            type: 'คอนโด', 
            assignedTo: { name: 'มาร์ค ลี', department: 'Interior' } 
          },
          { 
            id: 7, 
            name: 'BAAN NINYA Ramintra 83', 
            customer: 'ณัฐวดี มีความรู้', 
            createdDate: '14/04/2569', 
            status: 'REQUESTED', 
            type: 'บ้าน', 
            assignedTo: { name: 'เจโน่ ลี', department: 'Interior' } 
          },
          { 
            id: 6, 
            name: 'The Ricco residence Ramindra Hathairat', 
            customer: 'ถิระคุณ อันประเสริฐ', 
            createdDate: '30/03/2569', 
            status: 'REVISING', 
            type: 'บ้าน', 
            assignedTo: { name: 'มาร์ค ลี', department: 'Interior' } 
          },
          { 
            id: 5, 
            name: 'MAXXi Condo Rachayothin-Phahol 34', 
            customer: 'สุวิตจณี มะลิกุล', 
            createdDate: '18/03/2569', 
            status: 'WAITING_CONFIRM', 
            type: 'คอนโด', 
            assignedTo: { name: 'สมชาย ผู้บริหาร', department: 'Project Director' } 
          },
          { 
            id: 4, 
            name: 'Condo U kaset-Nawamin', 
            customer: 'กนกพร ทองประเสริฐ', 
            createdDate: '10/03/2569', 
            status: 'PRICING', 
            type: 'คอนโด', 
            assignedTo: { name: 'จีซอง พัค', department: 'Pricing' } 
          },
          { 
            id: 3, 
            name: 'Casa City Donmuang-Songprapa', 
            customer: 'กิตติ ตระกูลมั่น', 
            createdDate: '27/02/2569', 
            status: 'CANCELLED', 
            type: 'บ้าน', 
            assignedTo: { name: 'สมชาย ผู้บริหาร', department: 'Project Director' } 
          },
          { 
            id: 2, 
            name: 'The Parkland Charan-Pinklao', 
            customer: 'นวล เขมิกา', 
            createdDate: '15/02/2569', 
            status: 'DESIGNING', 
            type: 'คอนโด', 
            assignedTo: { name: 'เจโน่ ลี', department: 'Interior' } 
          },
          { 
            id: 1, 
            name: 'Villaggio Bang-Yai', 
            customer: 'จอน บัรยู', 
            createdDate: '08/01/2569', 
            status: 'COMPLETED', 
            type: 'บ้าน', 
            assignedTo: null // กรณีงานเสร็จหรือไม่มีคนถือ
          },
        ];

        setProjects(mockData);
        setIsLoading(false);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลโครงการได้');
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, isLoading, error }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  return useContext(ProjectContext);
};