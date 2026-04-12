import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function UserDetailModal({
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
            activeTab="users"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
        />
    );
}
