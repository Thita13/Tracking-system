import React from 'react';

export default function Timeline({ project, tracking }) {
    if (!project) return null;

    const steps = [
        { key: 'CREATE_TASK', label: 'สร้างโครงการ', dept: 'Project Director' },
        { key: 'SEND_TO_INTERIOR', label: 'ออกแบบ', dept: 'Interior' },
        { key: 'SEND_TO_PRICING', label: 'ประเมินราคา', dept: 'Pricing' },
        { key: 'SEND_TO_3D', label: '3D', dept: 'Interior' }
    ];

    const mapStatus = (status) => {
        const mapping = {
            'NEW': 'CREATE_TASK',
            'INTERIOR': 'SEND_TO_INTERIOR',
            'WAITING_CONFIRM': 'SEND_TO_INTERIOR',
            'PRICING': 'SEND_TO_PRICING',
            'DESIGN_3D': 'SEND_TO_3D'
        };
        return mapping[status] || status;
    };

    // 🔴 1. รับค่า actionBy เพิ่มเข้ามาเพื่อนำชื่อผู้ใช้มาต่อข้อความ
    const getHoverText = (status, isRevisionStart, actionBy) => {
        let text = status;
        if (['CREATE_TASK', 'NEW'].includes(status)) text = 'สร้างโครงการใหม่';
        else if (['SEND_TO_INTERIOR', 'SEND_TO_PRICING', 'SEND_TO_3D'].includes(status)) text = 'ได้รับมอบหมายงาน';
        else if (['START_INTERIOR', 'START_PRICING', 'START_3D'].includes(status)) {
            text = isRevisionStart ? 'กดรับงานแก้ไข' : 'กดรับงาน';
        }
        else if (['SUBMIT_WORK', 'SEND_TO_PROJECTDIRECTOR'].includes(status)) text = 'ส่งงานเพื่อรอตรวจสอบ';
        else if (status === 'REQUEST_REVISION') text = 'ถูกส่งกลับมาแก้ไข';
        else if (status === 'COMPLETE' || status === 'COMPLETED') text = 'จบโครงการ';

        // ถ้ามีชื่อผู้ทำรายการ ให้แสดงชื่อนำหน้าข้อความ (เช่น "Jaemin กดรับงาน")
        return actionBy ? `${actionBy} ${text}` : text;
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-8">Timeline</h3>
            
            <div className="flex items-start justify-between relative w-full">
                
                <div className="absolute top-5 left-[12.5%] right-[12.5%] h-1 bg-gray-200 z-0"></div>

                {steps.map((step, idx) => {
                    const stepHistory = tracking.filter(t => {
                        if (step.key === 'SEND_TO_INTERIOR') {
                            return (['START_INTERIOR', 'SUBMIT_WORK'].includes(t.status) || 
                                    (t.status === 'SEND_TO_PROJECTDIRECTOR' && t.department === 'Interior'));
                        }
                        if (step.key === 'SEND_TO_PRICING') {
                            return t.status === 'START_PRICING' || 
                                   (t.status === 'SEND_TO_PROJECTDIRECTOR' && t.department === 'Pricing');
                        }
                        if (step.key === 'SEND_TO_3D') {
                           return t.status === 'START_3D' || t.status === 'COMPLETE';
                        }
                        return t.status === step.key || mapStatus(t.status) === step.key;
                    });

                    let isCompleted = false;
                    const has3DStarted = tracking.some(t => t.status === 'START_3D');

                    if (step.key === 'CREATE_TASK') {
                        isCompleted = true;
                    }
                    else if (step.key === 'SEND_TO_INTERIOR') {
                        isCompleted = ['PRICING', 'PRICING_DONE', 'DESIGN_3D', 'COMPLETED'].includes(project.status) ||
                            (project.status === 'WAITING_CONFIRM' && tracking.some(t => t.department === 'Interior' && t.status === 'SEND_TO_PROJECTDIRECTOR'));
                    }
                    else if (step.key === 'SEND_TO_PRICING') {
                        isCompleted = ['DESIGN_3D', 'COMPLETED'].includes(project.status) ||
                            (project.status === 'WAITING_CONFIRM' && tracking.some(t => t.department === 'Pricing' && t.status === 'SEND_TO_PROJECTDIRECTOR'));
                    }
                    else if (step.key === 'SEND_TO_3D') {
                       isCompleted = project.status === 'COMPLETED' || 
                            (project.status === 'WAITING_CONFIRM' && has3DStarted);
                    }

                    let isCurrent = false;
                    if (!isCompleted) {
                        if (step.key === 'CREATE_TASK') {
                            isCurrent = false;
                        }
                        else if (step.key === 'SEND_TO_INTERIOR') {
                            const isInteriorStarted = tracking.some(t => t.status === 'START_INTERIOR');
                            isCurrent = project.status === 'INTERIOR' && isInteriorStarted;
                        }
                        else if (step.key === 'SEND_TO_PRICING') {
                            const isPricingStarted = tracking.some(t => t.status === 'START_PRICING') || Boolean(project.assign_to);
                            isCurrent = project.status === 'PRICING' && isPricingStarted;
                        }
                        else if (step.key === 'SEND_TO_3D') {
                            const is3DStarted = tracking.some(t => t.status === 'START_3D');
                            isCurrent = project.status === 'DESIGN_3D' && is3DStarted;
                        }
                    }

                    return (
                        <div key={idx} className="z-10 flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 border-2 transition-colors
                                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                  isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-200 border-gray-200 text-gray-400'}`}>
                                {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className="text-[12px] font-bold text-gray-700 text-center">{step.label}</span>
                            <span className="text-[12px] text-gray-500 mb-2 text-center">{step.dept}</span>
                            
                            <div className="text-[11px] text-gray-400 text-center space-y-2 mt-1">
                                {stepHistory.map((h, hIdx) => {
                                    const isRevisionStart = ['START_INTERIOR', 'START_PRICING', 'START_3D'].includes(h.status) && 
                                                            stepHistory.findIndex(item => item.status === h.status) < hIdx;

                                    return (
                                        <div key={hIdx} className="leading-tight whitespace-nowrap relative group cursor-help inline-block">
                                            <span className="hover:text-gray-600 transition-colors">
                                                {new Date(h.action_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                {' '}
                                                {new Date(h.action_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                            </span>
                                            
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded shadow-lg z-50">
                                                {/* 🔴 2. ส่ง h.action_by เข้าไปเพื่อแสดงชื่อผู้ทำรายการ */}
                                                {getHoverText(h.status, isRevisionStart, h.action_by)}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[4px] border-transparent border-t-gray-800"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}