
const require = (function() {
  let def = {grid: null, fadeBg: null, pagePill: null, filterDropdown: null, dropdownMenu: null,pageSheet: null, searchSheet: null, searchTextarea: null, pagesGrid: null,searchResults: null, modeTab: null, activeClone: null, originalBox: null,detailsCard: null, modalContainer: null, currentPage: 1, itemsPerPage: 100,allItems: [], allIcons: [], filteredItems: [], filteredIcons: [], totalPages: 1,currentSearchQuery: "", currentMode: "items", currentType: "", currentRarity: "",allTypes: [], allRarities: [], imageCache: new Map(), failedImages: new Set(),isModalAnimating: false, isDropdownOpen: false, rarityMap: {WHITE: "Common", BLUE: "Rare", GREEN: "Uncommon", ORANGE: "Mythic",ORANGE_PLUS: "Mythic+", PURPLE: "Epic", PURPLE_PLUS: "Epic+", RED: "Artifact", NONE: "None"}};
  function init() {setupElements();setupEventDelegation();parseURLParameters();fetchData();createDropdownMenu();}
  function setupElements() {
    def.grid = document.getElementById('grid');
    def.fadeBg = document.getElementById('fadeBg');
    def.pagePill = document.getElementById('pagePill');
    def.filterDropdown = document.getElementById('filterDropdown');
    def.pageSheet = document.getElementById('pageSheet');
    def.searchSheet = document.getElementById('searchSheet');
    def.searchTextarea = document.getElementById('searchTextarea');
    def.pagesGrid = document.getElementById('pagesGrid');
    def.searchResults = document.getElementById('searchResults');
    def.modeTab = document.getElementById('modeTab');
  }
  function createDropdownMenu() {
    def.dropdownMenu = document.createElement('div');
    def.dropdownMenu.className = 'dropdown-menu';
    def.dropdownMenu.id = 'dropdownMenu';
    document.body.appendChild(def.dropdownMenu);
  }

  function setupEventDelegation() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('touchmove', handleTouchMove, {passive: false});
    def.searchTextarea.addEventListener('input', handleSearchInput);
    def.searchTextarea.addEventListener('keydown', handleSearchKeydown);
    def.fadeBg.addEventListener('click', handleFadeBgClick);
    def.modeTab.addEventListener('click', handleModeTabClick);
    def.filterDropdown.addEventListener('click', handleFilterDropdownClick);
    document.addEventListener('click', function(event) {
      if (def.isDropdownOpen && !def.filterDropdown.contains(event.target) && !def.dropdownMenu.contains(event.target)) {
        closeDropdown();
      }
    });
  }

  function disableBodyScroll() { document.body.classList.add('dropdown-open'); }
  function enableBodyScroll() { document.body.classList.remove('dropdown-open'); }

  function stringToHex(str) {
    let hex = '';
    for(let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
  }

  function hexToString(hex) {
    let str = '';
    for(let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  function parseURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const itemIdParam = urlParams.get('i');
    if (itemIdParam) {
      sessionStorage.setItem('directItemId', itemIdParam);
      return;
    }
    
    const qParam = urlParams.get('q');
    if (qParam) {
      try {
        if (!qParam.startsWith('"') && /^[0-9a-fA-F]+$/.test(qParam)) {
          const decodedData = hexToString(qParam);
          const parts = decodedData.split('#');
          
          if (parts.length >= 3) {
            def.currentType = parts[0] || "";
            def.currentRarity = parts[1] || "";
            const pageNum = parseInt(parts[2]) || 1;
            if (pageNum > 0) def.currentPage = pageNum;
            
            if (parts.length >= 4) {
              const modeParam = parts[3];
              if (modeParam === 'items' || modeParam === 'icons') {
                def.currentMode = modeParam;
                def.modeTab.textContent = modeParam === 'items' ? 'Items' : 'Icons';
              }
            }
            return;
          }
        }
      } catch (e) {}
      
      if (qParam.startsWith('"') && qParam.endsWith('"')) {
        def.currentSearchQuery = qParam.slice(1, -1);
        def.searchTextarea.value = def.currentSearchQuery;
      } else {
        def.currentSearchQuery = qParam;
        def.searchTextarea.value = qParam;
      }
    }
    
    const modeParam = urlParams.get('mode');
    if (modeParam && (modeParam === 'items' || modeParam === 'icons')) {
      def.currentMode = modeParam;
      def.modeTab.textContent = modeParam === 'items' ? 'Items' : 'Icons';
      def.modeTab.classList.toggle('active', true);
    }
    
    const typeParam = urlParams.get('type');
    if (typeParam) def.currentType = typeParam;
    
    const rarityParam = urlParams.get('rare');
    if (rarityParam) def.currentRarity = rarityParam;
    
    const pageParam = urlParams.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam);
      if (!isNaN(pageNum) && pageNum > 0) def.currentPage = pageNum;
    }
  }

  function updateURLParameters() {
    const urlParams = new URLSearchParams();
    
    if (def.currentSearchQuery) {
      urlParams.set('q', `"${def.currentSearchQuery}"`);
    } else if (def.currentType || def.currentRarity || def.currentPage !== 1 || def.currentMode !== "items") {
      const filterString = `${def.currentType}#${def.currentRarity}#${def.currentPage}#${def.currentMode}`;
      const hexString = stringToHex(filterString);
      urlParams.set('q', hexString);
    } else if (def.currentMode !== "items") {
      urlParams.set('mode', def.currentMode);
    }
    
    const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  function handleDirectItem() {
    const itemId = sessionStorage.getItem('directItemId');
    if (!itemId || def.allItems.length === 0) return;
    
    const item = def.allItems.find(i => i["2"] && i["2"].toString() === itemId);
    if (!item) {
      sessionStorage.removeItem('directItemId');
      return;
    }
    
    sessionStorage.removeItem('directItemId');
    const urlParams = new URLSearchParams();
    urlParams.set('i', itemId);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    
    const itemIndex = def.filteredItems.findIndex(i => i["2"] && i["2"].toString() === itemId);
    if (itemIndex === -1) {
      def.currentSearchQuery = "";
      def.currentType = "";
      def.currentRarity = "";
      def.currentPage = 1;
      def.searchTextarea.value = "";
      renderGrid();
      
      const newItemIndex = def.filteredItems.findIndex(i => i["2"] && i["2"].toString() === itemId);
      if (newItemIndex !== -1) {
        const itemPage = Math.floor(newItemIndex / def.itemsPerPage) + 1;
        def.currentPage = itemPage;
        renderGrid();
        
        setTimeout(() => {
          const boxes = document.querySelectorAll('.box');
          const pageIndex = newItemIndex % def.itemsPerPage;
          if (boxes[pageIndex]) handleBoxClick(boxes[pageIndex]);
        }, 500);
      }
    } else {
      const itemPage = Math.floor(itemIndex / def.itemsPerPage) + 1;
      if (itemPage !== def.currentPage) {
        def.currentPage = itemPage;
        renderGrid();
      }
      
      setTimeout(() => {
        const boxes = document.querySelectorAll('.box');
        const pageIndex = itemIndex % def.itemsPerPage;
        if (boxes[pageIndex]) handleBoxClick(boxes[pageIndex]);
      }, 500);
    }
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
    if (def.activeClone) e.preventDefault();
  }

  function handleSearchInput(e) {
    def.currentPage = 1;
    def.currentSearchQuery = e.target.value.trim();
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
    if (e.target === def.fadeBg && !def.isModalAnimating) {
      closeModal();
      closeAllSheets();
      closeDropdown();
    }
  }

  function handleModeTabClick() {
    def.currentMode = def.currentMode === 'items' ? 'icons' : 'items';
    def.currentPage = 1;
    def.modeTab.textContent = def.currentMode === 'items' ? 'Items' : 'Icons';
    def.modeTab.classList.add('active');
    def.searchTextarea.placeholder = def.currentMode === 'items' ? 'Search' : 'Search';
    renderGrid();
    updateURLParameters();
    updateFilterDropdown();
  }

  function handleFilterDropdownClick(e) {
    e.stopPropagation();
    if (def.currentMode !== "items") return;
    if (def.isDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function handleDropdownFilterClick(target) {
    const filterType = target.getAttribute('data-filter-type');
    const filterValue = target.getAttribute('data-filter-value');
    
    if (filterType === 'type') {
      def.currentType = filterValue === 'all' ? "" : filterValue;
    } else if (filterType === 'rarity') {
      def.currentRarity = filterValue === 'all' ? "" : filterValue;
    }
    
    def.currentPage = 1;
    closeDropdown();
    renderGrid();
    updateURLParameters();
  }

  function handleFooterPillClick(target) {
    if (target === def.pagePill) openPageSheet();
  }

  function handlePageButtonClick(target) {
    const page = parseInt(target.textContent);
    def.currentPage = page;
    renderGrid();
    closeAllSheets();
    updateURLParameters();
  }

  function handleBoxClick(box) {
    if (def.currentMode === 'items') {
      const index = Array.from(def.grid.children).indexOf(box);
      const startIndex = (def.currentPage - 1) * def.itemsPerPage;
      const actualIndex = startIndex + index;
      if (actualIndex >= 0 && actualIndex < def.filteredItems.length) {
        const item = def.filteredItems[actualIndex];
        const urlParams = new URLSearchParams();
        urlParams.set('i', item["2"]);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        openModal(box, item);
      }
    } else {
      const index = Array.from(def.grid.children).indexOf(box);
      const startIndex = (def.currentPage - 1) * def.itemsPerPage;
      const actualIndex = startIndex + index;
      if (actualIndex >= 0 && actualIndex < def.filteredIcons.length) {
        const iconName = def.filteredIcons[actualIndex];
        const item = {"1": iconName, "3": extractIconName(iconName)};
        openModal(box, item);
      }
    }
  }

  function fetchData() {
    Promise.all([
      fetch('src/assets/itemData.json').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('src/assets/assets.json').then(r => r.ok ? r.json() : Promise.reject())
    ]).then(([itemsData, iconsData]) => {
      def.allItems = itemsData;
      def.allIcons = Array.isArray(iconsData) ? iconsData : Object.values(iconsData).filter(item => typeof item === 'string');
      processData();
      renderGrid();
      updateFilterDropdown();
      updateURLParameters();
      handleDirectItem();
    }).catch(error => {
      def.grid.innerHTML = '<div class="no-results">Failed to load data. Please check if JSON files exist.</div>';
    });
  }

  function processData() {
    def.allTypes = [...new Set(def.allItems.map(item => item["6"]).filter(Boolean))].sort();
    def.allRarities = [...new Set(def.allItems.map(item => item["5"]).filter(Boolean))].filter(rarity => rarity !== "255" && rarity !== "NONE").sort();
    def.filteredItems = [...def.allItems];
    def.filteredIcons = [...def.allIcons];
    
    if (def.currentMode === "items") {
      def.totalPages = Math.ceil(def.filteredItems.length / def.itemsPerPage);
    } else {
      def.totalPages = Math.ceil(def.filteredIcons.length / def.itemsPerPage);
    }
    
    if (def.currentPage > def.totalPages) {
      def.currentPage = Math.max(1, def.totalPages);
    }
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
    const final = 'icons/not-found.png';
    const urls = [];
    
    if (iconName) {
      urls.push(`https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/${iconName}.png`);
    }
    
    if (itemID) {
      urls.push(`https://cdn.jsdelivr.net/gh/I-SHOW-AKIRU200/AKIRU-ICONS@main/ICONS/${itemID}.png`);
    }
    
    if (itemID) {
      urls.push(`https://iconapi.wasmer.app/${itemID}`);
    }
    
    let index = 0;
    
    function tryNext() {
      if (index >= urls.length) {
        icon.src = final;
        icon.classList.add('loaded');
        return;
      }
      
      const url = urls[index++];
      
      if (def.imageCache.has(url)) {
        icon.src = url;
        icon.classList.add('loaded');
        return;
      }
      
      if (def.failedImages.has(url)) {
        tryNext();
        return;
      }
      
      const img = new Image();
      
      img.onload = function() {
        if (this.naturalWidth === 614 && this.naturalHeight === 614) {
          def.failedImages.add(url);
          tryNext();
        } else {
          icon.src = url;
          icon.classList.add('loaded');
          def.imageCache.set(url, url);
        }
      };
      
      img.onerror = function() {
        def.failedImages.add(url);
        tryNext();
      };
      
      img.src = url;
    }
    
    if (urls.length) {
      tryNext();
    } else {
      icon.src = final;
      icon.classList.add('loaded');
    }
    
    return icon;
  }

  function renderGrid() {
    def.grid.innerHTML = "";
    
    if (def.currentMode === "items") {
      def.filteredItems = def.allItems.filter(item => {
        const matchesSearch = !def.currentSearchQuery || 
          (item["3"] && item["3"].toLowerCase().includes(def.currentSearchQuery.toLowerCase())) || 
          (item["2"] && item["2"].toString().includes(def.currentSearchQuery)) || 
          (item["1"] && item["1"].toLowerCase().includes(def.currentSearchQuery.toLowerCase())) || 
          (item["4"] && item["4"].toLowerCase().includes(def.currentSearchQuery.toLowerCase()));
        const matchesType = !def.currentType || item["6"] === def.currentType;
        const matchesRarity = !def.currentRarity || item["5"] === def.currentRarity;
        return matchesSearch && matchesType && matchesRarity;
      });
      
      def.totalPages = Math.ceil(def.filteredItems.length / def.itemsPerPage);
      
      if (def.currentPage > def.totalPages) {
        def.currentPage = Math.max(1, def.totalPages);
      }
      
      if (def.filteredItems.length === 0) {
        def.grid.innerHTML = '<div class="no-results">No items found matching your filters</div>';
        updateFilterDropdown();
        updateSearchResultsText();
        return;
      }
      
      const startIndex = (def.currentPage - 1) * def.itemsPerPage;
      const endIndex = Math.min(startIndex + def.itemsPerPage, def.filteredItems.length);
      const itemsToShow = def.filteredItems.slice(startIndex, endIndex);
      
      itemsToShow.forEach(item => {
        const box = document.createElement('div');
        box.className = 'box';
        const icon = createImageElement(item["1"], 'icon', item["3"] || '', item["2"]);
        box.appendChild(icon);
        def.grid.appendChild(box);
      });
    } else {
      if (def.currentSearchQuery) {
        def.filteredIcons = def.allIcons.filter(iconName => 
          iconName && iconName.toLowerCase().includes(def.currentSearchQuery.toLowerCase())
        );
      } else {
        def.filteredIcons = [...def.allIcons];
      }
      
      def.totalPages = Math.ceil(def.filteredIcons.length / def.itemsPerPage);
      
      if (def.currentPage > def.totalPages) {
        def.currentPage = Math.max(1, def.totalPages);
      }
      
      if (def.filteredIcons.length === 0) {
        def.grid.innerHTML = '<div class="no-results">No icons found matching your search</div>';
        updateFilterDropdown();
        updateSearchResultsText();
        return;
      }
      
      const startIndex = (def.currentPage - 1) * def.itemsPerPage;
      const endIndex = Math.min(startIndex + def.itemsPerPage, def.filteredIcons.length);
      const iconsToShow = def.filteredIcons.slice(startIndex, endIndex);
      
      iconsToShow.forEach(iconName => {
        const box = document.createElement('div');
        box.className = 'box';
        const icon = createImageElement(iconName, 'icon', iconName, null);
        box.appendChild(icon);
        def.grid.appendChild(box);
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
    def.pagePill.textContent = `Page ${def.currentPage}/${def.totalPages}`;
    
    if (def.currentMode === "items") {
      def.filterDropdown.style.display = 'flex';
      let filterText = "Filters";
      
      if (def.currentType || def.currentRarity) {
        const activeFilters = [];
        if (def.currentType) activeFilters.push(def.currentType);
        if (def.currentRarity) {
          let displayRarity = def.currentRarity;
          if (def.rarityMap[def.currentRarity]) displayRarity = def.rarityMap[def.currentRarity];
          activeFilters.push(displayRarity);
        }
        filterText = activeFilters.join(', ');
        if (filterText.length > 20) filterText = filterText.substring(0, 20) + '...';
      }
      
      def.filterDropdown.innerHTML = `${filterText}`;
      updateDropdownMenu();
    } else {
      def.filterDropdown.style.display = 'none';
    }
  }

  function updateDropdownMenu() {
    if (!def.dropdownMenu) return;
    
    def.dropdownMenu.innerHTML = '';
    
    const typeSection = document.createElement('div');
    typeSection.className = 'dropdown-section';
    const typeTitle = document.createElement('div');
    typeTitle.className = 'dropdown-section-title';
    typeTitle.textContent = 'Type';
    typeSection.appendChild(typeTitle);
    const allTypesBtn = document.createElement('button');
    allTypesBtn.className = `dropdown-filter-btn ${!def.currentType ? 'active' : ''}`;
    allTypesBtn.textContent = 'All Types';
    allTypesBtn.setAttribute('data-filter-type', 'type');
    allTypesBtn.setAttribute('data-filter-value', 'all');
    typeSection.appendChild(allTypesBtn);
    def.allTypes.forEach(type => {
      const typeBtn = document.createElement('button');
      typeBtn.className = `dropdown-filter-btn ${def.currentType === type ? 'active' : ''}`;
      typeBtn.textContent = type;
      typeBtn.setAttribute('data-filter-type', 'type');
      typeBtn.setAttribute('data-filter-value', type);
      typeSection.appendChild(typeBtn);
    });
    def.dropdownMenu.appendChild(typeSection);
    
    const raritySection = document.createElement('div');
    raritySection.className = 'dropdown-section';
    const rarityTitle = document.createElement('div');
    rarityTitle.className = 'dropdown-section-title';
    rarityTitle.textContent = 'Rarity';
    raritySection.appendChild(rarityTitle);
    const allRaritiesBtn = document.createElement('button');
    allRaritiesBtn.className = `dropdown-filter-btn ${!def.currentRarity ? 'active' : ''}`;
    allRaritiesBtn.textContent = 'All Rarities';
    allRaritiesBtn.setAttribute('data-filter-type', 'rarity');
    allRaritiesBtn.setAttribute('data-filter-value', 'all');
    raritySection.appendChild(allRaritiesBtn);
    def.allRarities.forEach(rarity => {
      const rarityBtn = document.createElement('button');
      rarityBtn.className = `dropdown-filter-btn ${def.currentRarity === rarity ? 'active' : ''}`;
      let displayName = rarity;
      if (def.rarityMap[rarity]) displayName = def.rarityMap[rarity];
      rarityBtn.textContent = displayName;
      rarityBtn.setAttribute('data-filter-type', 'rarity');
      rarityBtn.setAttribute('data-filter-value', rarity);
      raritySection.appendChild(rarityBtn);
    });
    def.dropdownMenu.appendChild(raritySection);
  }

  function updateSearchResultsText() {
    if (def.currentSearchQuery || def.currentType || def.currentRarity) {
      const itemCount = def.currentMode === "items" ? def.filteredItems.length : def.filteredIcons.length;
      let filterText = [];
      if (def.currentSearchQuery) filterText.push(`"${def.currentSearchQuery}"`);
      if (def.currentType) filterText.push(`Type: ${def.currentType}`);
      if (def.currentRarity) {
        let displayRarity = def.currentRarity;
        if (def.rarityMap[def.currentRarity]) displayRarity = def.rarityMap[def.currentRarity];
        filterText.push(`Rarity: ${displayRarity}`);
      }
      def.searchResults.textContent = `${itemCount} results ${filterText.length > 0 ? `(${filterText.join(', ')})` : ''}`;
    } else {
      def.searchResults.textContent = "";
    }
  }

  function openDropdown() {
    if (def.currentMode !== "items") return;
    
    updateDropdownMenu();
    const rect = def.filterDropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 220;
    let leftPosition = rect.right - dropdownWidth;
    if (leftPosition < 10) leftPosition = 10;
    if (leftPosition + dropdownWidth > viewportWidth - 10) leftPosition = viewportWidth - dropdownWidth - 10;
    def.dropdownMenu.style.left = leftPosition + 'px';
    def.dropdownMenu.style.top = rect.bottom + 10 + 'px';
    def.dropdownMenu.style.right = 'auto';
    def.dropdownMenu.classList.add('active');
    def.filterDropdown.classList.add('active');
    def.fadeBg.classList.add('active');
    def.isDropdownOpen = true;
    disableBodyScroll();
  }

  function closeDropdown() {
    def.dropdownMenu.classList.remove('active');
    def.filterDropdown.classList.remove('active');
    def.fadeBg.classList.remove('active');
    def.isDropdownOpen = false;
    enableBodyScroll();
  }

  function openPageSheet() {
    def.pagesGrid.innerHTML = "";
    for (let i = 1; i <= def.totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `sheet-page-btn ${i === def.currentPage ? 'active' : ''}`;
      btn.textContent = i;
      def.pagesGrid.appendChild(btn);
    }
    openSheet(def.pageSheet);
  }

  function openSearchSheet() { openSheet(def.searchSheet); }

  function openSheet(sheet) {
    closeAllSheets();
    closeDropdown();
    sheet.classList.add('active');
    def.fadeBg.classList.add('active');
    document.body.style.touchAction = 'none';
  }

  function closeAllSheets() {
    document.body.style.touchAction = '';
    def.pageSheet.classList.remove('active');
    def.searchSheet.classList.remove('active');
    def.fadeBg.classList.remove('active');
  }

  function openModal(box, item) {
    if (def.activeClone || def.isModalAnimating) return;
    
    def.isModalAnimating = true;
    document.body.style.overflow = 'hidden';
    const rect = box.getBoundingClientRect();
    
    def.modalContainer = document.createElement('div');
    def.modalContainer.className = 'modal-container';
    def.modalContainer.style.pointerEvents = 'none';
    document.body.appendChild(def.modalContainer);
    
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
    
    def.modalContainer.appendChild(modal);
    def.activeClone = modal;
    def.originalBox = box;
    
    setTimeout(() => {
      def.fadeBg.classList.add('active');
      def.modalContainer.classList.add('active');
      modal.style.left = '50%';
      modal.style.top = 'calc(50% - 100px)';
      modal.style.transform = 'translate(-50%, -50%) scale(1.8)';
      modal.style.width = '200px';
      modal.style.height = '200px';
      
      setTimeout(() => {
        def.detailsCard = createDetailsCard(item);
        def.modalContainer.appendChild(def.detailsCard);
        const modalRect = modal.getBoundingClientRect();
        def.detailsCard.style.left = '50%';
        def.detailsCard.style.top = (modalRect.bottom + 20) + 'px';
        def.detailsCard.style.width = modalRect.width + 'px';
        def.detailsCard.style.transform = 'translateX(-50%)';
        
        setTimeout(() => {
          def.detailsCard.classList.add('active');
          def.isModalAnimating = false;
        }, 50);
      }, 400);
    }, 50);
  }

  function createDetailsCard(item) {
    const detailsCard = document.createElement('div');
    detailsCard.className = 'details-card';
    
    if (def.currentMode === 'icons') {
      const iconNameTitle = document.createElement('div');
      iconNameTitle.className = 'details-title ibm-plex-mono-bold';
      iconNameTitle.textContent = extractIconName(item["1"]);
      detailsCard.appendChild(iconNameTitle);
    } else {
      if (item["3"]) {
        const title = document.createElement('div');
        title.className = 'details-title ibm-plex-mono-bold';
        let titleText = item["3"];
        if (item["4"]) titleText += ` - ${item["4"]}`;
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
    if (!def.activeClone || !def.originalBox || def.isModalAnimating) return;
    
    def.isModalAnimating = true;
    document.body.style.overflow = '';
    
    if (def.detailsCard) {
      def.detailsCard.style.transform = 'translateX(-50%) translateY(20px)';
      def.detailsCard.style.opacity = '0';
    }
    
    def.fadeBg.classList.remove('active');
    def.modalContainer.classList.remove('active');
    const rect = def.originalBox.getBoundingClientRect();
    def.activeClone.style.left = rect.left + 'px';
    def.activeClone.style.top = rect.top + 'px';
    def.activeClone.style.width = rect.width + 'px';
    def.activeClone.style.height = rect.height + 'px';
    def.activeClone.style.transform = 'translate(0,0) scale(1)';
    
    setTimeout(() => {
      if (def.modalContainer && def.modalContainer.parentNode) def.modalContainer.remove();
      def.activeClone = null;
      def.modalContainer = null;
      def.detailsCard = null;
      def.isModalAnimating = false;
    }, 400);
  }
  
  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function() { require.init(); });
