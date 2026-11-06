'use strict';
const T = Tonari;
const $ = selector => document.querySelector(selector);
const app = $('#app');
const shell = $('#shell');
const dlg = $('#dialog');
const cover = $('#cover');
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blankDraft = () => ({situation:'',method:'',fields:[],values:{}});
const state = {records:[], requests:[], step:1, draft:blankDraft(), active:null, edit:null, signs:[], buzzer:false, reportTo:'警察',
  sosLog:[], walkOrigin:T.walkOrigins[0], walkKind:'shop'};
const methods = ['友人/家族と合流','タクシー移動','警備会社への同行相談','安全地点で待機','学校/職場に共有'];
const situations = ['帰り道に不安・違和感がある','つきまとい・待ち伏せがある','脅し・接近など、切迫した危険がある','うまく説明できない・その他'];
const stages = ['状況','支援方法','共有範囲','内容確認'];
const sections = {home:'ホーム',menu:'その他のメニュー',support:'帰宅サポート',emergency:'緊急案内',sos:'SOSデモ',help:'個別に助けを求める',places:'近くの待機先',soslog:'SOSの操作履歴',status:'依頼状況',staff:'支援担当デモ',records:'被害記録',record:'記録の入力',report:'相談レポート',risk:'状況の整理'};
const icons = {
  home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
  support:'<circle cx="8.3" cy="8.2" r="3.3"/><path d="M2.5 20v-1.5a5.8 5.8 0 0 1 11.6 0V20M15 5.3a3.25 3.25 0 1 1 0 6.4m1.2 2.7a5.6 5.6 0 0 1 5.3 5.6"/>',
  menu:'<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/>',
  emergency:'<path d="m12 3 9.7 16.6a.9.9 0 0 1-.8 1.4H3.1a.9.9 0 0 1-.8-1.4L12 3Z"/><path d="M12 8v5.2m0 3.6v.2"/>',
  status:'<circle cx="12" cy="12" r="9"/><path d="M12 6.6v5.6l3.6 2.2"/>',
  records:'<path d="M5 4h10m-10 0v16h14v-8M8 16h4m-2.2-3.4 1.2-3.3 7.4-7.1 2.1 2.1-7.3 7.2-3.4 1.1Z"/>',
  report:'<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8m-8 4h6"/>',
  risk:'<path d="M4 4h16v12H9l-5 4V4Z"/><path d="M9.5 8.3a2.5 2.5 0 0 1 5 .1c0 1.4-2.5 1.6-2.5 3m0 2.1v.1"/>',
  staff:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V3h6v3M3 12h18m-11 0v2h4v-2"/>',
  arrow:'<path d="m9 5.5 6.5 6.5L9 18.5"/>',
  next:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back:'<path d="M19 12H4m6-6-6 6 6 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m3 0h2"/>',
  stack:'<rect x="4" y="6" width="16" height="14" rx="1.5"/><path d="M7 3h10M8 11h8m-8 4h5"/>',
  person:'<circle cx="12" cy="7.5" r="3.2"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  phone:'<path d="m7 3 3 5-2.5 2.2c1.3 2.9 3.4 5.1 6.2 6.3L16 14l5 3c-.4 3.5-2.2 4.6-5.6 3.7A18.4 18.4 0 0 1 3.3 8.6C2.4 5.2 3.5 3.4 7 3Z"/>',
  sound:'<path d="M3 10h4l5-5v14l-5-5H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  check:'<path d="m5 12 4.5 4.5L19 7"/>',
  list:'<path d="M8 6h12M8 12h12M8 18h12m-16-12h.5m-.5 6h.5m-.5 6h.5"/>',
  file:'<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7m-7 4h5"/>',
  guide:'<path d="M3 5c4-1 6-.5 9 1.2C15 4.5 17 4 21 5v14c-4-1-6-.5-9 1.2C9 18.5 7 18 3 19zM12 6.2v14"/>'
};
function ico(name) {
  return `<svg class="ico" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]||''}</svg>`;
}
const button=(label,action,cls='primary',attrs='')=>`<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const link=(label,route,cls='secondary')=>`<a href="#${route}" class="${cls}">${label}</a>`;
const stamp=()=> crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const current=()=>state.requests.find(r=>r.id===state.active)||state.requests.at(-1);
const activeSos=()=>state.sosLog.at(-1)?.endedAt ? null : state.sosLog.at(-1);
const buzzerIsOn=()=>activeSos()?.buzzerOn ?? state.buzzer;
const optional='<span class="field-tag">任意</span>';
const required='<span class="field-tag required">必須</span>';
const notice=(text,kind='info')=>`<div class="notice ${kind}">${ico(kind==='warning'?'emergency':'info')}<p>${text}</p></div>`;
const rows=(pairs,cls='')=>`<dl class="data-rows ${cls}">${pairs.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'未記入')}</dd></div>`).join('')}</dl>`;
const title=(label,sub='')=>`<div class="page-title"><div><h1>${label}</h1>${sub?`<p>${sub}</p>`:''}</div></div>`;
const empty=(icon,h,p,action='')=>`<section class="panel empty"><span class="empty-icon">${ico(icon)}</span><h2>${h}</h2><p>${p}</p>${action}</section>`;
function nav(route) {
  const navigation=$('#nav');
  navigation.hidden=route==='home';
  shell.classList.toggle('on-home',navigation.hidden);
  const tab=(key,label)=>`<a href="#${key}" class="nav-item" ${key===route?'aria-current="page"':''}>${ico(key)}<span>${label}</span></a>`;
  navigation.innerHTML=`<div class="nav-inner">${tab('home','ホーム')}
    ${button(ico('emergency')+'<span>いま危ない</span>','start-sos','nav-item nav-emergency',route==='sos'?'aria-current="page"':'')}
    ${tab('menu','メニュー')}</div>`;
}
function render() {
  const hash=location.hash.slice(1);
  const route=Object.hasOwn(sections,hash)?hash:'home';
  nav(route);
  if(route!=='emergency') state.buzzer=false;
  app.dataset.route=route;
  app.innerHTML=({home,menu,emergency,sos,help,places,soslog,support,status,staff,records,record:recordForm,report:reportPage,risk:riskPage})[route]();
  if(cover.hidden) {
    document.title=`${sections[route]}｜となり（体験版）`;
    app.focus({preventScroll:true}); window.scrollTo(0,0);
  }
}
function go(route) {
  if(location.hash==='#'+route) render(); else location.hash=route;
}
function toast(text) {
  const out=$('#toast');
  out.textContent=text; out.hidden=false;
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>{out.hidden=true;},4200);
}
function modal(label,html) {
  $('#dialog-title').textContent=label;
  $('#dialog-content').innerHTML=html;
  dlg.showModal();
}
function guide() {
  modal('体験版と情報の取り扱い',`<p>「となり」は、ひとりで帰るのが不安なときの選択肢と、相談の準備を確認できる体験版です。</p>
    <ul class="plain-list"><li><b>いま危ない</b>　無音のブザー、110番の案内、架空の位置記録、友人への通知文を1回で準備します。実際の緊急通報はご自身の電話から110番へ。</li>
    <li><b>個別に助けを求める</b>　友人・家族への文面や、近くの人に見せる言葉を選べます。</li>
    <li><b>近くの待機先を探す</b>　架空の地図で交番・24時間営業の店への徒歩経路を確認します。</li>
    <li><b>帰宅サポートを使う</b>　合流・タクシー・同行相談・待機などを選び、デモの依頼を作れます。</li>
    <li><b>記録する</b>　起きたことを入力し、警察・弁護士・学校・職場に相談するためのレポートを作れます。</li></ul>
    ${rows([['利用目的','架空の情報での操作体験'],['入力の保存先','開いているタブ内。再読み込み・終了で消去'],['担当画面','同じタブ内のデモ画面。実際の担当者への通知なし'],['外部連携','通報・配車・同行手配・位置情報送信は行いません']])}
    <h3>知っておいていただきたいこと</h3>
    <ul class="plain-list"><li>この体験版に実在する個人情報は入力しないでください。カメラ・マイク・位置情報は使用しません。</li><li>「画面を隠す」は表示だけを切り替えます。履歴や入力内容は消えません。</li><li>自分で書き出したレポートや印刷物は、タブを閉じても残ります。</li></ul>`);
}
function home() {
  const action = (icon, label, detail) =>
    `<span class="action-icon">${ico(icon)}</span>
     <span class="action-label"><strong>${label}</strong><small>${detail}</small></span>
     ${ico('arrow')}`;
  return `<h1 class="home-heading">帰り道が不安なときに</h1>
    <div class="home-actions">
      ${button(action('sound','いま危ない <span class="sos-tag">一括SOSデモ</span>',activeSos()?'進行中のSOSデモを表示':'ブザー・110番・位置記録・友人通知'),'start-sos','home-action action-urgent')}
      ${link(action('support','個別に助けを求める','友人・家族や、近くにいる人へ'),'help','home-action action-support')}
      ${link(action('pin','近くの待機先を探す','交番・24時間営業の店への経路デモ'),'places','home-action action-places')}
    </div>
    <p class="home-demo">${ico('info')}<span>発信・送信はしません。緊急時は電話で110番へ。</span></p>
    <div class="home-more home-shortcuts">${link(ico('support')+' 帰宅サポートを使う','support','more-link')}
      ${button(ico('records')+' 記録する','new-record','more-link')}
      ${link(ico('menu')+' その他のメニュー','menu','more-link')}</div>`;
}
function menu() {
  const row = (icon, label, detail) =>
    `<span class="line-icon">${ico(icon)}</span><span><b>${label}</b><small>${detail}</small></span>${ico('arrow')}`;
  return `${title('その他のメニュー')}
    <div class="menu-groups">
      <section><h2 class="section-title">依頼と記録</h2><div class="menu-panel">
        ${link(row('pin','SOSの操作履歴を見る','デモの時刻・架空の地点'),'soslog','menu-line')}
        ${link(row('status','依頼状況を見る','デモ依頼の進み具合・共有内容'),'status','menu-line')}
        ${link(row('records','記録一覧を見る','記録を見返す・編集する'),'records','menu-line')}
      </div></section>
      <section><h2 class="section-title">相談の準備</h2><div class="menu-panel">
        ${link(row('risk','気になる状況を整理','状況に応じた行動の目安を確認'),'risk','menu-line')}
        ${link(row('report','相談レポートを作る','警察・弁護士・学校・職場への相談用'),'report','menu-line')}
      </div></section>
      <section><h2 class="section-title">体験版について</h2><div class="menu-panel">
        ${link(row('phone','個別の緊急操作','110番の案内・ブザー・共有デモ'),'emergency','menu-line')}
        ${button(row('guide','利用案内','このアプリでできること・情報の取り扱い'),'guide','menu-line')}
        ${link(row('staff','支援担当デモを開く','依頼の確認・ステータスの更新'),'staff','menu-line')}
      </div></section>
    </div>`;
}
function emergency() {
  const actionRow=(k,h,s,a)=>button(`<span class="line-icon">${ico(k)}</span><span><b>${h}</b><small>${s}</small></span>${ico('arrow')}`,a,'menu-line');
  return `${title('緊急案内','依頼や記録の入力を待つ必要はありません。')}
    <section class="panel emergency-lead"><div class="label danger-text">${ico('phone')} 緊急時の連絡</div>
      <h2>電話アプリから <span class="dial-number">110</span> 番へ</h2><p>この体験版からは発信できません。実際の緊急通報には、ご自身の電話をお使いください。</p>
      ${button(`110番の発信手順を見る ${ico('arrow')}`,'call','danger-btn')}</section>
    <div class="two-col"><section class="panel"><h2 class="panel-title">助けを求めて待機する</h2><p>無理に帰宅を続けず、駅の窓口や交番など、人に助けを求められる場所での待機を検討してください。</p><p class="muted">施設の営業・人員・受け入れ状況は確認していません。</p><div class="row">${link('近くの待機先を探す','places','secondary')}${link('待機・合流を相談する','support','secondary')}</div></section>
    <section><h2 class="section-title">緊急操作のデモ</h2><div class="menu-panel">${actionRow('person','緊急連絡先共有デモ','送信前の文面を確認','contact')}${actionRow('pin','現在地共有デモ','架空の場所を表示','location')}
      <div class="buzzer" id="buzzer-card">${button(`<span class="line-icon">${ico('sound')}</span><span><b id="buzzer-label">${buzzerIsOn()?'ブザー表示を停止':'防犯ブザー風デモを開始'}</b><small>無音・振動なしの動作表示</small></span>${ico('arrow')}`,'buzzer','menu-line',`aria-pressed="${buzzerIsOn()}"`)}<p id="buzzer-status" role="status" hidden></p></div></div></section></div>
    <div class="panel consultation-note"><h2 class="panel-title">緊急でない警察への相談</h2><p>警察相談専用電話 <b>#9110</b> または最寄りの警察署へ。<a href="https://www.npa.go.jp/goiken_index.html" target="_blank" rel="noopener noreferrer">警察庁の案内（外部サイト）</a></p></div>`;
}

