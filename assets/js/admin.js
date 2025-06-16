import { supabase, logout } from './supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    // ตรวจสอบการล็อกอินและสิทธิ์ผู้ดูแลระบบ
    const user = JSON.parse(localStorage.getItem('election_user'))
    if (!user || !user.is_admin) {
        document.getElementById('adminContent').style.display = 'none'
        document.getElementById('notAdmin').style.display = 'block'
        return
    }
    
    // ออกจากระบบ
    document.getElementById('logoutBtn').addEventListener('click', logout)
    
    // โหลดการตั้งค่าปัจจุบัน
    const { data: settings, error: settingsError } = await supabase
        .from('election_settings')
        .select('*')
        .single()
    
    if (settingsError) {
        alert('เกิดข้อผิดพลาดในการโหลดการตั้งค่า')
        return
    }
    
    // ตั้งค่าค่าเริ่มต้นในฟอร์ม
    document.getElementById('votingOpen').checked = settings.voting_open
    document.getElementById('resultsVisible').checked = settings.results_visible
    
    // บันทึกการตั้งค่า
    document.getElementById('electionSettings').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const votingOpen = document.getElementById('votingOpen').checked
        const resultsVisible = document.getElementById('resultsVisible').checked
        
        try {
            const { error } = await supabase
                .from('election_settings')
                .update({ 
                    voting_open: votingOpen,
                    results_visible: resultsVisible
                })
                .eq('id', settings.id)
            
            if (error) throw error
            
            alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
        } catch (error) {
            console.error('Error updating settings:', error)
            alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า')
        }
    })
})
