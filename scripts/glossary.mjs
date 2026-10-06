// GMST Cloud — glossary tooltips.
// Marks jargon with a dotted underline and shows a plain-Korean definition on
// hover / focus / tap. Auto-enhances career & curriculum tags too, so a
// first-time audience can decode every technical word on screen.

const DICT = {
  '클라우드': '인터넷을 통해 빌려 쓰는 컴퓨터 자원. 내 컴퓨터가 아니라 남의 거대한 컴퓨터를 잠깐 빌리는 거예요.',
  '서버': '다른 컴퓨터들의 요청을 받아 처리해 주는 "중앙 컴퓨터". 식당의 주방 같은 역할이에요.',
  '데이터센터': '서버 수천~수만 대를 모아둔 거대한 건물. 클라우드의 "본체"입니다.',
  '트래픽': '서비스에 몰리는 접속·데이터의 양. 도로에 차가 몰리는 것과 비슷해요.',
  '인프라': '서비스를 돌리기 위한 밑바탕 설비(서버·네트워크 등). 건물의 "기초공사".',
  '배포': '내가 만든 프로그램을 사용자가 쓸 수 있게 서버에 올려 공개하는 일.',
  '서비스 배포': '내가 만든 프로그램을 사용자가 쓸 수 있게 서버에 올려 공개하는 일.',
  'AWS': '아마존이 운영하는 세계 1위 클라우드 서비스(Amazon Web Services).',
  'AWS 입문': '세계 1위 클라우드 서비스 AWS의 기본 기능을 배우는 단계.',
  'AWS 자격증': 'AWS 실력을 공식 인증하는 시험. 취업·진학에 유리해요.',
  'DevOps': '개발(Dev)과 운영(Ops)을 합친 말. 만들고-배포하고-운영하는 과정을 자동화해 빠르게 반복하는 방식.',
  'CI/CD': '코드를 저장하면 자동으로 검사·배포까지 이어지는 "자동화 컨베이어벨트".',
  '컨테이너': '프로그램과 실행환경을 통째로 담은 "도시락". 어디서든 똑같이 실행돼요.',
  '제로트러스트': '"아무도 기본적으로 믿지 않는다"는 보안 원칙. 접속할 때마다 신원을 확인해요.',
  '데이터 파이프라인': '데이터를 모으고 → 정리하고 → 쓸 수 있게 흘려보내는 "수도관".',
  '모니터링': '서비스가 잘 돌아가는지 실시간으로 지켜보는 일.',
  '리눅스': '서버에서 가장 많이 쓰는 운영체제(OS).',
  '접근제어': '누가 어디까지 볼 수 있는지 권한을 정하는 것.',
  '빅데이터': '사람이 손으로 다루기엔 너무 큰 규모의 데이터.',
  '분석': '데이터에서 의미 있는 패턴을 찾아내는 일.',
  '취약점 진단': '해킹당할 수 있는 약점을 미리 찾아 고치는 점검.',
  '네트워크': '컴퓨터들이 서로 데이터를 주고받는 "연결망".',
  '네트워크 기초': '컴퓨터들이 데이터를 주고받는 원리를 배우는 첫 단계.',
  '자동화': '사람이 반복하던 일을 기계가 알아서 하게 만드는 것.',
  'DB': '데이터베이스 — 데이터를 체계적으로 저장·관리하는 창고.',
  '포트폴리오': '내가 만든 결과물을 모아 실력을 보여주는 모음집.',
};

export function initGlossary() {
  // one shared tooltip element
  const pop = document.createElement('div');
  pop.className = 'gloss-pop';
  pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);

  const keyOf = (el) => el.dataset.k || el.textContent.trim();
  const defOf = (el) => DICT[keyOf(el)];

  // auto-enhance tag-like elements whose text exactly matches a term
  document.querySelectorAll('.ccard__tags span, .tl__body li').forEach((el) => {
    const t = el.textContent.trim();
    if (DICT[t]) { el.classList.add('term'); el.tabIndex = 0; }
  });
  // prepare any manually-marked terms
  document.querySelectorAll('.term').forEach((el) => {
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.setAttribute('aria-label', (el.dataset.k || el.textContent.trim()) + ' 뜻 보기');
  });

  let current = null;
  function show(el) {
    const def = defOf(el);
    if (!def) return;
    current = el;
    pop.innerHTML = `<b>${keyOf(el)}</b>${def}`;
    pop.classList.add('show');
    position(el);
  }
  function position(el) {
    const r = el.getBoundingClientRect();
    // measure
    pop.style.left = '0px'; pop.style.top = '0px';
    const pr = pop.getBoundingClientRect();
    let left = r.left + r.width / 2 - pr.width / 2;
    left = Math.max(12, Math.min(left, innerWidth - pr.width - 12));
    let top = r.top - pr.height - 10;
    if (top < 12) top = r.bottom + 10; // flip below if no room above
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }
  function hide() { current = null; pop.classList.remove('show'); }

  // delegation (works for dynamically added terms)
  document.addEventListener('pointerover', (e) => { const t = e.target.closest?.('.term'); if (t) show(t); });
  document.addEventListener('pointerout', (e) => { const t = e.target.closest?.('.term'); if (t && t === current) hide(); });
  document.addEventListener('focusin', (e) => { const t = e.target.closest?.('.term'); if (t) show(t); });
  document.addEventListener('focusout', (e) => { const t = e.target.closest?.('.term'); if (t && t === current) hide(); });
  // touch: tap toggles
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('.term');
    if (!t) { if (current) hide(); return; }
    if (t === current) hide(); else show(t);
  });
  addEventListener('scroll', () => { if (current) position(current); }, { passive: true });
  addEventListener('resize', () => { if (current) position(current); });
}

export default initGlossary;
