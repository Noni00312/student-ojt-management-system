$(document).ready(function () {
  $("#additional-info-form").validate({
    rules: {
      studentId: {
        required: true,
        minlength: 2,
      },
      phoneNumber: {
        required: true,
        digits: true,
        minlength: 10,
        maxlength: 15,
      },
      firstName: {
        required: true,
        minlength: 2,
      },
      middleName: {
        required: true,
        minlength: 2,
      },
      lastName: {
        required: true,
        minlength: 2,
      },
      gender: {
        required: true,
      },
      address: {
        required: true,
        minlength: 5,
      },
      companyName: {
        required: true,
      },
      // companyAddress: {
      //     required: true,
      //     minlength: 5
      // },
      morningTimeIn: {
        required: true,
      },
      morningTimeOut: {
        required: true,
      },
      afternoonTimeIn: {
        required: true,
      },
      afternoonTimeOut: {
        required: true,
      },
    },
    message: {
      studentId: {
        required: "Please enter your student ID",
        minlength: "Your student ID must be at least 2 characters long",
      },
      phoneNumber: {
        required: "Please enter your phone number",
        digits: "Please enter a valid phone number",
        minlength: "Your phone number must be at least 10 digits long",
        maxlength: "Your phone number must be at most 15 digits long",
      },
      firstName: {
        required: "Please enter your first name",
        minlength: "Your first name must be at least 2 characters long",
      },
      middleName: {
        required: "Please enter your middle name",
        minlength: "Your middle name must be at least 2 characters long",
      },
      lastName: {
        required: "Please enter your last name",
        minlength: "Your middle name must be at least 2 characters long",
      },
      gender: {
        required: "Please choose a gender",
      },
      address: {
        required: "Please enter your address",
        minlength: "Your address must be at least 5 characters long",
      },
      companyName: {
        required: "Please enter your company name",
        minlength: "Your company name must be at least 2 characters long",
      },
      companyAddress: {
        required: "Please enter your company address",
        minlength: "Your company address must be at least 5 characters long",
      },
      morningTimeIn: {
        required: "Please enter your morning time in",
      },
      morningTimeOut: {
        required: "Please enter your morning time out",
      },
      afternoonTimeIn: {
        required: "Please enter your afternoon time in",
      },
      afternoonTimeOut: {
        required: "Please enter your afternoon time out",
      },
    },
    errorPlacement: function (error, element) {
      error.appendTo($("#" + element.attr("name") + "-error"));
    },
    submitHandler: function (form) {
      const submitButton = $(form).find('button[type="submit"]');

      submitButton.prop("disabled", true);
      submitButton.html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Registering...
      `);

      const studentData = {
        userId: form.userId.value,
        userType: form.userType.value,
        studentId: form.studentId.value,
        phoneNumber: form.phoneNumber.value,
        firstName: form.firstName.value,
        middleName: form.middleName.value,
        lastName: form.lastName.value,
        suffix: form.suffix.value,
        gender: form.gender.value,
        address: form.address.value,
        companyName: form.companyName.value,
        // companyAddress : form.companyAddress.value,
        morningTimeIn: form.morningTimeIn.value,
        morningTimeOut: form.morningTimeOut.value,
        afternoonTimeIn: form.afternoonTimeIn.value,
        afternoonTimeOut: form.afternoonTimeOut.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
          firebaseCRUD
            .createData("student", studentData)
            .then(() => {
              alert("Registration successful!");
              window.location.href = "../pages/login.html";
            })
            .catch((error) => {
              console.error("Registration error:", error);
              alert(`Registration failed: ${error.message}`);

              submitButton.prop("disabled", false);
              submitButton.text("Create account");
            });
        })
        .catch((err) => {
          console.error("Failed to load firebase-crud:", err);
          submitButton.prop("disabled", false);
          submitButton.text("Create account");
        });
    },
  });
});
