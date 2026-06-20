// Security headers configuration
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// HTML email template
function createEmailHTML(name, email, message) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
        📧 New Portfolio Contact Form Submission
      </h2>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Contact Details:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #374151; margin-top: 0;">Message:</h3>
        <p style="line-height: 1.6; color: #4b5563;">${message.replace(/\n/g, '<br>')}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent from your portfolio contact form.
        </p>
        <a href="mailto:${email}?subject=Re: Your portfolio inquiry" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Reply to ${name}
        </a>
      </div>
    </div>
  `;
}

// Auto-reply email template
function createAutoReplyHTML(name, message) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
        🙏 Thank You for Reaching Out!
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${name},</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Thank you for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible, usually within 24-48 hours.
      </p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Your Message Summary:</h3>
        <p style="color: #6b7280; margin-bottom: 10px;"><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
        <p style="color: #6b7280; font-style: italic;">"${message.length > 100 ? message.substring(0, 100) + '...' : message}"</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        In the meantime, feel free to check out my work on:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://github.com/Aswincloud"
           style="display: inline-block; background-color: #374151; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px;">
          GitHub
        </a>
        <a href="https://www.linkedin.com/in/aswin4122001/" 
           style="display: inline-block; background-color: #0077b5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 0 10px;">
          LinkedIn
        </a>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        Best regards,<br>
        <strong>Aswin</strong><br>
        Software Engineer
      </p>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated response. Please do not reply to this email directly.
        </p>
      </div>
    </div>
  `;
}

