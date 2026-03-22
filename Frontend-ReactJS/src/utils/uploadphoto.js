// src/utils/uploadPhoto.js
import { supabase } from '../config/supabaseClient';

export async function uploadProfilePhoto(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `profiles/${fileName}`;

  const { error } = await supabase
    .storage
    .from('avatar')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase
    .storage
    .from('avatar')
    .getPublicUrl(filePath);

  return data.publicUrl;
}