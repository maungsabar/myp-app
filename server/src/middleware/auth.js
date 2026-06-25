import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-dev-only';

// Authenticate: verify JWT token from Authorization header
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role, username: decoded.username, name: decoded.name };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
    }
    return res.status(401).json({ error: 'Token tidak valid. Silakan login kembali.' });
  }
}

// Authorize: check if user has one of the allowed roles
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Belum login.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke halaman ini.' });
    }
    next();
  };
}

// Helper: generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
