import { createContext, useState, useEffect, useContext } from 'react';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/tasks');

        if (!response.ok) {
          throw new Error('ไม่สามารถเชื่อมต่อกับ Server ได้');
        }

        const data = await response.json();

        const formattedData = data.map(item => ({
          id: item.id_task,
          name: item.task_name,
          customer: item.customer_name,
          createdDate: new Date(item.created_at).toLocaleDateString('th-TH'),
          status: item.status, // มั่นใจว่าค่านี้ตรงกับ ENUM ใน DB
          type: item.task_type,
          assignedTo: item.assignedTo || null 
        }));

        setProjects(formattedData);
        setIsLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
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