export const getSemesterLabel = (semester) => {
    switch (semester) {
        case 1:
            return "1st Semester";
        case 2:
            return "2nd Semester";
        default:
            return `Semester ${semester}`;
    }
};
