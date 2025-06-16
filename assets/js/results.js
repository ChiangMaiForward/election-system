import { supabase } from './supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    // ตรวจสอบสถานะการแสดงผล
    const { data: settings, error: settingsError } = await supabase
        .from('election_settings')
        .select('*')
        .single()
    
    if (settingsError || !settings.results_visible) {
        document.getElementById('resultsContainer').style.display = 'none'
        document.getElementById('resultsClosed').style.display = 'block'
        return
    }
    
    // ดึงผลการเลือกตั้ง
    const { data: results, error: resultsError } = await supabase
        .from('votes')
        .select(`
            candidate_id,
            candidates ( name ),
            count:count(*)
        `)
        .group('candidate_id, candidates(name)')
    
    if (resultsError) {
        alert('เกิดข้อผิดพลาดในการโหลดผลการเลือกตั้ง')
        return
    }
    
    // คำนวณคะแนนทั้งหมด
    const totalVotes = results.reduce((sum, item) => sum + item.count, 0)
    
    // แสดงผลลัพธ์
    const resultsContainer = document.getElementById('resultsContainer')
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>ยังไม่มีผลการเลือกตั้ง</p>'
        return
    }
    
    const resultsTable = document.createElement('table')
    resultsTable.innerHTML = `
        <thead>
            <tr>
                <th>ผู้สมัคร</th>
                <th>จำนวนคะแนน</th>
                <th>ร้อยละ</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(item => `
                <tr>
                    <td>${item.candidates.name}</td>
                    <td>${item.count}</td>
                    <td>${totalVotes > 0 ? ((item.count / totalVotes) * 100).toFixed(2) : 0}%</td>
                </tr>
            `).join('')}
            <tr class="total">
                <td>รวมทั้งหมด</td>
                <td>${totalVotes}</td>
                <td>100%</td>
            </tr>
        </tbody>
    `
    
    resultsContainer.appendChild(resultsTable)
})
