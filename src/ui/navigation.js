import { course } from "../data/course.js";

function goIfExists(goToLesson, index) {
    if (index < 0 || index >= course.length) {
        return;
    }

    goToLesson(index);
}

/*
 * Список уроков в сайдбаре. Отдельная функция, чтобы после обновления
 * сайдбара (галочки прогресса) можно было заново навесить обработчики,
 * не трогая кнопки «Предыдущий / Следующий».
 */
export function bindLessonList(goToLesson, root = document) {
    root.querySelectorAll(".lesson").forEach(button => {
        button.addEventListener("click", () => {
            goIfExists(goToLesson, Number(button.dataset.lessonIndex));
        });
    });
}

/*
 * Навешивает обработчики на кнопки «Предыдущий / Следующий урок»
 * и на список уроков в сайдбаре.
 * onNext вызывается перед переходом по кнопке «Следующий урок».
 */
export function initNavigation(
    currentIndex,
    goToLesson,
    { root = document, onNext = () => {} } = {}
) {
    root
        .querySelectorAll(".nav-button--next")
        .forEach(button =>
            button.addEventListener("click", () => {
                onNext();
                goIfExists(goToLesson, currentIndex + 1);
            })
        );

    root
        .querySelectorAll(".nav-button--previous")
        .forEach(button =>
            button.addEventListener("click", () =>
                goIfExists(goToLesson, currentIndex - 1)
            )
        );

    bindLessonList(goToLesson, root);
}
