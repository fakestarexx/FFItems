const FFItemsApp = (function() {
    let state = {
        grid: null,
        fadeBg: null,
        pagePill: null,
        footerPill: null,
        searchPill: null,
        typePill: null,
        rarityPill: null,
        pageSheet: null,
        searchSheet: null,
        typeSheet: null,
        raritySheet: null,
        searchInput: null,
        pagesGrid: null,
        typeGrid: null,
        rarityGrid: null,
        searchResults: null,
        itemsTab: null,
        iconsTab: null,
        
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
        imageCache: new Map(),
        failedImages: new Set(),
        isModalAnimating: false,
        
        rarityMap: {
            "WHITE": "COMMON",
            "BLUE": "RARE",
            "GREEN": "UNCOMMON",
            "ORANGE": "MYTHIC",
            "ORANGE_PLUS": "MYTHIC PLUS",
            "PURPLE": "EPIC",
            "PURPLE_PLUS": "EPIC PLUS",
            "RED": "ARTIFACT"
        }
    };

    function init() {
        setupElements();
        setupEventDelegation();
        // Parse URL parameters before fetching data
        parseURLParameters();
        fetchData();
    }

    function setupElements() {
        state.grid = document.getElementById('grid');
        state.fadeBg = document.getElementById('fadeBg');
        state.pagePill = document.getElementById('pagePill');
        state.footerPill = document.getElementById('footerPill');
        state.searchPill = document.getElementById('searchPill');
        state.typePill = document.getElementById('typePill');
        state.rarityPill = document.getElementById('rarityPill');
        state.pageSheet = document.getElementById('pageSheet');
        state.searchSheet = document.getElementById('searchSheet');
        state.typeSheet = document.getElementById('typeSheet');
        state.raritySheet = document.getElementById('raritySheet');
        state.searchInput = document.getElementById('searchInput');
        state.pagesGrid = document.getElementById('pagesGrid');
        state.typeGrid = document.getElementById('typeGrid');
        state.rarityGrid = document.getElementById('rarityGrid');
        state.searchResults = document.getElementById('searchResults');
        state.itemsTab = document.getElementById('itemsTab');
        state.iconsTab = document.getElementById('iconsTab');
    }

    function setupEventDelegation() {
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        state.searchInput.addEventListener('input', handleSearchInput);
        state.searchInput.addEventListener('keydown', handleSearchKeydown);
        
        state.fadeBg.addEventListener('click', handleFadeBgClick);
    }

    function parseURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get type parameter
        const typeParam = urlParams.get('type');
        if (typeParam) {
            state.currentType = typeParam;
        }
        
        // Get rarity parameter
        const rarityParam = urlParams.get('rare');
        if (rarityParam) {
            state.currentRarity = rarityParam;
        }
        
        // Get search query parameter
        const searchParam = urlParams.get('q');
        if (searchParam) {
            state.currentSearchQuery = searchParam;
        }
    }

    function updateURLParameters() {
        const urlParams = new URLSearchParams();
        
        if (state.currentType) {
            urlParams.set('type', state.currentType);
        }
        
        if (state.currentRarity) {
            urlParams.set('rare', state.currentRarity);
        }
        
        if (state.currentSearchQuery) {
            urlParams.set('q', state.currentSearchQuery);
        }
        
        const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname;
        
        // Update URL without reloading the page
        window.history.replaceState({}, '', newUrl);
    }

    function handleDocumentClick(e) {
        const target = e.target;
        
        if (target.classList.contains('mode-tab')) {
            handleModeTabClick(target);
        } else if (target.classList.contains('header-pill')) {
            handleHeaderPillClick(target);
        } else if (target.classList.contains('footer-pill')) {
            handleFooterPillClick(target);
        } else if (target.classList.contains('sheet-page-btn')) {
            handlePageButtonClick(target);
        } else if (target.classList.contains('filter-btn')) {
            handleFilterButtonClick(target);
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
        updateHeaderPills();
        updateURLParameters(); // Update URL when search changes
    }

    function handleSearchKeydown(e) {
        if (e.key === 'Enter') {
            closeAllSheets();
        }
    }

    function handleFadeBgClick(e) {
        if (e.target === state.fadeBg && !state.isModalAnimating) {
            closeModal();
            closeAllSheets();
        }
    }

    function handleModeTabClick(target) {
        const mode = target.id === 'itemsTab' ? 'items' : 'icons';
        if (state.currentMode === mode) return;
        
        state.currentMode = mode;
        state.currentPage = 1;
        state.currentSearchQuery = "";
        state.currentType = "";
        state.currentRarity = "";
        
        state.itemsTab.classList.toggle('active', mode === 'items');
        state.iconsTab.classList.toggle('active', mode === 'icons');
        
        state.searchInput.placeholder = mode === 'items' 
            ? 'Search by name, item ID or icon...' 
            : 'Search icons...';
        
        state.searchInput.value = "";
        renderGrid();
        updateURLParameters(); // Update URL when mode changes
    }

    function handleHeaderPillClick(target) {
        if (target === state.searchPill) {
            openSearchSheet();
        } else if (target === state.typePill) {
            openTypeSheet();
        } else if (target === state.rarityPill) {
            openRaritySheet();
        }
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

    function handleFilterButtonClick(target) {
        const parent = target.parentElement;
        
        if (parent.id === 'typeGrid') {
            if (target.textContent === 'All Types') {
                state.currentType = "";
            } else {
                state.currentType = target.textContent;
            }
        } else if (parent.id === 'rarityGrid') {
            if (target.textContent === 'All Rarities') {
                state.currentRarity = "";
            } else {
                const rarityKey = Object.keys(state.rarityMap).find(key => 
                    state.rarityMap[key] === target.textContent
                ) || target.textContent;
                state.currentRarity = rarityKey;
            }
        }
        
        state.currentPage = 1;
        renderGrid();
        closeAllSheets();
        updateURLParameters(); // Update URL when filters change
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
                    icon: iconName,
                    name: extractIconName(iconName)
                };
                openModal(box, item);
            }
        }
    }

    function fetchData() {
        Promise.all([
            fetch('assets/itemData.json').then(r => r.ok ? r.json() : Promise.reject()),
            fetch('assets/assets.json').then(r => r.ok ? r.json() : Promise.reject())
        ])
        .then(([itemsData, iconsData]) => {
            state.allItems = itemsData;
            state.allIcons = Array.isArray(iconsData) ? iconsData : Object.values(iconsData).filter(item => typeof item === 'string');
            
            processData();
            renderGrid();
        })
        .catch(error => {
            console.error('Failed to load data:', error);
            state.grid.innerHTML = '<div class="no-results">Failed to load data. Please check if JSON files exist.</div>';
        });
    }

    function processData() {
        state.allTypes = [...new Set(state.allItems.map(item => item.type).filter(Boolean))].sort();
        state.allRarities = [...new Set(state.allItems.map(item => item.Rare).filter(Boolean))]
            .filter(rarity => rarity !== "255" && rarity !== "NONE")
            .sort();
        
        state.filteredItems = [...state.allItems];
        state.filteredIcons = [...state.allIcons];
        state.totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
    }

    function getImageUrl(iconName) {
        if (!iconName) return 'https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png';
        if (iconName.includes('https://')) return iconName;
        /*
        Official → @0xMe’s Icon Resources | OB51 Icons Update
        */
        return `https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/${iconName}.png`;
    }

    function createImageElement(iconName, className, altText) {
        const icon = document.createElement('img');
        icon.className = className;
        icon.alt = altText || 'Free Fire Item';
        
        const imageUrl = getImageUrl(iconName);
        
        if (state.failedImages.has(imageUrl)) {
            icon.src = 'https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png';
            icon.classList.add('loaded');
            return icon;
        }
        
        if (state.imageCache.has(imageUrl)) {
            icon.src = state.imageCache.get(imageUrl);
            icon.classList.add('loaded');
        } else {
            icon.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PC9zdmc+';
            
            const imgLoader = new Image();
            imgLoader.onload = () => {
                icon.src = imageUrl;
                icon.classList.add('loaded');
                state.imageCache.set(imageUrl, imageUrl);
            };
            
            imgLoader.onerror = () => {
                state.failedImages.add(imageUrl);
                icon.src = 'https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png';
                icon.classList.add('loaded');
            };
            
            imgLoader.src = imageUrl;
        }
        
        return icon;
    }

    function renderGrid() {
        state.grid.innerHTML = "";
        
        if (state.currentMode === "items") {
            state.filteredItems = state.allItems.filter(item => {
                const matchesSearch = !state.currentSearchQuery || 
                    (item.name && item.name.toLowerCase().includes(state.currentSearchQuery.toLowerCase())) ||
                    (item.itemID && item.itemID.toString().includes(state.currentSearchQuery)) ||
                    (item.icon && item.icon.toLowerCase().includes(state.currentSearchQuery.toLowerCase())) ||
                    (item.description && item.description.toLowerCase().includes(state.currentSearchQuery.toLowerCase()));
                
                const matchesType = !state.currentType || item.type === state.currentType;
                const matchesRarity = !state.currentRarity || item.Rare === state.currentRarity;
                
                return matchesSearch && matchesType && matchesRarity;
            });
            
            state.totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
            
            if (state.filteredItems.length === 0) {
                state.grid.innerHTML = '<div class="no-results">No items found matching your filters</div>';
                updateHeaderPills();
                updateSearchResultsText();
                return;
            }
            
            const startIndex = (state.currentPage - 1) * state.itemsPerPage;
            const endIndex = Math.min(startIndex + state.itemsPerPage, state.filteredItems.length);
            const itemsToShow = state.filteredItems.slice(startIndex, endIndex);
            
            itemsToShow.forEach(item => {
                const box = document.createElement('div');
                box.className = 'box';
                
                const icon = createImageElement(item.icon, 'icon', item.name || 'Item Icon');
                box.appendChild(icon);
                state.grid.appendChild(box);
            });
        } else {
            if (state.currentSearchQuery) {
                state.filteredIcons = state.allIcons.filter(iconName => 
                    iconName && iconName.toLowerCase().includes(state.currentSearchQuery.toLowerCase())
                );
            } else {
                state.filteredIcons = [...state.allIcons];
            }
            
            state.totalPages = Math.ceil(state.filteredIcons.length / state.itemsPerPage);
            
            if (state.filteredIcons.length === 0) {
                state.grid.innerHTML = '<div class="no-results">No icons found matching your search</div>';
                updateHeaderPills();
                updateSearchResultsText();
                return;
            }
            
            const startIndex = (state.currentPage - 1) * state.itemsPerPage;
            const endIndex = Math.min(startIndex + state.itemsPerPage, state.filteredIcons.length);
            const iconsToShow = state.filteredIcons.slice(startIndex, endIndex);
            
            iconsToShow.forEach(iconName => {
                const box = document.createElement('div');
                box.className = 'box';
                
                const icon = createImageElement(iconName, 'icon', iconName);
                box.appendChild(icon);
                state.grid.appendChild(box);
            });
        }
        
        updateHeaderPills();
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

    function updateHeaderPills() {
        state.pagePill.textContent = `Page ${state.currentPage}/${state.totalPages}`;
        
        if (state.currentSearchQuery) {
            state.searchPill.textContent = state.currentSearchQuery.length > 10 
                ? state.currentSearchQuery.substring(0, 10) + "..." 
                : state.currentSearchQuery;
        } else {
            state.searchPill.textContent = "Search";
        }
        
        if (state.currentMode === "items") {
            document.querySelectorAll('.type-filter, .rarity-filter').forEach(el => {
                el.style.display = 'block';
            });
            
            if (state.currentType) {
                state.typePill.textContent = state.currentType;
                state.typePill.classList.add('active');
            } else {
                state.typePill.textContent = "Type";
                state.typePill.classList.remove('active');
            }
            
            if (state.currentRarity) {
                let displayRarity = state.currentRarity;
                if (state.rarityMap[state.currentRarity]) {
                    displayRarity = state.rarityMap[state.currentRarity];
                }
                state.rarityPill.textContent = displayRarity;
                state.rarityPill.classList.add('active');
            } else {
                state.rarityPill.textContent = "Rarity";
                state.rarityPill.classList.remove('active');
            }
        } else {
            document.querySelectorAll('.type-filter, .rarity-filter').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    function updateSearchResultsText() {
        if (state.currentSearchQuery || state.currentType || state.currentRarity) {
            const itemCount = state.currentMode === "items" ? state.filteredItems.length : state.filteredIcons.length;
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
            
            state.searchResults.textContent = `Showing results for ${filterText.join(', ')} - ${itemCount} ${state.currentMode} found`;
        } else {
            state.searchResults.textContent = "";
        }
    }

    function openTypeSheet() {
        state.typeGrid.innerHTML = "";
        
        const allBtn = document.createElement('button');
        allBtn.className = `filter-btn ${!state.currentType ? 'active' : ''}`;
        allBtn.textContent = 'All Types';
        state.typeGrid.appendChild(allBtn);
        
        state.allTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${state.currentType === type ? 'active' : ''}`;
            btn.textContent = type;
            state.typeGrid.appendChild(btn);
        });
        
        openSheet(state.typeSheet);
    }

    function openRaritySheet() {
        state.rarityGrid.innerHTML = "";
        
        const allBtn = document.createElement('button');
        allBtn.className = `filter-btn ${!state.currentRarity ? 'active' : ''}`;
        allBtn.textContent = 'All Rarities';
        state.rarityGrid.appendChild(allBtn);
        
        state.allRarities.forEach(rarity => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${state.currentRarity === rarity ? 'active' : ''}`;
            
            let displayName = rarity;
            if (state.rarityMap[rarity]) {
                displayName = state.rarityMap[rarity];
            }
            
            btn.textContent = displayName;
            state.rarityGrid.appendChild(btn);
        });
        
        openSheet(state.raritySheet);
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
        state.searchInput.value = state.currentSearchQuery;
        openSheet(state.searchSheet);
        
        setTimeout(() => {
            state.searchInput.focus();
        }, 300);
    }

    function openSheet(sheet) {
        closeAllSheets();
        sheet.classList.add('active');
        state.fadeBg.classList.add('active');
        document.body.style.touchAction = 'none';
    }

    function closeAllSheets() {
        document.body.style.touchAction = '';
        state.pageSheet.classList.remove('active');
        state.searchSheet.classList.remove('active');
        state.typeSheet.classList.remove('active');
        state.raritySheet.classList.remove('active');
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
        
        const modalIcon = createImageElement(item.icon, 'modal-icon', item.name || item.icon);
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
            iconNameTitle.textContent = extractIconName(item.icon);
            detailsCard.appendChild(iconNameTitle);
        } else {
            if (item.name) {
                const title = document.createElement('div');
                title.className = 'details-title ibm-plex-mono-bold';
                let titleText = item.name;
                if (item.description) {
                    titleText += ` - ${item.description}`;
                }
                title.textContent = titleText;
                detailsCard.appendChild(title);
            }
            
            const propertiesContainer = document.createElement('div');
            propertiesContainer.className = 'details-properties';
            
            if (item.itemID) {
                const idProperty = document.createElement('div');
                idProperty.className = 'details-property';
                
                const idLabel = document.createElement('span');
                idLabel.className = 'details-property-label ibm-plex-mono-bold';
                idLabel.textContent = 'Item ID: ';
                
                const idValue = document.createElement('span');
                idValue.className = 'details-property-value ibm-plex-mono-regular';
                idValue.textContent = item.itemID;
                
                idProperty.appendChild(idLabel);
                idProperty.appendChild(idValue);
                propertiesContainer.appendChild(idProperty);
            }
            
            if (item.icon) {
                const iconProperty = document.createElement('div');
                iconProperty.className = 'details-property';
                
                const iconLabel = document.createElement('span');
                iconLabel.className = 'details-property-label ibm-plex-mono-bold';
                iconLabel.textContent = 'Icon: ';
                
                const iconValue = document.createElement('span');
                iconValue.className = 'details-property-value ibm-plex-mono-regular';
                iconValue.textContent = item.icon;
                
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
    FFItemsApp.init();
});
