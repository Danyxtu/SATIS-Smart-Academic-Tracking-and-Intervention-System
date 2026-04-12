import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function ActivityLogDetailModal({
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
            activeTab="audit-logs"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
        />
    );
}
