# Global Loading State Implementation for Teacher Navigation

## Overview

A comprehensive global loading state system has been implemented across all teacher pages to provide consistent, professional loading feedback during navigation and view transitions.

## Files Created

### 1. **LoadingContext.jsx**

-   Location: `/resources/js/Context/LoadingContext.jsx`
-   Purpose: Centralized loading state management using React Context API
-   Features:
    -   `useLoading()` hook for easy access to loading state
    -   `startLoading()` and `stopLoading()` functions
    -   `withLoading()` utility for wrapping async operations
    -   Minimum delay support for better UX

### 2. **LoadingOverlay.jsx**

-   Location: `/resources/js/Components/LoadingOverlay.jsx`
-   Purpose: Reusable loading overlay component
-   Features:
    -   Animated spinning loader
    -   Semi-transparent dark background
    -   Centered modal with loading text
    -   Automatically hidden when not loading

## Files Modified

### 1. **TeacherLayout.jsx**

-   Added `LoadingProvider` wrapper around the entire layout
-   Added `LoadingOverlay` component for global display
-   Now all teacher pages automatically have access to loading state

### 2. **Dashboard.jsx**

-   Imported `useLoading` hook
-   Ready for loading integration on navigation

### 3. **MyClasses.jsx**

-   Imported `useLoading` hook
-   Updated `handleClassSelect()` to show loading when selecting a class
-   Updated `handleGoBack()` to show loading when returning to main view
-   300ms minimum loading display for smooth UX

### 4. **Attendance.jsx**

-   Imported `useLoading` hook
-   Added `handleViewModeChange()` function
-   Updated Grid/List view toggle buttons to use loading state
-   300ms minimum loading display

### 5. **AttendanceLog.jsx**

-   Imported `useLoading` hook for future enhancements
-   Prepared for navigation loading

### 6. **Interventions.jsx**

-   Imported `useLoading` hook
-   Removed local `isLoading` state
-   Updated `InterventionCenter` to use `useLoading()` from context
-   Updated `handleSelectStudent()` to use `startLoading()` and `stopLoading()`
-   Updated `handleBackToDashboard()` to use context loading
-   Removed inline loading overlay (now handled by global overlay)

## Key Features

✅ **Global Loading State** - All teacher pages share the same loading overlay
✅ **Consistent UI/UX** - Unified loading experience across all navigation
✅ **Easy Integration** - New pages can use `useLoading()` hook
✅ **Minimum Duration** - 300ms minimum to avoid flickering on fast operations
✅ **Non-Intrusive** - Doesn't block background interactions appropriately
✅ **Professional Appearance** - Animated spinner with backdrop blur

## Usage Example

```jsx
import { useLoading } from "@/Context/LoadingContext";

function MyComponent() {
    const { startLoading, stopLoading } = useLoading();

    const handleNavigation = () => {
        startLoading();
        setTimeout(() => {
            // Do navigation
            stopLoading();
        }, 300);
    };

    return <button onClick={handleNavigation}>Navigate</button>;
}
```

## Navigation Points with Loading

1. **Dashboard** - Ready for implementation
2. **My Classes**
    - Selecting a class → Loading overlay
    - Going back to class list → Loading overlay
3. **Attendance**
    - Switching between Grid/List views → Loading overlay
4. **Attendance Log** - Display page (minimal loading needed)
5. **Interventions**
    - Selecting a student → Loading overlay
    - Going back to dashboard → Loading overlay

## Component Hierarchy

```
TeacherLayout (LoadingProvider wrapper)
  ├── LoadingOverlay (global)
  ├── Navigation Bar
  ├── Page Content
  │   ├── Dashboard
  │   ├── MyClasses
  │   ├── Attendance
  │   ├── AttendanceLog
  │   └── Interventions
```

## Benefits

1. **Consistency** - Same loading experience across all pages
2. **Maintainability** - Single source of truth for loading state
3. **Reusability** - Context can be used in any page under TeacherLayout
4. **Performance** - Shared component reduces code duplication
5. **User Experience** - Smooth, professional loading feedback
