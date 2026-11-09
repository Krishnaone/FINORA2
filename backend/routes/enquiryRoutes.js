
const express = require('express');
const router = express.Router();

const db = require('../config/db');

// POST: Submit a customer enquiry
router.post('/', async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            service_slug,
            city,
            address,
            cover_type,
            members,
            cover_amount,
            policy_term,
            message
        } = req.body;

        // Validate required fields
        if (!full_name || !email || !phone || !service_slug) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields.'
            });
        }

        // Find selected service
        const service = await db.query(
            `SELECT service_id
             FROM public.services
             WHERE service_slug = $1`,
            [service_slug]
        );

        if (service.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Selected service not found.'
            });
        }

        // Insert enquiry into database
        const result = await db.query(
            `INSERT INTO public.enquiries
            (
                service_id,
                full_name,
                email,
                phone,
                city,
                address,
                cover_type,
                members,
                cover_amount,
                policy_term,
                message
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING enquiry_id, full_name, email, phone, status, created_at`,
            [
                service.rows[0].service_id,
                full_name.trim(),
                email.trim(),
                phone.trim(),
                city || null,
                address || null,
                cover_type || null,
                members || null,
                cover_amount ?? null,
                policy_term || null,
                message || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Your enquiry has been submitted successfully!',
            enquiry: result.rows[0]
        });

    } catch (error) {
        console.error('Enquiry Error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Something went wrong while submitting your enquiry.'
        });
    }
});

module.exports = router;
