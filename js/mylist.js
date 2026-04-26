// My List page logic

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
        if (entry.type === 'tv') {
          return await API.getTVDetails(entry.id);
        } else {
          return await API.getMovieDetails(entry.id);
        }
      })
    );
    
    const validItems = items.filter(item => item && item.id);
    
    if (statusEl) statusEl.innerHTML = `<strong>${validItems.length}</strong> عنصر في قائمتك`;
    
    container.innerHTML = validItems
      .map((item, i) => {
        // Ensure media_type is set for the card
        if (!item.media_type) {
          item.media_type = item.first_air_date ? 'tv' : 'movie';
        }
        return Utils.createCard(item, i);
      })
      .join('');
    
    Utils.attachCardListeners(container);
  }
};

document.addEventListener('DOMContentLoaded', () => MyListPage.init());
