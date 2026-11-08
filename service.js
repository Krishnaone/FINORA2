
// =========================================
// FINORA - SERVICE PAGE JAVASCRIPT
// Version 2.1
// =========================================

const API_BASE_URL = "http://localhost:5000";


// =========================================
// DETECT CURRENT SERVICE
// =========================================

function getCurrentService() {

    const currentPage = window.location.pathname;

    if (currentPage.includes("health-insurance")) {
        return {
            slug: "health_insurance",
            endpoint: "/api/health-insurance"
        };
    }

    if (currentPage.includes("term-insurance")) {
        return {
            slug: "term_insurance",
            endpoint: "/api/term-insurance"
        };
    }

    if (currentPage.includes("life-insurance")) {
        return {
            slug: "life_insurance",
            endpoint: "/api/life-insurance"
        };
    }

    if (currentPage.includes("loans")) {
        return {
            slug: "loans",
            endpoint: "/api/loans"
        };
    }

    return null;
}


// =========================================
// API CONNECTION STATUS
// =========================================

document.addEventListener("DOMContentLoaded", async function () {

    const apiStatus = document.getElementById("api-status");

    const service = getCurrentService();

    if (!service || !apiStatus) return;

    try {

        const response = await fetch(
            API_BASE_URL + service.endpoint
        );

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        apiStatus.textContent = data.message;

        console.log("Finora API Connected:", data);

    } catch (error) {

        apiStatus.textContent =
            "Unable to connect to Finora server.";

        console.error("Finora API Error:", error);

    }

});


// =========================================
// CUSTOMER ENQUIRY SUBMISSION
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const enquiryForm = document.querySelector(".enquiry-form");

    if (!enquiryForm) return;

    const service = getCurrentService();

    if (!service) return;

    const formStatus = enquiryForm.querySelector(".form-status");

    const submitButton = enquiryForm.querySelector(
        'button[type="submit"]'
    );

    if (!submitButton || !formStatus) return;

    const originalButtonText = submitButton.textContent;


    // =====================================
    // FORM SUBMISSION
    // =====================================

    enquiryForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!enquiryForm.checkValidity()) {
            enquiryForm.reportValidity();
            return;
        }

        const formData = new FormData(enquiryForm);


        // =================================
        // PREPARE ENQUIRY DATA
        // =================================

        const enquiryData = {

            full_name: formData.get("fullName")?.trim(),

            email: formData.get("email")?.trim(),

            phone: formData.get("phone")?.trim(),

            service_slug: service.slug,

            city: formData.get("city")?.trim() || null,

            address: formData.get("address")?.trim() || null,

            // Supports both health and term insurance forms
            cover_type:
                formData.get("coverFor") ||
                formData.get("coverType") ||
                null,

            members: formData.get("members") || null,

            cover_amount:
                formData.get("coverAmount") || null,

            // Term insurance specific field
            policy_term:
                formData.get("policyTerm") || null,

            message:
                formData.get("message")?.trim() || null

        };


        // =================================
        // SEND TO BACKEND
        // =================================

        try {

            submitButton.disabled = true;

            submitButton.textContent = "Submitting...";

            formStatus.textContent =
                "Submitting your enquiry...";

            formStatus.style.color = "#142B49";


            console.log("Finora Enquiry Payload:", enquiryData);


            const response = await fetch(
                API_BASE_URL + "/api/enquiries",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(enquiryData)
                }
            );


            const result = await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message || "Submission failed."
                );

            }


            // =================================
            // SUCCESS
            // =================================

            formStatus.textContent =
                "✓ " + result.message;

            formStatus.style.color = "green";

            enquiryForm.reset();

            console.log("Finora Enquiry Saved:", result);


        } catch (error) {


            // =================================
            // ERROR
            // =================================

            formStatus.textContent =
                error.message ||
                "Unable to submit enquiry.";

            formStatus.style.color = "red";

            console.error(
                "Enquiry Submission Error:",
                error
            );


        } finally {


            // =================================
            // RESTORE BUTTON
            // =================================

            submitButton.disabled = false;

            submitButton.textContent =
                originalButtonText;

        }

    });

});
