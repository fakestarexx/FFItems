let iconsData = [];
let assetsData = [];
let filteredData = [];
let currentPage = 0;
const itemsPerPage = 100;
let uniqueFilters = {
     itemType: new Set(),
     Rare: new Set(),
     collectionType: new Set(),
};
let lastClickedCard = null;
let modalOpen = false;
let currentSort = "";
let currentTypeFilter = "";
let currentCollectionFilter = "";
let currentRarityFilter = "";
let currentDataType = "items";

const rarityDisplayNames = {
     NONE: "COMMON",
     WHITE: "COMMON",
     BLUE: "RARE",
     GREEN: "UNCOMMON",
     ORANGE: "MYTHIC",
     ORANGE_PLUS: "MYTHIC PLUS",
     PURPLE: "EPIC",
     PURPLE_PLUS: "EPIC PLUS",
     Red: "ARTIFACT",
};

const rarityCardImages = {
     NONE: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/COMMON.png",
     WHITE: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/COMMON.png",
     BLUE: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/RARE.png",
     GREEN: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/UNCOMMON.png",
     ORANGE: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/MYTHIC.png",
     ORANGE_PLUS: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/MYTHIC_PLUS.png",
     PURPLE: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/EPIC.png",
     PURPLE_PLUS: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/EPIC_PLUS.png",
     Red: "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/card/ARTIFACT.png",
};

document.addEventListener("DOMContentLoaded", () => {
     setTimeout(() => {
          const loadingDot = document.getElementById("loadingDot");
          const container = document.getElementById("container");
          if (loadingDot) loadingDot.style.display = "none";
          if (container) container.style.display = "block";
     }, 1000);

     fetchIcons();
     fetchAssets();

     const menuButton = document.getElementById("menuButton");
     const sidebarClose = document.getElementById("sidebarClose");
     const search = document.getElementById("search");
     const modalBg = document.getElementById("modalBg");
     const modalClose = document.getElementById("modalClose");
     const itemsButton = document.getElementById("itemsButton");
     const assetsButton = document.getElementById("assetsButton");
     const changelogButton = document.getElementById("changelogButton");
     const changelogModalBg = document.getElementById("changelogModalBg");
     const changelogModalClose = document.getElementById("changelogModalClose");
     const clearFiltersButton = document.getElementById("clearFiltersButton");

     if (menuButton) menuButton.addEventListener("click", toggleSidebar);
     if (sidebarClose) sidebarClose.addEventListener("click", toggleSidebar);
     if (search) search.addEventListener("input", filterIcons);
     if (modalBg) modalBg.addEventListener("click", closeModal);
     if (modalClose) modalClose.addEventListener("click", closeModal);
     if (changelogButton) changelogButton.addEventListener("click", openChangelogModal);
     if (changelogModalBg) changelogModalBg.addEventListener("click", closeChangelogModal);
     if (changelogModalClose) changelogModalClose.addEventListener("click", closeChangelogModal);
     if (clearFiltersButton) clearFiltersButton.addEventListener("click", clearFilters);

     if (itemsButton) itemsButton.addEventListener("click", () => switchDataType("items"));
     if (assetsButton) assetsButton.addEventListener("click", () => switchDataType("assets"));

     const rarityMenu = document.getElementById("rarityMenu");
     const sortMenu = document.getElementById("sortMenu");
     const collectionsMenu = document.getElementById("collectionsMenu");
     const typesMenu = document.getElementById("typesMenu");

     if (rarityMenu) rarityMenu.addEventListener("click", () => toggleSubmenu("rarity"));
     if (sortMenu) sortMenu.addEventListener("click", () => toggleSubmenu("sort"));
     if (collectionsMenu) collectionsMenu.addEventListener("click", () => toggleSubmenu("collections"));
     if (typesMenu) typesMenu.addEventListener("click", () => toggleSubmenu("types"));

     window.addEventListener("load", () => {
          if ("serviceWorker" in navigator) {
               navigator.serviceWorker.register("sw.js").then(() => {
                    console.log("Service Worker Registered");
               });
          }

          let deferredPrompt;
          window.addEventListener("beforeinstallprompt", (e) => {
               e.preventDefault();
               deferredPrompt = e;
               setTimeout(() => {
                    if (deferredPrompt) {
                         deferredPrompt.prompt();
                         deferredPrompt.userChoice.then(() => {
                              deferredPrompt = null;
                         });
                    }
               }, 3000);
          });
     });
});

