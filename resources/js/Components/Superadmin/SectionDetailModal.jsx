import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function SectionDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
    mode = "view",
    onSaved,
    departments = [],
    teachers = [],
    subjects = [],
    sectionOptions = [],
    currentSchoolYear = "",
}) {
    return (
        <ManagementDetailModal
            show={show}
            onClose={onClose}
            activeTab="sections"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
            sectionManageMode={mode}
            onSectionSaved={onSaved}
            departmentOptions={departments}
            teacherOptions={teachers}
            subjectOptions={subjects}
            sectionOptions={sectionOptions}
            currentSchoolYear={currentSchoolYear}
        />
    );
}
