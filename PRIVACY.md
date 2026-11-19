# 개인정보처리방침 — 내 문장 모음 (크롬 확장 프로그램)

시행일: 2026년 11월 19일

‘내 문장 모음’(이하 “확장 프로그램”)은 사용자가 웹페이지에서 직접 고른 문장과 그림을 모아 두었다가 다시 복사해 쓰게 해 주는 개인 스크랩 도구입니다. 이 방침은 확장 프로그램이 어떤 정보를 어디에 어떻게 다루는지 설명합니다.

## 1. 한눈에 보기
- 사용자가 저장한 내용은 **사용자의 크롬 안에만** 보관됩니다.
- 확장 프로그램은 어떤 정보도 **개발자나 다른 서버로 보내지 않습니다.**
- 회원가입·로그인이 없고, 광고·분석 도구·쿠키를 쓰지 않습니다.
- 웹사이트 내용을 읽는 권한을 쓰지 않습니다.

## 2. 다루는 정보
사용자가 우클릭 메뉴에서 ‘저장’을 눌렀을 때만 아래 정보가 만들어집니다.

| 정보 | 언제 생기나요 | 어디에 보관되나요 |
|---|---|---|
| 선택한 문장 | 문장을 드래그하고 ‘내 문장 모음에 저장’을 누를 때 | 사용자 기기의 `chrome.storage.local` |
| 그림 주소(URL) | 그림 위에서 ‘이미지 저장’을 누를 때 (그림 파일 자체는 저장하지 않음) | 같은 곳 |
| 가져온 페이지 주소와 저장 시각 | 저장할 때 함께 | 같은 곳 |
| 사용자가 쓴 메모, 주제, 서식, 그림 자르기 설정, 카드 순서 | 사용자가 편집할 때 | 같은 곳 |
| 색상 테마, 주제 추천을 위해 사용자가 고친 주제에서 배운 단어 | 사용자가 바꾸거나 고칠 때 | 같은 곳 |

이 정보는 확장 프로그램의 기능(카드 보기·복사·검색·정리)에만 쓰입니다.

## 3. 보내거나 공유하지 않습니다
- 확장 프로그램은 위 정보를 인터넷으로 전송하지 않으며, 제3자에게 판매·제공하지 않습니다.
- 주제 추천은 사용자 기기 안에서만 계산합니다.
- 크롬 동기화(`chrome.storage.sync`)를 쓰지 않으므로 다른 기기로도 옮겨지지 않습니다.

## 4. 그림 미리보기에 대해
저장한 그림 카드를 팝업에서 보여 줄 때, 브라우저가 그 그림이 원래 있던 웹사이트에서 그림을 불러옵니다. 이때 해당 웹사이트는 그림이 요청되었다는 사실(일반적인 웹 접속 정보)을 알 수 있습니다. 확장 프로그램은 이 요청에 사용자가 저장한 다른 정보를 담아 보내지 않으며, 이전 페이지 정보를 보내지 않도록 설정되어 있습니다(`no-referrer`).

## 5. 사용하는 권한
| 권한 | 쓰는 이유 |
|---|---|
| `contextMenus` | 우클릭 메뉴에 ‘내 문장 모음에 저장’과 ‘이미지 저장’을 넣기 위해 |
| `storage` | 저장한 카드와 설정을 사용자 기기 안에 보관하기 위해 |

웹사이트 내용을 읽는 권한(호스트 권한, 콘텐츠 스크립트), 방문 기록·탭·다운로드 권한은 쓰지 않습니다.

## 6. 사용자가 할 수 있는 일
- **지우기:** 팝업에서 카드의 ✕ 또는 ‘모두 지우기’로 언제든 지울 수 있습니다.
- **내보내기:** ‘⤓ 백업’으로 내 카드를 파일로 받아 둘 수 있습니다. 이 파일은 사용자 컴퓨터에만 저장됩니다.
- **완전히 삭제:** 확장 프로그램을 삭제하면 크롬 안에 저장된 모든 정보가 함께 지워집니다.

## 7. 어린이의 개인정보
확장 프로그램은 누구의 개인정보도 모으지 않으며, 어린이를 대상으로 정보를 모으지 않습니다.

## 8. 방침의 변경
방침이 바뀌면 이 문서를 고치고 위의 시행일을 바꿉니다. 바뀐 내용은 이 저장소의 기록(커밋)에서 확인할 수 있습니다.

## 9. 문의
개인정보와 관련한 문의는 이 저장소의 [Issues](https://github.com/YJ-Choi746/snippet-ext-261119/issues)에 남겨 주세요.

---

## Privacy Policy (English summary)
Effective: November 19, 2026

- **What is stored:** only what the user explicitly saves via the right-click menu — selected text, image addresses (not the image files), the source page address and time, plus the user's own notes, topics, formatting, crop settings, order, color theme, and topic corrections.
- **Where:** locally in the user's browser (`chrome.storage.local`). Not synced.
- **Sharing:** nothing is transmitted to the developer or any third party, sold, or used for advertising or analytics. No accounts, cookies, or tracking.
- **Image previews:** when showing a saved image card, the browser loads the image from its original website, which may see a normal web request for that image (sent with `no-referrer`).
- **Permissions:** `contextMenus` (the "Save" items in the right-click menu) and `storage` (local storage). No host permissions or content scripts; the extension does not read page content.
- **Your control:** delete any card or all cards in the popup, export a backup file, or uninstall the extension to remove all stored data.
- **Contact:** please open an issue at https://github.com/YJ-Choi746/snippet-ext-261119/issues