function toggleSubmenu(type) {
     const menuItem = document.getElementById(`${type}Menu`);
     const submenu = document.getElementById(`${type}Submenu`);
     if (menuItem && submenu) {
          menuItem.classList.toggle("active");
          submenu.classList.toggle("open");
     }
}

function toggleSidebar() {
     const sidebar = document.getElementById("sidebar");
     if (sidebar) {
          sidebar.classList.toggle("open");
     }
}

function switchDataType(type) {
     currentDataType = type;

     const itemsButton = document.getElementById("itemsButton");
     const assetsButton = document.getElementById("assetsButton");

     if (itemsButton && assetsButton) {
          itemsButton.classList.toggle("active", type === "items");
          assetsButton.classList.toggle("active", type === "assets");
     }

     applyFilters();
}

async function fetchIcons() {
     try {
          const response = await fetch("https://cdn.jsdelivr.net/gh/9112000/FFItems@30594bf/assets/itemData.json");
          const data = await response.json();

          iconsData = data.map((item) => ({
               itemId: item["itemID"] || 0,
               name: item["description"] || "Unknown",
               iconName: item["icon"] || "Unknown",
               description: item["description"] || "No description",
               description2: item["description2"] || "No additional description",
               itemType: item["itemType"] ? item["itemType"].replace(/_/g, " ") : "Unknown",
               collectionType: item["collectionType"] ? item["collectionType"].replace(/_/g, " ") : "Unknown",
               Rare: item["Rare"] || "NONE",
               displayRarity: rarityDisplayNames[item["Rare"]] || item["Rare"] || "COMMON",
               cardImageUrl: rarityCardImages[item["Rare"]] || "assets/images/card/COMMON.png",
               iconUrl: `https://freefiremobile-a.akamaihd.net/common/Local/PK/FF_UI_Icon/${item["icon"]}.png`,
               dataType: "item",
          }));

          iconsData.forEach((item) => {
               if (item.itemType && item.itemType !== "Unknown") uniqueFilters.itemType.add(item.itemType);
               if (item.displayRarity && item.displayRarity !== "COMMON") uniqueFilters.Rare.add(item.displayRarity);
               if (item.collectionType && item.collectionType !== "Unknown") uniqueFilters.collectionType.add(item.collectionType);
          });

          populateFilterButtons("filter-Rare-buttons", uniqueFilters.Rare, "Rare");
          populateFilterButtons("filter-sort-buttons", new Set(["ID", "Name", "Rarity"]), "sort");
          populateFilterButtons("filter-collectionType-buttons", uniqueFilters.collectionType, "collectionType");
          populateFilterButtons("filter-itemType-buttons", uniqueFilters.itemType, "itemType");

          populateFilterTabs();

          filteredData = [...iconsData];
          sortIcons();
          renderIcons();

          const searchParams = new URLSearchParams(window.location.search);
          const query = searchParams.get("q");
          if (query) {
               const searchInput = document.getElementById("search");
               if (searchInput) {
                    searchInput.value = query;
                    filterIcons();
               }
          }
     } catch (error) {
          console.error("Failed to retrieve Icons:", error);
          showError();
     }
}

async function fetchAssets() {
     try {
          const response = await fetch("assets/assets.json");
          const data = await response.json();

          assetsData = data.map((url) => ({
               iconUrl: url,
               name: url.split("/").pop().replace(".png", ""),
               dataType: "asset",
          }));
     } catch (error) {
          console.error("Failed to retrieve Assets:", error);
     }
}

