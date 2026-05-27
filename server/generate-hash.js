import bcrypt from 'bcryptjs';

const password = 'password123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Password hash:', hash);
});
