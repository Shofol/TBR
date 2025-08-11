/**
 * API Routes with Debug System Integration
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { addDebugLog, getDebugMode, setDebugMode, runAllDiagnostics, generateDebugHTML } from "./diagnostics";
import { TubeBender } from "@shared/schema";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to verify JWT token
async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    addDebugLog('warn', 'Authentication attempt without token', 'auth');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = decoded;
    addDebugLog('debug', `Authenticated user: ${decoded.username}`, 'auth');
    next();
  } catch (error) {
    addDebugLog('error', `Token verification failed: ${error}`, 'auth');
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Security headers
  app.use('/api', helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Public API routes
  app.get('/api/tube-benders', async (req, res) => {
    try {
      const tubeBenders = await storage.getTubeBenders();
      addDebugLog('debug', `Retrieved ${tubeBenders.length} tube benders`, 'api');
      res.json(tubeBenders);
    } catch (error) {
      addDebugLog('error', `Failed to get tube benders: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to retrieve tube benders' });
    }
  });

  app.get('/api/tube-benders/recommended', async (req, res) => {
    try {
      const tubeBenders = await storage.getTubeBenders();
      // Simple recommendation logic - highest scoring first
      // Import the scoring algorithm to calculate scores
      const { calculateTubeBenderScore } = await import('../client/src/lib/scoring-algorithm.js');
      
      const recommended = tubeBenders
        .map(bender => calculateTubeBenderScore(bender))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3)
        .map(scored => {
          // Remove scoring data for API response
          const { totalScore, scoreBreakdown, ...originalBender } = scored;
          return originalBender;
        });
      
      addDebugLog('debug', `Generated ${recommended.length} recommendations`, 'api');
      res.json(recommended);
    } catch (error) {
      addDebugLog('error', `Failed to get recommendations: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to retrieve recommendations' });
    }
  });

  app.get('/api/tube-benders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tubeBender = await storage.getTubeBender(id);
      
      if (!tubeBender) {
        addDebugLog('warn', `Tube bender not found: ${id}`, 'api');
        return res.status(404).json({ message: 'Tube bender not found' });
      }
      
      addDebugLog('debug', `Retrieved tube bender: ${tubeBender.name}`, 'api');
      res.json(tubeBender);
    } catch (error) {
      addDebugLog('error', `Failed to get tube bender ${req.params.id}: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to retrieve tube bender' });
    }
  });

  app.get('/api/banner-settings', async (req, res) => {
    try {
      const settings = await storage.getBannerSettings();
      addDebugLog('debug', 'Retrieved banner settings', 'api');
      res.json(settings);
    } catch (error) {
      addDebugLog('error', `Failed to get banner settings: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to retrieve banner settings' });
    }
  });

  // Health check endpoint with debug info
  app.get('/api/health', (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      debug: {
        enabled: getDebugMode(),
        endpoint: '/__debug'
      }
    };
    
    addDebugLog('debug', 'Health check requested', 'api');
    res.json(health);
  });

  // Authentication routes
  app.post('/api/admin/login', authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        addDebugLog('warn', 'Login attempt with missing credentials', 'auth');
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const user = await storage.getAdminByUsername(username);
      if (!user) {
        addDebugLog('warn', `Login attempt for non-existent user: ${username}`, 'auth');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        addDebugLog('warn', `Login attempt for locked account: ${username}`, 'auth');
        return res.status(423).json({ message: 'Account is temporarily locked due to too many failed attempts' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        // Increment login attempts
        await storage.updateAdminLoginAttempts(user.id, user.loginAttempts + 1);
        addDebugLog('warn', `Failed login attempt for user: ${username}`, 'auth');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Reset login attempts on successful login
      await storage.updateAdminLoginAttempts(user.id, 0);

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      addDebugLog('info', `Successful login for user: ${username}`, 'auth');
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
      addDebugLog('error', `Login error: ${error}`, 'auth');
      res.status(500).json({ message: 'Authentication error' });
    }
  });

  // Protected admin routes
  app.get('/api/admin/debug/status', authenticateToken, (req, res) => {
    try {
      const status = {
        debugMode: getDebugMode(),
        diagnostics: runAllDiagnostics()
      };
      addDebugLog('debug', 'Debug status requested by admin', 'admin');
      res.json(status);
    } catch (error) {
      addDebugLog('error', `Debug status error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to get debug status' });
    }
  });

  app.post('/api/admin/debug/toggle', authenticateToken, (req, res) => {
    try {
      const { enabled } = req.body;
      setDebugMode(enabled === true);
      
      addDebugLog('info', `Debug mode ${enabled ? 'enabled' : 'disabled'} by admin`, 'admin');
      res.json({ debugMode: getDebugMode() });
    } catch (error) {
      addDebugLog('error', `Debug toggle error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to toggle debug mode' });
    }
  });

  app.get('/api/admin/debug/diagnostics', authenticateToken, (req, res) => {
    try {
      const diagnostics = runAllDiagnostics();
      addDebugLog('debug', 'Full diagnostics requested by admin', 'admin');
      res.json(diagnostics);
    } catch (error) {
      addDebugLog('error', `Diagnostics error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to run diagnostics' });
    }
  });

  app.get('/api/admin/debug/report', authenticateToken, (req, res) => {
    try {
      const html = generateDebugHTML();
      addDebugLog('debug', 'Debug report generated for admin', 'admin');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      addDebugLog('error', `Debug report error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to generate debug report' });
    }
  });

  // Other existing admin routes (tube benders, banner settings, etc.)
  app.get('/api/admin/tube-benders', authenticateToken, async (req, res) => {
    try {
      const tubeBenders = await storage.getTubeBenders();
      addDebugLog('debug', 'Admin accessed tube benders list', 'admin');
      res.json(tubeBenders);
    } catch (error) {
      addDebugLog('error', `Admin tube benders error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to retrieve tube benders' });
    }
  });

  app.put('/api/admin/tube-benders/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tubeBender = await storage.updateTubeBender(id, req.body);
      
      if (!tubeBender) {
        addDebugLog('warn', `Admin attempted to update non-existent tube bender: ${id}`, 'admin');
        return res.status(404).json({ message: 'Tube bender not found' });
      }
      
      addDebugLog('info', `Admin updated tube bender: ${tubeBender.name}`, 'admin');
      res.json(tubeBender);
    } catch (error) {
      addDebugLog('error', `Admin tube bender update error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to update tube bender' });
    }
  });

  app.get('/api/admin/banner-settings', authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getBannerSettings();
      addDebugLog('debug', 'Admin accessed banner settings', 'admin');
      res.json(settings);
    } catch (error) {
      addDebugLog('error', `Admin banner settings error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to retrieve banner settings' });
    }
  });

  app.put('/api/admin/banner-settings', authenticateToken, async (req, res) => {
    try {
      const settings = await storage.upsertBannerSettings(req.body);
      addDebugLog('info', 'Admin updated banner settings', 'admin');
      res.json(settings);
    } catch (error) {
      addDebugLog('error', `Admin banner settings update error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to update banner settings' });
    }
  });

  // Contact form endpoint (public)
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message, honeypot, mathAnswer } = req.body;
      
      // Basic spam protection
      if (honeypot) {
        addDebugLog('warn', 'Contact form spam attempt detected (honeypot)', 'contact');
        return res.status(400).json({ message: 'Invalid form submission' });
      }
      
      if (mathAnswer !== 15) { // 7 + 8 = 15
        addDebugLog('warn', 'Contact form spam attempt detected (math verification)', 'contact');
        return res.status(400).json({ message: 'Math verification failed' });
      }
      
      // Here you would typically send email, save to database, etc.
      addDebugLog('info', `Contact form submission from: ${email}`, 'contact');
      res.json({ message: 'Message sent successfully' });
    } catch (error) {
      addDebugLog('error', `Contact form error: ${error}`, 'contact');
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  addDebugLog('info', 'All API routes registered successfully', 'startup');

  const httpServer = createServer(app);
  return httpServer;
}