const {test}=require('node:test');const assert=require('node:assert/strict');const T=require('./docs/core.js');
test('順番通りに到着し、終了後は更新不可',()=>{const r={status:T.statuses[0],history:[]};for(const next of T.statuses.slice(1,8))T.transition(r,next);assert.equal(r.status,'到着済み');assert.deepEqual(T.allowed(r.status),[]);assert.throws(()=>T.transition(r,'手配不成立','理由'));});
test('飛び越しは禁止、各途中状態から不成立にでき理由が必須',()=>{assert.throws(()=>T.transition({status:T.statuses[0],history:[]},T.statuses[3]));for(const s of T.statuses.slice(0,7)){const r={status:s,history:[]};assert.throws(()=>T.transition(r,'手配不成立',' '));T.transition(r,'手配不成立','担当者なし');assert.equal(r.history[0].reason,'担当者なし');assert.deepEqual(T.allowed(r.status),[]);}});
test('リスクは未選択判定なし、複数時に高い値を優先',()=>{assert.equal(T.risk([]),0);assert.equal(T.risk(['unease']),1);assert.equal(T.risk(['unease','following']),2);assert.equal(T.risk(['unease','following','threat']),3);});
test('レポートは時系列、回数不明を推測せず件数と区別',()=>{const records=[{date:'2026-09-27T12:00',content:'B',count:'2',level:'2'},{date:'2026-09-26T12:00',content:'A',count:'',level:'1'}];const out=T.report(records,'警察');assert.ok(out.includes('記録件数：2件'));assert.ok(out.includes('合計：2回／回数不明の記録：1件'));assert.ok(out.includes('誰が（相手情報）：未記入・不明'));assert.ok(out.indexOf('入力内容）：A')<out.indexOf('入力内容）：B'));assert.equal(records[0].content,'B');});
test('共有が未選択なら、記入済みの値や状況も依頼に含めない',()=>{
  const draft={fields:[],situation:'入力済みの状況',values:{現在地:'架空の場所',相手情報:'人物欄'}};
  assert.deepEqual(T.disclosure(draft,[{content:'記録'}]),{fields:[],shared:{},sharedRecords:[]});
});

test('選択した欄だけをコピーし、記録本文は原文を保ち、依頼作成後の編集から切り離す',()=>{
  const draft={
    fields:['過去の記録','現在地'],situation:'入力済みの状況',
    values:{現在地:' 架空の場所 ',相手情報:'依頼の人物欄',目的地:'別の場所'}
  };
  const records=[{id:'internal',person:'記録の人物欄',content:'架空のAさんを見た',witness:'架空の目撃者'}];
  const result=T.disclosure(draft,records);
  assert.deepEqual(result.fields,['現在地','過去の記録']);
  assert.deepEqual(result.shared,{現在地:'架空の場所'});
  assert.deepEqual(Object.keys(result.sharedRecords[0]).sort(),['date','place','type','count','content','evidence','witness','level'].sort());
  records[0].content='編集後';
  draft.fields.length=0;
  assert.equal(result.sharedRecords[0].content,'架空のAさんを見た');
  assert.equal(result.sharedRecords[0].witness,'架空の目撃者');
  assert.equal(result.fields.length,2);
});

test('過去の記録と相手情報を両方選んだときだけ記録の人物欄を含める',()=>{
  const draft={fields:['相談理由','相手情報'],situation:'選択した状況',values:{相談理由:'補足',相手情報:'今回の人物欄'}};
  const records=[{person:'記録の人物欄'}];
  const withoutRecords=T.disclosure(draft,records);
  assert.deepEqual(withoutRecords.sharedRecords,[]);
  assert.deepEqual(withoutRecords.shared,{相談理由:'選択した状況\n補足',相手情報:'今回の人物欄'});
  draft.fields.push('過去の記録');
  assert.equal(T.disclosure(draft,records).sharedRecords[0].person,'記録の人物欄');
});

test('日時・回数・種別・本人の危険度が不明なら、ゼロ回やレベルを仮定しない',()=>{
  const out=T.report([{content:'日付なし'},{date:'2026-11-07T12:00',content:'日付あり'}],'学校');
  assert.match(out,/合計：不明／回数不明の記録：2件/);
  assert.match(out,/本人が選択した危険度：未選択/);
  assert.match(out,/種別：未記入・不明/);
  assert.ok(out.indexOf('入力内容）：日付あり')<out.indexOf('入力内容）：日付なし'));
});
test('1回のSOSで無音ブザー・110番の案内・架空の位置と時刻・未送信の友人通知が揃う',()=>{
  const log=[];
  const event=T.beginSos(log,'park','開始時刻');
  assert.equal(event.buzzerOn,true);
  assert.deepEqual(event.call,{number:'110',status:'未発信'});
  assert.deepEqual(event.location,{origin:'park',name:'公園入口',time:'開始時刻'});
  assert.equal(event.notification.status,'未送信');
  assert.match(event.notification.recipient,/友人/);
  assert.ok(event.notification.message.includes('電話'));
  assert.ok(!event.notification.message.includes(event.location.name));
});

test('SOSの連打は重複記録・ブザー再開を起こさず、終了後の明示的な操作で新規開始',()=>{
  const log=[];
  const first=T.beginSos(log,'station','A');
  first.buzzerOn=false;
  assert.equal(T.beginSos(log,'park','B'),first);
  assert.equal(first.buzzerOn,false);
  assert.equal(log.length,1);
  T.endSos(first,'C');
  T.endSos(first,'D');
  const next=T.beginSos(log,'park','E');
  assert.equal(first.endedAt,'C');
  assert.equal(first.location.name,'駅前広場');
  assert.equal(next.location.name,'公園入口');
  assert.equal(next.buzzerOn,true);
  assert.equal(log.length,2);
  T.endSos(next,'F');
  assert.equal(next.buzzerOn,false);
  assert.throws(()=>T.beginSos(log,'不明','G'));
  assert.equal(log.length,2);
});

test('各出発地点から、徒歩距離が最短の24時間店舗または交番と実在する区間を返す',()=>{
  const examples=[
    ['station','shop','plazaShop',95],['station','police','westBox',70],
    ['arcade','shop','parkShop',55],['arcade','police','eastBox',115],
    ['park','shop','parkShop',45],['park','police','eastBox',90]
  ];
  for(const [origin,kind,destination,meters] of examples) {
    const route=T.nearestWalk(origin,kind);
    assert.equal(route.destination,destination);
    assert.equal(route.meters,meters);
    assert.equal(route.segments.reduce((sum,edge)=>sum+edge.meters,0),meters);
    let node=origin;
    for(const edge of route.segments) {
      assert.equal(edge.from,node);
      assert.ok(T.walkStreets.some(([a,b,len])=>len===edge.meters &&
        ((a===edge.from && b===edge.to)||(b===edge.from && a===edge.to))));
      node=edge.to;
    }
    assert.equal(node,destination);
  }
});

test('近くても24時間営業でない店を除き、解けない入力では架空の経路を補わない',()=>{
  assert.equal(T.walkNodes.dayShop.allDay,false);
  assert.equal(T.nearestWalk('station','shop').destination,'plazaShop');
  assert.deepEqual(T.nearestWalk('parkShop','shop').segments,[]);
  assert.equal(T.nearestWalk('parkShop','shop').meters,0);
  assert.equal(T.nearestWalk('unknown','shop'),null);
  assert.equal(T.nearestWalk('park','unknown'),null);
});
