function validateForm() {
  var firstName = document.getElementById("firstName").value;
  var lastName = document.getElementById("lastName").value;
  var age = document.getElementById("age").value;
  var gender = document.querySelector('input[name="gender"]:checked');
  var email = document.getElementById("email").value;
  var errorMsg = "";

  // Validate First Name
  if (firstName === "") {
    errorMsg += "First Name is required. \n";
    document.getElementById("firstNameError").innerHTML =
      "Please enter your First Name.";
  } else {
    document.getElementById("firstNameError").innerHTML = "";
  }

  // Validate Last Name
  if (lastName === "") {
    errorMsg += "Last Name is required. \n";
    document.getElementById("lastNameError").innerHTML =
      "Please enter your Last Name.";
  } else {
    document.getElementById("lastNameError").innerHTML = "";
  }

  // Validate Age (presence and non-negative)
  if (age === "" || age < 0) {
    errorMsg += "Age is required and must be a non-negative number. \n";
    document.getElementById("ageError").innerHTML =
      "Please enter a valid Age (0 or above).";
  } else {
    document.getElementById("ageError").innerHTML = "";
  }

  // Validate Gender
  if (!gender) {
    errorMsg += "Gender is required. \n";
    document.getElementById("genderError").innerHTML =
      "Please select your Gender.";
  } else {
    document.getElementById("genderError").innerHTML = "";
  }

  // Validate Email (optional, but must be a valid email format if provided)
  if (email !== "") {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(String(email).toLowerCase())) {
      errorMsg += "Please enter a valid Email address (optional).";
      document.getElementById("emailError").innerHTML = "Invalid Email format.";
    } else {
      document.getElementById("emailError").innerHTML = "";
    }
  }

  // If there are any error messages, prevent form submission and display them
  if (errorMsg !== "") {
    alert(errorMsg);
    return false;
  }

  // If no errors, return true to allow form submission
  return true;
}

// Add event listener to the form
document
  .getElementById("registrationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get the selected gender value
    var gender = document.querySelector('input[name="gender"]:checked');
    var genderValue = gender ? gender.value : null;
    window.location.href = "./Record.htm";
    // Send form data to server
    fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        age: document.getElementById("age").value,
        gender: genderValue, // Use the selected gender value
        email: document.getElementById("email").value,
      }),
    })
      .then((response) => {
        if (response.ok) {
          // Redirect to another HTML page after successful form submission
          window.location.href = "./Record.htm"; // Change to the desired page URL
        } else {
          console.error("Form submission failed:", response.statusText);
          // Handle error appropriately
        }
      })
      .catch((error) => {
        console.error("Error during form submission:", error);
        // Handle error appropriately
      });
  });
