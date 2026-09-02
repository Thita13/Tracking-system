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

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-8">Timeline</h3>
            <div className="flex items-center justify-between relative px-4">
                <div className="absolute top-5 left-15 right-8 h-1 bg-gray-100 -z-0"></div>

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
                        <div key={idx} className="z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 border-2 
                                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                  isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className="text-[12px] font-bold text-gray-700">{step.label}</span>
                            <span className="text-[12px] text-gray-500 mb-2">{step.dept}</span>
                            <div className="text-[11px] text-gray-400 text-center">
                                {stepHistory.map((h, hIdx) => (
                                    <div key={hIdx}>
                                        {new Date(h.action_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        {' '}{new Date(h.action_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}