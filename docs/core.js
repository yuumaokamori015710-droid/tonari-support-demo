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
  const api={statuses,riskNames,fields,now,levelText,allowed,transition,risk,disclosure,report};
  root.Tonari=api;
  if(typeof module!=='undefined') module.exports=api;
})(globalThis);
