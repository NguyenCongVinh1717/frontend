// Students module
window.StudentsModule = (function(){
  let classes = [];

  async function loadLookups(){
    classes = await apiGet('/admin/classes').catch(()=>[]);
    const createSel = document.querySelector('#createStudentClassSelect');
    const editSel = document.querySelector('#editStudentClassSelect');
    if (createSel) {
      createSel.innerHTML = '<option value="">-- Chọn lớp --</option>';
      classes.forEach(c => createSel.appendChild(new Option(c.name, c.id)));
    }
    if (editSel) {
      editSel.innerHTML = '<option value="">-- Chọn lớp --</option>';
      classes.forEach(c => editSel.appendChild(new Option(c.name, c.id)));
    }
  }

  async function loadStudents(){
    const container = document.getElementById('pageStudents');
    if (!container.querySelector('#studentsTable')) {
      container.innerHTML = `
        <div class="card">
          <h3>Danh sách học sinh</h3>
          <table class="table" id="studentsTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã HS</th>
                <th>Họ tên</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Lớp</th>
                <th>Khối</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="card">
          <h3>Thêm học sinh</h3>
          <form id="createStudentForm" class="form-grid">
            <input name="studentCode" placeholder="Mã học sinh" required class="input"/>
            <input name="fullName" placeholder="Họ và tên" required class="input"/>
            <input name="dob" type="date" class="input"/>
            <select name="gender" class="input">
              <option value="">--Giới tính--</option>
              <option>Nam</option><option>Nữ</option><option>Khác</option>
            </select>
            <input name="email" placeholder="Email" class="input"/>
            <input name="phone" placeholder="Số điện thoại" class="input"/>
            <select name="classId" id="createStudentClassSelect" class="input"><option>--Chọn lớp--</option></select>
            <div><button class="btn" type="submit">Tạo</button></div>
          </form>
        </div>
        <div class="card">
          <h3>Sửa học sinh</h3>
          <form id="editStudentForm" class="form-grid">
            <input type="hidden" name="id"/>
            <input name="studentCode" placeholder="Mã học sinh" required class="input"/>
            <input name="fullName" placeholder="Họ và tên" required class="input"/>
            <input name="dob" type="date" class="input"/>
            <select name="gender" class="input">
              <option value="">--Giới tính--</option>
              <option>Nam</option><option>Nữ</option><option>Khác</option>
            </select>
            <input name="email" placeholder="Email" class="input"/>
            <input name="phone" placeholder="Số điện thoại" class="input"/>
            <select name="classId" id="editStudentClassSelect" class="input"><option>--Chọn lớp--</option></select>
            <div>
              <button class="btn" type="submit">Cập nhật</button>
              <button type="button" class="btn ghost" id="cancelEditStudent">Huỷ</button>
            </div>
          </form>
        </div>
      `;
    }

    await loadLookups();

    const list = await apiGet('/admin/students');
    const tb = document.querySelector('#studentsTable tbody');
    tb.innerHTML = '';

    (list || []).forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${escapeHtml(s.studentCode||'')}</td>
        <td>${escapeHtml(s.fullName||'')}</td>
        <td>${escapeHtml(s.dob||'')}</td>
        <td>${escapeHtml(s.gender||'')}</td>
        <td>${escapeHtml(s.className||'')}</td>
        <td>${escapeHtml(s.gradeName||'')}</td>
        <td>${escapeHtml(s.email||'')}</td>
        <td>${escapeHtml(s.phone||'')}</td>
        <td class="actions">
          <button class="btn ghost" onclick="StudentsModule.onEdit(${s.id})">Sửa</button>
          <button class="btn" onclick="StudentsModule.onDelete(${s.id})">Xoá</button>
        </td>`;
      tb.appendChild(tr);
    });

    setupCreateForm();
    setupEditForm();
  }

  function setupCreateForm(){
    const f = document.getElementById('createStudentForm');
    if (!f) return;
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const body = {
        studentCode: f.studentCode.value.trim(),
        fullName: f.fullName.value.trim(),
        dob: f.dob.value || null,
        gender: f.gender.value || null,
        email: f.email.value || null,
        phone: f.phone.value || null,
        classId: f.classId.value ? Number(f.classId.value) : null
      };
      try {
        await apiPost('/admin/students', body);
        showToast('Đã thêm học sinh');
        f.reset();
        await loadStudents();
      } catch (e) { showToast('Lỗi khi thêm: '+e.message, true); }
    };
  }

  function setupEditForm(){
    const f = document.getElementById('editStudentForm');
    if (!f) return;
    document.getElementById('cancelEditStudent').onclick = () => f.reset();
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const id = f.id.value;
      const body = {
        studentCode: f.studentCode.value.trim(),
        fullName: f.fullName.value.trim(),
        dob: f.dob.value || null,
        gender: f.gender.value || null,
        email: f.email.value || null,
        phone: f.phone.value || null,
        classId: f.classId.value ? Number(f.classId.value) : null
      };
      try {
        await apiPut(`/admin/students/${id}`, body);
        showToast('Cập nhật thành công');
        f.reset();
        await loadStudents();
      } catch (e) { showToast('Lỗi khi cập nhật: '+e.message, true); }
    };
  }

  async function onEdit(id){
    try {
      const s = await apiGet(`/admin/students/${id}`);
      const f = document.getElementById('editStudentForm');
      f.id.value = s.id;
      f.studentCode.value = s.studentCode || '';
      f.fullName.value = s.fullName || '';
      f.dob.value = s.dob || '';
      f.gender.value = s.gender || '';
      f.email.value = s.email || '';
      f.phone.value = s.phone || '';
      f.classId.value = s.classId || '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      showToast('Không thể tải học sinh: ' + e.message, true);
    }
  }

  async function onDelete(id){
    if (!confirm('Bạn có chắc muốn xoá học sinh này?')) return;
    try {
      await apiDelete(`/admin/students/${id}`);
      showToast('Đã xoá học sinh');
      await loadStudents();
    } catch(e){ showToast('Lỗi khi xoá: '+e.message, true); }
  }

  function escapeHtml(s){
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  return {
    init: loadStudents,
    onEdit,
    onDelete
  };
})();
