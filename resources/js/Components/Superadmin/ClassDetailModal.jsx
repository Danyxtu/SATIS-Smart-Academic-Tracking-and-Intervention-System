import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function ClassDetailModal({
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
            activeTab="classes"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
        />
    );
}
