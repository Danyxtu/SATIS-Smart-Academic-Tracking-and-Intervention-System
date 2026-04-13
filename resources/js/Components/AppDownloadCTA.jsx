import { useState } from "react";
import { Download, QrCode, Smartphone, X } from "lucide-react";
import Modal from "@/Components/Modal";
import { QRCodeSVG } from "qrcode.react";

const DEFAULT_APP_DOWNLOAD_URL =
    "https://github.com/Danyxtu/SATIS-Smart-Academic-Tracking-and-Intervention-System-App/releases/download/v1.0.3(beta)/satis-app_v1.0.3.beta.apk";

export default function AppDownloadCTA({
    href = DEFAULT_APP_DOWNLOAD_URL,
    title = "Download the App!",
    subtitle = "Get SATIS Mobile for instant updates.",
    className = "",
    floating = true,
}) {
    const [showQrModal, setShowQrModal] = useState(false);

    const wrapperClasses = floating
        ? "fixed bottom-4 right-4 z-50 w-[220px] sm:bottom-6 sm:right-6 sm:w-[280px]"
        : "w-full max-w-xs";

    return (
        <>
            <div className={`${wrapperClasses} ${className}`.trim()}>
                <div className="rounded-2xl bg-gradient-to-r from-primary via-pink-400 to-rose-400 p-[1px] shadow-2xl shadow-primary/30">
                    <div className="animate-float-cta rounded-2xl bg-white/95 px-3.5 py-3.5 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-500 text-white shadow-md shadow-primary/30">
                                <Smartphone className="h-5 w-5" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-extrabold leading-tight tracking-tight text-gray-800">
                                    {title}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-tight text-gray-600">
                                    {subtitle}
                                </span>
                            </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Download the SATIS mobile app"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </a>

                            <button
                                type="button"
                                onClick={() => setShowQrModal(true)}
                                aria-label="Scan QR code to download SATIS mobile app"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-white px-2.5 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <QrCode className="h-3.5 w-3.5" />
                                Scan QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                show={showQrModal}
                maxWidth="sm"
                closeable={true}
                onClose={() => setShowQrModal(false)}
            >
                <div className="bg-white px-5 py-5 text-gray-900">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                Scan QR to Download
                            </h3>
                            <p className="mt-1 text-xs text-gray-600">
                                Scan this code using your phone camera.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowQrModal(false)}
                            aria-label="Close QR code modal"
                            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mx-auto w-fit rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                        <QRCodeSVG
                            value={href}
                            size={224}
                            level="M"
                            includeMargin={true}
                            className="h-56 w-56"
                        />
                    </div>

                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Open Download Link
                    </a>
                </div>
            </Modal>
        </>
    );
}
