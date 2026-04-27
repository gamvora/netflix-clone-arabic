// My List page logic - with visible delete button on each card

const MyListPage = {
  async init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    const list = Utils.getMyList();
    const container = document.getElementById('mylistContainer');
    const statusEl = document.getElementById('listStatus');
    
    if (!container) return;
    
    if (list.length === 0) {
      if (statusEl) statusEl.innerHTML = '';
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-heart"></i>
          <h3>قائمتي فارغة</h3>
          <p>أضف الأفلام والمسلسلات المفضلة لديك هنا لمشاهدتها لاحقاً</p>
          <a href="index.html" class="btn btn-primary" style="margin-top: 20px;">تصفح المحتوى</a>
        </div>
      `;
      return;
    }
    
    if (statusEl) statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جارٍ تحميل قائمتك...`;
    
    // Fetch all items' details
    const items = await Promise.all(
      list.map(async (entry) => {
        try {
          if (entry.type === 'tv') {
            return await API.getTVDetails(entry.id);
          } else {
            return await API.getMovieDetails(entry.id);
          }
        } catch {
          return null;
        }
      })
    );
    
    const validItems = items.filter(item => item && item.id);
    
    if (statusEl) {
      statusEl.innerHTML = `
        <span><strong>${validItems.length}</strong> عنصر في قائمتك</span>
        <button id="clearAllBtn" class="btn-text-danger" title="مسح قائمتي بالكامل">
          <i class="fas fa-trash-alt"></i> مسح الكل
        </button>
      `;
    }
    
    this.render(container, validItems);
    
    // Clear all button
    document.getElementById('clearAllBtn')?.addEventListener('click', () => {
      if (confirm('هل أنت متأكد من مسح كل قائمتي؟ لا يمكن التراجع عن هذه العملية.')) {
        Utils.clearMyList();
        Utils.showToast('تم مسح قائمتي');
        setTimeout(() => location.reload(), 600);
      }
    });
  },

  render(container, validItems) {
    container.innerHTML = validItems
      .map((item, i) => {
        if (!item.media_type) {
          item.media_type = item.first_air_date ? 'tv' : 'movie';
        }
        const cardHtml = Utils.createCard(item, i);
        // Wrap with a remove-overlay button so deletion is visible & one-click
        return `
          <div class="mylist-item-wrap" data-id="${item.id}" data-type="${item.media_type}">
            ${cardHtml}
            <button class="mylist-remove" title="حذف من قائمتي" aria-label="حذف من قائمتي">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      })
      .join('');

    // Attach standard card click handlers (open modal on card click)
    Utils.attachCardListeners(container);

    // Attach remove button handlers (stop propagation so modal doesn't open)
    container.querySelectorAll('.mylist-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrap = btn.closest('.mylist-item-wrap');
        if (!wrap) return;
        const id = wrap.dataset.id;
        const type = wrap.dataset.type;

        // Animate out
        wrap.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        wrap.style.transform = 'scale(0.7)';
        wrap.style.opacity = '0';

        setTimeout(() => {
          Utils.removeFromMyList(id, type);
          Utils.showToast('تمت إزالة العنصر من قائمتي');
          wrap.remove();
          // Update count
          const remaining = container.querySelectorAll('.mylist-item-wrap').length;
          const statusEl = document.getElementById('listStatus');
          if (remaining === 0) {
            location.reload();
          } else if (statusEl) {
            const strong = statusEl.querySelector('strong');
            if (strong) strong.textContent = remaining;
          }
        }, 260);
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => MyListPage.init());