function sos() {
  const event=state.sosLog.at(-1);
  if(!event) return title('SOSデモ')+empty('sound','開始するにはボタンを押してください',
    'ブザー・110番・架空の位置記録・友人への通知をまとめて試せます。',
    button('いま危ない · SOSデモを開始','start-sos','danger-btn'));
  const row=(icon,label,value,note,control='')=>`<li class="sos-row">
    <span class="line-icon">${ico(icon)}</span><div><h2>${label}</h2><p>${value}</p>
    <small>${note}</small>${control}</div></li>`;
  const buzzerText=event.buzzerOn?'無音のデモ表示中':'表示を停止しました';
  const toggle=event.endedAt?'':button(event.buzzerOn?'ブザー表示を停止':'ブザー表示を再開','buzzer','sos-small',`aria-pressed="${event.buzzerOn}"`);
  return `${title(event.endedAt?'SOSデモを終了しました':'SOSデモの操作結果','実際に通報する場合は、電話アプリから110番へ。')}
    <div class="sos-wrap"><ul class="panel sos-list">
      ${row('sound','防犯ブザー',`<span id="sos-buzzer-label" role="status">${buzzerText}</span>`,'音・振動は出ません。',toggle)}
      ${row('phone',esc(event.call.number)+'番通報',esc(event.call.status),'この画面からは発信しません。',button('110番のかけ方','call','sos-small'))}
      ${row('pin','位置の記録',`${esc(event.location.name)}（架空）`,`このタブに記録 · ${esc(event.location.time)}（日本時間）`)}
      ${row('person','友人への通知',esc(event.notification.status),`宛先：${esc(event.notification.recipient)}`,`<blockquote class="message-quote">${esc(event.notification.message)}</blockquote>`)}
    </ul>
    <div class="stack-buttons sos-next">${button('記録した地点の近くを探す','sos-places','primary')}
    ${link('個別に助けを求める','help','secondary')}
    ${event.endedAt?link('SOSの操作履歴を見る','soslog','secondary'):button('SOSデモを終了する','end-sos','quiet')}</div></div>`;
}
function soslog() {
  const heading=title('SOSの操作履歴','このタブでSOSを押した時刻と架空の地点です。再読み込みで消えます。');
  if(!state.sosLog.length) return heading+empty('pin','SOSの操作履歴はまだありません','ボタンを押したときだけ、このタブにデモの記録が残ります。',link('ホームへ','home','secondary'));
  return `${heading}<div class="sos-wrap">${[...state.sosLog].reverse().map(event=>`<article class="panel">
    <h2 class="panel-title">${esc(event.location.name)}（架空）</h2>
    ${rows([['開始（日本時間）',event.time],['終了（日本時間）',event.endedAt||'デモ進行中'],['110番・友人通知','未発信・未送信']])}
    ${!event.endedAt?link('進行中のSOSデモを見る','sos','text-link'):''}</article>`).join('')}</div>`;
}
function help() {
  const item=(icon,label,hint,action)=>button(`<span class="line-icon">${ico(icon)}</span>
    <span><b>${label}</b><small>${hint}</small></span>${ico('arrow')}`,action,'menu-line');
  return `${title('個別に助けを求める','今、使いたい方法をひとつ選んでください。')}
    <div class="sos-wrap"><div class="menu-panel">
      ${item('person','友人・家族への文面を用意','電話してほしい・合流したい','friend-help')}
      ${item('guide','近くの人・店員に画面を見せる','声を出しにくいときに','show-help')}
      ${item('phone','110番のかけ方','実際の緊急通報は電話アプリから','call')}
    </div><div class="stack-buttons sos-next">
    ${link('帰宅サポートを使う','support','secondary')}
    ${link('緊急案内・個別の操作デモへ','emergency','text-link')}</div></div>`;
}

