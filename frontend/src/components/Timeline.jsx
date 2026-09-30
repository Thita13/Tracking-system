import React from 'react';

export default function Timeline({ project, tracking }) {
    if (!project) return null;

    const steps = [
        { key: 'CREATE_TASK', label: 'สร้างโครงการ', dept: 'Project Director' },
        { key: 'SEND_TO_INTERIOR', label: 'ออกแบบ', dept: 'Interior' },
        { key: 'SEND_TO_PRICING', label: 'ประเมินราคา', dept: 'Pricing' },
        { key: 'SEND_TO_3D', label: '3D', dept: 'Interior' }
    ];
    // เรียง tracking จากเก่าไปใหม่
    const sortedTracking = [...tracking].sort((a, b) => new Date(a.action_at) - new Date(b.action_at));
    // หาที่ส่งกลับแก้ไขครั้งล่าสุด
    const latestRevision = [...sortedTracking]
        .reverse()
        .find(t => t.status === 'REQUEST_REVISION');

    // Pricing รอบเก่า จะไม่ถูกนับว่าเสร็จในรอบปัจจุบัน
    const currentRoundTracking = latestRevision ? sortedTracking.filter(t => new Date(t.action_at) > new Date(latestRevision.action_at)) : sortedTracking;

    // ส่งงานล่าสุดในปัจจุบัน
    const latestSubmit = [...currentRoundTracking]
        .reverse()
        .find(t => t.status === 'SEND_TO_PROJECTDIRECTOR' && (t.department === 'Interior' || t.department === 'Pricing'));

    // ตรวจว่า 3D ส่งงานแล้วหรือยัง
    const latest3DStart = [...currentRoundTracking]
        .reverse()
        .find(t => t.status === 'START_3D');

    const latest3DComplete = [...currentRoundTracking]
        .reverse()
        .find(t => t.status === 'COMPLETE' || (t.status === 'SEND_TO_PROJECTDIRECTOR' && latest3DStart && new Date(t.action_at) > new Date(latest3DStart.action_at)));

    // Hover text
    const getHoverText = (status, isRevisionStart, actionBy) => {
        let text = status;

        if (['CREATE_TASK', 'NEW'].includes(status)) {
            text = 'สร้างโครงการใหม่';
        }
        else if (
            ['SEND_TO_INTERIOR', 'SEND_TO_PRICING', 'SEND_TO_3D'].includes(status)
        ) {
            text = 'ได้รับมอบหมายงาน';
        }
        else if (
            ['START_INTERIOR', 'START_PRICING', 'START_3D'].includes(status)
        ) {
            text = isRevisionStart
                ? 'กดรับงานแก้ไข'
                : 'กดรับงาน';
        }
        else if (
            ['SUBMIT_WORK', 'SEND_TO_PROJECTDIRECTOR'].includes(status)
        ) {
            text = 'ส่งงานเพื่อรอตรวจสอบ';
        }
        else if (status === 'REQUEST_REVISION') {
            text = 'ถูกส่งกลับมาแก้ไข';
        }
        else if (
            status === 'COMPLETE' ||
            status === 'COMPLETED'
        ) {
            text = 'จบโครงการ';
        }

        return actionBy
            ? `${actionBy} ${text}`
            : text;
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-8">Timeline</h3>
            
            <div className="flex items-start justify-between relative w-full">
                
                <div className="absolute top-5 left-[12.5%] right-[12.5%] h-1 bg-gray-200 z-0"></div>

                {steps.map((step, idx) => {
                    // ประวัติที่ใช้แสดงวันที่ของแต่ละขั้นตอน
                    const stepHistory = sortedTracking.filter(t => {
                        if (step.key === 'SEND_TO_INTERIOR') {
                            return (t.status === 'START_INTERIOR' || (t.status === 'SEND_TO_PROJECTDIRECTOR' && t.department === 'Interior'));
                        }
                        if (step.key === 'SEND_TO_PRICING') {
                            return (t.status === 'START_PRICING' || 
                                   (t.status === 'SEND_TO_PROJECTDIRECTOR' && t.department === 'Pricing'));
                        }
                        if (step.key === 'SEND_TO_3D') {
                           return (t.status === 'START_3D' || t.status === 'COMPLETE');
                        }
                        return (t.status === step.key || t.status === 'CREATE_TASK');
                    });
                    //สถานะของแต่ละขั้นตอน
                    let isCompleted = false;
                        const has3DStarted = tracking.some(
                            t => t.status === 'START_3D'
                        );

                        // Interior เคยส่งงานแล้วหรือยัง
                        const hasInteriorSubmitted = tracking.some(
                            t =>
                                t.status === 'SEND_TO_PROJECTDIRECTOR' &&
                                t.department === 'Interior'
                        );

                        // Pricing เคยส่งงานแล้วหรือยัง
                        const hasPricingSubmitted = tracking.some(
                            t =>
                                t.status === 'SEND_TO_PROJECTDIRECTOR' &&
                                t.department === 'Pricing'
                        );

                        // 3D เริ่มงานแล้วหรือยัง
                        const has3DCompleted = tracking.some(
                            t => t.status === 'COMPLETE'
                        );

                        if (step.key === 'CREATE_TASK') {

                            // สร้างโครงการถือว่าเสร็จตั้งแต่สร้าง
                            isCompleted = true;

                        }
                        else if (step.key === 'SEND_TO_INTERIOR') {

                            // Interior เสร็จเมื่อ Interior เคยส่งงานให้ตรวจแล้ว
                            isCompleted = hasInteriorSubmitted;

                        }
                        else if (step.key === 'SEND_TO_PRICING') {

                            // Pricing เสร็จเมื่อ Pricing เคยส่งงานให้ตรวจแล้ว
                            isCompleted = hasPricingSubmitted;

                        }
                        else if (step.key === 'SEND_TO_3D') {

                            // 3D เสร็จเมื่อโครงการจบ
                            isCompleted = has3DCompleted || project.status === 'COMPLETED';

                        }

                    let isCurrent = false;
                    if (!isCompleted) {
                        if (step.key === 'CREATE_TASK') {
                            isCurrent = false;
                        }

                        else if (step.key === 'SEND_TO_INTERIOR') {

                            const isInteriorStarted = tracking.some(
                                t => t.status === 'START_INTERIOR'
                            );

                            isCurrent =
                                project.status === 'INTERIOR' &&
                                isInteriorStarted;

                        }

                        else if (step.key === 'SEND_TO_PRICING') {

                            const isPricingStarted = tracking.some(
                                t => t.status === 'START_PRICING'
                            );

                            isCurrent =
                                project.status === 'PRICING' &&
                                isPricingStarted;

                        }

                        else if (step.key === 'SEND_TO_3D') {

                            const is3DStarted = tracking.some(
                                t => t.status === 'START_3D'
                            );

                            isCurrent =
                                project.status === 'DESIGN_3D' &&
                                is3DStarted;
                        }
                    }
                return (
                        <div
                            key={step.key}
                            className="z-10 flex flex-col items-center flex-1"
                        >
                            <div
                                className={`
                                    w-10 h-10 rounded-full
                                    flex items-center justify-center
                                    font-bold mb-2 border-2
                                    transition-colors

                                    ${
                                        isCompleted
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : isCurrent
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'bg-gray-200 border-gray-200 text-gray-400'
                                    }
                                `}
                            >
                                {isCompleted ? '✓' : idx + 1}
                            </div>

                            <span className="text-[12px] font-bold text-gray-700 text-center">
                                {step.label}
                            </span>

                            <span className="text-[12px] text-gray-500 mb-2 text-center">
                                {step.dept}
                            </span>

                            {/* ประวัติวันที่ */}
                            <div className="text-[11px] text-gray-400 text-center space-y-2 mt-1">

                                {stepHistory.map((h, hIdx) => {

                                    const isRevisionStart =
                                        [
                                            'START_INTERIOR',
                                            'START_PRICING',
                                            'START_3D'
                                        ].includes(h.status) &&
                                        stepHistory.findIndex(
                                            item =>
                                                item.status === h.status
                                        ) < hIdx;

                                    return (
                                        <div
                                            key={hIdx}
                                            className="leading-tight whitespace-nowrap relative group cursor-help inline-block"
                                        >
                                            <span className="hover:text-gray-600 transition-colors">

                                                {new Date(
                                                    h.action_at
                                                ).toLocaleDateString(
                                                    'th-TH',
                                                    {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }
                                                )}

                                                {' '}

                                                {new Date(
                                                    h.action_at
                                                ).toLocaleTimeString(
                                                    'th-TH',
                                                    {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }
                                                )}

                                                {' '}น.
                                            </span>

                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded shadow-lg z-50">

                                                {getHoverText(
                                                    h.status,
                                                    isRevisionStart,
                                                    h.action_by
                                                )}

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