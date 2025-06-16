import { loginWithDiscord, handleDiscordCallback } from './supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
  // ตรวจสอบว่าอยู่ในหน้า callback หรือไม่
  if (window.location.pathname === '/auth/discord/callback') {
    const user = await handleDiscordCallback()
    if (user) {
      localStorage.setItem('election_user', JSON.stringify(user))
      window.location.href = '/dashboard.html'
    } else {
      window.location.href = '/login.html?error=discord_oauth_failed'
    }
    return
  }

  // ส่วนการจัดการฟอร์มล็อกอินปกติ
  const loginForm = document.getElementById('loginForm')
  const discordLoginBtn = document.getElementById('discordLogin')
  const errorMessage = document.getElementById('errorMessage')
  
  if (discordLoginBtn) {
    discordLoginBtn.addEventListener('click', (e) => {
      e.preventDefault()
      loginWithDiscord()
    })
  }
  
  // ... โค้ดการล็อกอินแบบปกติ ...
})
