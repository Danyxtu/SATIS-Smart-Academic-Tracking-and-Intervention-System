import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function SubjectDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
    subjectManageMode = "view",
    onSubjectSaved,
    onSubjectDeleted,
    typeOptions = [],
    semesterOptions = [],
    gradeLevelOptions = [],
}) {
    return (
        <ManagementDetailModal
            show={show}
            onClose={onClose}
            activeTab="subjects"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
            subjectManageMode={subjectManageMode}
            onSubjectSaved={onSubjectSaved}
            onSubjectDeleted={onSubjectDeleted}
            subjectTypeOptions={typeOptions}
            subjectSemesterOptions={semesterOptions}
            subjectGradeLevelOptions={gradeLevelOptions}
        />
    );
}
