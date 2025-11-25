import { useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink'; // This is the Breeze NavLink
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import UserPicture from '../../assets/user.png';
import {
    Bell,
    Book,
    House,
    Lightbulb,
    LogOut,
    Newspaper,
    NotebookPen,
    PenLine,
    Menu,
    X,
    BarChart3, // Added for Analytics
} from 'lucide-react';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    // --- Sidebar Menu Items (FIXED) ---
    // I've added 'activeCheck' for robust highlighting (e.g., 'analytics.*')
    // And updated 'destination' to the correct route name.
    const menuItems = [
        { icon: <House size={24} />, label: 'Dashboard', destination: 'dashboard', activeCheck: 'dashboard' },
        { icon: <Lightbulb size={24} />, label: 'Learn More', destination: 'learn-more', activeCheck: 'learn-more' }, // Assuming this is a route
        { icon: <PenLine size={24} />, label: 'Attendance', destination: 'attendance', activeCheck: 'attendance' }, // Assuming this is a route
        { 
            icon: <BarChart3 size={24} />, // Changed icon
            label: 'Performance Analytics', // Changed label
            destination: 'analytics.index', // 1. FIXED DESTINATION
            activeCheck: 'analytics.*'     // 2. FIXED ACTIVE CHECK
        },
        { icon: <Newspaper size={24} />, label: 'Interventions & Feed', destination: 'interventions-feed', activeCheck: 'interventions-feed' },
        { icon: <Book size={24} />, label: 'Subject at Risk', destination: 'subject-at-risk', activeCheck: 'subject-at-risk' },
    ];

    // ✅ Optimized Sidebar Component
    const Sidebar = () => (
        <aside className="fixed left-0 top-0 w-64 h-screen flex-col bg-white text-black shadow-lg z-40 hidden lg:flex">
            {/* Logo Section */}
            <div className="flex items-center justify-center h-20 border-b-2 border-primary">
                <Link href={route('dashboard')}>
                    <ApplicationLogo className="block h-12 w-auto fill-current" />
                </Link>
            </div>

            {/* Profile Section */}
            <Link href={route('profile.edit')} className="flex items-center gap-4 p-4 mt-4 mx-4 rounded-lg hover:bg-gray-100">
                <img 
                    src={UserPicture} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full border-2 border-primary" 
                />
                <div>
                    <p className="font-semibold text-gray-800">{auth.user.name}</p>
                    <p className="text-sm text-gray-500">Student</p>
                </div>
            </Link>

            {/* Menu Items (FIXED) */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item, i) => {
                    // Check if the current route matches the 'activeCheck' pattern
                    const isActive = route().current(item.activeCheck);

                    return (
                        <NavLink
                            key={i}
                            href={route(item.destination)}
                            active={isActive}
                            // --- 3. FIXED STYLING ---
                            // We use the `active` prop to conditionally apply classes
                            className={`flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg transition-all duration-150
                                ${
                                    isActive
                                        ? 'bg-pink-100 text-pink-700 font-medium' // Active styles
                                        : 'hover:bg-gray-100' // Inactive styles
                                }
                            `}
                        >
                            {item.icon}
                            <p>{item.label}</p>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="border-t-2 border-primary p-2">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full px-4 h-[50px] flex items-center justify-start gap-3 rounded-lg text-gray-600 hover:bg-red-600 hover:text-white cursor-pointer transition-all duration-150"
                >
                    <LogOut size={24} />
                    <p className="font-medium">Log out</p>
                </Link>
            </div>
        </aside>
    );

    // ✅ Main Layout
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex flex-col flex-1 lg:pl-64">
                {/* Top Navigation */}
                <nav className="sticky top-0 z-30 bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            
                            {/* Left Side: Search Bar */}
                            <div className="flex-1 flex items-center">
                                <div className="flex-1 w-full max-w-lg">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-4 py-2 border border-gray-400 text-gray-800 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
                                        // className="w-full px-4 py-2 border border-pink-400 text-gray-800 bg-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    />
                                </div>
                            </div>

                            {/* Right Side: Icons & User Dropdown */}
                            <div className="hidden sm:flex sm:items-center sm:ml-6">
                                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                                    <Bell size={24} />
                                </button>
                                
                                <div className="ml-3 relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className="flex items-center text-sm rounded-full focus:outline-none"
                                            >
                                                <img 
                                                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                                                    src={UserPicture}
                                                    alt="User"
                                                />
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <div className="px-4 py-2">
                                                <div className="font-medium text-base text-gray-800">{auth.user.name}</div>
                                                <div className="font-medium text-sm text-gray-500">{auth.user.email}</div>
                                            </div>
                                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button">
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Hamburger Menu (Mobile) */}
                            <div className="-mr-2 flex items-center lg:hidden">
                                <button
                                    onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                                >
                                    {showingNavigationDropdown ? <X size={24} /> : <Menu size={24} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Responsive Navigation Menu (Mobile) (FIXED) */}
                    <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' lg:hidden border-t'}>
                        <div className="pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => (
                                <ResponsiveNavLink 
                                    key={item.label} 
                                    href={route(item.destination)} 
                                    active={route().current(item.activeCheck)} // Use activeCheck here too
                                >
                                    {item.label}
                                </ResponsiveNavLink>
                            ))}
                        </div>

                        {/* Responsive User Settings */}
                        <div className="pt-4 pb-1 border-t border-gray-200">
                            <div className="px-4">
                                <div className="font-medium text-base text-gray-800">{auth.user.name}</div>
                                <div className="font-medium text-sm text-gray-500">{auth.user.email}</div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                                <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                    Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}