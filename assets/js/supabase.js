// ตั้งค่า Supabase Client
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://zwjlsmdozewiyeooinuy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3amxzbWRvemV3aXllb29pbnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc0MjQsImV4cCI6MjA2NTY0MzQyNH0.VF2uXyk8BmRRMwjOvcAVVxnWBv5WECa8wGMRyGKkF5I'
const supabase = createClient(supabaseUrl, supabaseKey)

// ฟังก์ชันสำหรับตรวจสอบการล็อกอิน
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

// ฟังก์ชันสำหรับล็อกอินด้วย username/password
async function loginWithPassword(username, password) {
    // ในทางปฏิบัติควรใช้ Supabase Auth แต่สำหรับตัวอย่างนี้เราจะ query ตรงจากตาราง users
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()
    
    if (error || !user) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
    
    // ในทางปฏิบัติควรใช้ฟังก์ชันตรวจสอบรหัสผ่านที่ปลอดภัย
    if (user.password_hash !== hashPassword(password)) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
    
    // บันทึก session ลง localStorage
    localStorage.setItem('election_user', JSON.stringify(user))
    return user
}

// ฟังก์ชันสำหรับล็อกอินด้วย Discord
async function loginWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    })
    
    if (error) throw error
}

// ฟังก์ชันสำหรับล็อกเอาท์
async function logout() {
    localStorage.removeItem('election_user')
    await supabase.auth.signOut()
    window.location.href = '/index.html'
}

// ฟังก์ชันช่วยสำหรับแฮชรหัสผ่าน (ตัวอย่างเท่านั้น)
function hashPassword(password) {
    // ในทางปฏิบัติควรใช้ library เช่น bcrypt
    return btoa(password)
}

export { supabase, checkAuth, loginWithPassword, loginWithDiscord, logout }
