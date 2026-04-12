import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function SubjectDetailModal({
    show,
    onClose,
    payload,
    loading = false,
    error = "",
    row,
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
        />
    );
}
