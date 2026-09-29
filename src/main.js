import { App } from "./components/App.js";
import { Validation } from "./components/Validation.js";
import { validateLesson1 } from "./utils/validator.js";

const app = document.querySelector("#app");

app.innerHTML = App();

const checkButton = document.querySelector("#check-button");
const yamlEditor = document.querySelector("#yaml-editor");
const validationContainer = document.querySelector("#validation-container");

checkButton.addEventListener("click", () => {
    const yaml = yamlEditor.value;

    const errors = validateLesson1(yaml);

    if (errors.length === 0) {
        validationContainer.innerHTML = Validation({
            type: "success"
        });

        return;
    }

    validationContainer.innerHTML = Validation({
        type: "error",
        messages: errors
    });
});

console.log("OpenAPI Course loaded");