function populateFilterButtons(containerId, values, filterType) {
     const container = document.getElementById(containerId);
     if (!container) return;

     container.innerHTML = "";

     Array.from(values)
          .sort()
          .forEach((value) => {
               if (!value) return;

               const button = document.createElement("button");
               button.className = "sidebar-filter-button";
               button.textContent = value;
               button.dataset.filterType = filterType;
               button.dataset.filterValue = value;

               button.onclick = function () {
                    const buttons = container.querySelectorAll(".sidebar-filter-button");
                    buttons.forEach((btn) => btn.classList.remove("active"));

                    if (filterType === "sort") {
                         button.classList.add("active");
                         currentSort = value.toLowerCase();
                         sortIcons();
                         renderIcons();
                    } else {
                         const isActive = button.classList.contains("active");
                         buttons.forEach((btn) => btn.classList.remove("active"));

                         if (!isActive) {
                              button.classList.add("active");

                              if (filterType === "Rare") {
                                   currentRarityFilter = value;
                              } else if (filterType === "collectionType") {
                                   currentCollectionFilter = value;
                              } else if (filterType === "itemType") {
                                   currentTypeFilter = value;
                              }
                         } else {
                              if (filterType === "Rare") {
                                   currentRarityFilter = "";
                              } else if (filterType === "collectionType") {
                                   currentCollectionFilter = "";
                              } else if (filterType === "itemType") {
                                   currentTypeFilter = "";
                              }
                         }

                         applyFilters();
                    }
               };

               if (filterType === "sort" && value.toLowerCase() === currentSort) {
                    button.classList.add("active");
               }

               container.appendChild(button);
          });
}

function populateFilterTabs() {
     const filterTabs = document.getElementById("headerTabs");
     if (!filterTabs) return;

     filterTabs.innerHTML = "";

     const allTab = document.createElement("button");
     allTab.className = "filter-tab active";
     allTab.textContent = "ALL";
     allTab.onclick = () => {
          currentTypeFilter = "";
          currentCollectionFilter = "";
          currentRarityFilter = "";

          document.querySelectorAll(".filter-tab").forEach((tab) => tab.classList.remove("active"));
          allTab.classList.add("active");

          document.querySelectorAll(".sidebar-filter-button").forEach((btn) => {
               if (btn.dataset.filterType !== "sort") {
                    btn.classList.remove("active");
               }
          });

          applyFilters();
     };
     filterTabs.appendChild(allTab);

     Array.from(uniqueFilters.itemType)
          .sort()
          .forEach((type) => {
               if (!type) return;
               const tab = document.createElement("button");
               tab.className = "filter-tab";
               tab.textContent = type;
               tab.onclick = () => {
                    currentTypeFilter = type;
                    currentCollectionFilter = "";
                    currentRarityFilter = "";

                    document.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
                    tab.classList.add("active");

                    document.querySelectorAll(".sidebar-filter-button").forEach((btn) => {
                         if (btn.dataset.filterType !== "sort") {
                              btn.classList.remove("active");
                         }
                    });

                    const typeButton = document.querySelector(`.sidebar-filter-button[data-filter-value="${type}"]`);
                    if (typeButton) typeButton.classList.add("active");

                    applyFilters();
               };
               filterTabs.appendChild(tab);
          });

     Array.from(uniqueFilters.collectionType)
          .sort()
          .forEach((collection) => {
               if (!collection) return;
               const tab = document.createElement("button");
               tab.className = "filter-tab";
               tab.textContent = collection;
               tab.onclick = () => {
                    currentCollectionFilter = collection;
                    currentTypeFilter = "";
                    currentRarityFilter = "";

                    document.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
                    tab.classList.add("active");

                    document.querySelectorAll(".sidebar-filter-button").forEach((btn) => {
                         if (btn.dataset.filterType !== "sort") {
                              btn.classList.remove("active");
                         }
                    });

                    const collectionButton = document.querySelector(`.sidebar-filter-button[data-filter-value="${collection}"]`);
                    if (collectionButton) collectionButton.classList.add("active");

                    applyFilters();
               };
               filterTabs.appendChild(tab);
          });
}

function showError() {
     const grid = document.getElementById("iconGrid");
     if (grid) {
          grid.innerHTML = `<div class="no-results">Failed to load items. Please try again later.</div>`;
     }
}

function applyFilters() {
     const searchInput = document.getElementById("search");
     const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";

     if (currentDataType === "items") {
          filteredData = iconsData.filter((item) => {
               const itemName = item.name || "";
               const itemId = item.itemId || "";
               const iconName = item.iconName || "";

               const matchesSearch = searchQuery === "" || itemName.toString().toLowerCase().includes(searchQuery) || itemId.toString().includes(searchQuery) || iconName.toLowerCase().includes(searchQuery);

               const matchesType = !currentTypeFilter || item.itemType === currentTypeFilter;
               const matchesRare = !currentRarityFilter || item.displayRarity === currentRarityFilter;
               const matchesCollection = !currentCollectionFilter || item.collectionType === currentCollectionFilter;

               return matchesSearch && matchesType && matchesRare && matchesCollection;
          });

          sortIcons();
     } else {
          filteredData = assetsData.filter((asset) => {
               const assetName = asset.name || "";
               return searchQuery === "" || assetName.toLowerCase().includes(searchQuery);
          });
     }

     currentPage = 0;
     renderIcons();
}

