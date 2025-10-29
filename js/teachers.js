// Teachers module
window.TeachersModule = (function(){
  async function init(){
    // render layout if not present
    const page = document.getElementById('pageTeachers');
    if (!page.innerHTML.trim()){
      page.innerHTML = `
        <div class="card"><h3>Danh sách giáo viên</h3><div id="teacherList"></div></div>
        <div class="card"><h3>Tạo giáo viên</h3>
          <form id="createTeacherForm" class="form-grid">
            <input name="teacherCode" placeholder="Mã giáo viên" required class="input"/>
            <input name="fullName" placeholder="Họ và tên" required class="input"/>
            <input name="dob" type="date" class="input"/>
            <select name="gender" class="input"><option value="">--Giới tính--</option><option>Male</option><option>Female</option><option>Other</option></select>
            <input name="email" placeholder="Email" class="input"/>
            <input name="phone" placeholder="Phone" class="input"/>
            <div><button class="btn" type="submit">Tạo</button></div>
          </form>
        </div>
        <div class="card"><h3>Sửa giáo viên</h3>
          <form id="editTeacherForm" class="form-grid">
            <input type="hidden" name="id"/>
            <input name="teacherCode" placeholder="Mã giáo viên" required class="input"/>
            <input name="fullName" placeholder="Họ và tên" required class="input"/>
            <input name="dob" type="date" class="input"/>
            <select name="gender" class="input"><option value="">--Giới tính--</option><option>Male</option><option>Female</option><option>Other</option></select>
            <input name="email" placeholder="Email" class="input"/>
            <input name="phone" placeholder="Phone" class="input"/>
            <div><button class="btn" type="submit">Cập nhật</button></div>
          </form>
        </div>
      `;
    }
    await loadTeachers();
    setupForms();
  }

  async function loadTeachers(){
    try {
      const list = await apiGet('/admin/teachers');
      const container = document.getElementById('teacherList');
      container.innerHTML = '';
      list.forEach(t=>{
        const d = document.createElement('div'); d.className='card';
        d.innerHTML = `<strong>${escapeHtml(t.fullName||'')}</strong><div class="small">Code: ${escapeHtml(t.teacherCode||'')}</div>
        <div class="small">Email: ${escapeHtml(t.email||'')} • Phone: ${escapeHtml(t.phone||'')}</div>
        <div style="margin-top:8px"><button class="btn ghost" onclick="TeachersModule.edit(${t.id})">Edit</button> <button class="btn" onclick="TeachersModule.remove(${t.id})">Delete</button></div>`;
        container.appendChild(d);
      });
    } catch(e){ showToast('Load teachers failed: '+e.message, true); }
  }

  function setupForms(){
    const create = document.getElementById('createTeacherForm');
    create.onsubmit = async (ev)=>{
      ev.preventDefault();
      const b = {
        teacherCode: create.teacherCode.value.trim(),
        fullName: create.fullName.value.trim(),
        dob: create.dob.value || null,
        gender: create.gender.value || null,
        email: create.email.value || null,
        phone: create.phone.value || null
      };
      try { await apiPost('/admin/teachers', b); showToast('Created'); create.reset(); await loadTeachers(); } catch(e){ showToast('Create failed: '+e.message, true); }
    };

    const edit = document.getElementById('editTeacherForm');
    edit.onsubmit = async (ev)=>{
      ev.preventDefault();
      const id = edit.id.value;
      const b = {
        teacherCode: edit.teacherCode.value.trim(),
        fullName: edit.fullName.value.trim(),
        dob: edit.dob.value || null,
        gender: edit.gender.value || null,
        email: edit.email.value || null,
        phone: edit.phone.value || null
      };
      try { await apiPut(`/admin/teachers/${id}`, b); showToast('Updated'); edit.reset(); await loadTeachers(); } catch(e){ showToast('Update failed: '+e.message, true); }
    };
  }

  async function edit(id){
    try {
      const t = await apiGet(`/admin/teachers/${id}`);
      const f = document.getElementById('editTeacherForm');
      f.id.value = t.id; f.teacherCode.value = t.teacherCode||''; f.fullName.value = t.fullName||''; f.dob.value = t.dob||''; f.gender.value = t.gender||''; f.email.value = t.email||''; f.phone.value = t.phone||'';
      window.scrollTo({top:0,behavior:'smooth'});
    } catch(e){ showToast('Load failed: '+e.message,true); }
  }

  async function remove(id){
    if (!confirm('Xác nhận xoá giáo viên?')) return;
    try { await apiDelete(`/admin/teachers/${id}`); showToast('Deleted'); await loadTeachers(); } catch(e){ showToast('Delete failed: '+e.message,true); }
  }

  function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  return { init, edit, remove };
})();
