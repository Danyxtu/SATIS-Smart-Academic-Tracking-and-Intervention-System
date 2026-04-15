import ApplicationLogo from "@/Components/ApplicationLogo";
import PrimaryButton from "@/Components/PrimaryButton";
import GuestLayout from "@/Layouts/GuestLayout";
import axios from "axios";
import { Head, Link, router } from "@inertiajs/react";
import { CheckCircle, Mail, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_COOLDOWN_SECONDS = 180;
const DEFAULT_EXPIRES_MINUTES = 6;

const formatCountdown = (secondsValue) => {
    const totalSeconds = Math.max(0, Number(secondsValue) || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${minutes}:${seconds}`;
};

const sanitizeOtp = (value) =>
    String(value ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

const extractErrorMessage = (error, fallback) => {
    const apiMessage =
        error?.response?.data?.errors?.email?.[0] ||
        error?.response?.data?.errors?.otp?.[0] ||
        error?.response?.data?.message;

    return apiMessage || fallback;
};

export default function EmailOtpVerification({
    status,
    currentEmail = "",
    requiresEmailInput = false,
    expiresInMinutes = DEFAULT_EXPIRES_MINUTES,
    retryAfterSeconds = 0,
    cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
}) {
    const [email, setEmail] = useState(currentEmail || "");
    const [otp, setOtp] = useState("");
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [retryAfter, setRetryAfter] = useState(
        Math.max(0, Number(retryAfterSeconds) || 0),
    );
    const [cooldown, setCooldown] = useState(
        Number(cooldownSeconds) || DEFAULT_COOLDOWN_SECONDS,
    );
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = sanitizeOtp(otp);
    const isResendLocked = retryAfter > 0;
    const resendMinutes = Math.max(
        1,
        Math.ceil((Number(cooldown) || 180) / 60),
    );

    const showEmailRequiredHint =
        status === "verification-email-required" || requiresEmailInput;

    useEffect(() => {
        setEmail(currentEmail || "");
    }, [currentEmail]);

    useEffect(() => {
        setRetryAfter(Math.max(0, Number(retryAfterSeconds) || 0));
        setCooldown(Number(cooldownSeconds) || DEFAULT_COOLDOWN_SECONDS);
    }, [retryAfterSeconds, cooldownSeconds]);

    useEffect(() => {
        if (retryAfter <= 0) {
            return undefined;
        }

        const timerId = window.setInterval(() => {
            setRetryAfter((previousValue) =>
                previousValue <= 1 ? 0 : previousValue - 1,
            );
        }, 1000);

        return () => window.clearInterval(timerId);
    }, [retryAfter]);

    const sendButtonLabel = useMemo(() => {
        if (isResendLocked) {
            return `Resend In ${formatCountdown(retryAfter)}`;
        }

        return "Send OTP";
    }, [isResendLocked, retryAfter]);

    const handleSendOtp = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (isResendLocked) {
            setError(
                `Please wait ${formatCountdown(retryAfter)} before resending another OTP.`,
            );
            return;
        }

        if (!normalizedEmail.includes("@")) {
            setError("Please enter a valid personal email.");
            return;
        }

        setSending(true);

        try {
            const response = await axios.post(route("otp.send"), {
                email: normalizedEmail,
            });

            const nextCooldown =
                Number(response?.data?.cooldown_seconds ?? cooldown) ||
                cooldown;
            const nextRetryAfter =
                Number(response?.data?.resend_in ?? nextCooldown) ||
                nextCooldown;

            setCooldown(nextCooldown);
            setRetryAfter(Math.max(0, nextRetryAfter));
            setMessage(response?.data?.message || "OTP sent.");
        } catch (requestError) {
            const nextRetryAfter =
                Number(requestError?.response?.data?.resend_in ?? 0) || 0;
            setRetryAfter(Math.max(0, nextRetryAfter));
            setError(extractErrorMessage(requestError, "Failed to send OTP."));
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!normalizedEmail.includes("@")) {
            setError("Please enter a valid personal email.");
            return;
        }

        if (normalizedOtp.length !== 6) {
            setError("Please enter the 6-digit OTP sent to your email.");
            return;
        }

        setVerifying(true);

        try {
            const response = await axios.post(route("otp.verify"), {
                email: normalizedEmail,
                otp: normalizedOtp,
            });

            setMessage(
                response?.data?.message || "Email verified successfully.",
            );
            setOtp("");

            const redirectTo =
                response?.data?.redirect_to || route("redirect-after-login");

            router.visit(redirectTo, {
                replace: true,
            });
        } catch (requestError) {
            setError(
                extractErrorMessage(requestError, "Failed to verify OTP."),
            );
        } finally {
            setVerifying(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Verify Personal Email" />

            <div className="mb-6 flex flex-col items-center">
                <Link href="/" className="group">
                    <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-primary/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                        <ApplicationLogo className="relative h-24 w-24 drop-shadow-md transition-transform duration-300 group-hover:scale-105" />
                    </div>
                </Link>
                <div className="mt-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h1 className="font-poppins text-xl font-semibold text-gray-800">
                        OTP Email Verification
                    </h1>
                </div>
            </div>

            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm text-gray-700">
                <Mail className="mx-auto mb-3 h-8 w-8 text-blue-500" />
                Enter your personal email, request a 6-digit OTP, and enter the
                code to continue.
                <p className="mt-2 text-xs text-blue-700">
                    OTP expires in {expiresInMinutes || DEFAULT_EXPIRES_MINUTES}{" "}
                    minutes. You can resend every {resendMinutes}
                    {resendMinutes === 1 ? " minute" : " minutes"}.
                </p>
            </div>

            {showEmailRequiredHint && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-700">
                    A personal email is required before you can access the
                    dashboard.
                </div>
            )}

            {isResendLocked && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-700">
                    You can resend another OTP in {formatCountdown(retryAfter)}.
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    {message}
                </div>
            )}

            <form onSubmit={handleVerifyOtp}>
                <div className="mb-4">
                    <label
                        htmlFor="email"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                        Personal Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="user@example.com"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-primary/30"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label
                        htmlFor="otp"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                        6-Digit OTP
                    </label>
                    <input
                        id="otp"
                        inputMode="numeric"
                        maxLength={6}
                        value={normalizedOtp}
                        onChange={(event) => setOtp(event.target.value)}
                        placeholder="123456"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm tracking-[0.25em] focus:border-primary focus:ring-primary/30"
                        required
                    />
                </div>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <PrimaryButton
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sending || isResendLocked}
                        className="w-full justify-center rounded-xl bg-gradient-to-r from-primary to-pink-400 shadow-lg shadow-primary/25 transition-all duration-200 hover:from-primary/90 hover:to-pink-500 sm:w-auto"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? "Sending..." : sendButtonLabel}
                    </PrimaryButton>

                    <PrimaryButton
                        type="submit"
                        disabled={verifying}
                        className="w-full justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500/90 hover:to-teal-500/90 sm:w-auto"
                    >
                        {verifying ? "Verifying..." : "Verify OTP"}
                    </PrimaryButton>

                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-primary"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
