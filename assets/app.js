// 미아전기(주) 홈페이지 공통 동작
(function () {
  const D = window.MIA_DATA || { categories: {}, products: [], news: [] };
  const CATS = D.categories;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const params = new URLSearchParams(location.search);
  const catName = code => CATS[code] || '기타';

  // 모바일 메뉴
  const btn = $('.menu-btn');
  if (btn) btn.onclick = () => $('.nav').classList.toggle('open');

  function productCard(p) {
    const img = p.imgs[0]
      ? `<img src="${p.imgs[0]}" alt="${esc(p.name)}" loading="lazy">`
      : '<span class="none">사진 준비중</span>';
    return `<a class="p-card" href="product.html?id=${p.id}">
      <div class="img">${img}</div>
      <div class="txt"><div class="tag">${esc(catName(p.cat))}${p.sub && p.sub !== catName(p.cat) ? ' · ' + esc(p.sub) : ''}</div><h3>${esc(p.name)}</h3></div>
    </a>`;
  }

  // 카테고리 대표 사진: 해당 분류에서 사진 있는 가장 최근 제품
  const coverOf = code => (D.products.find(p => p.cat === code && p.imgs.length) || {}).imgs?.[0] || '';

  /* ---------- 메인 ---------- */
  const heroCollage = $('#heroCollage');
  if (heroCollage) {
    heroCollage.innerHTML = ['GD02', 'GD03', 'GD05', 'GD01']
      .map(c => `<div><img src="${coverOf(c)}" alt="${esc(catName(c))}"></div>`).join('');
  }
  const catBox = $('#catCards');
  if (catBox) {
    catBox.innerHTML = Object.keys(CATS).map(code => {
      const n = D.products.filter(p => p.cat === code).length;
      return `<a class="cat-card" href="products.html?cat=${code}">
        <div class="img"><img src="${coverOf(code)}" alt="${esc(CATS[code])}" loading="lazy"></div>
        <div class="txt"><h3>${esc(CATS[code])}</h3><span>제품 ${n}종</span></div>
      </a>`;
    }).join('');
  }
  const latest = $('#latestProducts');
  if (latest) {
    latest.innerHTML = D.products.filter(p => p.imgs.length && p.cat !== 'GD00').slice(0, 8).map(productCard).join('');
  }
  const newsMini = $('#newsMini');
  if (newsMini) {
    newsMini.innerHTML = D.news.slice(0, 6).map(n =>
      `<a href="news.html?id=${n.id}"><span class="t">[${esc(n.board)}] ${esc(n.title)}</span><span class="d">${esc(n.date)}</span></a>`).join('');
  }
  const stat = $('#statProducts');
  if (stat) stat.textContent = D.products.length + '+';

  /* ---------- 제품 목록 ---------- */
  const list = $('#productList');
  if (list) {
    let cat = params.get('cat') || 'ALL';
    let q = params.get('q') || '';
    let shown = 24;
    const tabs = $('#catTabs');
    const input = $('#q');
    input.value = q;

    const codes = ['ALL', ...Object.keys(CATS), 'GD00'];
    const label = c => c === 'ALL' ? '전체' : c === 'GD00' ? '기타' : CATS[c];
    const countOf = c => c === 'ALL' ? D.products.length : D.products.filter(p => p.cat === c).length;
    tabs.innerHTML = codes.filter(c => countOf(c)).map(c =>
      `<button data-c="${c}">${label(c)}<small>${countOf(c)}</small></button>`).join('');

    function render() {
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === cat));
      const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const items = D.products.filter(p =>
        (cat === 'ALL' || p.cat === cat) &&
        words.every(w => (p.name + ' ' + p.text + ' ' + p.sub).toLowerCase().includes(w)));
      $('#resultCount').textContent = `${label(cat)} · ${items.length}개 제품${q ? ` · "${q}" 검색` : ''}`;
      list.innerHTML = items.length
        ? items.slice(0, shown).map(productCard).join('')
        : '<p class="empty">찾는 제품이 없습니다. 다른 검색어로 찾아보세요.</p>';
      $('#moreBtn').style.display = items.length > shown ? '' : 'none';
      const u = new URL(location);
      cat === 'ALL' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat);
      q ? u.searchParams.set('q', q) : u.searchParams.delete('q');
      history.replaceState(null, '', u);
    }
    tabs.onclick = e => { const b = e.target.closest('button'); if (b) { cat = b.dataset.c; shown = 24; render(); } };
    input.oninput = () => { q = input.value; shown = 24; render(); };
    $('#moreBtn').onclick = () => { shown += 24; render(); };
    render();
  }

  /* ---------- 제품 상세 ---------- */
  const detail = $('#productDetail');
  if (detail) {
    const p = D.products.find(x => String(x.id) === params.get('id'));
    if (!p) {
      detail.innerHTML = '<p class="empty">제품을 찾을 수 없습니다. <a href="products.html"><u>제품 목록으로</u></a></p>';
    } else {
      document.title = `${p.name} | 미아전기(주)`;
      $('#crumbCat').innerHTML = `<a href="products.html?cat=${p.cat}">${esc(catName(p.cat))}</a>`;
      const imgs = p.imgs.length ? p.imgs : [];
      detail.innerHTML = `
        <div class="detail">
          <div class="gallery">
            <div class="main">${imgs[0] ? `<img id="mainImg" src="${imgs[0]}" alt="${esc(p.name)}">` : '<span class="none">사진 준비중</span>'}</div>
            ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<button class="${i ? '' : 'on'}" data-src="${s}"><img src="${s}" alt=""></button>`).join('')}</div>` : ''}
          </div>
          <div class="info">
            <div class="eyebrow">${esc(catName(p.cat))}${p.sub && p.sub !== catName(p.cat) ? ' · ' + esc(p.sub) : ''}</div>
            <h1>${esc(p.name)}</h1>
            ${p.text ? `<div class="desc">${esc(p.text)}</div>` : '<div class="desc">자세한 사양과 가격은 전화로 문의해 주세요.</div>'}
            <div class="actions">
              <a class="btn amber" href="tel:043-733-5750">📞 제품 문의 043-733-5750</a>
              <a class="btn" href="products.html?cat=${p.cat}">같은 분류 제품 보기</a>
            </div>
          </div>
        </div>
        ${p.details.length ? `<div class="detail-imgs"><h2>상세 정보</h2>${p.details.map(s => `<img src="${s}" alt="${esc(p.name)} 상세" loading="lazy">`).join('')}</div>` : ''}`;
      const thumbs = detail.querySelector('.thumbs');
      if (thumbs) thumbs.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        $('#mainImg').src = b.dataset.src;
        thumbs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      };
      const related = $('#related');
      if (related) related.innerHTML = D.products.filter(x => x.cat === p.cat && x.id !== p.id && x.imgs.length).slice(0, 4).map(productCard).join('');
    }
  }

  /* ---------- 소식 ---------- */
  const newsList = $('#newsList');
  if (newsList) {
    let board = '전체';
    const tabs = $('#newsTabs');
    tabs.innerHTML = ['전체', '공지사항', '정보'].map(b => `<button data-b="${b}">${b}</button>`).join('');
    function render() {
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.b === board));
      const items = D.news.filter(n => board === '전체' || n.board === board);
      newsList.innerHTML = items.map(n => `
        <div class="news-item" id="n${n.id}">
          <button><span class="badge ${n.board === '정보' ? 'info' : ''}">${esc(n.board)}</span><span class="t">${esc(n.title)}</span><span class="d">${esc(n.date)}</span></button>
          <div class="news-body">
            ${n.text ? `<div class="txt">${esc(n.text)}</div>` : ''}
            ${n.imgs.map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}
            ${n.files.length ? `<div class="files">${n.files.map(f => `<a href="${f.url}" download>📎 ${esc(f.name)}</a>`).join('')}</div>` : ''}
          </div>
        </div>`).join('');
    }
    tabs.onclick = e => { const b = e.target.closest('button'); if (b) { board = b.dataset.b; render(); } };
    newsList.onclick = e => { const b = e.target.closest('.news-item > button'); if (b) b.parentElement.classList.toggle('open'); };
    render();
    const open = params.get('id') && document.getElementById('n' + params.get('id'));
    if (open) { open.classList.add('open'); open.scrollIntoView({ block: 'center' }); }
  }
})();
