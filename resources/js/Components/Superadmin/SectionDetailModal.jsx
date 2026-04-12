import ManagementDetailModal from "@/Components/Superadmin/ManagementDetailModal";

export default function SectionDetailModal({
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
            activeTab="sections"
            payload={payload}
            loading={loading}
            error={error}
            row={row}
        />
    );
}
