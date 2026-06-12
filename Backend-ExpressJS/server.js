// server.js
require('dotenv').config({ 
  path: require('path').resolve(__dirname, '.env') 
}); // ← الأول قبل أي حاجة

const app = require('./config/app');

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('ENV check:', process.env.SUPABASE_URL ? '✅ OK' : '❌ Missing');
});