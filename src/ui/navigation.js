import { course } from "../data/course.js";

/*
 * Навешивает обработчики на кнопки «Предыдущий / Следующий урок»
 * и на список уроков в сайдбаре.
 */
export function initNavigation(currentIndex, goToLesson) {
    const go = index => {
        if (index < 0 || index >= course.length) {
            return;
        }

        goToLesson(index);
    };

    document
        .querySelector("#next-button")
        ?.addEventListener("click", () => go(currentIndex + 1));

    document
        .querySelector("#previous-button")
        ?.addEventListener("click", () => go(currentIndex - 1));

    document.querySelectorAll(".lesson").forEach(button => {
        button.addEventListener("click", () => {
            go(Number(button.dataset.lessonIndex));
        });
    });
}