// Send email function using Resend API
//
// REQUIREMENTS:
// 1. Resend API key configured as environment variable
// 2. Domain verification in Resend dashboard (completed)
// 3. Proper error handling and logging
//
async function sendEmail(to, subject, html, text, hostname = 'aswincloud.com', env) {
  console.log('🚀 Starting email send process:', {
    to,
    subject,
    hostname,
    timestamp: new Date().toISOString(),
  });

  // Validate email format
  if (!isValidEmail(to)) {
    console.error('❌ Invalid email address:', to);
    throw new Error('Invalid email address');
  }

  console.log('✅ Email validation passed');

  // Check if we're in a preview environment
  if (hostname.includes('workers.dev')) {
    console.log('📧 Preview deployment - email would be sent:', {
      to,
      subject,
      from: 'contact@aswincloud.com',
      hostname,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  console.log('🌐 Production environment detected, proceeding with Resend');

  try {
    console.log('📤 Preparing Resend API request...');

    // Prepare the email payload
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: to }],
        },
      ],
      from: {
        email: 'contact@aswincloud.com',
        name: 'Aswin Portfolio',
      },
      subject: subject,
      content: [
        {
          type: 'text/html',
          value: html,
        },
        {
          type: 'text/plain',
          value: text,
        },
      ],
    };

    console.log('📋 Resend email payload prepared:', {
      to: emailPayload.personalizations[0].to[0].email,
      from: emailPayload.from.email,
      subject: emailPayload.subject,
      htmlLength: emailPayload.content[0].value.length,
      textLength: emailPayload.content[1].value.length,
    });

    // Send email via MailChannels API
    console.log('🌐 Making request to MailChannels API...');

    // Send email via Resend API
    console.log('🌐 Making request to Resend API...');

    // Resend API payload
    const resendPayload = {
      from: 'contact@aswincloud.com', // Now using your verified domain
      to: [to],
      subject: subject,
      html: html,
      text: text,
    };

    console.log('📧 Resend payload:', JSON.stringify(resendPayload, null, 2));

    // You'll need to add your Resend API key as a secret
    const RESEND_API_KEY = env.RESEND_API_KEY || 're_placeholder_key';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    console.log('📡 Resend API response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        headers: Object.fromEntries(response.headers.entries()),
        url: 'https://api.resend.com/emails',
        method: 'POST',
      });

      // Log the full error text separately for better visibility
      console.error('📄 Full error response:', errorText);

      throw new Error(`Resend error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('📨 Resend API response body:', responseData);

    console.log('✅ Email sent successfully via Resend:', {
      to,
      subject,
      id: responseData.id,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', {
      error: error.message,
      stack: error.stack,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });

    // Log the full error message separately
    console.error('📄 Full error message:', error.message);
    if (error.stack) {
      console.error('📄 Full error stack:', error.stack);
    }

    throw error;
  }
}

// Helper function to add CORS headers to response
function addCorsHeaders(response, methods = 'GET, POST, OPTIONS') {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', methods);
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Helper function to handle API routes
async function handleApiRoutes(pathname, request, env) {
  if (pathname === '/api/contact' && request.method === 'POST') {
    const response = await handleContactForm(request, env);
    return addCorsHeaders(response, 'POST, OPTIONS');
  }

  if (pathname === '/api/health' && request.method === 'GET') {
    const response = new Response(
      JSON.stringify({
        status: 'OK',
        message: 'Portfolio backend is running on Cloudflare Workers',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
    return response;
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null; // Not an API route
}

// Helper function to serve static assets
async function serveStaticAssets(request, env) {
  try {
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      // Add security headers to static assets
      const headers = new Headers(asset.headers);

      // Apply security headers based on content type
      const contentType = headers.get('content-type') || '';

      if (
        contentType.includes('text/html') ||
        contentType.includes('application/javascript') ||
        contentType.includes('text/css')
      ) {
        // Apply full security headers for HTML, JS, and CSS files
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
          headers.set(key, value);
        }
      } else {
        // Apply basic security headers for other assets (images, fonts, etc.)
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      }

      return new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      });
    }
  } catch (error) {
    console.error('Error fetching asset:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
  return null; // Asset not found
}

// Helper function to serve SPA with security headers
async function serveSpa(request, env) {
  const rootRequest = new Request(new URL('/', request.url).toString(), request);
  const response = await env.ASSETS.fetch(rootRequest);

  if (response.status === 200) {
    // Add security headers for HTML responses
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }

    // For HEAD requests, return only headers and status (no body)
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // For GET requests, return the full response with body
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return null; // SPA not found
}

// Handle contact form submission
async function handleContactForm(request, env) {
  try {
    const { name, email, message } = await request.json();

    // Validate input
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ success: false, message: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (message.length < 10 || message.length > 1000) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Message must be between 10 and 1000 characters',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send notification email to you
    const notificationHTML = createEmailHTML(name, email, message);
    const notificationText = `
      New Portfolio Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Date: ${new Date().toLocaleString()}
      
      Message:
      ${message}
      
      Reply to: ${email}
    `;

    // Send auto-reply to the user
    const autoReplyHTML = createAutoReplyHTML(name, message);
    const autoReplyText = `
      Hi ${name},
      
      Thank you for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible, usually within 24-48 hours.
      
      Your message was submitted on: ${new Date().toLocaleString()}
      
      In the meantime, feel free to check out my work on GitHub (https://github.com/Aswincloud) or connect with me on LinkedIn (https://www.linkedin.com/in/aswin4122001/).
      
      Best regards,
      Aswin
      Software Engineer
      
      ---
      This is an automated response. Please do not reply to this email directly.
    `;

    // Send both emails via Resend
    console.log('📨 Processing contact form submission:', {
      name,
      email,
      messageLength: message.length,
      hostname: request.headers.get('host') || 'aswincloud.com',
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    console.log('📧 Preparing to send notification email to:', 'contact@aswincloud.com');
    console.log('📧 Preparing to send auto-reply email to:', email);

    try {
      console.log('🚀 Starting email sending process...');

      const [notificationResult, autoReplyResult] = await Promise.all([
        sendEmail(
          'contact@aswincloud.com',
          `New Portfolio Contact from ${name}`,
          notificationHTML,
          notificationText,
          request.headers.get('host') || 'aswincloud.com',
          env
        ),
        sendEmail(
          email,
          'Thank you for contacting me!',
          autoReplyHTML,
          autoReplyText,
          request.headers.get('host') || 'aswincloud.com',
          env
        ),
      ]);

      console.log('✅ Both emails sent successfully:', {
        notificationResult,
        autoReplyResult,
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('❌ Email processing failed:', {
        error: emailError.message,
        stack: emailError.stack,
        name,
        email,
        timestamp: new Date().toISOString(),
      });
      // Continue with success response even if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message sent successfully! Thank you for contacting me.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error handling contact form:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to send message. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Main worker event handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Handle API routes
    if (pathname.startsWith('/api/')) {
      const apiResponse = await handleApiRoutes(pathname, request, env);
      if (apiResponse) {
        return apiResponse;
      }
      // Not found in API
      return new Response('Not Found', { status: 404 });
    }

    // 2. Try to serve static assets
    const assetResponse = await serveStaticAssets(request, env);
    if (assetResponse) {
      return assetResponse;
    }

    // 3. For GET/HEAD requests, serve SPA with security headers
    if (request.method === 'GET' || request.method === 'HEAD') {
      const spaResponse = await serveSpa(request, env);
      if (spaResponse) {
        return spaResponse;
      }
      // If SPA not found, return 404
      return new Response('Not Found', { status: 404 });
    }

    // 4. All other requests: 404
    return new Response('Not Found', { status: 404 });
  },
};
