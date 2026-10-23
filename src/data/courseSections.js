/*
 * Блоки курса OpenAPI для списка уроков. Сами уроки остаются плоским списком
 * (course.js), блоки нужны только сайдбару: так же, как главы в SQL и «Диаграммах».
 */
export const COURSE_SECTIONS = [
    { title: "Знакомство", lessons: ["theory-api-basics", "theory-yaml"] },
    { title: "Первое описание", lessons: ["practice-skeleton", "practice-1"] },
    { title: "Ресурс Users", lessons: ["theory-2", "practice-2"] },
    { title: "Схемы и JSON", lessons: ["theory-3", "practice-3", "theory-5", "practice-4"] },
    {
        title: "Списки и параметры",
        lessons: ["theory-4", "practice-users-list", "theory-6", "practice-5", "practice-6"]
    },
    { title: "Ответы и ошибки", lessons: ["theory-7", "practice-7", "practice-8"] },
    { title: "От базы к API", lessons: ["theory-9", "practice-9", "theory-10"] }
];
