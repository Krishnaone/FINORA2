
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ========================================
// FINORA ADMIN ROUTES
// ========================================

// Allowed enquiry statuses
const allowedStatuses = [
    "New",
    "Contacted",
    "Approved",
    "Rejected"
];

// ========================================
// ADMIN LOGIN
// ========================================

router.post("/login", (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        if (
            username !== process.env.ADMIN_USERNAME ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication configuration is missing."
            });
        }

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            message: "Admin login successful!",
            token
        });

    } catch (error) {
        console.error("Admin Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to process login."
        });
    }
});

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

const authenticateAdmin = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.admin = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

// All routes below this point require authentication
router.use(authenticateAdmin);

// ========================================
// DASHBOARD STATISTICS
// ========================================

router.get("/stats", async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                COUNT(*) AS total_enquiries,

                COUNT(*) FILTER (
                    WHERE status = 'New'
                ) AS new_enquiries,

                COUNT(*) FILTER (
                    WHERE status = 'Contacted'
                ) AS contacted_enquiries,

                COUNT(*) FILTER (
                    WHERE status = 'Approved'
                ) AS approved_enquiries,

                COUNT(*) FILTER (
                    WHERE status = 'Rejected'
                ) AS rejected_enquiries

            FROM public.enquiries
        `);

        const serviceResult = await db.query(`
            SELECT
                s.service_name,
                COUNT(e.enquiry_id) AS total

            FROM public.services s

            LEFT JOIN public.enquiries e
            ON s.service_id = e.service_id

            GROUP BY s.service_id, s.service_name
            ORDER BY total DESC
        `);

        res.json({
            success: true,
            statistics: result.rows[0],
            service_breakdown: serviceResult.rows
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard statistics."
        });
    }
});

// ========================================
// FETCH ALL CUSTOMER ENQUIRIES
// ========================================

router.get("/enquiries", async (req, res) => {
    try {

        const {
            search = "",
            status = "",
            page = "1",
            limit = "10"
        } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(pageSize) ||
            pageNumber < 1 ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination values."
            });
        }

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry status."
            });
        }

        const offset = (pageNumber - 1) * pageSize;

        const searchValue = `%${search.trim()}%`;

        const values = [searchValue];
        let conditions = `
            WHERE (
                e.full_name ILIKE $1
                OR e.email ILIKE $1
                OR e.phone ILIKE $1
            )
        `;

        if (status) {
            values.push(status);
            conditions += ` AND e.status = $${values.length}`;
        }

        const countResult = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM public.enquiries e
            ${conditions}
            `,
            values
        );

        const total = Number(countResult.rows[0].total);

        const enquiryResult = await db.query(
            `
            SELECT
                e.*,
                s.service_name,
                s.service_slug

            FROM public.enquiries e

            LEFT JOIN public.services s
            ON e.service_id = s.service_id

            ${conditions}

            ORDER BY e.created_at DESC NULLS LAST,
                     e.enquiry_id DESC

            LIMIT $${values.length + 1}
            OFFSET $${values.length + 2}
            `,
            [...values, pageSize, offset]
        );

        res.json({
            success: true,
            total_enquiries: total,
            current_page: pageNumber,
            total_pages: Math.ceil(total / pageSize),
            enquiries: enquiryResult.rows
        });

    } catch (error) {
        console.error("Fetch Enquiries Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch customer enquiries."
        });
    }
});

// ========================================
// FETCH INDIVIDUAL ENQUIRY
// ========================================

router.get("/enquiries/:id", async (req, res) => {
    try {

        const enquiryId = Number(req.params.id);

        if (!Number.isInteger(enquiryId) || enquiryId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry ID."
            });
        }

        const result = await db.query(
            `
            SELECT
                e.*,
                s.service_name,
                s.service_slug

            FROM public.enquiries e

            LEFT JOIN public.services s
            ON e.service_id = s.service_id

            WHERE e.enquiry_id = $1
            `,
            [enquiryId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        res.json({
            success: true,
            enquiry: result.rows[0]
        });

    } catch (error) {
        console.error("Enquiry Details Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch enquiry details."
        });
    }
});

// ========================================
// UPDATE ENQUIRY STATUS
// ========================================

router.put("/enquiries/:id/status", async (req, res) => {
    try {

        const enquiryId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(enquiryId) || enquiryId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry ID."
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status selected."
            });
        }

        const result = await db.query(
            `
            UPDATE public.enquiries

            SET status = $1

            WHERE enquiry_id = $2

            RETURNING enquiry_id, full_name, status
            `,
            [status, enquiryId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        res.json({
            success: true,
            message: "Enquiry status updated successfully!",
            enquiry: result.rows[0]
        });

    } catch (error) {
        console.error("Update Status Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update enquiry status."
        });
    }
});

// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;
