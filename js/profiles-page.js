/**
 * NETFLIXY - Profiles Page Controller
 * Handles views: selection, PIN unlock, edit, avatar gallery, manage.
 */

(function () {
  'use strict';

  const PM = window.ProfilesManager;
  if (!PM) { console.error('ProfilesManager not loaded'); return; }

  // ---------- View elements ----------
  const views = {
    selection: document.getElementById('selectionView'),
    pin: document.getElementById('pinView'),
    edit: document.getElementById('editView'),
    gallery: document.getElementById('galleryView'),
    manage: document.getElementById('manageView')
  };
  const viewTitle = document.getElementById('viewTitle');

  // ---------- Selection ----------
  const profilesGrid = document.getElementById('profilesGrid');
  const manageBtn = document.getElementById('manageBtn');

  // ---------- PIN ----------
  const pinAvatar = document.getElementById('pinAvatar');
  const pinSubtitle = document.getElementById('pinSubtitle');
  const pinInputs = document.getElementById('pinInputs');
  const pinError = document.getElementById('pinError');
  const pinBackBtn = document.getElementById('pinBackBtn');

  // ---------- Edit ----------
  const editTitle = document.getElementById('editTitle');
  const editAvatarImg = document.getElementById('editAvatarImg');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const editForm = document.getElementById('editForm');
  const editName = document.getElementById('editName');
  const editKids = document.getElementById('editKids');
  const editHasPin = document.getElementById('editHasPin');
  const pinSetup = document.getElementById('pinSetup');
  const pinSetupInputs = document.getElementById('pinSetupInputs');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  // ---------- Gallery ----------
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryBackBtn = document.getElementById('galleryBackBtn');

  // ---------- Manage ----------
  const manageGrid = document.getElementById('manageGrid');
  const doneBtn = document.getElementById('doneBtn');

  // ---------- Toast ----------
  const toastEl = document.getElementById('toast');

  // ---------- Edit state ----------
  let editState = {
    mode: 'create',     // 'create' | 'edit'
    id: null,
    selectedAvatar: PM.getDefaultAvatar()
  };
  let pendingPinProfileId = null;

  /* ====================================================================
     Helpers
     ==================================================================== */
  function switchView(name) {
    Object.values(views).forEach(v => v && (v.hidden = true));
    if (views[name]) views[name].hidden = false;
    document.body.classList.toggle('manage-mode', name === 'manage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toastEl.className = 'toast';
    }, 2500);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function getNextUrl() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && /^[a-zA-Z0-9_\-\.]+\.html(\?[^#]*)?$/.test(decodeURIComponent(next))) {
      return decodeURIComponent(next);
    }
    return 'index.html';
  }

  /* ====================================================================
     SELECTION view
     ==================================================================== */
  function renderSelection() {
    const profiles = PM.getAll();
    profilesGrid.innerHTML = '';

    profiles.forEach(p => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'profile-card';
      card.dataset.id = p.id;
      card.innerHTML = `
        <div class="profile-avatar">
          <img src="${escapeHtml(p.avatar)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
          ${p.kids ? '<span class="profile-kids-badge">أطفال</span>' : ''}
          ${p.pin ? '<span class="profile-lock"><i class="fas fa-lock"></i></span>' : ''}
        </div>
        <div class="profile-name">${escapeHtml(p.name)}</div>
      `;
      card.addEventListener('click', () => selectProfile(p.id));
      profilesGrid.appendChild(card);
    });

    // "Add profile" card
    if (PM.canCreateMore()) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'profile-card add';
      add.innerHTML = `
        <div class="profile-avatar"><i class="fas fa-plus"></i></div>
        <div class="profile-name">إضافة بروفايل</div>
      `;
      add.addEventListener('click', () => openEdit('create'));
      profilesGrid.appendChild(add);
    }

    // First-run: if no profiles yet, jump straight to create
    if (profiles.length === 0) {
      viewTitle.textContent = 'أنشئ بروفايلك الأول';
      openEdit('create');
      return;
    } else {
      viewTitle.textContent = 'من يشاهد الآن؟';
    }

    manageBtn.style.display = profiles.length > 0 ? '' : 'none';
  }

  function selectProfile(id) {
    const p = PM.getById(id);
    if (!p) return;

    if (p.pin) {
      // Show PIN view
      pendingPinProfileId = id;
      pinAvatar.src = p.avatar;
      pinAvatar.alt = p.name;
      pinSubtitle.textContent = `البروفايل: ${p.name}`;
      pinError.hidden = true;
      clearPinInputs(pinInputs);
      switchView('pin');
      setTimeout(() => pinInputs.querySelector('.pin-box').focus(), 100);
    } else {
      activateAndGo(id);
    }
  }

  function activateAndGo(id) {
    if (!PM.setActive(id)) {
      toast('حدث خطأ', 'error');
      return;
    }
    PM.markIntroSeen();
    const next = getNextUrl();
    window.location.href = next;
  }

  /* ====================================================================
     PIN view
     ==================================================================== */
  function clearPinInputs(container) {
    container.querySelectorAll('.pin-box').forEach(b => {
      b.value = '';
      b.classList.remove('filled');
    });
  }

  function readPin(container, selector = '.pin-box') {
    return Array.from(container.querySelectorAll(selector))
      .map(b => b.value)
      .join('');
  }

  function setupPinInputs(container, onComplete) {
    const boxes = Array.from(container.querySelectorAll('.pin-box'));

    boxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(0, 1);
        if (val) {
          e.target.classList.add('filled');
          if (idx < boxes.length - 1) boxes[idx + 1].focus();
          else if (onComplete && readPin(container).length === boxes.length) {
            onComplete(readPin(container));
          }
        } else {
          e.target.classList.remove('filled');
        }
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          boxes[idx - 1].focus();
          boxes[idx - 1].value = '';
          boxes[idx - 1].classList.remove('filled');
        } else if (e.key === 'ArrowLeft' && idx < boxes.length - 1) {
          // RTL — left goes to next visually
          boxes[idx + 1].focus();
        } else if (e.key === 'ArrowRight' && idx > 0) {
          boxes[idx - 1].focus();
        } else if (e.key === 'Enter' && readPin(container).length === boxes.length) {
          if (onComplete) onComplete(readPin(container));
        }
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, boxes.length);
        text.split('').forEach((ch, i) => {
          if (boxes[i]) {
            boxes[i].value = ch;
            boxes[i].classList.add('filled');
          }
        });
        if (text.length === boxes.length && onComplete) {
          onComplete(text);
        } else if (boxes[text.length]) {
          boxes[text.length].focus();
        }
      });
    });
  }

  setupPinInputs(pinInputs, (pin) => {
    if (!pendingPinProfileId) return;
    if (PM.verifyPin(pendingPinProfileId, pin)) {
      activateAndGo(pendingPinProfileId);
    } else {
      pinError.hidden = false;
      pinInputs.classList.remove('shake');
      void pinInputs.offsetWidth; // reflow
      pinInputs.style.animation = 'none';
      setTimeout(() => {
        pinInputs.style.animation = 'shake 0.4s ease';
      }, 10);
      clearPinInputs(pinInputs);
      pinInputs.querySelector('.pin-box').focus();
    }
  });

  pinBackBtn.addEventListener('click', () => {
    pendingPinProfileId = null;
    switchView('selection');
  });

  /* ====================================================================
     EDIT view
     ==================================================================== */
  function openEdit(mode, id) {
    editState.mode = mode;
    editState.id = id || null;

    if (mode === 'edit') {
      const p = PM.getById(id);
      if (!p) return;
      editTitle.textContent = 'تعديل البروفايل';
      editName.value = p.name;
      editKids.checked = !!p.kids;
      editHasPin.checked = !!p.pin;
      editState.selectedAvatar = p.avatar;
      editAvatarImg.src = p.avatar;
      deleteBtn.hidden = false;
      // If has PIN, leave setup hidden (user would need to retype to change)
      pinSetup.hidden = !editHasPin.checked;
      clearPinInputs(pinSetupInputs);
    } else {
      editTitle.textContent = 'إضافة بروفايل';
      editName.value = '';
      editKids.checked = false;
      editHasPin.checked = false;
      editState.selectedAvatar = PM.getDefaultAvatar();
      editAvatarImg.src = editState.selectedAvatar;
      deleteBtn.hidden = true;
      pinSetup.hidden = true;
      clearPinInputs(pinSetupInputs);
    }

    switchView('edit');
    setTimeout(() => editName.focus(), 100);
  }

  editHasPin.addEventListener('change', () => {
    pinSetup.hidden = !editHasPin.checked;
    if (editHasPin.checked) {
      setTimeout(() => pinSetupInputs.querySelector('.pin-box').focus(), 100);
    } else {
      clearPinInputs(pinSetupInputs);
    }
  });

  setupPinInputs(pinSetupInputs);

  changeAvatarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openGallery();
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProfile();
  });

  cancelBtn.addEventListener('click', () => {
    if (PM.getAll().length === 0) {
      toast('يجب إنشاء بروفايل واحد على الأقل', 'error');
      return;
    }
    renderSelection();
    switchView('selection');
  });

  deleteBtn.addEventListener('click', () => {
    if (!editState.id) return;
    const p = PM.getById(editState.id);
    if (!p) return;
    if (!confirm(`هل تريد حذف البروفايل "${p.name}"؟ لا يمكن التراجع عن هذه العملية.`)) return;

    const res = PM.remove(editState.id);
    if (res.success) {
      toast('تم حذف البروفايل', 'success');
      renderSelection();

      if (PM.getAll().length === 0) {
        openEdit('create');
      } else {
        switchView('selection');
      }
    } else {
      toast(res.error || 'فشل الحذف', 'error');
    }
  });

  function saveProfile() {
    const name = editName.value.trim();
    if (!name) {
      toast('الاسم مطلوب', 'error');
      editName.focus();
      return;
    }

    let pinValue = undefined;
    if (editHasPin.checked) {
      pinValue = readPin(pinSetupInputs);
      if (pinValue.length !== 4) {
        toast('يجب إدخال 4 أرقام لكلمة المرور', 'error');
        pinSetupInputs.querySelector('.pin-box').focus();
        return;
      }
    } else {
      pinValue = null; // clear PIN
    }

    const payload = {
      name,
      avatar: editState.selectedAvatar,
      kids: editKids.checked,
      pin: pinValue
    };

    if (editState.mode === 'create') {
      const res = PM.create(payload);
      if (!res.success) return toast(res.error, 'error');
      toast('تم إنشاء البروفايل', 'success');

      // If this is the first profile ever, auto-activate and go to site
      if (PM.getAll().length === 1) {
        setTimeout(() => activateAndGo(res.profile.id), 600);
        return;
      }
    } else {
      // In edit mode, only pass pin if user explicitly touched the toggle
      const current = PM.getById(editState.id);
      if (!current) return toast('البروفايل غير موجود', 'error');

      // If user kept "hasPin" on but didn't type a new PIN, keep existing
      if (editHasPin.checked && readPin(pinSetupInputs).length !== 4) {
        payload.pin = current.pin; // keep existing
      }

      const res = PM.update(editState.id, payload);
      if (!res.success) return toast(res.error, 'error');
      toast('تم حفظ التعديلات', 'success');
    }

    renderSelection();
    switchView('selection');
  }

  /* ====================================================================
     GALLERY view
     ==================================================================== */
  function openGallery() {
    renderGallery();
    switchView('gallery');
  }

  function renderGallery() {
    galleryGrid.innerHTML = '';
    PM.AVATAR_GALLERY.forEach(av => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (av.url === editState.selectedAvatar ? ' selected' : '');
      btn.dataset.url = av.url;
      btn.setAttribute('aria-label', av.label);
      btn.innerHTML = `<img src="${escapeHtml(av.url)}" alt="${escapeHtml(av.label)}" loading="lazy">`;
      btn.addEventListener('click', () => {
        editState.selectedAvatar = av.url;
        editAvatarImg.src = av.url;
        // Return to edit view
        switchView('edit');
      });
      galleryGrid.appendChild(btn);
    });
  }

  galleryBackBtn.addEventListener('click', () => switchView('edit'));

  /* ====================================================================
     MANAGE view
     ==================================================================== */
  function openManage() {
    const profiles = PM.getAll();
    manageGrid.innerHTML = '';

    profiles.forEach(p => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'profile-card';
      card.dataset.id = p.id;
      card.innerHTML = `
        <div class="profile-avatar">
          <img src="${escapeHtml(p.avatar)}" alt="${escapeHtml(p.name)}" loading="lazy">
          ${p.kids ? '<span class="profile-kids-badge">أطفال</span>' : ''}
          ${p.pin ? '<span class="profile-lock"><i class="fas fa-lock"></i></span>' : ''}
          <div class="profile-edit-overlay"><i class="fas fa-pencil-alt"></i></div>
        </div>
        <div class="profile-name">${escapeHtml(p.name)}</div>
      `;
      card.addEventListener('click', () => openEdit('edit', p.id));
      manageGrid.appendChild(card);
    });

    // Add slot
    if (PM.canCreateMore()) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'profile-card add';
      add.innerHTML = `
        <div class="profile-avatar"><i class="fas fa-plus"></i></div>
        <div class="profile-name">إضافة</div>
      `;
      add.addEventListener('click', () => openEdit('create'));
      manageGrid.appendChild(add);
    }

    switchView('manage');
  }

  manageBtn.addEventListener('click', openManage);
  doneBtn.addEventListener('click', () => {
    renderSelection();
    switchView('selection');
  });

  /* ====================================================================
     INIT
     ==================================================================== */
  renderSelection();
  switchView('selection');

  // Mark intro as seen so going back/forward doesn't replay it
  PM.markIntroSeen();

})();
