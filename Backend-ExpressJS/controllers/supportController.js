// Backend-ExpressJS/controllers/supportController.js
const supabase = require("../config/supabase");

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) return null;
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return header.trim();
};

/**
 * Creates a support ticket.
 * Allows guest submissions or automatically associates with logged-in user if JWT token is passed.
 */
exports.createSupportTicket = async (req, res, next) => {
  try {
    const { name, email, category, subject, message } = req.body;

    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    const validCategories = [
      'account', 'materials_ai', 'bidding', 'sessions', 
      'messaging', 'payments', 'reviews', 'community', 
      'technical', 'other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, error: "Invalid category selection." });
    }

    // Check for optional authorization token to link ticket to a user profile
    let userId = null;
    const token = getBearerToken(req);
    if (token) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user?.id) {
          userId = data.user.id;
        }
      } catch (authErr) {
        console.warn("Failed to extract user from optional auth header:", authErr.message);
      }
    }

    // Insert the ticket details
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        name,
        email,
        category,
        subject,
        message,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket in database:", error);
      return res.status(500).json({ success: false, error: "Failed to submit support ticket. Please try again." });
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      ticketId: ticket.id,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets support tickets submitted by the logged-in user.
 */
exports.getMySupportTickets = async (req, res, next) => {
  try {
    const userId = req.user.id; // Attached by isAuthenticated middleware

    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user tickets:", error);
      return res.status(500).json({ success: false, error: "Failed to retrieve your tickets." });
    }

    return res.status(200).json({
      success: true,
      tickets
    });
  } catch (error) {
    next(error);
  }
};
