import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-4 text-sm text-gray-600 text-center">
                Forgot your password? No problem. Just enter your email address
                and we’ll send you a password reset link.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 text-center">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        isFocused={true}
                        placeholder="Enter your email"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    {/* Back to Login Link */}
                    <Link
                        href={route('login')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Login
                    </Link>

                    {/* Submit Button */}
                    <PrimaryButton disabled={processing}>
                        Email Reset Link
                    </PrimaryButton>
                </div>

                {/* Optional: Back to Welcome/Home */}
                <div className="text-center mt-4">
                    <Link
                        href="/"
                        className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        ← Back to Welcome Page
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
