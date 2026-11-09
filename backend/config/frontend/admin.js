
const API_URL = "http://localhost:5000/api/admin";

let currentPage = 1;
const pageLimit = 10;


// ELEMENTS
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");


// GET TOKEN
function getToken() {
    return sessionStorage.getItem("finoraAdminToken");
}


// API REQUEST HELPER
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        logout();
        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}


// LOGIN
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginButton = document.getElementById("loginButton");

    loginError.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        sessionStorage.setItem("finoraAdminToken", data.token);

        document.getElementById("password").value = "";

        showDashboard();

    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});


// SHOW DASHBOARD
function showDashboard() {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");

    loadDashboard();
}


// LOGOUT
function logout() {
    sessionStorage.removeItem("finoraAdminToken");

    dashboard.classList.add("hidden");
    loginScreen.classList.remove("hidden");

    loginForm.reset();
    loginError.textContent = "";
}


// LOAD DASHBOARD DATA
async function loadDashboard() {
    try {
        await Promise.all([
            loadStatistics(),
            loadEnquiries()
        ]);
    } catch (error) {
        console.error("Dashboard Error:", error.message);
    }
}


// LOAD STATISTICS
async function loadStatistics() {
    const data = await apiRequest("/stats");

    const stats = data.statistics;

    document.getElementById("totalEnquiries").textContent =
        stats.total_enquiries;

    document.getElementById("newEnquiries").textContent =
        stats.new_enquiries;

    document.getElementById("contactedEnquiries").textContent =
        stats.contacted_enquiries;

    document.getElementById("approvedEnquiries").textContent =
        stats.approved_enquiries;

    document.getElementById("rejectedEnquiries").textContent =
        stats.rejected_enquiries;

    document.getElementById("summaryTotal").textContent =
        stats.total_enquiries;

    displayServiceBreakdown(data.service_breakdown);
}


// SERVICE BREAKDOWN
function displayServiceBreakdown(services) {
    const container = document.getElementById("serviceBreakdown");

    container.innerHTML = "";

    const highest = Math.max(
        ...services.map(service => Number(service.total)),
        1
    );

    services.forEach(service => {
        const total = Number(service.total);
        const percentage = (total / highest) * 100;

        const item = document.createElement("div");
        item.className = "service-item";

        const info = document.createElement("div");
        info.className = "service-info";

        const name = document.createElement("span");
        name.textContent = service.service_name;

        const count = document.createElement("strong");
        count.textContent = total;

        info.append(name, count);

        const track = document.createElement("div");
        track.className = "progress-track";

        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = `${percentage}%`;

        track.appendChild(fill);
        item.append(info, track);
        container.appendChild(item);
    });
}


// LOAD CUSTOMER ENQUIRIES
async function loadEnquiries() {
    const search = document.getElementById("searchInput").value.trim();
    const status = document.getElementById("statusFilter").value;

    const params = new URLSearchParams({
        search,
        status,
        page: currentPage,
        limit: pageLimit
    });

    const data = await apiRequest(`/enquiries?${params}`);

    displayEnquiries(data.enquiries);

    document.getElementById("paginationInfo").textContent =
        `Page ${data.current_page} of ${data.total_pages}`;

    document.getElementById("previousPage").disabled =
        currentPage <= 1;

    document.getElementById("nextPage").disabled =
        currentPage >= data.total_pages;

    document.getElementById("enquiryMessage").textContent =
        `${data.total_enquiries} enquiries found.`;
}


// DISPLAY ENQUIRIES
function displayEnquiries(enquiries) {
    const tableBody = document.getElementById("enquiriesTableBody");

    tableBody.innerHTML = "";

    if (enquiries.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No enquiries found.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    enquiries.forEach(enquiry => {
        const row = document.createElement("tr");

        const date = enquiry.created_at
            ? new Date(enquiry.created_at).toLocaleDateString("en-IN")
            : "—";

        const cells = [
            enquiry.enquiry_id,
            enquiry.full_name,
            enquiry.service_name || "—",
            enquiry.phone,
            date
        ];

        cells.forEach((value, index) => {
            const cell = document.createElement("td");

            cell.textContent = value ?? "—";

            if (index === 1) {
                cell.className = "customer-name";
            }

            row.appendChild(cell);
        });

        // STATUS BADGE
        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = `status status-${String(enquiry.status || "New").toLowerCase()}`;
        badge.textContent = enquiry.status || "New";

        statusCell.appendChild(badge);
        row.appendChild(statusCell);


        // STATUS UPDATE DROPDOWN
        const updateCell = document.createElement("td");
        const select = document.createElement("select");

        select.className = "status-select";

        ["New", "Contacted", "Approved", "Rejected"].forEach(status => {
            const option = document.createElement("option");

            option.value = status;
            option.textContent = status;

            if (status === enquiry.status) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        select.addEventListener("change", async function () {
            await updateEnquiryStatus(enquiry.enquiry_id, select.value);
        });

        updateCell.appendChild(select);
        row.appendChild(updateCell);

        tableBody.appendChild(row);
    });
}


// UPDATE ENQUIRY STATUS
async function updateEnquiryStatus(id, status) {
    try {
        const data = await apiRequest(`/enquiries/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status })
        });

        document.getElementById("enquiryMessage").textContent =
            data.message;

        await loadStatistics();
        await loadEnquiries();

    } catch (error) {
        alert(error.message);
        await loadEnquiries();
    }
}


// SIDEBAR NAVIGATION
document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", function () {
        const section = this.dataset.section;

        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
        });

        this.classList.add("active");

        document.getElementById("overviewSection").classList.add("hidden");
        document.getElementById("enquiriesSection").classList.add("hidden");

        if (section === "overview") {
            document.getElementById("overviewSection").classList.remove("hidden");
            document.getElementById("pageTitle").textContent = "Overview";
        }

        if (section === "enquiries") {
            document.getElementById("enquiriesSection").classList.remove("hidden");
            document.getElementById("pageTitle").textContent = "Customer Enquiries";

            loadEnquiries();
        }
    });
});


// VIEW ALL ENQUIRIES BUTTON
document.getElementById("viewEnquiriesButton").addEventListener("click", function () {
    document.querySelector('[data-section="enquiries"]').click();
});


// REFRESH
document.getElementById("refreshButton").addEventListener("click", loadDashboard);


// SEARCH
document.getElementById("searchButton").addEventListener("click", function () {
    currentPage = 1;
    loadEnquiries();
});


// SEARCH WHEN ENTER IS PRESSED
document.getElementById("searchInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        currentPage = 1;
        loadEnquiries();
    }
});


// FILTER BY STATUS
document.getElementById("statusFilter").addEventListener("change", function () {
    currentPage = 1;
    loadEnquiries();
});


// PAGINATION
document.getElementById("previousPage").addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        loadEnquiries();
    }
});

document.getElementById("nextPage").addEventListener("click", function () {
    currentPage++;
    loadEnquiries();
});


// LOGOUT BUTTON
document.getElementById("logoutButton").addEventListener("click", logout);


// CHECK EXISTING SESSION
if (getToken()) {
    showDashboard();
}
