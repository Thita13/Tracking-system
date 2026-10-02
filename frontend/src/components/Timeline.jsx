import React from 'react';

export default function Timeline({ project, tracking }) {
    if (!project) return null;

    const steps = [
        {
            key: 'CREATE_TASK',
            label: 'สร้างโครงการ',
            dept: 'Project Director'
        },
        {
            key: 'SEND_TO_INTERIOR',
            label: 'ออกแบบ',
            dept: 'Interior'
        },
        {
            key: 'SEND_TO_PRICING',
            label: 'ประเมินราคา',
            dept: 'Pricing'
        },
        {
            key: 'SEND_TO_3D',
            label: '3D',
            dept: 'Interior'
        }
    ];

    // --------------------------------------------------
    // เรียง Tracking จากเก่า → ใหม่
    // --------------------------------------------------
    const sortedTracking = [...(tracking || [])].sort(
        (a, b) =>
            new Date(a.action_at).getTime() -
            new Date(b.action_at).getTime()
    );

    // --------------------------------------------------
    // หา Revision ล่าสุด
    //
    // REQUEST_REVISION = Project Director ส่งกลับแก้
    //
    // หมายเหตุ:
    // Admin ไม่มี ADMIN_REVISE แล้ว
    // เพราะ Admin ใช้ปุ่ม "มอบหมายงาน" ในการส่งกลับ
    // --------------------------------------------------
    const latestRevision = [...sortedTracking]
        .reverse()
        .find(t => t.status === 'REQUEST_REVISION');

    const revisionTarget = latestRevision?.department || null;

    // --------------------------------------------------
    // Tracking หลัง Revision ล่าสุด
    //
    // ใช้ดูว่า หลังจากถูกส่งกลับมาแก้แล้ว
    // มีการส่งงานกลับไปตรวจอีกครั้งหรือยัง
    // --------------------------------------------------
    const currentRoundTracking = latestRevision
        ? sortedTracking.filter(
            t =>
                new Date(t.action_at).getTime() >
                new Date(latestRevision.action_at).getTime()
        )
        : sortedTracking;

    // --------------------------------------------------
    // Helper
    // --------------------------------------------------

    const hasTracking = (status, department = null) => {
        return sortedTracking.some(t => {
            if (t.status !== status) return false;

            if (department) {
                return t.department === department;
            }

            return true;
        });
    };

    const hasCurrentRoundTracking = (
        status,
        department = null
    ) => {
        return currentRoundTracking.some(t => {
            if (t.status !== status) return false;

            if (department) {
                return t.department === department;
            }

            return true;
        });
    };

    // --------------------------------------------------
    // ประวัติการส่งงาน
    // --------------------------------------------------

    const hasInteriorSubmitted =
        hasTracking(
            'SEND_TO_PROJECTDIRECTOR',
            'Interior'
        );

    const hasPricingSubmitted =
        hasTracking(
            'SEND_TO_PROJECTDIRECTOR',
            'Pricing'
        );

    const has3DCompleted =
        hasTracking('COMPLETE');

    // --------------------------------------------------
    // ประวัติการรับงาน
    // --------------------------------------------------

    const hasInteriorStarted =
        hasTracking('START_INTERIOR');

    const hasPricingStarted =
        hasTracking('START_PRICING');

    const has3DStarted =
        hasTracking('START_3D');

    // --------------------------------------------------
    // ประวัติการส่งไปแต่ละขั้น
    // --------------------------------------------------

    const hasSentToPricing =
        hasTracking('SEND_TO_PRICING');

    const hasSentTo3D =
        hasTracking('SEND_TO_3D');

    // --------------------------------------------------
    // ตรวจว่าแต่ละขั้นเป็น Revision Target หรือไม่
    // --------------------------------------------------

    const interiorIsRevisionTarget =
        revisionTarget === 'Interior';

    const pricingIsRevisionTarget =
        revisionTarget === 'Pricing';

    const threeDIsRevisionTarget =
        revisionTarget === 'DESIGN_3D';

    // --------------------------------------------------
    // ส่งงานหลัง Revision แล้วหรือยัง
    // --------------------------------------------------

    const interiorSubmittedAfterRevision =
        hasCurrentRoundTracking(
            'SEND_TO_PROJECTDIRECTOR',
            'Interior'
        );

    const pricingSubmittedAfterRevision =
        hasCurrentRoundTracking(
            'SEND_TO_PROJECTDIRECTOR',
            'Pricing'
        );

    const threeDCompletedAfterRevision =
        hasCurrentRoundTracking('COMPLETE');

    // --------------------------------------------------
    // ตรวจวันที่ / ประวัติสำหรับแต่ละ Step
    // --------------------------------------------------

    const getStepHistory = step => {

        // -----------------------------
        // สร้างโครงการ
        // -----------------------------
        if (step.key === 'CREATE_TASK') {
            return sortedTracking.filter(
                t =>
                    t.status === 'CREATE_TASK'
            );
        }

        // -----------------------------
        // Interior
        // -----------------------------
        if (step.key === 'SEND_TO_INTERIOR') {
            return sortedTracking.filter(
                t =>
                    t.status === 'START_INTERIOR' ||
                    (
                        t.status === 'SEND_TO_PROJECTDIRECTOR' &&
                        t.department === 'Interior'
                    )
            );
        }

        // -----------------------------
        // Pricing
        // -----------------------------
        if (step.key === 'SEND_TO_PRICING') {
            return sortedTracking.filter(
                t =>
                    t.status === 'START_PRICING' ||
                    (
                        t.status === 'SEND_TO_PROJECTDIRECTOR' &&
                        t.department === 'Pricing'
                    )
            );
        }

        // -----------------------------
        // 3D
        // -----------------------------
        if (step.key === 'SEND_TO_3D') {
            return sortedTracking.filter(
                t =>
                    t.status === 'START_3D' ||
                    t.status === 'COMPLETE'
            );
        }

        return [];
    };

    // --------------------------------------------------
    // Hover Text
    // --------------------------------------------------

    const getHoverText = (
        status,
        isRevisionStart,
        actionBy
    ) => {

        let text = status;

        // สร้างโครงการ
        if (
            ['CREATE_TASK', 'NEW'].includes(status)
        ) {
            text = 'สร้างโครงการใหม่';
        }

        // มอบหมายงาน
        else if (
            [
                'SEND_TO_INTERIOR',
                'SEND_TO_PRICING',
                'SEND_TO_3D'
            ].includes(status)
        ) {
            text = 'ได้รับมอบหมายงาน';
        }

        // รับงาน
        else if (
            [
                'START_INTERIOR',
                'START_PRICING',
                'START_3D'
            ].includes(status)
        ) {
            text = isRevisionStart
                ? 'กดรับงานแก้ไข'
                : 'กดรับงาน';
        }

        // ส่งงานตรวจ
        else if (
            [
                'SUBMIT_WORK',
                'SEND_TO_PROJECTDIRECTOR'
            ].includes(status)
        ) {
            text = 'ส่งงานเพื่อรอตรวจสอบ';
        }

        // ส่งกลับแก้ไข
        else if (
            status === 'REQUEST_REVISION'
        ) {
            text = 'Project Director ส่งกลับมาแก้ไข';
        }

        // จบโครงการ
        else if (
            [
                'COMPLETE',
                'COMPLETED'
            ].includes(status)
        ) {
            text = 'จบโครงการ';
        }

        return actionBy
            ? `${actionBy} ${text}`
            : text;
    };

    // --------------------------------------------------
    // ตรวจสถานะของแต่ละ Step
    // --------------------------------------------------

    const getStepState = step => {

    let isCompleted = false;
    let isCurrent = false;

    // ==================================================
    // STEP 1 : สร้างโครงการ
    // ==================================================

    if (step.key === 'CREATE_TASK') {

        return {
            isCompleted: true,
            isCurrent: false
        };
    }

    // ==================================================
    // STEP 2 : Interior
    // ==================================================

    if (step.key === 'SEND_TO_INTERIOR') {

        // ----------------------------------------------
        // ตอนนี้งานอยู่ Interior
        // ----------------------------------------------
        if (project.status === 'INTERIOR') {

            // รับงานแล้ว → สีน้ำเงิน
            if (Boolean(project.accepted_at)) {
                isCurrent = true;
            }

            // ยังไม่รับ → สีเทา
            else {
                isCurrent = false;
            }

            return {
                isCompleted: false,
                isCurrent
            };
        }

        // ----------------------------------------------
        // งานอยู่ขั้นตอนหลัง Interior
        // Interior ถือว่าเสร็จแล้ว
        //
        // เช่น
        // PRICING
        // DESIGN_3D
        // COMPLETED
        // ----------------------------------------------
        if (
            project.status === 'PRICING' ||
            project.status === 'DESIGN_3D' ||
            project.status === 'COMPLETED'
        ) {

            return {
                isCompleted: true,
                isCurrent: false
            };
        }

        // ----------------------------------------------
        // WAITING_CONFIRM
        //
        // ต้องดูว่าใครเป็นคนส่งงานล่าสุด
        // ----------------------------------------------

        if (project.status === 'WAITING_CONFIRM') {

            const latestSubmit = [...sortedTracking]
                .reverse()
                .find(
                    t =>
                        t.status === 'SEND_TO_PROJECTDIRECTOR' &&
                        (
                            t.department === 'Interior' ||
                            t.department === 'Pricing'
                        )
                );

            // ถ้า Interior เป็นคนส่งล่าสุด
            if (
                latestSubmit &&
                latestSubmit.department === 'Interior'
            ) {
                return {
                    isCompleted: true,
                    isCurrent: false
                };
            }

            // ถ้า Pricing เป็นคนส่งล่าสุด
            // Interior ถือว่าเสร็จแล้วอยู่ดี
            if (
                latestSubmit &&
                latestSubmit.department === 'Pricing'
            ) {
                return {
                    isCompleted: true,
                    isCurrent: false
                };
            }
        }

        return {
            isCompleted: false,
            isCurrent: false
        };
    }

    // ==================================================
    // STEP 3 : Pricing
    // ==================================================

    if (step.key === 'SEND_TO_PRICING') {

        // ----------------------------------------------
        // สำคัญมาก
        //
        // ถ้าปัจจุบันอยู่ INTERIOR
        // แปลว่า workflow ถูกส่งกลับไป Interior
        //
        // Pricing ต้อง "ย้อนกลับเป็นสีเทา"
        // แม้จะเคยส่งงานมาก่อน
        // ----------------------------------------------

        if (project.status === 'INTERIOR') {

            return {
                isCompleted: false,
                isCurrent: false
            };
        }

        // ----------------------------------------------
        // ปัจจุบันอยู่ Pricing
        // ----------------------------------------------

        if (project.status === 'PRICING') {

            // รับงานแล้ว
            if (Boolean(project.accepted_at)) {

                return {
                    isCompleted: false,
                    isCurrent: true
                };
            }

            // ยังไม่ได้รับ
            return {
                isCompleted: false,
                isCurrent: false
            };
        }

        // ----------------------------------------------
        // ปัจจุบันอยู่ 3D
        //
        // แปลว่า Pricing ผ่านแล้ว
        // ----------------------------------------------

        if (project.status === 'DESIGN_3D') {

            return {
                isCompleted: true,
                isCurrent: false
            };
        }

        // ----------------------------------------------
        // โครงการเสร็จแล้ว
        // ----------------------------------------------

        if (project.status === 'COMPLETED') {

            return {
                isCompleted: true,
                isCurrent: false
            };
        }

        // ----------------------------------------------
        // WAITING_CONFIRM
        // ----------------------------------------------

        if (project.status === 'WAITING_CONFIRM') {

            const latestSubmit = [...sortedTracking]
                .reverse()
                .find(
                    t =>
                        t.status === 'SEND_TO_PROJECTDIRECTOR' &&
                        (
                            t.department === 'Interior' ||
                            t.department === 'Pricing'
                        )
                );

            // ------------------------------------------
            // ถ้า Pricing เป็นคนส่งงานล่าสุด
            // Pricing = เสร็จ
            // ------------------------------------------

            if (
                latestSubmit &&
                latestSubmit.department === 'Pricing'
            ) {

                return {
                    isCompleted: true,
                    isCurrent: false
                };
            }

            // ------------------------------------------
            // ถ้า Interior ส่งงานล่าสุด
            //
            // แปลว่ายังไม่ถึง Pricing
            // ------------------------------------------

            if (
                latestSubmit &&
                latestSubmit.department === 'Interior'
            ) {

                return {
                    isCompleted: false,
                    isCurrent: false
                };
            }
        }

        return {
            isCompleted: false,
            isCurrent: false
        };
    }

    // ==================================================
    // STEP 4 : 3D
    // ==================================================

    if (step.key === 'SEND_TO_3D') {

        // ----------------------------------------------
        // ถ้าปัจจุบันย้อนกลับไป Interior
        // หรือ Pricing
        //
        // 3D ต้องเป็นสีเทา
        // ----------------------------------------------

        if (
            project.status === 'INTERIOR' ||
            project.status === 'PRICING'
        ) {

            return {
                isCompleted: false,
                isCurrent: false
            };
        }

        // ----------------------------------------------
        // ปัจจุบันอยู่ 3D
        // ----------------------------------------------

        if (project.status === 'DESIGN_3D') {

            // รับงานแล้ว น้ำเงิน
            if (Boolean(project.accepted_at)) {

                return {
                    isCompleted: false,
                    isCurrent: true
                };
            }

            // ยังไม่รับ เทา
            return {
                isCompleted: false,
                isCurrent: false
            };
        }

        // จบโครงการ
        if (project.status === 'COMPLETED') {

            return {
                isCompleted: true,
                isCurrent: false
            };
        }

        return {
            isCompleted: false,
            isCurrent: false
        };
    }

    return {
        isCompleted: false,
        isCurrent: false
    };
};

    // Render
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">

            <h3 className="font-bold text-gray-800 mb-8">
                Timeline
            </h3>

            <div className="flex items-start justify-between relative w-full">

                {/*เส้น Timeline*/}
                <div
                    className="
                        absolute
                        top-5
                        left-[12.5%]
                        right-[12.5%]
                        h-1
                        bg-gray-200
                        z-0
                    "
                ></div>

                {steps.map((step, idx) => {

                    const stepHistory =
                        getStepHistory(step);

                    const {
                        isCompleted,
                        isCurrent
                    } = getStepState(step);

                    return (
                        <div
                            key={step.key}
                            className="
                                z-10
                                flex
                                flex-col
                                items-center
                                flex-1
                            "
                        >

                            {/*วงกลม*/}

                            <div
                                className={`
                                    w-10
                                    h-10
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    mb-2
                                    border-2
                                    transition-colors

                                    ${
                                        isCompleted
                                            ? `
                                                bg-green-500
                                                border-green-500
                                                text-white
                                            `
                                            : isCurrent
                                                ? `
                                                    bg-blue-500
                                                    border-blue-500
                                                    text-white
                                                `
                                                : `
                                                    bg-gray-200
                                                    border-gray-200
                                                    text-gray-400
                                                `
                                    }
                                `}
                            >
                                {isCompleted
                                    ? '✓'
                                    : idx + 1}
                            </div>

                            {/*ชื่อ Step*/}

                            <span
                                className="
                                    text-[12px]
                                    font-bold
                                    text-gray-700
                                    text-center
                                "
                            >
                                {step.label}
                            </span>

                            {/*แผนก*/}

                            <span
                                className="
                                    text-[12px]
                                    text-gray-500
                                    mb-2
                                    text-center
                                "
                            >
                                {step.dept}
                            </span>

                            {/*ประวัติวันที่*/}

                            <div
                                className="
                                    text-[11px]
                                    text-gray-400
                                    text-center
                                    space-y-2
                                    mt-1
                                "
                            >

                                {stepHistory.map(
                                    (h, hIdx) => {

                                        // ตรวจว่า START ครั้งนี้เป็นการรับงานแก้ไขหรือไม่
                                        const previousStart =
                                            stepHistory
                                                .slice(0, hIdx)
                                                .find(
                                                    item =>
                                                        item.status ===
                                                        h.status
                                                );

                                        const isRevisionStart =
                                            [
                                                'START_INTERIOR',
                                                'START_PRICING',
                                                'START_3D'
                                            ].includes(
                                                h.status
                                            ) &&
                                            Boolean(
                                                previousStart
                                            );

                                        return (
                                            <div
                                                key={`${h.id_tracking || hIdx}-${h.action_at}`}
                                                className="
                                                    leading-tight
                                                    whitespace-nowrap
                                                    relative
                                                    group
                                                    cursor-help
                                                    inline-block
                                                "
                                            >

                                                <span
                                                    className="
                                                        hover:text-gray-600
                                                        transition-colors
                                                    "
                                                >

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

                                                <div
                                                    className="
                                                        absolute
                                                        bottom-full
                                                        left-1/2
                                                        transform
                                                        -translate-x-1/2
                                                        mb-1
                                                        hidden
                                                        group-hover:block
                                                        bg-gray-800
                                                        text-white
                                                        text-[10px]
                                                        font-medium
                                                        px-2.5
                                                        py-1.5
                                                        rounded
                                                        shadow-lg
                                                        z-50
                                                    "
                                                >

                                                    {getHoverText(
                                                        h.status,
                                                        isRevisionStart,
                                                        h.action_by
                                                    )}

                                                    <div
                                                        className="
                                                            absolute
                                                            top-full
                                                            left-1/2
                                                            transform
                                                            -translate-x-1/2
                                                            border-[4px]
                                                            border-transparent
                                                            border-t-gray-800
                                                        "
                                                    ></div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>
                    );
                })}

            </div>
        </div>
    );
}