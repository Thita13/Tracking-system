export const getStatusColor = (status) => {
  switch (status) {
    case 'NEW': return 'bg-[#DBEAFE] border border-[#3B82F6] text-[#2563EB]'; 
    case 'INTERIOR': return 'bg-[#EDE9FE] border border-[#6A02F2] text-[#7C3AED]';
    case 'WAITING_CONFIRM': return 'bg-[#FEF3C7] border border-[#CDA400] text-[#D97706]';
    case 'PRICING': return 'bg-[#CFFAFE] border border-[#20BCCD] text-[#0891B2]';
    case 'DESIGN_3D': return 'bg-[#F3CBEC] border border-[#D731BB] text-[#BE059F]';
    case 'COMPLETED': return 'bg-[#DCFCE7] border border-[#40AD00] text-[#16A34A]';
    case 'CANCELLED': return 'bg-[#FEE2E2] border border-[#FF0000] text-[#DC2626]';

    case 'CREATE_TASK': return 'bg-[#9DC1FB] border border-[#3B82F6] text-[#3B82F6]';
    case 'SEND_TO_INTERIOR':
    case 'BACK_TO_INTERIOR': return 'bg-[#C5AEFB] border border-[#7E00AB] text-[#7E00AB]';
    case 'SEND_TO_PRICING':
    case 'BACK_TO_PRICING': return 'bg-[#8FA0D7] border border-[#00067D] text-[#00067D]';
    case 'SEND_TO_3D': return 'bg-[#B1E5F2] border border-[#0089A8] text-[#0089A8]';
    case 'REQUEST_REVISION': return 'bg-[#E0BD94] border border-[#613C00] text-[#613C00]';
    case 'COMPLETE': return 'bg-[#91E2AF] border border-[#40AD00] text-[#40AD00]';
    
    default: return 'bg-gray-200 text-gray-800';
  }
};