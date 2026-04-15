import PrimaryButton from "@/Components/PrimaryButton";
import ApplicationLogo from "@/Components/ApplicationLogo";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Mail, CheckCircle, Send } from "lucide-react";

export default function VerifyEmail({
    status,
    currentEmail = "",
    requiresEmailInput = false,
    expiresInMinutes = 30,
    retryAfterSeconds = 0,
    cooldownSeconds = 180,
}) {
    // Remove useForm and duplicate retryAfter/setRetryAfter
    const [email, setEmail] = useState(currentEmail || "");
    const [otp, setOtp] = useState("");
    const [retryAfter, setRetryAfter] = useState(Math.max(0, Number(retryAfterSeconds) || 0));
    const [cooldown, setCooldown] = useState(Number(cooldownSeconds) || 180);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const cooldownMinutes = Math.max(1, Math.ceil((Number(cooldown) || 180) / 60));
    const isCooldownActive = retryAfter > 0;

    const formatRetryAfter = (seconds) => {
        const totalSeconds = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(totalSeconds / 60);
        const remainderSeconds = String(totalSeconds % 60).padStart(2, "0");
        return `${minutes}:${remainderSeconds}`;
    };

    useEffect(() => {
        setEmail(currentEmail || "");
    }, [currentEmail]);

    useEffect(() => {
        setRetryAfter(Math.max(0, Number(retryAfterSeconds) || 0));
        setCooldown(Number(cooldownSeconds) || 180);
    }, [retryAfterSeconds, cooldownSeconds]);

    useEffect(() => {
        if (retryAfter <= 0) return;
        const countdownId = window.setInterval(() => {
            setRetryAfter((previousValue) => (previousValue <= 1 ? 0 : previousValue - 1));
        }, 1000);
        return () => window.clearInterval(countdownId);
    }, [retryAfter]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
            setError("");
            setMessage("");
            if (isCooldownActive) {
                setError(`Please wait ${formatRetryAfter(retryAfter)} before resending another OTP.`);
                return;
            }
            if (!email.includes("@")) {
                setError("Please enter a valid personal email.");
                return;
            }
            setSending(true);
            try {
                const res = await fetch("/email-otp/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                setSending(false);
                if (!res.ok) {
                    setError(data.message || "Failed to send OTP.");
                    setRetryAfter(Number(data.resend_in || 0));
                    return;
                }
                setMessage(data.message || "OTP sent.");
                setRetryAfter(180);
            } catch (err) {
                setSending(false);
                setError("Failed to send OTP.");
            }
        };

        const handleVerifyOtp = async (e) => {
            e.preventDefault();
            setError("");
            setMessage("");
            if (!otp || otp.length !== 6) {
                setError("Please enter the 6-digit OTP sent to your email.");
                return;
            }
            setVerifying(true);
            try {
                const res = await fetch("/email-otp/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({ email, otp }),
                });
                const data = await res.json();
                setVerifying(false);
                if (!res.ok) {
                    setError(data.message || "Failed to verify OTP.");
                    return;
                }
                setMessage(data.message || "Email verified successfully.");
                setOtp("");
                // Optionally, reload or redirect here
            } catch (err) {
                setVerifying(false);
                setError("Failed to verify OTP.");
            }
        };
    // End of useEffect for retryAfter


    const showEmailRequiredHint = status === "verification-email-required";

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            {/* Header Section */}
            <div className="flex flex-col items-center mb-6">
                <Link href="/" className="group">
                    <div className="relative">
                        <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ApplicationLogo className="h-24 w-24 relative drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                    </div>
                </Link>
                <div className="mt-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <h1 className="text-xl font-semibold text-gray-800 font-poppins">
                        Verify Email
                    </h1>
                </div>
            </div>

            <div className="mb-6 text-sm text-gray-600 text-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Mail className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                {requiresEmailInput
                    ? "Please enter your personal email first. We will send a verification link to activate your account access."
                    : "Before getting started, verify your personal email by clicking the link we send."}
                <p className="mt-2 text-xs text-blue-700">
                    Verification links expire in {expiresInMinutes} minutes. You
                    can request another verification email every{" "}
                    {cooldownMinutes}
                    {cooldownMinutes === 1 ? " minute" : " minutes"}.
                </p>
            </div>

            {showEmailRequiredHint && (
                <div className="mb-4 text-sm font-medium text-amber-700 text-center bg-amber-50 p-3 rounded-xl border border-amber-200">
                    A personal email is required before you can access the
                    dashboard.
                </div>
            )}

            {status === "verification-link-sent" && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />A new verification link
                    has been sent to your personal email.
                </div>
            )}

            {isCooldownActive && (
                <div className="mb-4 text-sm font-medium text-amber-700 text-center bg-amber-50 p-3 rounded-xl border border-amber-200">
                    You can resend another verification email in{" "}
                    {formatRetryAfter(retryAfter)}.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mb-4">
                    <label
                        htmlFor="email"
                        className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1"
                    >
                        Personal Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="student@example.com"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary/30"
                        required={requiresEmailInput}
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <PrimaryButton
                        disabled={processing || isCooldownActive}
                        className="w-full sm:w-auto justify-center bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-500 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {isCooldownActive
                            ? `Resend In ${formatRetryAfter(retryAfter)}`
                            : requiresEmailInput
                              ? "Send Verification Email"
                              : "Resend Verification Email"}
                    </PrimaryButton>

                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="text-sm text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
