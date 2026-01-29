**Web Interface** <br>
- Visit https://starexx.vercel.app and use the search box at top to find items.
- Click any result to view detailed information.
  - Name, Description
  - IconName, ItemID
  - Type, Rarity
- The interface provides a user-friendly way to browse and explore all available game items.
- API Usage:
  - Pagination: `/?page={page}`
  - Rarity: `/?rare={rarity}`
  - Search: `/?q={query}`
  - Type: `/?type={type}`
  - Mode: `/?mode={mode}`


**Web API**<br>
- Use endpoints for integration. Search items with `/api/items?raw={query}` or get all data with `/api/data/items`.
  - or [ItemData.json](https://github.com/fakestarexx/FFItems/blob/master/src/assets/itemData.json) <br>
  ```json
  [
    {
     "1": "iconName",
     "2": "itemID", 
     "3": "name",
     "4": "description",
     "5": "rarity",
     "6": "type"
    }
  ]
  ```
- API returns JSON with item details including ID, name, description, type, and rarity for automated applications and data processing.

**Endpoints:**
- Search: GET `/api/items?raw={query}`
- All Data: GET `/api/data/items`

**Examples:**
```bash
curl "https://starexx.vercel.app/api/items?raw=Alok"
```
```json
{
  "query": "Alok",
  "count": 29,
  "results": [{
    "itemID": "102000015",
    "name": "Alok",
    "description": "Item description",
    "iconName": "Icon_name",
    "type": "Characters",
    "rarity": "Epic",
    "openInWeb": "https://starexx.vercel.app/?q=102000015"
   }
 ]
}
```

**Integration Examples**: JavaScript, Python
```javascript
async function searchItems(query) {
  const response = await fetch(`https://starexx.vercel.app/api/items?raw=${encodeURIComponent(query)}`);
  return await response.json();
}
```

```python
import requests

def searchItems(query):
    response = requests.get(f"https://starexx.vercel.app/api/items?raw={query}")
    return response.json()
```

**Rarity & Types**:
| Category | Types | Rarity |
|---------|-------|--------|
| Characters & Customization | Characters, Look Changer | Rare |
| Clothing | Top, Bottom, Shoe, Head, Mask, Facepaint | Mythic |
| Skins, Weapons & Combat | Weapon Skins, Weapon Crates, Skill Skins, Fist Skins, Grenade Skins, Gloo Walls | Mythic+ |
| Skins, Gear & Items | Bag Skins, Parachute, Skyboard, Skywings | Epic |
| Skins, Vehicles | Vehicle Skins | Epic+ |
| Emotes & Animations | Emote, Super Emote, Arrival Animation, Final Shots | Artifact |
| Pets | Pets, Pet Skin, Pet Emote, Pet Skill | Uncommon |
| Avatars & Profile | Avatars, Avatar Frame, Profile Pin | Common |
| Photos & Social | Photo Frame, Photo Pose, Photo Sticker | — |
| Music & Voice | Music, Voice Packs | — |
| Cards & Banners | Battle Cards, Banners | — |
| Loot & Crates | Loot Box, Loot Crates, Choice Crates | — |
| Tokens & Vouchers | Exchange Tokens, Vouchers | — |
| Bundles & Special | Bundles, Hyper Book | — |


**Guidelines:**
- Web interface for visual browsing and detailed views
- Web API for programmatic integration and automation
- Search supports partial matches and is case-insensitive
- Empty query returns all items (Web, API)
- Use direct links: https://starexx.vercel.app/?q={ItemID}

<br>

**Author**: Ankit Mehta ([realstarexx](https://github.com/realstarexx), [fakestarexx](https://github.com/fakestarexx))
