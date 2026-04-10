import React from "react";
import SchoolStaffLayout from "@/Layouts/SchoolStaffLayout";
import { PasswordResetRequestsPage } from "@/Pages/Admin/PasswordResetRequests";

export default function PasswordResetRequests(props) {
    return (
        <PasswordResetRequestsPage
            {...props}
            routePrefix="superadmin"
            subtitle="Review and process password reset requests from teachers and students across all departments"
        />
    );
}

PasswordResetRequests.layout = (page) => <SchoolStaffLayout children={page} />;
