export const getStatusColor = (status) => {
  switch (status) {
    case 'NEW': return 'bg-[#9DC1FB] border border-[#3B82F6] text-[#3B82F6]'; 
    case 'DESIGNING': return 'bg-[#C5AEFB] border border-[#7E00AB] text-[#7E00AB]';
    case 'REQUESTED': return 'bg-[#FCB98B] border border-[#F47200] text-[#F47200]';
    case 'REVISING': return 'bg-[#E0BD94] border border-[#613C00] text-[#613C00]';
    case 'WAITING_CONFIRM': return 'bg-[#F5D984] border border-[#CDA400] text-[#CDA400]';
    case 'PRICING': return 'bg-[#8FA0D7] border border-[#00067D] text-[#00067D]';
    case 'COMPLETED': return 'bg-[#91E2AF] border border-[#40AD00] text-[#40AD00]';
    case 'CANCELLED': return 'bg-[#F7A2A2] border border-[#FF0000] text-[#FF0000]';

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