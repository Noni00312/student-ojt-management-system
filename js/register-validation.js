$(document).ready(function () {
  $.validator.addMethod(
    "atLeastOneChecked",
    function (value, element) {
      console.log(
        "Checked boxes:",
        $('input[name="weeklySchedule[]"]:checked').length
      );
      return $('input[name="weeklySchedule[]"]:checked').length > 0;
    },
    "Choose at least one day."
  );

  $.validator.addMethod(
    "validTimeSequence",
    function () {
      return isTimeSequenceValid();
    },
    "Please ensure the times are in proper order."
  );

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
      "weeklySchedule[]": {
        atLeastOneChecked: true,
      },
      morningTimeIn: {
        required: true,
        validTimeSequence: true,
      },
      morningTimeOut: {
        required: true,
        validTimeSequence: true,
      },
      afternoonTimeIn: {
        required: true,
        validTimeSequence: true,
      },
      afternoonTimeOut: {
        required: true,
        validTimeSequence: true,
      },
    },

    messages: {
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
        minlength: "Your last name must be at least 2 characters long",
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
      },
      "weeklySchedule[]": {
        atLeastOneChecked: "Choose at least one day for weekly schedule.",
      },
      companyAddress: {
        required: "Please enter your company address",
        minlength: "Your company address must be at least 5 characters long",
      },
      morningTimeIn: {
        required: "Please enter your morning time in",
      },
      morningTimeOut: {
        greaterThan: "Time out must be after Morning time in.",
      },
      afternoonTimeIn: {
        greaterThan: "Afternoon time in must be after Morning time out.",
      },
      afternoonTimeOut: {
        greaterThan: "Time out must be after Afternoon time in.",
      },
    },

    errorPlacement: function (error, element) {
      const baseName = element.attr("name").replace(/\[\]$/, "");
      const errorContainer = $("#" + baseName + "-error");

      if (errorContainer.length) {
        error.appendTo(errorContainer);
      } else {
        if (element.attr("type") === "checkbox") {
          error.insertAfter(element.closest("div"));
        } else {
          error.insertAfter(element);
        }
      }
    },
    submitHandler: async function (form, event) {
      if (event) event.preventDefault();
      const submitButton = $(form).find('button[type="submit"]');
      submitButton.prop("disabled", true);
      submitButton.html(`
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Registering...
  `);

      try {
        const selectedDays = {};
        $(".weekdays-container input[type='checkbox']").each(function () {
          selectedDays[$(this).val()] = $(this).is(":checked");
        });

        const fileInput = document.getElementById("img-input");
        let imageBase64 = null;

        if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
            imageBase64 = await ImageConverter.imageToBase64(
              fileInput.files[0]
            );
            ImageConverter.validateBase64(imageBase64);
          } catch (error) {
            console.warn("Image conversion warning:", error.message);
          }
        }

        const studentData = {
          userId: form.userId.value,
          userType: form.userType.value,
          emailAddress: form.emailAddress.value,
          studentId: form.studentId.value,
          phoneNumber: form.phoneNumber.value,
          firstName: form.firstName.value,
          middleName: form.middleName.value,
          lastName: form.lastName.value,
          suffix: form.suffix.value,
          gender: form.gender.value,
          address: form.address.value,
          companyName: form.companyName.value,
          companyAddress: form.companyAddress.value,
          weeklySchedule: selectedDays,
          morningTimeIn: form.morningTimeIn.value,
          morningTimeOut: form.morningTimeOut.value,
          afternoonTimeIn: form.afternoonTimeIn.value,
          afternoonTimeOut: form.afternoonTimeOut.value,
          userImg: imageBase64,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          const { firebaseCRUD } = await import("./firebase-crud.js");
          const result = await firebaseCRUD.createData("students", studentData);

          alert("Registration successful!");
          window.location.href = "../pages/login.html";
        } catch (error) {
          console.error("Full error object:", error);
          console.error("HTTP status:", error.response?.status);
          alert(`Registration failed: ${error.message}`);
          submitButton.prop("disabled", false);
          submitButton.text("Create account");
        }
      } catch (error) {
        console.error("Registration error:", error);
        alert(`Registration failed: ${error.message}`);
        submitButton.prop("disabled", false);
        submitButton.text("Create account");
      }
    },
  });
});

$(
  "#morning-time-in, #morning-time-out, #afternoon-time-in, #afternoon-time-out"
).on("change", function () {
  $("#additional-info-form").validate().element("#morning-time-in");
  $("#additional-info-form").validate().element("#morning-time-out");
  $("#additional-info-form").validate().element("#afternoon-time-in");
  $("#additional-info-form").validate().element("#afternoon-time-out");
});

function isTimeSequenceValid() {
  const morningIn = $("#morning-time-in").val();
  const morningOut = $("#morning-time-out").val();
  const afternoonIn = $("#afternoon-time-in").val();
  const afternoonOut = $("#afternoon-time-out").val();

  if (!morningIn || !morningOut || !afternoonIn || !afternoonOut) return true;

  return (
    morningIn < morningOut &&
    morningOut < afternoonIn &&
    afternoonIn < afternoonOut
  );
}
