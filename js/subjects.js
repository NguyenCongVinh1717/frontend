// Subjects module (no teacher choice)
window.SubjectsModule = (function(){
  let grades = [];

  async function init(){
    const page = document.getElementById('pageSubjects');
    if (!page.innerHTML.trim()){
      page.innerHTML = `
        <div class="card"><h3>Danh sách môn học</h3><div id="subjectsGrid"></div></div>
        <div class="card">
          <h3>Tạo môn học</h3>
          <form id="createSubjectForm" class="form-grid">
            <input name="name" placeholder="Tên môn" required class="input"/>
            <input name="code" placeholder="Mã môn" required class="input"/>
            <input name="credit" type="number" value="3" class="input"/>
            <select name="gradeId" id="createSubjectGradeSelect" class="input"></select>
            <div><button class="btn" type="submit">Tạo</button></div>
          </form>
        </div>
        <div class="card">
          <h3>Sửa môn học</h3>
          <form id="editSubjectForm" class="form-grid">
            <input type="hidden" name="id"/>
            <input name="name" placeholder="Tên môn" required class="input"/>
            <input name="code" placeholder="Mã môn" required class="input"/>
            <input name="credit" type="number" value="3" class="input"/>
            <select name="gradeId" id="editSubjectGradeSelect" class="input"></select>
            <div><button class="btn" type="submit">Cập nhật</button></div>
          </form>
        </div>
      `;
    }
    await loadGrades();
    await loadSubjects();
    setupForms();
  }

  async function loadGrades(){
    grades = await apiGet('/admin/grades').catch(()=>[]);
    const c = document.getElementById('createSubjectGradeSelect');
    const e = document.getElementById('editSubjectGradeSelect');
    if (c){ c.innerHTML = '<option value="">-- Chọn khối --</option>'; grades.forEach(g => c.appendChild(new Option(g.name, g.id))); }
    if (e){ e.innerHTML = '<option value="">-- Chọn khối --</option>'; grades.forEach(g => e.appendChild(new Option(g.name, g.id))); }
  }

  async function loadSubjects(){
    const list = await apiGet('/admin/subjects');
    const grid = document.getElementById('subjectsGrid');
    grid.innerHTML = '';
    (list||[]).forEach(s=>{
      const d = document.createElement('div'); d.className='card';
      d.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="small">${escapeHtml(s.code||'')}</div>
        <div class="small">Khối: ${escapeHtml(s.gradeName || (s.grade && s.grade.name) || '')}</div>
        <div style="margin-top:8px"><button class="btn ghost" onclick="SubjectsModule.edit(${s.id})">Edit</button><button class="btn" onclick="SubjectsModule.remove(${s.id})">Delete</button></div>`;
      grid.appendChild(d);
    });
  }

  function setupForms(){
    const create = document.getElementById('createSubjectForm');
    create.onsubmit = async (ev)=>{
      ev.preventDefault();
      const b = { name:create.name.value.trim(), code:create.code.value.trim(), credit: Number(create.credit.value)||3, gradeId: create.gradeId.value ? Number(create.gradeId.value) : null };
      try { await apiPost('/admin/subjects', b); showToast('Created'); create.reset(); await loadSubjects(); } catch(e){ showToast('Create failed: '+e.message,true); }
    };

    const edit = document.getElementById('editSubjectForm');
    edit.onsubmit = async (ev)=>{
      ev.preventDefault();
      const id = edit.id.value;
      const b = { name: edit.name.value.trim(), code: edit.code.value.trim(), credit: Number(edit.credit.value)||3, gradeId: edit.gradeId.value ? Number(edit.gradeId.value) : null };
      try { await apiPut(`/admin/subjects/${id}`, b); showToast('Updated'); edit.reset(); await loadSubjects(); } catch(e){ showToast('Update failed: '+e.message,true); }
    };
  }

  async function edit(id){
    try {
      const s = await apiGet(`/admin/subjects/${id}`);
      const f = document.getElementById('editSubjectForm');
      f.id.value = s.id; f.name.value = s.name||''; f.code.value = s.code||''; f.credit.value = s.credit != null ? s.credit : 3;
      // set grade id if present
      if (s.grade && s.grade.id) f.gradeId.value = s.grade.id;
      else if (s.gradeId) f.gradeId.value = s.gradeId;
      window.scrollTo({top:0,behavior:'smooth'});
    } catch(e){ showToast('Load failed: '+e.message,true); }
  }

  async function remove(id){
    if (!confirm('Xác nhận xoá môn học?')) return;
    try { await apiDelete(`/admin/subjects/${id}`); showToast('Deleted'); await loadSubjects(); } catch(e){ showToast('Delete failed: '+e.message,true); }
  }

  function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  return { init, edit, remove };
})();
