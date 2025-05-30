const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function updatePassword() {
  const newPassword = '{ZmV:NSMN(T4*^:0';
  const hashedPassword = await hashPassword(newPassword);
  console.log('New hashed password for demo account:');
  console.log(hashedPassword);
}

updatePassword();