function walkMap(route) {
  const nodes=T.walkNodes;
  const roads=T.walkStreets.map(([from,to])=>`M${nodes[from].x} ${nodes[from].y} L${nodes[to].x} ${nodes[to].y}`).join(' ');
  const stops=[route.origin,...route.segments.map(segment=>segment.to)];
  const path=stops.map(id=>`${nodes[id].x},${nodes[id].y}`).join(' ');
  const marker=(id,label,offset)=>`<g><circle class="map-stop" cx="${nodes[id].x}" cy="${nodes[id].y}" r="7"/>
    <text x="${nodes[id].x}" y="${nodes[id].y+offset}">${label}</text></g>`;
  return `<svg class="walk-map" viewBox="0 0 345 184" aria-hidden="true" focusable="false">
    <path class="map-road-edge" d="${roads}"/><path class="map-road" d="${roads}"/>
    <polyline class="map-route" points="${path}"/>
    ${marker(route.origin,'出発',23)}${marker(route.destination,'目的地',-13)}</svg>`;
}
function walkResult(route) {
  if(!route) return '<p class="notice">この条件の徒歩経路は見つかりませんでした。</p>';
  const name=id=>esc(T.walkNodes[id].name);
  const segmentItem=(segment,index)=>{
    const from=T.walkNodes[segment.from],to=T.walkNodes[segment.to];
    const direction=from.x===to.x ? (to.y<from.y?'北':'南') : (to.x<from.x?'西':'東');
    return `<li><b>${name(segment.to)}</b><span>${direction}へ ${segment.meters} m${index===route.segments.length-1?' · 目的地':''}</span></li>`;
  };
  return `<div class="walk-result-head"><div><div class="label">最寄りの候補（架空）</div><h2>${name(route.destination)}</h2></div>
    <span class="walk-distance">徒歩 <strong>${route.meters}</strong> m</span></div>
    <figure class="walk-figure">${walkMap(route)}<figcaption>架空の徒歩地図 · 上が北</figcaption></figure>
    <h3>最短の徒歩経路</h3><ol class="walk-steps"><li><b>${name(route.origin)}</b><span>出発</span></li>
      ${route.segments.map(segmentItem).join('')}</ol>`;
}
function places() {
  const route=T.nearestWalk(state.walkOrigin,state.walkKind);
  return `${title('近くの待機先を探す','架空の街の徒歩経路を試せます。実際の道案内には使えません。')}
    <div class="walk-layout"><section class="panel"><h2 class="panel-title">経路の条件</h2>
    <label class="field">出発地点（架空）<select id="walk-origin">${T.walkOrigins.map(id=>`<option value="${id}" ${id===state.walkOrigin?'selected':''}>${esc(T.walkNodes[id].name)}</option>`).join('')}</select></label>
    <fieldset class="walk-kind"><legend>探す場所</legend><div class="walk-options">${[['shop','24時間営業の店'],['police','交番']].map(([value,label])=>`<label class="choice"><input type="radio" name="walk-kind" value="${value}" ${value===state.walkKind?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>
    <p class="hint">距離と営業時間はデモの設定です。実在の店舗の営業状況・交番の在所状況・道の様子は確認していません。</p></section>
    <section class="panel" aria-label="徒歩経路"><div id="walk-result">${walkResult(route)}</div><span id="walk-announcement" class="sr-only" role="status"></span></section></div>`;
}
function stepRail() {
  return `<div class="step-rail"><div class="rail-heading">手続きの流れ</div><ol class="steps" aria-label="手続きの進捗">${stages.map((s,i)=>{
    const n=i+1,done=n<state.step;
    return `<li class="${n===state.step?'here':done?'done':''}" ${n===state.step?'aria-current="step"':''}><span class="step-number">${done?ico('check'):String(n).padStart(2,'0')}</span><span>${s}</span></li>`;
  }).join('')}</ol><p class="rail-foot">共有する情報は、依頼の作成前に確認・変更できます。</p></div>`;
}
function recordExcerpt(r) {
  return `<details class="record-excerpt"><summary>${esc((r.date||'日時不明').replace('T',' '))}　${esc(r.type||'種別未選択')}</summary>${rows([
    ['場所',r.place],['内容',r.content],['回数',r.count?`${r.count}回`:'不明'],['証拠メモ',r.evidence],['目撃者',r.witness],
    ...(Object.hasOwn(r,'person')?[['相手情報',r.person]]:[]),['本人が感じた危険度',T.levelText(r.level)]
  ])}</details>`;
}
function disclosureView(data) {
  const hidden=T.fields.filter(k=>!data.fields.includes(k));
  return `<div class="disclosure-result"><div class="subhead"><h3>表示する情報</h3><span class="tag">${data.fields.length} / ${T.fields.length} 項目</span></div>
    ${data.fields.length?rows(data.fields.map(k=>[k,k==='過去の記録'?`${data.sharedRecords.length}件（依頼作成時点）`:data.shared[k]])):'<p class="inset">任意の共有項目はありません。</p>'}
    ${data.sharedRecords.length?`<div class="excerpt-list"><p class="label">表示する記録の内訳</p>${data.sharedRecords.map(recordExcerpt).join('')}</div>`:''}
    ${hidden.length?`<p class="excluded"><b>選択していない項目</b>　${hidden.map(esc).join('、')}</p>`:''}</div>`;
}
function shareEditor(d) {
  const descriptions=['手入力した架空の場所','移動先として伝えたい場所','選択した状況と補足','依頼作成時点の記録のコピー','相手について伝えたいこと','デモ用の連絡先'];
  return `<div class="subhead"><span class="label">担当画面に表示する情報</span><span class="tag" id="share-count" aria-live="polite">${d.fields.length} / 6 項目</span></div>
    <p class="muted">すべて任意です。選ばなくても依頼を作成できます。</p>
    <div class="choice-list">${T.fields.map((k,i)=>{
      const selected=d.fields.includes(k);
      const more=k==='過去の記録'
        ? `<p class="share-extra" id="share-${i}" ${selected?'':'hidden'}>全${state.records.length}件の内容・証拠メモ・目撃者などをコピーします。記録の「相手情報」欄は「相手情報」も選んだ場合にのみ含まれます。自由記述内の名前などはそのままです。次の画面で内容を確認できます。</p>`
        : `<label class="field share-extra" id="share-${i}" ${selected?'':'hidden'}>${k==='相談理由'?'選択した状況への補足':k+'の入力'} ${optional}<input name="value${i}" maxlength="500" value="${esc(d.values[k]||'')}" placeholder="架空の情報を入力"></label>`;
      return `<div class="share-row"><label class="choice"><input type="checkbox" name="share" value="${k}" aria-controls="share-${i}" ${selected?'checked':''}><span><b>${k}</b><small>${descriptions[i]}</small></span></label>${more}</div>`;
    }).join('')}</div>`;
}
function support() {
  const d=state.draft,step=state.step;
  const question=['いまの状況を選んでください','希望する支援を選んでください','共有する範囲を選んでください','依頼内容をご確認ください'][step-1];
  const radios=(name,options,value)=>`<div class="choice-list">${options.map(x=>`<label class="choice"><input name="${name}" type="radio" required value="${esc(x)}" ${x===value?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div>`;
  let contents='';
  if(step===1) contents=`<p class="muted">近いものを1つ選んでください。うまく説明できない場合も進めます。</p>${radios('situation',situations,d.situation)}<p class="hint">切迫した危険を感じる場合は、<a href="#emergency">緊急案内</a>を先に開けます。</p>`;
  if(step===2) contents=`<p class="muted">この体験版では、実際の連絡や手配は行いません。</p>${radios('method',methods,d.method)}`;
  if(step===3) contents=shareEditor(d);
  if(step===4) contents=`<p class="muted">以下が、このタブ内の支援担当デモに表示される内容です。</p>
    ${rows([['支援方法',d.method],['表示先','支援担当デモ（このタブ内）'],['外部への送信','なし']])}
    ${disclosureView(T.disclosure(d,state.records))}
    <p class="hint">作成時に照会番号・作成日時・ステータスが付きます。作成済みの明細はあとから変更できません。</p>`;
  return `${title('帰宅サポート','合流・移動・待機の希望を選び、デモ依頼を作成します。')}
    <div class="wizard-layout">${stepRail()}<form id="support-form" class="panel form-panel" autocomplete="off">
    <fieldset><legend><span class="step-caption">STEP ${String(step).padStart(2,'0')} / 04</span><span>${question}</span></legend>${contents}</fieldset>
    <div class="form-actions">${step>1?button(ico('back')+' 戻る','support-back','secondary'):link('ホームへ','home','secondary')}
    <button class="primary" type="submit">${['支援方法を選ぶ','共有範囲を選ぶ','内容を確認する','この内容でデモ依頼を作成'][step-1]} ${ico(step===4?'check':'next')}</button></div>
    ${step>=3?'<p class="input-reminder">体験用です。実在する個人情報は入力しないでください。</p>':''}</form></div>`;
}
function picker() {
  return state.requests.length>1 ? `<label class="field request-picker">表示するデモ依頼<select id="request-picker">${[...state.requests].reverse().map(r=>`<option value="${esc(r.id)}" ${current()?.id===r.id?'selected':''}>${esc(r.id.slice(0,8).toUpperCase())} ｜ ${esc(r.method)} ｜ ${esc(r.status)}</option>`).join('')}</select></label>` : '';
}
function requestBasics(r) {
  return rows([['照会番号',r.id.slice(0,8).toUpperCase()],['支援方法',r.method],['作成日時',`${r.time}（日本時間）`],['表示先','支援担当デモ（このタブ内）']]);
}
function history(r) {
  return `<ol class="history-list" aria-label="依頼の更新履歴">${[...r.history].reverse().map((h,i)=>`<li class="${i===0?'latest':''}"><div class="history-node"></div><div><span class="history-time">${esc(h.time)}</span><div class="history-line"><b>${esc(h.status)}</b>${i===0?'<span class="tag">現在</span>':''}</div>${h.reason?`<p class="user-text">${esc(h.reason)}</p>`:''}</div></li>`).join('')}</ol>`;
}
function status() {
  const r=current();
  const start=title('依頼状況','照会番号ごとに、デモ依頼の進捗と共有内容を確認できます。');
  if(!r) return start+empty('status','依頼はまだありません','帰宅サポートで作成した依頼が、ここに表示されます。',link('帰宅サポートを使う','support','primary'));
  const failed=r.status===T.statuses[8], ended=r.status===T.statuses[7];
  const msg=failed?'手配は成立していません。別の支援方法を選ぶか、必要に応じて緊急案内へ進んでください。':ended?'このデモ依頼は終了しました。新しい依頼を作成できます。':'これはデモの進行状況です。危険を感じるときは、状態の更新を待つ必要はありません。';
  return `${start}${picker()}<section class="receipt-head ${failed?'failed':''}"><div><div class="label">現在のステータス<span class="tag">デモ</span></div><h2>${esc(r.status)}</h2><p>${msg}</p>${failed?`<p class="user-text"><b>不成立の理由：</b>${esc(r.history.at(-1).reason)}</p>`:''}</div>
    <div class="receipt-stub"><span>照会番号</span><strong>${esc(r.id.slice(0,8).toUpperCase())}</strong><small>最終更新（日本時間） <br>${esc(r.history.at(-1).time)}</small></div></section>
    <div class="detail-layout"><section class="panel"><h2 class="panel-title">依頼明細</h2>${requestBasics(r)}${disclosureView(r)}</section>
    <div><section class="panel"><h2 class="panel-title">更新履歴 <span class="tag">${r.history.length}件</span></h2>${history(r)}<details class="flow-details"><summary>ステータスの流れを見る</summary><ol>${T.statuses.slice(0,8).map(s=>`<li>${s}</li>`).join('')}</ol><p class="muted">途中で手配不成立になる場合もあります。</p></details></section>
    <div class="panel"><h2 class="panel-title">次の操作</h2><div class="stack-buttons">${link('支援担当デモを開く','staff','secondary')}${button('別の支援を相談する','new-support','secondary')}${button('いま危ない · SOSデモ','start-sos','danger-outline')}</div></div></div></div>`;
}
function staff() {
  const r=current();
  const start=title('支援担当デモ','同じタブで担当者の操作を体験できます。実際の担当者には通知されません。');
  if(!r) return start+empty('staff','確認する依頼はありません','依頼が作成されると、選択された情報だけが表示されます。',link('デモ依頼を作成する','support','primary'));
  const next=T.allowed(r.status);
  return `${start}${picker()}<div class="detail-layout"><section class="panel"><div class="subhead"><h2 class="panel-title">依頼内容</h2><span class="tag">${esc(r.status)}</span></div>${requestBasics(r)}${disclosureView(r)}${link('利用者側の依頼明細へ','status','text-link')}</section>
    <div><section class="panel"><h2 class="panel-title">ステータス更新</h2>${next.length?`<form id="status-form" autocomplete="off"><label class="field">次のステータス<select name="next">${next.map(s=>`<option>${s}</option>`).join('')}</select></label><label class="field" id="reason-field" hidden>手配不成立の理由 ${required}<textarea name="reason" maxlength="1000" placeholder="例：対応できる担当者が見つからない"></textarea></label><button class="primary full">ステータスを更新</button></form>`:'<p>終了済みのため、ステータスは変更できません。</p>'}</section>
    <section class="panel"><h2 class="panel-title">担当メモ</h2><p class="muted">利用者側の依頼明細には表示されません。</p><form id="memo-form" autocomplete="off"><label class="field">新しいメモ<textarea name="memo" required maxlength="1000"></textarea></label><button class="secondary full">メモを追加する</button></form>${[...r.memos].reverse().map(m=>`<div class="memo-item"><small>${esc(m.time)}</small><p class="user-text">${esc(m.text)}</p></div>`).join('')}</section></div></div>`;
}

function records() {
  return `${title('被害記録','分かることだけ、覚えている言葉で記録できます。')}
    <div class="toolbar"><span class="count-label">このタブの記録 <b>${state.records.length}</b> 件</span><div class="row">${button('記録を追加する','new-record','primary')}${link('相談レポートへ','report','secondary')}</div></div>
    ${notice('入力は再読み込み・タブ終了で消えます。架空の情報でお試しください。')}
    ${state.records.length?`<div class="record-list">${[...state.records].reverse().map(r=>`<article class="panel record-item"><div class="subhead"><span class="label">${ico('calendar')}${esc((r.date||'日時未記入').replace('T',' '))}</span><span class="tag ${r.level==='3'?'attention':''}">${esc(T.levelText(r.level))}</span></div><h2>${esc(r.type||'種別未選択')}${r.place?' ｜ '+esc(r.place):''}</h2><p class="user-text">${esc(r.content)}</p>
      <div class="record-actions">${button('編集','edit-record','secondary',`data-id="${esc(r.id)}"`)}${button('削除','delete-record','quiet',`data-id="${esc(r.id)}"`)}</div></article>`).join('')}</div>`:
      empty('records','記録はまだありません','追加した記録は一覧で確認でき、相談レポートにまとめられます。')}`;
}
function recordForm() {
  const r=state.records.find(x=>x.id===state.edit)||{};
  const textField=(key,label,kind='text',hint='')=>`<label class="field">${label} ${optional}<input name="${key}" type="${kind}" value="${esc(r[key]||'')}" ${kind==='number'?'min="1" max="100000" step="1"':kind==='text'?'maxlength="500"':''} ${hint?`placeholder="${esc(hint)}"`:''}></label>`;
  const types=['つきまとい','待ち伏せ','連絡・メッセージ','脅し','侵入・接近','その他'];
  return `${title(state.edit?'記録を編集する':'記録する','覚えている内容から入力してください。不明な項目は空欄のまま残せます。')}
    <form id="record-form" class="entry-form" autocomplete="off">
      ${notice('架空の情報でお試しください。この記録を追加しても外部には送信されません。')}
      <section class="panel"><h2 class="panel-title">出来事の内容</h2><label class="field">見聞きしたこと ${required}<textarea name="content" required maxlength="5000" placeholder="例：駅の改札を出た後、同じ人が後ろを歩いていた。">${esc(r.content||'')}</textarea></label>
      <div class="form-grid">${textField('date','日時（日本時間）','datetime-local')}${textField('place','場所')}<label class="field">種別 ${optional}<select name="type"><option value="">未選択</option>${types.map(k=>`<option ${r.type===k?'selected':''}>${k}</option>`).join('')}</select></label>${textField('count','行為の回数','number','不明なら空欄')}</div></section>
      <section class="panel"><h2 class="panel-title">補足情報</h2><div class="form-grid">${textField('person','相手情報')}${textField('witness','目撃者')}</div><label class="field">証拠メモ ${optional}<textarea name="evidence" maxlength="2000" placeholder="例：メッセージの日時と保存場所。ファイルの添付はありません。">${esc(r.evidence||'')}</textarea></label>
      <label class="field">本人が感じた危険度 ${optional}<select name="level"><option value="">未選択</option>${[1,2,3].map(n=>`<option value="${n}" ${Number(r.level)===n?'selected':''}>${esc(T.levelText(n))}</option>`).join('')}</select></label><p class="hint">本人の選択を記録する項目です。危険を予測したり、法的判断を行ったりするものではありません。</p></section>
      <div class="form-actions">${link('キャンセル','records','secondary')}<button class="primary">このタブに記録を保存 ${ico('check')}</button></div>
    </form>`;
}
function reportPage() {
  const start=title('相談レポート','「いつ・どこで・誰が・何を・何回」を、入力した記録から整理します。');
  if(!state.records.length) return start+empty('report','レポートに含める記録がありません','記録を1件追加すると、内容を確認してから書き出せます。',button('記録を追加する','new-record'));
  return `${start}<div class="report-layout"><section class="panel no-print"><h2 class="panel-title">出力内容</h2>
    <label class="field">相談先<select id="report-target">${['警察','弁護士','学校','職場'].map(k=>`<option ${state.reportTo===k?'selected':''}>${k}</option>`).join('')}</select></label>
    ${rows([['対象','このタブの全記録 '+state.records.length+'件'],['送信','相談先への送信はありません']])}<p class="hint">相手情報や証拠メモを含みます。保存・印刷する前に、プレビューの内容を確認してください。</p>
    <div class="stack-buttons">${button('テキストを保存','download-report')}${button('印刷 / PDF','print','secondary')}</div></section>
    <section class="panel report-panel"><h2 class="panel-title">レポートのプレビュー</h2><pre id="report-text">${esc(T.report(state.records,state.reportTo))}</pre></section></div>`;
}
function riskResult() {
  const n=T.risk(state.signs);
  const advice=n===3?'切迫した危険を感じるときは、依頼や記録より緊急連絡を優先してください。':n===2?'ひとりでの移動を避ける支援や、警察への相談を検討できます。':'表示されるレベルにかかわらず、支援を求めることができます。';
  return `<div class="label">選択した状況の目安</div><h2>${n?esc(T.levelText(n)):'まだ選択されていません'}</h2><p>${advice}</p><p class="muted">低いレベルでも危険がないことを意味しません。専門家による評価ではありません。</p>`;
}
function riskPage() {
  return `${title('気になる状況を整理','当てはまるものを選ぶと、次の行動を考えるための目安を表示します。')}
    <div class="two-col"><section class="panel"><fieldset><legend>当てはまる状況</legend><p class="muted">複数選択できます。未選択では判定しません。</p><div class="choice-list">
    ${[['unease','不安・違和感がある'],['following','繰り返しつきまとい・待ち伏せがある'],['threat','脅し・身体への危害・侵入がある']].map(([v,s])=>`<label class="choice"><input type="checkbox" name="risk" value="${v}" ${state.signs.includes(v)?'checked':''}><span>${s}</span></label>`).join('')}</div></fieldset></section>
    <section class="panel risk-output"><div id="risk-result" aria-live="polite">${riskResult()}</div><div class="stack-buttons">${button('いま危ない · SOSデモ','start-sos','danger-outline')}${link('帰宅サポートを使う','support','primary')}</div></section></div>`;
}

function saveDraft() {
  const f=$('#support-form');
  if(!f) return;
  const fd=new FormData(f),d=state.draft;
  if(state.step===1) d.situation=fd.get('situation')||'';
  if(state.step===2) d.method=fd.get('method')||'';
  if(state.step===3) {
    d.fields=fd.getAll('share');
    T.fields.forEach((k,i)=>{if(k!=='過去の記録') d.values[k]=fd.get('value'+i)||'';});
  }
}
function showHiddenScreen() {
  if(dlg.open) dlg.close();
  $('#toast').hidden=true;
  shell.hidden=true; cover.hidden=false; document.title='メモ'; $('#unhide').focus();
}
$('#unhide').onclick=()=>{
  cover.hidden=true; shell.hidden=false;
  document.title=`${sections[app.dataset.route]}｜となり（体験版）`;
  $('#quick-exit').focus({preventScroll:true});
};
$('#skip').onclick=ev=>{ev.preventDefault();app.focus();};
document.addEventListener('input',ev=>{
  const el=ev.target;
  if(el.form?.id==='support-form') saveDraft();
  if(typeof el.setCustomValidity==='function') el.setCustomValidity('');
});
document.addEventListener('change',ev=>{
  const el=ev.target;
  if(el.form?.id==='support-form') {
    saveDraft();
    if(el.name==='share') {
      T.fields.forEach((k,i)=>{$('#share-'+i).hidden=!state.draft.fields.includes(k);});
      $('#share-count').textContent=`${state.draft.fields.length} / 6 項目`;
    }
  }
  if(el.name==='next') {
    const failed=el.value===T.statuses[8];
    $('#reason-field').hidden=!failed;
    el.form.elements.reason.required=failed;
    if(!failed) {el.form.elements.reason.value='';el.form.elements.reason.setCustomValidity('');}
  }
  if(el.id==='request-picker') {state.active=el.value;render();}
  if(el.id==='help-intent') $('#help-message').value=T.helpMessages[el.value];
  if(el.id==='walk-origin' || el.name==='walk-kind') {
    if(el.id==='walk-origin') state.walkOrigin=el.value;
    else state.walkKind=el.value;
    const route=T.nearestWalk(state.walkOrigin,state.walkKind);
    $('#walk-result').innerHTML=walkResult(route);
    $('#walk-announcement').textContent=route?`${T.walkNodes[route.destination].name}まで徒歩${route.meters}メートル（架空）`:'経路は見つかりませんでした。';
  }
  if(el.id==='report-target') {
    state.reportTo=el.value; $('#report-text').textContent=T.report(state.records,state.reportTo);
  }
  if(el.name==='risk') {
    state.signs=[...document.querySelectorAll('[name=risk]:checked')].map(c=>c.value);
    $('#risk-result').innerHTML=riskResult();
  }
});
function nonBlank(input,message) {
  if(input.value.trim()) return true;
  input.setCustomValidity(message); input.reportValidity(); return false;
}
document.addEventListener('submit',ev=>{
  ev.preventDefault();
  const f=ev.target, fd=new FormData(f);
  switch(f.id) {
    case 'support-form': {
      saveDraft();
      if(state.step<4) {state.step+=1;render();return;}
      const d=state.draft;
      if(!situations.includes(d.situation)||!methods.includes(d.method)) {
        state.step=!situations.includes(d.situation)?1:2;render();return;
      }
      const time=T.now(),status=T.statuses[0];
      const r={id:stamp(),method:d.method,time,status,...T.disclosure(d,state.records),history:[{time,status}],memos:[]};
      f.querySelector('[type=submit]').disabled=true;
      state.requests.push(r); state.active=r.id; state.step=1; state.draft=blankDraft();
      go('status'); toast('デモ依頼を作成しました。外部には送信していません。');
      break;
    }
    case 'record-form': {
      if(!nonBlank(f.elements.content,'見聞きした内容を入力してください。')) return;
      const r=Object.fromEntries(fd);
      r.id=state.edit||stamp();
      const index=state.records.findIndex(x=>x.id===r.id);
      if(index<0) state.records.push(r); else state.records[index]=r;
      state.edit=null; go('records'); toast('このタブ内に記録しました。'); break;
    }
    case 'status-form': {
      const next=fd.get('next');
      if(next===T.statuses[8]&&!nonBlank(f.elements.reason,'手配不成立の理由を入力してください。')) return;
      try {T.transition(current(),next,fd.get('reason')||''); render();toast('デモ依頼のステータスを更新しました。');}
      catch(error) {toast(error.message);}
      break;
    }
    case 'memo-form': {
      if(!nonBlank(f.elements.memo,'メモを入力してください。')) return;
      current().memos.push({text:fd.get('memo').trim(),time:T.now()}); render();toast('担当メモを追加しました。');
      break;
    }
  }
});
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-action]');
  if(!b) return;
  switch(b.dataset.action) {
    case 'start-sos':
      T.beginSos(state.sosLog,state.walkOrigin);
      state.buzzer=false;
      go('sos');break;
    case 'end-sos':
      T.endSos(activeSos());
      state.buzzer=false;render();break;
    case 'sos-places': {
      const event=state.sosLog.at(-1);
      if(event) state.walkOrigin=event.location.origin;
      go('places');break;
    }
    case 'friend-help':
      modal('友人・家族への文面',`<label class="field">お願いしたいこと<select id="help-intent"><option value="call">電話してほしい</option><option value="meet">合流したい</option></select></label>
        <label class="field">連絡に使う文面<textarea id="help-message" readonly>${esc(T.helpMessages.call)}</textarea></label>
        ${button('文面を選択する','select-message','secondary')}<p class="hint">未送信です。必要に応じて文面をコピーし、普段の連絡手段でお使いください。</p>`);break;
    case 'select-message':
      $('#help-message').focus();$('#help-message').select();break;
    case 'show-help':
      modal('近くの人に見せる画面','<p class="help-card">助けてください。<br>ひとりで帰るのが不安です。<br>ここで一緒に待っていただけますか。</p>');break;
    case 'guide': guide();break;
    case 'hide': showHiddenScreen();break;
    case 'dismiss': dlg.close();break;
    case 'new-support': state.step=1;state.draft=blankDraft();go('support');break;
    case 'support-back': saveDraft();state.step=Math.max(1,state.step-1);render();break;
    case 'new-record': state.edit=null;go('record');break;
    case 'edit-record': state.edit=b.dataset.id;go('record');break;
    case 'delete-record':
      modal('この記録を削除しますか？',`<p>記録一覧から削除され、元に戻せません。作成済みの依頼に含めたコピーと、書き出したファイルは残ります。</p>${button('記録を削除する','confirm-delete','danger-btn full',`data-id="${esc(b.dataset.id)}"`)}`);break;
    case 'confirm-delete':
      state.records=state.records.filter(r=>r.id!==b.dataset.id);
      dlg.close();render();toast('このタブの記録一覧から削除しました。');break;
    case 'call':
      modal('110番への連絡手順',`<p class="inset"><b>この画面からは発信しません。</b></p><ol class="plain-list"><li>ご自身の電話アプリを開きます。</li><li>「110」を入力して発信してください。</li><li>場所と、いま起きていることを、分かる範囲で伝えてください。</li></ol>`);break;
    case 'contact':
      modal('緊急連絡先共有デモ',`<p class="tag">プレビューのみ・未送信</p>${rows([['宛先','架空の連絡先'],['文面','いま帰宅に不安があります。電話や合流の相談をしたいです。']])}<p class="muted">連絡先にはアクセスしていません。実際の連絡には普段の連絡手段をお使いください。</p>`);break;
    case 'location':
      modal('現在地共有デモ',`<p class="tag">架空の場所・未送信</p>${rows([['架空の地点',T.walkNodes[state.walkOrigin].name]])}<p>端末の位置情報は取得・追跡・送信していません。</p>`);break;
    case 'buzzer': {
      const running=activeSos();
      const on=!buzzerIsOn();
      if(running) running.buzzerOn=on;
      else state.buzzer=on;
      b.setAttribute('aria-pressed',String(on));
      if(app.dataset.route==='sos') {
        b.textContent=on?'ブザー表示を停止':'ブザー表示を再開';
        $('#sos-buzzer-label').textContent=on?'無音のデモ表示中':'表示を停止しました';
      } else {
        $('#buzzer-label').textContent=on?'ブザー表示を停止':'防犯ブザー風デモを開始';
        $('#buzzer-status').hidden=false;
        $('#buzzer-status').textContent=on?'デモ表示中です。音・振動は出ません。':'停止しました。';
      }
      break;
    }
    case 'download-report':
      modal('レポートの保存',`<p>全${state.records.length}件の内容・相手情報・証拠メモなどを含むテキストを、この端末に保存します。保存したファイルは、タブを閉じても残ります。</p>${button('内容を確認して保存する','confirm-download','primary full')}`);break;
    case 'confirm-download': {
      const source=$('#report-text');
      if(!source) return;
      const url=URL.createObjectURL(new Blob(['\uFEFF'+source.textContent],{type:'text/plain;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='となり-相談レポート.txt';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);dlg.close();break;
    }
    case 'print': window.print();break;
  }
});
window.addEventListener('hashchange',()=>{if(dlg.open) dlg.close();render();});
render();
