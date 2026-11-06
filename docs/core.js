(function(root){
  'use strict';
  const statuses = ['依頼作成済み','支援担当が確認中','手配調整中','手配確定','合流待ち','合流済み','移動中','到着済み','手配不成立'];
  const riskNames = ['', '不安・違和感', '明確なつきまとい', '高リスク'];
  const fields = ['現在地','目的地','相談理由','過去の記録','相手情報','緊急連絡先'];
  const now = () => new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false});
  const levelText = level => riskNames[level] ? `レベル${level}：${riskNames[level]}` : '未選択';
  function allowed(status) {
    const i=statuses.indexOf(status);
    return i<0 || i>=7 ? [] : [statuses[i+1],statuses[8]];
  }
  function transition(request,next,reason='') {
    if(!allowed(request.status).includes(next)) throw Error('次に進めるステータスを選んでください。');
    if(next===statuses[8] && !reason.trim()) throw Error('手配不成立の理由を入力してください。');
    request.status=next;
    request.history.push({status:next,time:now(),reason:next===statuses[8] ? reason.trim() : ''});
  }
  function risk(signs) {
    return signs.includes('threat') ? 3 : signs.includes('following') ? 2 : signs.includes('unease') ? 1 : 0;
  }
  // The review screen, request and operator view share this field-level projection.
  // Free text is never inspected to infer or remove people's names.
  function disclosure(draft,records) {
    const selected=fields.filter(k=>draft.fields.includes(k));
    const shared={};
    for(const k of selected) {
      if(k==='過去の記録') continue;
      const value=String(draft.values[k]??'').trim();
      shared[k]=k==='相談理由' ? [draft.situation,value].filter(Boolean).join('\n') : value;
    }
    const recordKeys=['date','place','type','count','content','evidence','witness','level'];
    if(selected.includes('相手情報')) recordKeys.push('person');
    const sharedRecords=selected.includes('過去の記録')
      ? records.map(rec=>Object.fromEntries(recordKeys.map(k=>[k,String(rec[k]??'')]))) : [];
    return {fields:selected,shared,sharedRecords};
  }
  function report(records,to) {
    const val=x=>String(x||'未記入・不明');
    const ordered=records.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
    const known=records.filter(r=>r.count && Number(r.count)>0);
    return [
      '相談用の事実整理レポート（デモ）',`相談先：${to}`,`作成日時（日本時間）：${now()}`,
      `記録件数：${records.length}件（記録件数と行為の回数は異なります）`,
      `入力された行為回数の合計：${known.length?known.reduce((n,r)=>n+Number(r.count),0)+'回':'不明'}／回数不明の記録：${records.length-known.length}件`,
      '本人の入力内容を整理したものです。事実認定・法的判断・危険の予測は行っていません。',
      ...ordered.map((r,i)=>[
        `\n【記録 ${i+1}】`,`いつ：${val(r.date).replace('T',' ')}`,`どこで：${val(r.place)}`,
        `誰が（相手情報）：${val(r.person)}`,`種別：${val(r.type)}`,`何を（入力内容）：${val(r.content)}`,
        `何回：${r.count?val(r.count)+'回':'不明'}`,`証拠メモ：${val(r.evidence)}`,`目撃者：${val(r.witness)}`,
        `本人が選択した危険度：${levelText(r.level)}`
      ].join('\n')),
      '\n相談したいこと・希望する支援：未記入（必要に応じて相談時に追記してください）',
      '未記入の情報は推測で補っていません。'
    ].join('\n');
  }
  // Distances belong only to this fictional walking map. Coordinates draw its diagram.
  const walkNodes = {
    station:{name:'駅前広場',x:42,y:91},
    plaza:{name:'けやき交差点',x:130,y:91},
    arcade:{name:'商店街入口',x:215,y:91},
    east:{name:'東通り角',x:302,y:91},
    park:{name:'公園入口',x:302,y:150},
    westBox:{name:'駅前交番',x:42,y:35,kind:'police'},
    eastBox:{name:'公園通り交番',x:302,y:35,kind:'police'},
    plazaShop:{name:'広場前ストア',x:130,y:35,kind:'shop',allDay:true},
    parkShop:{name:'公園前ストア',x:215,y:150,kind:'shop',allDay:true},
    dayShop:{name:'駅前青果店',x:42,y:150,kind:'shop',allDay:false}
  };
  const walkOrigins = ['station','arcade','park'];
  const walkStreets = [
    ['station','westBox',70], ['station','plaza',60], ['station','dayShop',20],
    ['westBox','plazaShop',135], ['plaza','plazaShop',35], ['plaza','arcade',85],
    ['plazaShop','eastBox',170], ['arcade','east',75], ['arcade','parkShop',55],
    ['east','eastBox',40], ['east','park',50], ['park','parkShop',45],
    ['dayShop','parkShop',215]
  ];
  const neighbors = Object.fromEntries(Object.keys(walkNodes).map(key=>[key,[]]));
  for(const [from,to,meters] of walkStreets) {
    neighbors[from].push({to,meters});
    neighbors[to].push({to:from,meters});
  }

  function nearestWalk(origin,kind) {
    if(!Object.hasOwn(walkNodes,origin) || !['shop','police'].includes(kind)) return null;
    const distance=new Map([[origin,0]]);
    const previous=new Map();
    const pending=new Set(Object.keys(walkNodes));
    while(pending.size) {
      let next;
      let nearest=Infinity;
      for(const id of pending) {
        const meters=distance.get(id)??Infinity;
        if(meters<nearest) { nearest=meters; next=id; }
      }
      if(next===undefined) break;
      const node=walkNodes[next];
      if(node.kind===kind && (kind!=='shop' || node.allDay===true)) {
        const segments=[];
        for(let id=next; id!==origin;) {
          const edge=previous.get(id);
          segments.unshift({from:edge.from,to:id,meters:edge.meters});
          id=edge.from;
        }
        return {origin,destination:next,meters:nearest,segments};
      }
      pending.delete(next);
      for(const edge of neighbors[next]) {
        if(!pending.has(edge.to)) continue;
        const candidate=nearest+edge.meters;
        if(candidate<(distance.get(edge.to)??Infinity)) {
          distance.set(edge.to,candidate);
          previous.set(edge.to,{from:next,meters:edge.meters});
        }
      }
    }
    return null;
  }

  const helpMessages = {
    call:'今、ひとりで帰るのが不安です。電話してもらえますか。',
    meet:'今、ひとりで帰るのが不安です。合流できるか相談したいです。'
  };
  function beginSos(log,origin,time=now()) {
    const last=log.at(-1);
    if(last && !last.endedAt) return last;
    if(!walkOrigins.includes(origin)) throw Error('架空の出発地点を選んでください。');
    const event={
      time, endedAt:null, buzzerOn:true,
      call:{number:'110',status:'未発信'},
      location:{origin,name:walkNodes[origin].name,time},
      notification:{recipient:'友人（デモ連絡先）',message:helpMessages.call,status:'未送信'}
    };
    log.push(event);
    return event;
  }
  function endSos(event,time=now()) {
    if(!event || event.endedAt) return;
    event.buzzerOn=false;
    event.endedAt=time;
  }
  const api={statuses,riskNames,fields,now,levelText,allowed,transition,risk,disclosure,report,
    walkNodes,walkOrigins,walkStreets,nearestWalk,helpMessages,beginSos,endSos};
  root.Tonari=api;
  if(typeof module!=='undefined') module.exports=api;
})(globalThis);
