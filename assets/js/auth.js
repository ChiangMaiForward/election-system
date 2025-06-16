import { loginWithPassword, loginWithDiscord } from './supabase.js'

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm')
    const discordLoginBtn = document.getElementById('discordLogin')
    const errorMessage = document.getElementById('errorMessage')
    
    // ล็อกอินด้วย username/password
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        
        try {
            await loginWithPassword(username, password)
            window.location.href = '/dashboard.html'
        } catch (error) {
            errorMessage.textContent = error.message
        }
    })
    
    // ล็อกอินด้วย Discord
    discordLoginBtn.addEventListener('click', async () => {
        try {
            await loginWithDiscord()
        } catch (error) {
            errorMessage.textContent = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Discord'
        }
    })
})
