<div align="center">

# ☁ GMST CLOUD

### 공주마이스터고 클라우드컴퓨팅 전공심화동아리 · 기능반

**컴퓨터를 사는 시대에서, 빌리는 시대로.**

동아리 소개용 원페이지 사이트 — WebGL급 캔버스 파티클 히어로, 스크롤 시네마,
인터랙티브 커리큘럼/진로/수상 섹션. 빌드 과정 없는 순수 정적 사이트.

</div>

---

## 실행 (로컬 미리보기)

정적 사이트라 아무 정적 서버로 열면 됩니다. 예:

```bash
# Node (의존성 설치 없이)
npx serve .        # 또는
python -m http.server 5500
```

브라우저에서 해당 주소로 접속. (파일을 `file://`로 바로 열면 `fetch`가 막혀
데이터 섹션이 비어 보일 수 있으니 반드시 서버로 여세요.)

## 배포 (Vercel)

1. 이 폴더를 GitHub에 올리기
2. [vercel.com](https://vercel.com) → New Project → 저장소 선택
3. Framework = **Other**, 빌드 명령 없음, 출력 디렉터리 = 루트 → Deploy

정적 파일만 올라가므로 1분 안에 라이브됩니다.

## 구조

```
gmst/
├── index.html
├── styles/      reset · variables · main · animations · responsive
├── scripts/     main · hero(캔버스 파티클) · scroll(리빌/스플릿/GSAP)
├── data/        apps · careers · curriculum  (내용은 여기서 수정)
├── assets/      favicon · og
└── manifest.webmanifest
```

## 내용 수정 포인트 (검토용)

- **문구**: `index.html`의 각 섹션 텍스트
- **일상 서비스 / 진로 / 커리큘럼 카드**: `data/*.json` 만 고치면 자동 반영
- **수상·혜택 수치**: `index.html`의 `data-count` 값 (현재는 예시 placeholder)

> 수치·문구는 예시이며 검토 후 확정 예정입니다. 디자인·인터랙션 중심으로 제작되었습니다.
