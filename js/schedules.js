// Schedules module - uses class-subject-teacher assignments list
window.SchedulesModule = (function(){
  async function init(){
    const page = document.getElementById('pageSchedules');
    if (!page.innerHTML.trim()){
      page.innerHTML = `
        <div class="card"><h3>Thời khoá biểu</h3><div id="schedulesList"></div></div>
        <div class="card">
          <h3>Tạo thời khoá biểu</h3>
          <form id="createScheduleForm" class="form-grid">
            <input name="dayOfWeek" placeholder="Day (1..7)" type="number" min="1" max="7" required class="input"/>
            <input name="period" placeholder="Period" type="number" min="1" required class="input"/>
            <select name="classSubjectTeacherId" id="cstSelect" class="input"></select>
            <div><button class="btn" type="submit">Tạo</button></div>
          </form>
        </div>
      `;
    }
    await loadAssignments();
    await loadSchedules();
    setupForm();
  }

  async function loadAssignments(){
    // endpoint to get class-subject-teacher assignments
    const cstSel = document.getElementById('cstSelect');
    cstSel.innerHTML = '<option value="">-- chọn --</option>';
    const list = await apiGet('/admin/class-subject-teachers').catch(()=>[]);
    (list || []).forEach(a => {
      const label = `${a.schoolClassName || a.className || (a.schoolClass && a.schoolClass.name) || a.classId} • ${a.subjectName || (a.subject && a.subject.name)} • ${a.teacherName || (a.teacher && a.teacher.fullName)}`;
      cstSel.appendChild(new Option(label, a.id));
    });
  }

  async function loadSchedules(){
    const list = await apiGet('/admin/schedules').catch(()=>[]);
    const box = document.getElementById('schedulesList');
    box.innerHTML = '';
    if (!list || list.length===0) { box.textContent = 'No schedules'; return; }
    const table = document.createElement('table'); table.className='table';
    table.innerHTML = '<thead><tr><th>ID</th><th>Day</th><th>Period</th><th>Assignment</th><th>Action</th></tr></thead>';
    const tb = document.createElement('tbody');
    list.forEach(s=>{
      const tr = document.createElement('tr');
      const assignLabel = s.classSubjectTeacherName || (s.classSubjectTeacher ? (s.classSubjectTeacher.schoolClassName+' • '+s.classSubjectTeacher.subjectName+' • '+s.classSubjectTeacher.teacherName) : '');
      tr.innerHTML = `<td>${s.id}</td><td>${s.dayOfWeek}</td><td>${s.period}</td><td>${escapeHtml(assignLabel)}</td>
        <td><button onclick="SchedulesModule.remove(${s.id})" class="btn ghost">Delete</button></td>`;
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    box.appendChild(table);
  }

  function setupForm(){
    const f = document.getElementById('createScheduleForm');
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const dto = {
        dayOfWeek: Number(f.dayOfWeek.value),
        period: Number(f.period.value),
        classSubjectTeacherId: f.classSubjectTeacherId.value ? Number(f.classSubjectTeacherId.value) : null
      };
      if (!dto.classSubjectTeacherId) return showToast('Chọn assignment', true);
      try { await apiPost('/admin/schedules', dto); showToast('Schedule created'); f.reset(); await loadSchedules(); } catch(e){ showToast('Create failed: '+e.message,true); }
    };
  }

  async function remove(id){
    if (!confirm('Xác nhận xoá?')) return;
    try { await apiDelete(`/admin/schedules/${id}`); showToast('Deleted'); await loadSchedules(); } catch(e){ showToast('Delete failed: '+e.message,true); }
  }

  function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  return { init, remove };
})();
