// ตั้งค่า Supabase Client
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://zwjlsmdozewiyeooinuy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3amxzbWRvemV3aXllb29pbnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc0MjQsImV4cCI6MjA2NTY0MzQyNH0.VF2uXyk8BmRRMwjOvcAVVxnWBv5WECa8wGMRyGKkF5I'
const supabase = createClient(supabaseUrl, supabaseKey)

// Discord OAuth Config
const discordConfig = {
  clientId: 'YOUR_DISCORD_CLIENT_ID',
  redirectUri: window.location.origin + '/auth/discord/callback',
  scope: 'identify'
}

// ฟังก์ชันล็อกอินด้วย Discord
async function loginWithDiscord() {
  // สร้าง URL สำหรับ Discord OAuth
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordConfig.clientId}&redirect_uri=${encodeURIComponent(discordConfig.redirectUri)}&response_type=code&scope=${discordConfig.scope}`

  // บันทึก state ลง localStorage เพื่อป้องกัน CSRF
  const state = generateRandomString()
  localStorage.setItem('discord_oauth_state', state)
  
  // Redirect ไปยัง Discord
  window.location.href = `${discordAuthUrl}&state=${state}`
}

// ฟังก์ชันจัดการ callback จาก Discord
async function handleDiscordCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  
  // ตรวจสอบ state
  const savedState = localStorage.getItem('discord_oauth_state')
  if (!code || !state || state !== savedState) {
    console.error('Invalid OAuth state')
    return false
  }
  
  try {
    // ส่ง code ไปยัง Supabase เพื่อแลกเป็น token
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: discordConfig.redirectUri,
        scopes: discordConfig.scope,
        queryParams: {
          code: code
        }
      }
    })
    
    if (error) throw error
    
    // ดึงข้อมูลผู้ใช้ Discord
    const discordUser = await getDiscordUser(data.access_token)
    
    // บันทึกหรืออัปเดตผู้ใช้ในฐานข้อมูล Supabase
    const user = await syncDiscordUser(discordUser)
    
    return user
  } catch (error) {
    console.error('Discord OAuth error:', error)
    return false
  } finally {
    localStorage.removeItem('discord_oauth_state')
  }
}

// ฟังก์ชันช่วยเหลือ
function generateRandomString() {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getDiscordUser(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  return await response.json()
}

async function syncDiscordUser(discordUser) {
  // ตรวจสอบว่ามีผู้ใช้ในระบบแล้วหรือไม่
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('*')
    .eq('discord_id', discordUser.id)
    .maybeSingle()
    
  if (lookupError) throw lookupError
  
  if (existingUser) {
    // อัปเดตข้อมูลผู้ใช้ที่มีอยู่
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username: discordUser.username,
        last_login: new Date().toISOString()
      })
      .eq('id', existingUser.id)
      .select()
      .single()
      
    if (updateError) throw updateError
    return updatedUser
  } else {
    // สร้างผู้ใช้ใหม่
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        username: discordUser.username,
        discord_id: discordUser.id,
        is_admin: false
      }])
      .select()
      .single()
      
    if (createError) throw createError
    return newUser
  }
}

export { 
  supabase, 
  discordConfig,
  loginWithDiscord, 
  handleDiscordCallback 
}
