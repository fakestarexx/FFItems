const Logic = (function() {
  let state = {
    grid: null,
    fadeBg: null,
    pagePill: null,
    footerPill: null,
    filterDropdown: null,
    dropdownMenu: null,
    pageSheet: null,
    searchSheet: null,
    searchTextarea: null,
    pagesGrid: null,
    searchResults: null,
    modeTab: null,
    activeClone: null,
    originalBox: null,
    detailsCard: null,
    modalContainer: null,
    currentPage: 1,
    itemsPerPage: 100,
    allItems: [],
    allIcons: [],
    filteredItems: [],
    filteredIcons: [],
    totalPages: 1,
    currentSearchQuery: "",
    currentMode: "items",
    currentType: "",
    currentRarity: "",
    allTypes: [],
    allRarities: [],
    imageCache: new Map,
    failedImages: new Set,
    isModalAnimating: false,
    isDropdownOpen: false,
    rarityMap: {
      "WHITE": "Common",
      "BLUE": "Rare",
      "GREEN": "Uncommon",
      "ORANGE": "Mythic",
      "ORANGE_PLUS": "Mythic+",
      "PURPLE": "Epic",
      "PURPLE_PLUS": "Epic+",
      "RED": "Artifact",
      "NONE": "None"
    }
  };

  function init() {
    setupElements();
    setupEventDelegation();
    parseURLParameters();
    fetchData();
    createDropdownMenu();
  }

  function setupElements() {
    state.grid = document.getElementById('grid');
    state.fadeBg = document.getElementById('fadeBg');
    state.pagePill = document.getElementById('pagePill');
    state.filterDropdown = document.getElementById('filterDropdown');
    state.pageSheet = document.getElementById('pageSheet');
    state.searchSheet = document.getElementById('searchSheet');
    state.searchTextarea = document.getElementById('searchTextarea');
    state.pagesGrid = document.getElementById('pagesGrid');
    state.searchResults = document.getElementById('searchResults');
    state.modeTab = document.getElementById('modeTab');
  }

  function createDropdownMenu() {
    state.dropdownMenu = document.createElement('div');
    state.dropdownMenu.className = 'dropdown-menu';
    state.dropdownMenu.id = 'dropdownMenu';
    document.body.appendChild(state.dropdownMenu);
  }

  function setupEventDelegation() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false
    });
    state.searchTextarea.addEventListener('input', handleSearchInput);
    state.searchTextarea.addEventListener('keydown', handleSearchKeydown);
    state.fadeBg.addEventListener('click', handleFadeBgClick);
    state.modeTab.addEventListener('click', handleModeTabClick);
    state.filterDropdown.addEventListener('click', handleFilterDropdownClick);
    document.addEventListener('click', function(event) {
      if (state.isDropdownOpen && !state.filterDropdown.contains(event.target) && !state.dropdownMenu
        .contains(event.target)) {
        closeDropdown();
      }
    });
  }

  function disableBodyScroll() {
    document.body.classList.add('dropdown-open');
  }

  function enableBodyScroll() {
    document.body.classList.remove('dropdown-open');
  }

  function parseURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam && (modeParam === 'items' || modeParam === 'icons')) {
      state.currentMode = modeParam;
      state.modeTab.textContent = modeParam === 'items' ? 'Items' : 'Icons';
      state.modeTab.classList.toggle('active', true);
    }
    const typeParam = urlParams.get('type');
    if (typeParam) {
      state.currentType = typeParam;
    }
    const rarityParam = urlParams.get('rare');
    if (rarityParam) {
      state.currentRarity = rarityParam;
    }
    const searchParam = urlParams.get('q');
    if (searchParam) {
      state.currentSearchQuery = searchParam;
      state.searchTextarea.value = searchParam;
    }
  }

  function updateURLParameters() {
    const urlParams = new URLSearchParams();
    urlParams.set('mode', state.currentMode);
    if (state.currentType) {
      urlParams.set('type', state.currentType);
    }
    if (state.currentRarity) {
      urlParams.set('rare', state.currentRarity);
    }
    if (state.currentSearchQuery) {
      urlParams.set('q', state.currentSearchQuery);
    }
    const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window
      .location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  function handleDocumentClick(e) {
    const target = e.target;
    if (target.classList.contains('footer-pill')) {
      handleFooterPillClick(target);
    } else if (target.classList.contains('sheet-page-btn')) {
      handlePageButtonClick(target);
    } else if (target.classList.contains('dropdown-filter-btn')) {
      handleDropdownFilterClick(target);
    } else if (target.classList.contains('box') || target.closest('.box')) {
      const box = target.classList.contains('box') ? target : target.closest('.box');
      handleBoxClick(box);
    }
  }

  function handleTouchMove(e) {
    if (state.activeClone) {
      e.preventDefault();
    }
  }

  function handleSearchInput(e) {
    state.currentPage = 1;
    state.currentSearchQuery = e.target.value.trim();
    renderGrid();
    updateFilterDropdown();
    updateURLParameters();
  }

  function handleSearchKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      closeAllSheets();
    }
  }

  function handleFadeBgClick(e) {
    if (e.target === state.fadeBg && !state.isModalAnimating) {
      closeModal();
      closeAllSheets();
      closeDropdown();
    }
  }

  function handleModeTabClick() {
    state.currentMode = state.currentMode === 'items' ? 'icons' : 'items';
    state.currentPage = 1;
    state.modeTab.textContent = state.currentMode === 'items' ? 'Items' : 'Icons';
    state.modeTab.classList.add('active');
    state.searchTextarea.placeholder = state.currentMode === 'items' ? 'Search' : 'Search';
    renderGrid();
    updateURLParameters();
    updateFilterDropdown();
  }

  function handleFilterDropdownClick(e) {
    e.stopPropagation();
    if (state.currentMode !== "items") return;
    if (state.isDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function handleDropdownFilterClick(target) {
    const filterType = target.getAttribute('data-filter-type');
    const filterValue = target.getAttribute('data-filter-value');
    if (filterType === 'type') {
      if (filterValue === 'all') {
        state.currentType = "";
      } else {
        state.currentType = filterValue;
      }
    } else if (filterType === 'rarity') {
      if (filterValue === 'all') {
        state.currentRarity = "";
      } else {
        state.currentRarity = filterValue;
      }
    }
    state.currentPage = 1;
    closeDropdown();
    renderGrid();
    updateURLParameters();
  }

  function handleFooterPillClick(target) {
    if (target === state.pagePill) {
      openPageSheet();
    }
  }

  function handlePageButtonClick(target) {
    const page = parseInt(target.textContent);
    state.currentPage = page;
    renderGrid();
    closeAllSheets();
  }

  function handleBoxClick(box) {
    if (state.currentMode === 'items') {
      const index = Array.from(state.grid.children).indexOf(box);
      const startIndex = (state.currentPage - 1) * state.itemsPerPage;
      const actualIndex = startIndex + index;
      if (actualIndex >= 0 && actualIndex < state.filteredItems.length) {
        const item = state.filteredItems[actualIndex];
        openModal(box, item);
      }
    } else {
      const index = Array.from(state.grid.children).indexOf(box);
      const startIndex = (state.currentPage - 1) * state.itemsPerPage;
      const actualIndex = startIndex + index;
      if (actualIndex >= 0 && actualIndex < state.filteredIcons.length) {
        const iconName = state.filteredIcons[actualIndex];
        const item = {
          "1": iconName,
          "3": extractIconName(iconName)
        };
        openModal(box, item);
      }
    }
  }

  function fetchData() {
    Promise.all([
      fetch('assets/itemData.json').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('assets/assets.json').then(r => r.ok ? r.json() : Promise.reject())
    ]).then(([itemsData, iconsData]) => {
      state.allItems = itemsData;
      state.allIcons = Array.isArray(iconsData) ? iconsData : Object.values(iconsData).filter(item =>
        typeof item === 'string');
      processData();
      renderGrid();
      updateFilterDropdown();
    }).catch(error => {
      state.grid.innerHTML =
        '<div class="no-results">Failed to load data. Please check if JSON files exist.</div>';
    });
  }

  function processData() {
    state.allTypes = [...new Set(state.allItems.map(item => item["6"]).filter(Boolean))].sort();
    state.allRarities = [...new Set(state.allItems.map(item => item["5"]).filter(Boolean))].filter(
      rarity => rarity !== "255" && rarity !== "NONE").sort();
    state.filteredItems = [...state.allItems];
    state.filteredIcons = [...state.allIcons];
    state.totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
  }

function getImageUrl(iconName, itemID) {
  if (!iconName) return 'src/icons/not-found.png';
  if (iconName.includes('https://')) return iconName;
  return null;
}

function createImageElement(iconName, className, altText, itemID) {
  const icon = document.createElement('img');
  icon.className = className;
  icon.alt = altText || 'Free Fire Item';
  
  const FALLBACK =
    'https://cdn.jsdelivr.net/gh/9112000/FFItems@5e8cc4727d5e19ed975aed50497167bf9228fea4/assets/images/error-404.png';
  
  const urls = [];
  
  // 1️⃣ First priority: Crystal Person
  if (iconName) {
    urls.push(
      `https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/${iconName}.png`
    );
  }
  
  // 2️⃣ Second priority: IShowAkiru
  if (itemID) {
    urls.push(
      `https://cdn.jsdelivr.net/gh/I-SHOW-AKIRU200/AKIRU-ICONS@main/ICONS/${itemID}.png`
    );
  }
  
  // 3️⃣ Last priority: ShahGCreator
  if (itemID) {
    urls.push(`https://iconapi.wasmer.app/${itemID}`);
  }
  
  let index = 0;
  
  function tryNext() {
    if (index >= urls.length) {
      icon.src = FALLBACK;
      icon.classList.add('loaded');
      return;
    }
    
    const url = urls[index++];
    
    if (state.imageCache.has(url)) {
      icon.src = url;
      icon.classList.add('loaded');
      return;
    }
    
    if (state.failedImages.has(url)) {
      tryNext();
      return;
    }
    
    const img = new Image();
    
    img.onload = function() {
      if (this.naturalWidth === 614 && this.naturalHeight === 614) {
        state.failedImages.add(url);
        tryNext();
      } else {
        icon.src = url;
        icon.classList.add('loaded');
        state.imageCache.set(url, url);
      }
    };
    
    img.onerror = function() {
      state.failedImages.add(url);
      tryNext();
    };
    
    img.src = url;
  }
  
  if (urls.length) {
    tryNext();
  } else {
    icon.src = FALLBACK;
    icon.classList.add('loaded');
  }
  
  return icon;
}

  function renderGrid() {
    state.grid.innerHTML = "";
    if (state.currentMode === "items") {
      state.filteredItems = state.allItems.filter(item => {
        const matchesSearch = !state.currentSearchQuery || 
          (item["3"] && item["3"].toLowerCase().includes(state.currentSearchQuery.toLowerCase())) || 
          (item["2"] && item["2"].toString().includes(state.currentSearchQuery)) || 
          (item["1"] && item["1"].toLowerCase().includes(state.currentSearchQuery.toLowerCase())) || 
          (item["4"] && item["4"].toLowerCase().includes(state.currentSearchQuery.toLowerCase()));
        const matchesType = !state.currentType || item["6"] === state.currentType;
        const matchesRarity = !state.currentRarity || item["5"] === state.currentRarity;
        return matchesSearch && matchesType && matchesRarity;
      });
      state.totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
      if (state.filteredItems.length === 0) {
        state.grid.innerHTML = '<div class="no-results">No items found matching your filters</div>';
        updateFilterDropdown();
        updateSearchResultsText();
        return;
      }
      const startIndex = (state.currentPage - 1) * state.itemsPerPage;
      const endIndex = Math.min(startIndex + state.itemsPerPage, state.filteredItems.length);
      const itemsToShow = state.filteredItems.slice(startIndex, endIndex);
      itemsToShow.forEach(item => {
        const box = document.createElement('div');
        box.className = 'box';
        const icon = createImageElement(item["1"], 'icon', item["3"] || '', item["2"]);
        box.appendChild(icon);
        state.grid.appendChild(box);
      });
    } else {
      if (state.currentSearchQuery) {
        state.filteredIcons = state.allIcons.filter(iconName => iconName && iconName.toLowerCase()
          .includes(state.currentSearchQuery.toLowerCase()));
      } else {
        state.filteredIcons = [...state.allIcons];
      }
      state.totalPages = Math.ceil(state.filteredIcons.length / state.itemsPerPage);
      if (state.filteredIcons.length === 0) {
        state.grid.innerHTML = '<div class="no-results">No icons found matching your search</div>';
        updateFilterDropdown();
        updateSearchResultsText();
        return;
      }
      const startIndex = (state.currentPage - 1) * state.itemsPerPage;
      const endIndex = Math.min(startIndex + state.itemsPerPage, state.filteredIcons.length);
      const iconsToShow = state.filteredIcons.slice(startIndex, endIndex);
      iconsToShow.forEach(iconName => {
        const box = document.createElement('div');
        box.className = 'box';
        const icon = createImageElement(iconName, 'icon', iconName, null);
        box.appendChild(icon);
        state.grid.appendChild(box);
      });
    }
    updateFilterDropdown();
    updateSearchResultsText();
  }

  function extractIconName(iconString) {
    if (!iconString) return "Unknown Icon";
    if (iconString.includes('https://')) {
      const url = new URL(iconString);
      const pathSegments = url.pathname.split('/');
      const fileName = pathSegments[pathSegments.length - 1];
      return fileName.replace('.png', '');
    }
    return iconString;
  }

  function updateFilterDropdown() {
    state.pagePill.textContent = `Page ${state.currentPage}/${state.totalPages}`;
    if (state.currentMode === "items") {
      state.filterDropdown.style.display = 'flex';
      let filterText = "Filters";
      if (state.currentType || state.currentRarity) {
        const activeFilters = [];
        if (state.currentType) activeFilters.push(state.currentType);
        if (state.currentRarity) {
          let displayRarity = state.currentRarity;
          if (state.rarityMap[state.currentRarity]) {
            displayRarity = state.rarityMap[state.currentRarity];
          }
          activeFilters.push(displayRarity);
        }
        filterText = activeFilters.join(', ');
        if (filterText.length > 20) {
          filterText = filterText.substring(0, 20) + '...';
        }
      }
      state.filterDropdown.innerHTML = `${filterText}`;
      updateDropdownMenu();
    } else {
      state.filterDropdown.style.display = 'none';
    }
  }

  function updateDropdownMenu() {
    if (!state.dropdownMenu) return;
    state.dropdownMenu.innerHTML = '';
    const typeSection = document.createElement('div');
    typeSection.className = 'dropdown-section';
    const typeTitle = document.createElement('div');
    typeTitle.className = 'dropdown-section-title';
    typeTitle.textContent = 'Type';
    typeSection.appendChild(typeTitle);
    const allTypesBtn = document.createElement('button');
    allTypesBtn.className = `dropdown-filter-btn ${!state.currentType ? 'active' : ''}`;
    allTypesBtn.textContent = 'All Types';
    allTypesBtn.setAttribute('data-filter-type', 'type');
    allTypesBtn.setAttribute('data-filter-value', 'all');
    typeSection.appendChild(allTypesBtn);
    state.allTypes.forEach(type => {
      const typeBtn = document.createElement('button');
      typeBtn.className = `dropdown-filter-btn ${state.currentType === type ? 'active' : ''}`;
      typeBtn.textContent = type;
      typeBtn.setAttribute('data-filter-type', 'type');
      typeBtn.setAttribute('data-filter-value', type);
      typeSection.appendChild(typeBtn);
    });
    state.dropdownMenu.appendChild(typeSection);
    const raritySection = document.createElement('div');
    raritySection.className = 'dropdown-section';
    const rarityTitle = document.createElement('div');
    rarityTitle.className = 'dropdown-section-title';
    rarityTitle.textContent = 'Rarity';
    raritySection.appendChild(rarityTitle);
    const allRaritiesBtn = document.createElement('button');
    allRaritiesBtn.className = `dropdown-filter-btn ${!state.currentRarity ? 'active' : ''}`;
    allRaritiesBtn.textContent = 'All Rarities';
    allRaritiesBtn.setAttribute('data-filter-type', 'rarity');
    allRaritiesBtn.setAttribute('data-filter-value', 'all');
    raritySection.appendChild(allRaritiesBtn);
    state.allRarities.forEach(rarity => {
      const rarityBtn = document.createElement('button');
      rarityBtn.className = `dropdown-filter-btn ${state.currentRarity === rarity ? 'active' : ''}`;
      let displayName = rarity;
      if (state.rarityMap[rarity]) {
        displayName = state.rarityMap[rarity];
      }
      rarityBtn.textContent = displayName;
      rarityBtn.setAttribute('data-filter-type', 'rarity');
      rarityBtn.setAttribute('data-filter-value', rarity);
      raritySection.appendChild(rarityBtn);
    });
    state.dropdownMenu.appendChild(raritySection);
  }

  function updateSearchResultsText() {
    if (state.currentSearchQuery || state.currentType || state.currentRarity) {
      const itemCount = state.currentMode === "items" ? state.filteredItems.length : state.filteredIcons
        .length;
      let filterText = [];
      if (state.currentSearchQuery) filterText.push(`"${state.currentSearchQuery}"`);
      if (state.currentType) filterText.push(`Type: ${state.currentType}`);
      if (state.currentRarity) {
        let displayRarity = state.currentRarity;
        if (state.rarityMap[state.currentRarity]) {
          displayRarity = state.rarityMap[state.currentRarity];
        }
        filterText.push(`Rarity: ${displayRarity}`);
      }
    } else {
      state.searchResults.textContent = "";
    }
  }

  function openDropdown() {
    if (state.currentMode !== "items") return;
    updateDropdownMenu();
    const rect = state.filterDropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 220;
    let leftPosition = rect.right - dropdownWidth;
    if (leftPosition < 10) {
      leftPosition = 10;
    }
    if (leftPosition + dropdownWidth > viewportWidth - 10) {
      leftPosition = viewportWidth - dropdownWidth - 10;
    }
    state.dropdownMenu.style.left = leftPosition + 'px';
    state.dropdownMenu.style.top = rect.bottom + 10 + 'px';
    state.dropdownMenu.style.right = 'auto';
    state.dropdownMenu.classList.add('active');
    state.filterDropdown.classList.add('active');
    state.fadeBg.classList.add('active');
    state.isDropdownOpen = true;
    disableBodyScroll();
  }

  function closeDropdown() {
    state.dropdownMenu.classList.remove('active');
    state.filterDropdown.classList.remove('active');
    state.fadeBg.classList.remove('active');
    state.isDropdownOpen = false;
    enableBodyScroll();
  }

  function openPageSheet() {
    state.pagesGrid.innerHTML = "";
    for (let i = 1; i <= state.totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `sheet-page-btn ${i === state.currentPage ? 'active' : ''}`;
      btn.textContent = i;
      state.pagesGrid.appendChild(btn);
    }
    openSheet(state.pageSheet);
  }

  function openSearchSheet() {
    openSheet(state.searchSheet);
  }

  function openSheet(sheet) {
    closeAllSheets();
    closeDropdown();
    sheet.classList.add('active');
    state.fadeBg.classList.add('active');
    document.body.style.touchAction = 'none';
  }

  function closeAllSheets() {
    document.body.style.touchAction = '';
    state.pageSheet.classList.remove('active');
    state.searchSheet.classList.remove('active');
    state.fadeBg.classList.remove('active');
  }

  function openModal(box, item) {
    if (state.activeClone || state.isModalAnimating) return;
    state.isModalAnimating = true;
    document.body.style.overflow = 'hidden';
    const rect = box.getBoundingClientRect();
    state.modalContainer = document.createElement('div');
    state.modalContainer.className = 'modal-container';
    state.modalContainer.style.pointerEvents = 'none';
    document.body.appendChild(state.modalContainer);
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    modal.style.width = rect.width + 'px';
    modal.style.height = rect.height + 'px';
    modal.style.pointerEvents = 'none';
    const modalIcon = createImageElement(item["1"], 'modal-icon', item["3"] || item["1"], item["2"]);
    modalIcon.style.pointerEvents = 'none';
    modal.appendChild(modalIcon);
    state.modalContainer.appendChild(modal);
    state.activeClone = modal;
    state.originalBox = box;
    setTimeout(() => {
      state.fadeBg.classList.add('active');
      state.modalContainer.classList.add('active');
      modal.style.left = '50%';
      modal.style.top = 'calc(50% - 100px)';
      modal.style.transform = 'translate(-50%, -50%) scale(1.8)';
      modal.style.width = '200px';
      modal.style.height = '200px';
      setTimeout(() => {
        state.detailsCard = createDetailsCard(item);
        state.modalContainer.appendChild(state.detailsCard);
        const modalRect = modal.getBoundingClientRect();
        state.detailsCard.style.left = '50%';
        state.detailsCard.style.top = (modalRect.bottom + 20) + 'px';
        state.detailsCard.style.width = modalRect.width + 'px';
        state.detailsCard.style.transform = 'translateX(-50%)';
        setTimeout(() => {
          state.detailsCard.classList.add('active');
          state.isModalAnimating = false;
        }, 50);
      }, 400);
    }, 50);
  }

  function createDetailsCard(item) {
    const detailsCard = document.createElement('div');
    detailsCard.className = 'details-card';
    if (state.currentMode === 'icons') {
      const iconNameTitle = document.createElement('div');
      iconNameTitle.className = 'details-title ibm-plex-mono-bold';
      iconNameTitle.textContent = extractIconName(item["1"]);
      detailsCard.appendChild(iconNameTitle);
    } else {
      if (item["3"]) {
        const title = document.createElement('div');
        title.className = 'details-title ibm-plex-mono-bold';
        let titleText = item["3"];
        if (item["4"]) {
          titleText += ` - ${item["4"]}`;
        }
        title.textContent = titleText;
        detailsCard.appendChild(title);
      }
      const propertiesContainer = document.createElement('div');
      propertiesContainer.className = 'details-properties';
      if (item["2"]) {
        const idProperty = document.createElement('div');
        idProperty.className = 'details-property';
        const idLabel = document.createElement('span');
        idLabel.className = 'details-property-label ibm-plex-mono-bold';
        idLabel.textContent = 'Item ID: ';
        const idValue = document.createElement('span');
        idValue.className = 'details-property-value ibm-plex-mono-regular';
        idValue.textContent = item["2"];
        idProperty.appendChild(idLabel);
        idProperty.appendChild(idValue);
        propertiesContainer.appendChild(idProperty);
      }
      if (item["1"]) {
        const iconProperty = document.createElement('div');
        iconProperty.className = 'details-property';
        const iconLabel = document.createElement('span');
        iconLabel.className = 'details-property-label ibm-plex-mono-bold';
        iconLabel.textContent = 'Icon: ';
        const iconValue = document.createElement('span');
        iconValue.className = 'details-property-value ibm-plex-mono-regular';
        iconValue.textContent = item["1"];
        iconProperty.appendChild(iconLabel);
        iconProperty.appendChild(iconValue);
        propertiesContainer.appendChild(iconProperty);
      }
      detailsCard.appendChild(propertiesContainer);
    }
    return detailsCard;
  }

  function closeModal() {
    if (!state.activeClone || !state.originalBox || state.isModalAnimating) return;
    state.isModalAnimating = true;
    document.body.style.overflow = '';
    if (state.detailsCard) {
      state.detailsCard.style.transform = 'translateX(-50%) translateY(20px)';
      state.detailsCard.style.opacity = '0';
    }
    state.fadeBg.classList.remove('active');
    state.modalContainer.classList.remove('active');
    const rect = state.originalBox.getBoundingClientRect();
    state.activeClone.style.left = rect.left + 'px';
    state.activeClone.style.top = rect.top + 'px';
    state.activeClone.style.width = rect.width + 'px';
    state.activeClone.style.height = rect.height + 'px';
    state.activeClone.style.transform = 'translate(0,0) scale(1)';
    setTimeout(() => {
      if (state.modalContainer && state.modalContainer.parentNode) {
        state.modalContainer.remove();
      }
      state.activeClone = null;
      state.modalContainer = null;
      state.detailsCard = null;
      state.isModalAnimating = false;
    }, 400);
  }
  
  return {
    init: init
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  Logic.init();
});
