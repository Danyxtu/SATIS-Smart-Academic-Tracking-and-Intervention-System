import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function DepartmentDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
    mode = "view",
    onSaved,
    onDeleted,
    trackOptions = [],
    departmentOptions = [],
}) {
    return (
        <ManagementDetailModal
            show={show}
            onClose={onClose}
            activeTab="departments"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
            departmentManageMode={mode}
            onDepartmentSaved={onSaved}
            onDepartmentDeleted={onDeleted}
            trackOptions={trackOptions}
            departmentOptions={departmentOptions}
        />
    );
}
