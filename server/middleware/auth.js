const { createClient } = require('@supabase/supabase-js');

const authMiddleware = async (req, res, next) => {
  try {
    // For now, we'll bypass auth but keep the structure ready
    // You can uncomment and modify this when ready to implement JWT auth
    
    /*
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'Authorization header required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token with Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Attach user to request
    req.user = user;
    */
    
    // For development - bypass auth
    req.user = { id: 'development-user' };
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      ok: false,
      error: 'Authentication error'
    });
  }
};

module.exports = authMiddleware;
