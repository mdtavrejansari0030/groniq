// Netlify Serverless Function: contact.js
// Handles Groniq website form submissions securely and delivers to tavrej@groniqdigital.com

const RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL || 'tavrej@groniqdigital.com';

function normalizeUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function generateHtmlEmail(data, clientName, email, website, message) {
    const brandName = data['Business Name'] || data.business || 'N/A';
    const focusArea = data['Improvement Area'] || data.focus || data['Selected Scope'] || 'N/A';
    const spend = data['Monthly Marketing Spend'] || data.spend || 'N/A';
    const inquiryType = data['Inquiry Type'] || 'Strategic Growth Audit Request';

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #222222;">
        <div style="border-bottom: 2px solid #39FF14; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #39FF14; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">New Groniq Inquiry</h2>
            <p style="margin: 4px 0 0 0; color: #888888; font-size: 13px;">${inquiryType}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 10px 0; color: #888888; width: 140px; vertical-align: top;">Name:</td>
                <td style="padding: 10px 0; color: #ffffff; font-weight: bold;">${clientName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #888888; vertical-align: top;">Email:</td>
                <td style="padding: 10px 0; color: #39FF14;"><a href="mailto:${email}" style="color: #39FF14; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #888888; vertical-align: top;">Business / Brand:</td>
                <td style="padding: 10px 0; color: #ffffff;">${brandName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #888888; vertical-align: top;">Website:</td>
                <td style="padding: 10px 0; color: #ffffff;">
                    ${website ? `<a href="${website}" target="_blank" style="color: #39FF14; text-decoration: underline;">${website}</a>` : 'Not provided'}
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #888888; vertical-align: top;">Focus / Scope:</td>
                <td style="padding: 10px 0; color: #ffffff;">${focusArea}</td>
            </tr>
            ${spend !== 'N/A' ? `
            <tr>
                <td style="padding: 10px 0; color: #888888; vertical-align: top;">Monthly Spend:</td>
                <td style="padding: 10px 0; color: #ffffff;">${spend}</td>
            </tr>` : ''}
        </table>

        <div style="background-color: #161616; padding: 18px; border-radius: 8px; border-left: 3px solid #39FF14; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #888888; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Message / Challenges</p>
            <p style="margin: 0; color: #eeeeee; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>

        <div style="border-top: 1px solid #222222; padding-top: 16px; font-size: 12px; color: #666666; text-align: center;">
            <p style="margin: 0;">Delivered to ${RECIPIENT_EMAIL} via Groniq Digital Solutions</p>
        </div>
    </div>
    `;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
        };
    }

    try {
        let data = {};
        const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
        
        if (contentType.includes('application/json')) {
            data = JSON.parse(event.body || '{}');
        } else {
            const params = new URLSearchParams(event.body || '');
            for (const [key, value] of params.entries()) {
                data[key] = value;
            }
        }

        // Spam protection: check honeypot
        if (data._honey) {
            // Silently accept spam bot submissions without dispatching email
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Submission accepted' })
            };
        }

        // Server-side validation
        const clientName = (data['Client Name'] || data.name || '').trim();
        const email = (data['Email Address'] || data.email || '').trim();
        const rawWebsite = (data['Website URL'] || data.website || '').trim();
        const message = (data['Client Message'] || data.message || '').trim();

        if (!clientName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Please enter your name.' })
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Please enter a valid email address.' })
            };
        }

        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Please enter your message.' })
            };
        }

        // Normalize website URL (e.g. spacia.com -> https://spacia.com)
        const normalizedWebsite = normalizeUrl(rawWebsite);
        if (normalizedWebsite) {
            data['Website URL'] = normalizedWebsite;
        }

        // Option 1: Direct Resend API if API key is provided in environment
        if (process.env.RESEND_API_KEY) {
            try {
                const subject = data._subject || `New Groniq Inquiry from ${clientName}`;
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM_EMAIL || 'Groniq Website <onboarding@resend.dev>',
                        to: [RECIPIENT_EMAIL],
                        reply_to: email,
                        subject: subject,
                        html: generateHtmlEmail(data, clientName, email, normalizedWebsite, message)
                    })
                });

                const resendResult = await resendResponse.json().catch(() => ({}));
                if (resendResponse.ok && resendResult.id) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ success: true, message: 'Submission accepted for delivery via Resend' })
                    };
                }
            } catch (resendErr) {
                console.error('Resend delivery failed, falling back to FormSubmit:', resendErr);
            }
        }

        // Option 2: Forward to FormSubmit delivery service for tavrej@groniqdigital.com
        const payload = {
            ...data,
            _subject: data._subject || `New Groniq Inquiry from ${clientName}`,
            _template: 'table',
            _captcha: 'false',
            _replyto: email
        };
        delete payload._honey;

        const forwardUrl = `https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`;
        let response;
        try {
            response = await fetch(forwardUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': 'https://groniqdigital.com',
                    'Referer': 'https://groniqdigital.com/'
                },
                body: JSON.stringify(payload)
            });
        } catch (fetchErr) {
            // Network failure or timeout from serverless proxy -> signal frontend to execute direct client delivery
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    fallbackToClient: true,
                    error: 'Network connectivity issue reaching delivery provider'
                })
            };
        }

        const result = await response.json().catch(() => ({}));

        if (response.ok && (result.success === 'true' || result.success === true)) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Submission accepted for delivery' })
            };
        }

        // One-time activation notice from FormSubmit
        if (result.message && result.message.includes('Activation')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    needsActivation: true,
                    message: result.message
                })
            };
        }

        // If delivery service challenged or rejected server-side call, signal client-side fallback
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: false,
                fallbackToClient: true,
                error: result.message || 'Delivery service requested direct client transmission'
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'Internal server error processing submission' })
        };
    }
};
