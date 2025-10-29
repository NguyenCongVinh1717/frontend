// js/assignments.js
// Requires apiGet, apiPost, apiPut, apiDelete helper functions to exist (like in your admin HTML)

(async function () {
  // Elements
  const pageId = 'page-assignments';
  const classSel = document.getElementById('assignClassSelect');
  const subjectSel = document.getElementById('assignSubjectSelect');
  const teacherSel = document.getElementById('assignTeacherSelect');
  const btnAssign = document.getElementById('btnAssign');
  const tblBody = document.querySelector('#assignmentsTable tbody');

  // API paths (adjust if your backend differs)
  const API_LIST_ASSIGN = '/admin/class-subject-teachers'; // GET -> list assignments
  const API_CLASSES = '/admin/classes'; // GET -> [{id, name}]
  const API_SUBJECTS = '/admin/subjects'; // GET -> [{id, name, code, gradeName?}]
  const API_TEACHERS = '/admin/teachers'; // GET -> [{id, fullName, teacherCode}]
  // POST /admin/class-subject-teachers?classId=...&subjectId=...&teacherId=...
  // DELETE /admin/class-subject-teachers?classId=...&subjectId=...&teacherId=...
  // PUT /admin/classes/{classId}/subjects/{subjectId}/teachers/{teacherId}

  // load lookups
  async function loadLookups() {
    try {
      const [classes, subjects, teachers] = await Promise.all([
        apiGet('/admin/classes').catch(() => []),
        apiGet('/admin/subjects').catch(() => []),
        apiGet('/admin/teachers').catch(() => [])
      ]);
      fillSelect(classSel, classes, 'id', (s) => s.name || `Class ${s.id}`, '-- Select class --');
      fillSelect(subjectSel, subjects, 'id', (s) => `${s.name || s.code || s.id}`, '-- Select subject --');
      fillSelect(teacherSel, teachers, 'id', (t) => `${t.fullName || t.teacherCode || t.id}`, '-- Select teacher --');
    } catch (e) {
      console.error('loadLookups error', e);
      showError('Failed to load classes/subjects/teachers.');
    }
  }

  function fillSelect(selectEl, items, valKey, labelFn, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = placeholder || '-- Select --';
    selectEl.appendChild(opt0);
    (items || []).forEach(it => {
      const opt = document.createElement('option');
      opt.value = it[valKey];
      opt.textContent = typeof labelFn === 'function' ? labelFn(it) : it[labelFn] || it[valKey];
      selectEl.appendChild(opt);
    });
  }

  // load assignments list
  async function loadAssignments() {
    if (!tblBody) return;
    tblBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
      // Expect backend to return array of objects: { id, classId, className, subjectId, subjectName, teacherId, teacherName }
      const list = await apiGet(API_LIST_ASSIGN);
      if (!Array.isArray(list) || list.length === 0) {
        tblBody.innerHTML = '<tr><td colspan="5">No assignments</td></tr>';
        return;
      }
      tblBody.innerHTML = '';
      list.forEach(item => {
        const tr = document.createElement('tr');
        const idCell = `<td>${escapeHtml(item.id)}</td>`;
        const classCell = `<td>${escapeHtml(item.className || item.schoolClass?.name || item.schoolClassName || `#${item.classId}`)}</td>`;
        const subjectCell = `<td>${escapeHtml(item.subjectName || item.subject?.name || `#${item.subjectId}`)}</td>`;
        const teacherCell = `<td id="teacher-cell-${item.id}">${escapeHtml(item.teacherName || item.teacher?.fullName || (item.teacherId ? `#${item.teacherId}` : '-'))}</td>`;

        const actionsTd = document.createElement('td');

        // Change teacher dropdown + button
        const changeSel = document.createElement('select');
        changeSel.className = 'input';
        changeSel.style.minWidth = '160px';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '-- change teacher --';
        changeSel.appendChild(defaultOpt);

        // fill with teachers (we'll fetch again)
        // keep the currently loaded teachers in teacherSel for reuse:
        const teachers = Array.from(teacherSel.options).slice(1).map(o => ({ id: o.value, text: o.textContent }));
        teachers.forEach(t => {
          const o = document.createElement('option'); o.value = t.id; o.textContent = t.text;
          changeSel.appendChild(o);
        });

        const btnChange = document.createElement('button');
        btnChange.className = 'btn ghost';
        btnChange.textContent = 'Change';
        btnChange.addEventListener('click', async () => {
          const newTeacherId = changeSel.value;
          if (!newTeacherId) return showError('Select a teacher to change to');
          // item contains classId and subjectId (or schoolClass.id and subject.id) - try multiple shapes:
          const classId = item.classId || item.schoolClass?.id || item.schoolClassId || item.schoolClass_id;
          const subjectId = item.subjectId || item.subject?.id || item.subjectId;
          try {
            await apiPut(`/admin/classes/${classId}/subjects/${subjectId}/teachers/${newTeacherId}`);
            // update teacher cell text
            const selOpt = changeSel.selectedOptions[0];
            const newName = selOpt ? selOpt.textContent : `#${newTeacherId}`;
            const teacherCellEl = document.getElementById(`teacher-cell-${item.id}`);
            if (teacherCellEl) teacherCellEl.textContent = newName;
            showMsg('Teacher changed');
            await loadAssignments();
          } catch (err) {
            showError(err);
          }
        });

        // Unassign button
        const btnUnassign = document.createElement('button');
        btnUnassign.className = 'btn';
        btnUnassign.textContent = 'Unassign';
        btnUnassign.addEventListener('click', async () => {
          if (!confirm('Unassign this subject from the class?')) return;
          const classId = item.classId || item.schoolClass?.id || item.schoolClassId;
          const subjectId = item.subjectId || item.subject?.id || item.subjectId;
          const teacherId = item.teacherId || item.teacher?.id || item.teacherId;
          try {
            await apiDelete(`/admin/class-subject-teachers?classId=${classId}&subjectId=${subjectId}&teacherId=${teacherId}`);
            showMsg('Unassigned');
            await loadAssignments();
          } catch (err) { showError(err); }
        });

        actionsTd.appendChild(changeSel);
        actionsTd.appendChild(btnChange);
        actionsTd.appendChild(btnUnassign);

        tr.innerHTML = idCell + classCell + subjectCell + teacherCell;
        tr.appendChild(actionsTd);
        tblBody.appendChild(tr);
      });
    } catch (e) {
      console.error('loadAssignments error', e);
      tblBody.innerHTML = '<tr><td colspan="5">Failed to load</td></tr>';
      showError('Failed to load assignments');
    }
  }

  // Assign button handler
  btnAssign?.addEventListener('click', async () => {
    const classId = classSel.value;
    const subjectId = subjectSel.value;
    const teacherId = teacherSel.value;
    if (!classId || !subjectId || !teacherId) return showError('Select class, subject and teacher');
    try {
      await apiPost(`/admin/class-subject-teachers?classId=${classId}&subjectId=${subjectId}&teacherId=${teacherId}`, {});
      showMsg('Assigned successfully');
      // reset selects optionally
      classSel.value = '';
      subjectSel.value = '';
      teacherSel.value = '';
      await loadAssignments();
    } catch (err) { showError(err); }
  });

  // initialiser — called by page init (or call manually)
  async function initAssignmentsPage() {
    await loadLookups();
    await loadAssignments();
  }

  // Expose to global so main can call when switching pages
  window.initAssignmentsPage = initAssignmentsPage;

  // If you want auto-init on load uncomment:
  // document.addEventListener('DOMContentLoaded', initAssignmentsPage);

})();