function sortIcons() {
     if (currentSort === "name") {
          filteredData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
     } else if (currentSort === "id") {
          filteredData.sort((a, b) => (a.itemId || 0) - (b.itemId || 0));
     } else if (currentSort === "rarity") {
          const rarityOrder = {
               COMMON: 1,
               UNCOMMON: 2,
               RARE: 3,
               EPIC: 4,
               "EPIC PLUS": 5,
               MYTHIC: 6,
               "MYTHIC PLUS": 7,
               ARTIFACT: 8,
          };

          filteredData.sort((a, b) => {
               const aRarity = rarityOrder[a.displayRarity] || 0;
               const bRarity = rarityOrder[b.displayRarity] || 0;
               return bRarity - aRarity || (a.itemId || 0) - (b.itemId || 0);
          });
     }
}

function renderIcons() {
     const grid = document.getElementById("iconGrid");
     if (!grid) return;

     const start = currentPage * itemsPerPage;
     const end = start + itemsPerPage;
     const visibleIcons = filteredData.slice(start, end);

     grid.innerHTML = "";

     if (filteredData.length === 0) {
          grid.innerHTML = `<div class="no-results">No items found matching your criteria</div>`;
          const paginationDiv = document.getElementById("pagination");
          if (paginationDiv) paginationDiv.innerHTML = "";
          return;
     }

     visibleIcons.forEach((icon, index) => {
          const card = document.createElement("div");
          card.className = "icon-card";
          card.dataset.index = start + index;
          card.onclick = (e) => {
               document.querySelectorAll(".icon-card").forEach((c) => {
                    c.classList.remove("active");
               });
               card.classList.add("active");
               lastClickedCard = card;
               showModal(icon);
          };

          const cardContainer = document.createElement("div");
          cardContainer.style.position = "relative";
          cardContainer.style.width = "100%";
          cardContainer.style.height = "100%";

          if (currentDataType === "items") {
               const cardBg = document.createElement("img");
               cardBg.src = icon.cardImageUrl;
               cardBg.alt = icon.name + " card background";
               cardBg.className = "card-bg";
               cardBg.onerror = () => {
                    cardBg.src = "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png";
               };

               const cardIcon = document.createElement("img");
               cardIcon.src = icon.iconUrl;
               cardIcon.alt = icon.name;
               cardIcon.className = "card-icon";
               cardIcon.onerror = () => {
                    cardIcon.src = "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png";
               };

               cardContainer.appendChild(cardBg);
               cardContainer.appendChild(cardIcon);
          } else {
               const cardIcon = document.createElement("img");
               cardIcon.src = icon.iconUrl;
               cardIcon.alt = icon.name;
               cardIcon.className = "card-icon";
               cardIcon.style.position = "absolute";
               cardIcon.style.top = "50%";
               cardIcon.style.left = "50%";
               cardIcon.style.transform = "translate(-50%, -50%)";
               cardIcon.style.maxWidth = "80%";
               cardIcon.style.maxHeight = "80%";
               cardIcon.onerror = () => {
                    cardIcon.src = "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png";
               };

               cardContainer.appendChild(cardIcon);
          }

          card.appendChild(cardContainer);
          grid.appendChild(card);
     });

     updatePagination();
}

function updatePagination() {
     const paginationDiv = document.getElementById("pagination");
     if (!paginationDiv) return;

     const totalPages = Math.ceil(filteredData.length / itemsPerPage);
     paginationDiv.innerHTML = "";

     for (let i = 0; i < totalPages; i++) {
          const button = document.createElement("button");
          button.textContent = i + 1;
          button.classList.toggle("active", i === currentPage);
          button.onclick = () => changePage(i);
          paginationDiv.appendChild(button);
     }
}

function changePage(page) {
     currentPage = page;
     renderIcons();
     window.scrollTo({ top: 0, behavior: "smooth" });
}

function filterIcons() {
     applyFilters();
}

