require('dotenv').config();
const supabase = require('./config/supabase');

async function getCategories() {
  const { data, error } = await supabase.from('bootcamps').select('category');
  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }
  const uniqueCategories = [...new Set(data.map(r => r.category))];
  console.log('UNIQUE CATEGORIES:', uniqueCategories);
}

getCategories();
