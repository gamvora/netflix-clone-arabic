// Search page logic

const SearchPage = {
  searchTimeout: null,

  init() {
    Utils.setupNavbar();
    Utils.setupModals();
    
    const input = document.getElementById('searchInput');
    if (!input) return;
    
    input.focus();
    
    // Check URL for initial query
    const urlQuery = Utils.getQueryParam('q');
    if (urlQuery) {
      input.value = urlQuery;
      this.performSearch(urlQuery);
    }
    
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 400);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = input.value.trim();
        this.performSearch(q);
      }
    });
  },

  async performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    const statusEl = document.getElementById('searchStatus');
    
    if (!query) {
      if (statusEl) statusEl.innerHTML = '';
      if (resultsContainer) resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>ابحث عن أفلامك ومسلسلاتك المفضلة</h3>
          <p>اكتب اسم الفيلم أو المسلسل في مربع البحث أعلاه</p>
        </div>
      `;
      return;
    }
    
    if (statusEl) statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جارٍ البحث عن "${query}"...`;
    
    const results = await API.search(query);
    
    if (results.length === 0) {
      if (statusEl) statusEl.innerHTML = '';
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>لا توجد نتائج لـ "${query}"</h3>
          <p>جرب البحث بكلمات أخرى</p>
        </div>
      `;
      return;
    }
    
    if (statusEl) statusEl.innerHTML = `تم العثور على <strong>${results.length}</strong> نتيجة لـ "${query}"`;
    
    resultsContainer.innerHTML = results
      .map((item, i) => Utils.createCard(item, i))
      .join('');
    
    Utils.attachCardListeners(resultsContainer);
  }
};

document.addEventListener('DOMContentLoaded', () => SearchPage.init());
