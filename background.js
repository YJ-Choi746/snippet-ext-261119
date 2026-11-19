// 내 문장 모음 - 백그라운드(서비스 워커)
// 역할: 우클릭 메뉴를 만들고, 메뉴를 누르면 문장/이미지 주소를 chrome.storage.local에 저장한다.
//       툴바 아이콘을 직접 그리고(아이콘 파일 없이), 저장 결과를 배지로 알려 준다.
// 바깥 서버로는 아무것도 보내지 않는다. 주제 추천은 팝업(popup.js)이 연다.

const MAX_ITEMS = 50;
const NEAR_FULL = 45;
const COLOR_NEAR = "#c2410c"; // 주황: 거의 참
const COLOR_FULL = "#b42318"; // 빨강: 가득 참
// 색상 테마별 저장 배지 색 (popup.js 의 THEMES.accent 와 같음)
const THEME_ACCENT = { lemon: "#7a5d1e", mint: "#2f6b4b", sky: "#2f5c8a", lavender: "#5b4596", peach: "#97462f" };

// ---------- 설치·시작 ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "save-text", title: '“ 내 문장 모음에 저장: "%s"', contexts: ["selection"] });
    chrome.contextMenus.create({ id: "save-image", title: "“ 내 문장 모음에 이미지 저장", contexts: ["image"] });
  });
  drawIcon();
});
chrome.runtime.onStartup.addListener(drawIcon);

// 툴바 아이콘: 진한 갈색 사각형 + 따옴표 (시안 B)
function drawIcon() {
  try {
    const imageData = {};
    for (const size of [16, 32]) {
      const c = new OffscreenCanvas(size, size);
      const g = c.getContext("2d");
      const r = size * 0.18;
      g.fillStyle = "#2f271d";
      g.beginPath(); g.roundRect(0, 0, size, size, r); g.fill();
      g.fillStyle = "#fbf7ef";
      g.font = `bold ${Math.round(size * 0.95)}px Georgia, serif`;
      g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.fillText("“", size / 2, size * 0.98);
      imageData[size] = g.getImageData(0, 0, size, size);
    }
    chrome.action.setIcon({ imageData });
    return true;
  } catch (e) {
    console.warn("아이콘을 그리지 못했어요", e);
    return false;
  }
}

// ---------- 우클릭 메뉴 ----------
chrome.contextMenus.onClicked.addListener((info) => { handleMenuClick(info); });

// 테스트에서도 직접 부를 수 있게 함수로 분리. 결과를 문자열로 돌려준다.
async function handleMenuClick(info) {
  let item = null;
  if (info.menuItemId === "save-text" && info.selectionText) {
    const text = info.selectionText.trim();
    if (text) item = { type: "text", content: text };
  } else if (info.menuItemId === "save-image" && info.srcUrl) {
    item = { type: "image", content: info.srcUrl };
  }
  if (!item) return "ignored";

  const { clips = [], theme = "lemon" } = await chrome.storage.local.get(["clips", "theme"]);
  const accent = THEME_ACCENT[theme] || THEME_ACCENT.lemon;

  if (clips.length >= MAX_ITEMS) {          // 50개가 가득 차면 저장하지 않음
    flashBadge("FULL", COLOR_FULL);
    return "full";
  }
  if (clips.some((c) => c.type === item.type && c.content === item.content)) {   // 중복
    flashBadge("✓", accent);
    return "duplicate";
  }

  item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  item.pageUrl = info.pageUrl || "";
  item.savedAt = Date.now();
  item.memo = "";
  item.topic = null;        // 팝업을 열면 주제를 추천해 채움
  item.topicAuto = true;

  clips.unshift(item);      // 최신 항목을 맨 위에
  await chrome.storage.local.set({ clips });
  flashBadge(String(clips.length), clips.length >= NEAR_FULL ? COLOR_NEAR : accent);
  return "saved:" + clips.length;
}

// 툴바 아이콘에 2초 동안 배지 표시 (권한 필요 없음)
let badgeTimer = 0;
function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeTextColor?.({ color: "#ffffff" });
  chrome.action.setBadgeText({ text });
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
}
