import { THEME_DATA } from './data/theme_data.js';

const CONFIG = {
    maxSearchLimit: 100,
    serialPadding: 3,
    basePath: 'assets/character'
};

// 전역 상태 관리
let currentMode = 'all'; 
let currentCategory = 'eyes'; 
let currentThemeIndex = 0;

// 모드 전환
function toggleMode(mode) {
    currentMode = mode;
    const themeArea = document.getElementById('theme');
    
    if (mode === 'theme') {
        themeArea.style.display = 'block';
        updateThemeUI(); 
    } else {
        themeArea.style.display = 'none';
        changeCategory(currentCategory); 
    }
}

// 카테고리 버튼 UI 업데이트
function updateCategoryUI(category) {
    const navButtons = document.querySelectorAll('#category-menu button');
    navButtons.forEach(btn => {
        // onclick 속성 문자열에 해당 카테고리가 포함되어 있는지 확인
        if (btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}


// 테마 슬라이더 업데이트
function updateThemeUI() {
    const container = document.getElementById('theme-list-container');

    if (!container) return;

    container.innerHTML = '';

    // 현재 인덱스를 중심으로 -2 ~ +2 슬롯 생성
    for (let i = -2; i <= 2; i++) {
        let targetIndex = (currentThemeIndex + i) % THEME_DATA.length;
        if (targetIndex < 0) targetIndex += THEME_DATA.length;

        const theme = THEME_DATA[targetIndex];
        const card = document.createElement('div');
        card.className = `theme-card ${i === 0 ? 'active' : ''}`;
        
        // 카드 클릭 시 해당 테마로 이동
        card.onclick = () => {
            if (i !== 0) {
                currentThemeIndex = targetIndex;
                updateThemeUI();
            }
        };

        const img = document.createElement('img');
        img.src = theme.thumb;
        img.alt = theme.name;

        card.appendChild(img);
        container.appendChild(card);
    }

    changeCategory(currentCategory);
}

// 테마 화살표 이동
function moveTheme(direction) {
    currentThemeIndex = (currentThemeIndex + direction) % THEME_DATA.length;
    if (currentThemeIndex < 0) currentThemeIndex += THEME_DATA.length;
    updateThemeUI();
}

// 카테고리 변경 및 아이템 로드
async function changeCategory(category) {
    currentCategory = category;
    updateCategoryUI(category);

    const grid = document.getElementById('item-grid');
    grid.innerHTML = '<p class="loading-text">불러오는 중...</p>';
    
    let validImages = [];

    if (currentMode === 'all') {
        validImages = await scanFolder(category);
    } else {
        const selectedTheme = THEME_DATA[currentThemeIndex];
        if (selectedTheme) {
            // 파일명이 'category_XXX.png'로 시작하는지 체크
            validImages = selectedTheme.items
                .filter(fileName => fileName.toLowerCase().startsWith(category.toLowerCase() + "_"))
                .map(fileName => `${CONFIG.basePath}/${category}/${fileName}`);
        }
    }

    renderItems(category, validImages);
}

// 폴더 스캔 로직 (전체 모드용)
async function scanFolder(category) {
    const found = [];
    for (let i = 1; i <= CONFIG.maxSearchLimit; i++) {
        const serial = String(i).padStart(CONFIG.serialPadding, '0');
        const fileName = `${category}_${serial}.png`;
        const filePath = `${CONFIG.basePath}/${category}/${fileName}`;

        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            if (response.ok) {
                found.push(filePath);
            } else {
                break; 
            }
        } catch (error) {
            break;
        }
        if (i % 20 === 0) await new Promise(r => setTimeout(r, 0));
    }
    return found;
}

// 아이템 그리드 출력
function renderItems(category, images) {
    const grid = document.getElementById('item-grid');
    grid.innerHTML = '';

    if (images.length === 0) {
        grid.innerHTML = '<p class="empty-text">아이템이 없습니다.</p>';
        return;
    }

    images.forEach(path => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        const img = document.createElement('img');
        img.src = path;
        img.width = 60;
        img.height = 60;
        img.loading = "lazy";
        
        itemCard.onclick = () => applyItem(category, path);
        itemCard.appendChild(img);
        grid.appendChild(itemCard);
    });
}

// 캐릭터 아이템 착용
function applyItem(category, imagePath) {
    const layer = document.getElementById(`layer-${category}`);
    if (!layer) return;

    if (layer.src && layer.src.includes(imagePath)) {
        layer.src = "";
    } else {
        layer.src = imagePath;
        // 의상 간섭 로직
        if (category === 'dress') {
            document.getElementById('layer-cloth-1').src = "";
            document.getElementById('layer-cloth-2').src = "";
        } else if (category === 'cloth-1' || category === 'cloth-2') {
            const dressLayer = document.getElementById('layer-dress');
            if (dressLayer) dressLayer.src = "";
        }
    }
}

// HTML에서 호출하는 함수들을 window 객체에 할당
window.changeCategory = changeCategory;
window.toggleMode = toggleMode;
window.moveTheme = moveTheme;
window.applyItem = applyItem;

// 초기 로드
window.addEventListener('DOMContentLoaded', () => {
    changeCategory('eyes');
});