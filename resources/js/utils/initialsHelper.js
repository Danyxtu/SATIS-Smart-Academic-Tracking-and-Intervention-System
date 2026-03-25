// Helper to get initials from first and last name
// Usage: getInitials('John', 'Doe') => 'JD'

function getInitials(firstName, lastName) {
    if (!firstName || !lastName) return "";
    return firstName.trim()[0].toUpperCase() + lastName.trim()[0].toUpperCase();
}

export default getInitials;