function clearFilters() {
    currentTypeFilter = "";
    currentCollectionFilter = "";
    currentRarityFilter = "";

    document.querySelectorAll(".filter-tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelector(".filter-tab").classList.add("active");

    document.querySelectorAll(".sidebar-filter-button").forEach((btn) => {
        if (btn.dataset.filterType !== "sort") {
            btn.classList.remove("active");
        }
    });

    applyFilters();
}

function showModal(item) {
     const modal = document.getElementById("modal");
     const modalImage = document.getElementById("modalImage");
     const modalDescription = document.getElementById("modalDescription");
     const modalDescription2 = document.getElementById("modalDescription2");
     const modalItemId = document.getElementById("modalItemId");
     const modalIconName = document.getElementById("modalIconName");
     const modalType = document.getElementById("modalType");
     const modalRare = document.getElementById("modalRare");

     if (modal && modalImage) {
          modalImage.src = item.iconUrl;
          modalImage.onerror = () => {
               modalImage.src = "https://cdn.jsdelivr.net/gh/9112000/FFItems@master/assets/images/error-404.png";
          };

          if (item.dataType === "item") {
               if (modalDescription) modalDescription.textContent = item.name || "Unknown";
               if (modalDescription2) {
                    const description = item.description2 || item.description || "No description";
                    modalDescription2.textContent = description === "No description" || description === "NONE" ? "No description provided" : description;
               }
               if (modalItemId) modalItemId.textContent = item.itemId || "Unknown";
               if (modalIconName) modalIconName.textContent = item.iconName || "Unknown";
               if (modalType) modalType.textContent = item.itemType || "Unknown";
               if (modalRare) modalRare.textContent = item.displayRarity || "Unknown";
               document.querySelectorAll("#modalDescription2, #modalItemId, #modalType, #modalRare").forEach((el) => {
                    el.style.display = "";
               });
               document.querySelectorAll(".divider").forEach((el) => {
                    el.style.display = "";
               });
          } else {
               if (modalDescription) modalDescription.textContent = "";
               if (modalDescription2) modalDescription2.textContent = "";
               if (modalItemId) modalItemId.textContent = "Unavailable in assets mode.";
               if (modalIconName) modalIconName.textContent = item.name || "Unknown";
               if (modalType) modalType.textContent = "";
               if (modalRare) modalRare.textContent = "";

               document.querySelectorAll("#modalDescription2, #item.description, #modalType, #modalRare").forEach((el) => {
                    el.style.display = "none";
               });
               document.querySelectorAll(".divider").forEach((el) => {
                    el.style.display = "none";
               });
          }

          modal.classList.add("show");
     }
}

function closeModal() {
     const modal = document.getElementById("modal");
     if (modal) {
          modal.classList.remove("show");
     }
}

function openChangelogModal() {
    const changelogModal = document.getElementById("changelogModal");
    if (changelogModal) {
        changelogModal.classList.add("show");
    }
}

function closeChangelogModal() {
    const changelogModal = document.getElementById("changelogModal");
    if (changelogModal) {
        changelogModal.classList.remove("show");
    }
}


function copyToClipboard(text, type) {
     if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard
               .writeText(text)
               .then(() => {
                    showCopyNotification(type);
               })
               .catch((err) => {
                    console.error("Failed to copy: ", err);
                    fallbackCopyToClipboard(text, type);
               });
     } else {
          fallbackCopyToClipboard(text, type);
     }
}

function fallbackCopyToClipboard(text, type) {
     const textArea = document.createElement("textarea");
     textArea.value = text;
     textArea.style.position = "fixed";
     textArea.style.opacity = 0;
     document.body.appendChild(textArea);
     textArea.focus();
     textArea.select();

     try {
          const successful = document.execCommand("copy");
          if (successful) {
               showCopyNotification(type);
          }
     } catch (err) {
          console.error("Fallback copy failed: ", err);
     }

     document.body.removeChild(textArea);
}

function showCopyNotification(type) {
     alert(`${type} copied to clipboard!`);
}

if ("serviceWorker" in navigator) {
     window.addEventListener("load", () => {
          navigator.serviceWorker
               .register("sw.js")
               .then((reg) => console.log("Service worker registered", reg))
               .catch((err) => console.error("Service worker registration failed", err));
     });
}
