/**
 * Dress Up Game Configuration
 * 규칙: category_001.png ~ category_999.png
 */
const CONFIG = {
    maxSearchLimit: 100,
    serialPadding: 3,
    basePath: 'assets/character'
};

/**
 * 카테고리 변경 시 호출되는 메인 함수
 * @param {string} category - 'hair', 'eyes', 'dress', 'cloth-1', 'cloth-2', 'shoes', 'necklace', 'hair-band'
 */
async function changeCategory(category) {
    const grid = document.getElementById('item-grid');
    
    // 로딩 메시지 표시 및 기존 아이템 제거
    grid.innerHTML = '<p class="loading-text">불러오는 중...</p>';
    
    const validImages = [];

    // 순차적으로 파일 존재 여부 확인
    for (let i = 1; i <= CONFIG.maxSearchLimit; i++) {
        const serial = String(i).padStart(CONFIG.serialPadding, '0');
        const fileName = `${category}_${serial}.png`;
        const filePath = `${CONFIG.basePath}/${category}/${fileName}`;

        try {
            // HEAD 요청으로 파일이 실제 서버 경로에 존재하는지만 체크 (속도 빠름)
            const response = await fetch(filePath, { method: 'HEAD' });

            if (response.ok) {
                validImages.push(filePath);
            } else {
                // 404 Not Found 등을 만나면 더 이상 뒤 번호는 없는 것으로 간주하고 중단
                console.log(`[${category}] 스캔 완료: 총 ${validImages.length}개의 아이템 발견`);
                break;
            }
        } catch (error) {
            console.error("파일 탐색 중 네트워크 오류:", error);
            break;
        }

        // 브라우저 렌더링 스레드가 멈추지 않도록 20개마다 아주 짧은 휴식
        if (i % 20 === 0) await new Promise(r => setTimeout(r, 0));
    }

    renderItems(category, validImages);
}

/**
 * 스캔된 이미지들을 화면(그리드)에 그리는 함수
 */
function renderItems(category, images) {
    const grid = document.getElementById('item-grid');
    grid.innerHTML = ''; // 로딩 메시지 비우기

    if (images.length === 0) {
        grid.innerHTML = '<p class="empty-text">아이템이 없습니다.</p>';
        return;
    }

    // main.js 내의 renderItems 함수 부분 수정
    images.forEach(path => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';

        const img = document.createElement('img');
        img.src = path;
        img.alt = category;
        img.width = 60; 
        img.height = 60;
        img.loading = "lazy"; 

        itemCard.onclick = () => {
            applyItem(category, path);
        };

        itemCard.appendChild(img);
        grid.appendChild(itemCard);
    });
}

/**
 * 선택한 아이템을 캐릭터 레이어에 적용하는 함수
 */
function applyItem(category, imagePath) {
    const layer = document.getElementById(`layer-${category}`);
    if (!layer) return;

    // 현재 입고 있는 이미지의 파일명(src)을 가져옴 (상대 경로 비교를 위해 decodeURIComponent 사용)
    const currentSrc = layer.getAttribute('src');

    // [핵심] 클릭한 아이템이 이미 적용되어 있다면 빈 문자열로 만들어 벗김
    if (currentSrc === imagePath) {
        layer.src = ""; 
    } else {
        // 아니라면 새로 입힘
        layer.src = imagePath;

        // 기존 규칙 유지: 원피스 입으면 상의하의 탈의
        if (category === 'dress') {
            document.getElementById('layer-cloth-1').src = "";
            document.getElementById('layer-cloth-2').src = "";
        } else if (category === 'cloth-1' || category === 'cloth-2') {
            document.getElementById('layer-dress').src = "";
        }
    }
}

/**
 * 초기 실행: 페이지가 로드되면 기본으로 'hair' 카테고리를 보여줌
 */
window.addEventListener('DOMContentLoaded', () => {
    changeCategory('hair');
});