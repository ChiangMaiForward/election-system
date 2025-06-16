import { supabase, logout } from './supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    // ตรวจสอบการล็อกอิน
    const user = JSON.parse(localStorage.getItem('election_user'))
    if (!user) {
        window.location.href = '/login.html'
        return
    }
    
    // แสดงชื่อผู้ใช้
    document.getElementById('welcomeMessage').textContent = `สวัสดี, ${user.username}!`
    
    // ออกจากระบบ
    document.getElementById('logoutBtn').addEventListener('click', logout)
    
    // ตรวจสอบสถานะการเลือกตั้ง
    const { data: settings, error: settingsError } = await supabase
        .from('election_settings')
        .select('*')
        .single()
    
    if (settingsError || !settings.voting_open) {
        document.getElementById('votingSection').style.display = 'none'
        document.getElementById('votingClosed').style.display = 'block'
        return
    }
    
    // โหลดรายชื่อผู้สมัคร
    const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
    
    if (candidatesError) {
        alert('เกิดข้อผิดพลาดในการโหลดรายชื่อผู้สมัคร')
        return
    }
    
    // แสดงรายชื่อผู้สมัคร
    const candidatesList = document.getElementById('candidatesList')
    candidates.forEach(candidate => {
        const candidateCard = document.createElement('div')
        candidateCard.className = 'candidate-card'
        candidateCard.innerHTML = `
            <img src="${candidate.image_url || 'https://via.placeholder.com/150'}" alt="${candidate.name}">
            <h4>${candidate.name}</h4>
            <p>${candidate.description || ''}</p>
            <button class="vote-btn" data-id="${candidate.id}">เลือก</button>
        `
        candidatesList.appendChild(candidateCard)
    })
    
    // จัดการการลงคะแนน
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const candidateId = btn.getAttribute('data-id')
            
            // ตรวจสอบ cooldown
            const lastVoteTime = new Date(user.last_vote_time)
            const now = new Date()
            const cooldown = 10 * 1000 // 10 วินาที
            
            if (user.last_vote_time && (now - lastVoteTime) < cooldown) {
                alert(`กรุณารอ ${Math.ceil((cooldown - (now - lastVoteTime)) / 1000)} วินาทีก่อนลงคะแนนอีกครั้ง`)
                return
            }
            
            try {
                // บันทึกการลงคะแนน
                const { error: voteError } = await supabase
                    .from('votes')
                    .insert([{ 
                        user_id: user.id, 
                        candidate_id: candidateId 
                    }])
                
                if (voteError) throw voteError
                
                // อัปเดตเวลาลงคะแนนล่าสุด
                const { error: userError } = await supabase
                    .from('users')
                    .update({ last_vote_time: now.toISOString() })
                    .eq('id', user.id)
                
                if (userError) throw userError
                
                // อัปเดตข้อมูลผู้ใช้ใน localStorage
                user.last_vote_time = now.toISOString()
                localStorage.setItem('election_user', JSON.stringify(user))
                
                alert('ลงคะแนนสำเร็จ!')
            } catch (error) {
                console.error('Error voting:', error)
                alert('เกิดข้อผิดพลาดในการลงคะแนน')
            }
        })
    })
})
