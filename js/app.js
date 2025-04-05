
//Hide and Show Password START
const password_input = document.getElementById("password-input");
const password_icon = document.getElementById("password-icon");
password_icon.addEventListener("click", function () {
    if (password_input.type === "password") {
        password_input.type = "text";
        password_icon.classList.remove("bi-eye-slash-fill");
        password_icon.classList.add("bi-eye-fill");
    } else {
        password_input.type = "password";
        password_icon.classList.remove("bi-eye-fill");
        password_icon.classList.add("bi-eye-slash-fill");
    }
});

const confirm_password_input = document.getElementById("confirm-password-input");
const confirm_password_icon = document.getElementById("confirm-password-icon");
confirm_password_icon.addEventListener("click", function () {
    if (confirm_password_input.type === "password") {
        confirm_password_input.type = "text";
        confirm_password_icon.classList.remove("bi-eye-slash-fill");
        confirm_password_icon.classList.add("bi-eye-fill");
    } else {
        confirm_password_input.type = "password";
        confirm_password_icon.classList.remove("bi-eye-fill");
        confirm_password_icon.classList.add("bi-eye-slash-fill");
    }
});