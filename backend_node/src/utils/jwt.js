import jwt from 'jsonwebtoken';

function generateToken(payload) {
  const secretKey = process.env.JWT_SECRET ;
  const token = jwt.sign(payload, secretKey, { expiresIn: '7d' });
    return token;
}

function verifyToken(token) {
  const secretKey = process.env.JWT_SECRET ;
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error) {
    return null;
  }
}

export { generateToken, verifyToken };